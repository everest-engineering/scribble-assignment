# Implementation Plan: Scenario 4 Result State and Restart

**Branch**: `assignment` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-flow/spec.md`

**Note**: This plan is limited to Scenario 4 result-state and restart behavior.

## Summary

Extend the existing Scenario 3 gameplay flow so the first correct accepted
guess ends the round, preserves the completed round data for a shared result
state, reveals the secret word and final scores to all players, and then allows
only the host to restart the room back to a clean lobby with the same roster.
The backend remains authoritative for result transitions, restart permissions,
and round-state cleanup, while the frontend continues to consume one viewer-
specific room snapshot contract that now supports `results` and host restart
controls.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (backend) and React 18
with Vite (frontend)

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest

**Storage**: In-memory room and game state only

**Testing**: `cd backend && npm test`, `cd frontend && npm test`, plus manual
two-tab browser validation for multiplayer flows

**Target Platform**: Node.js backend and modern desktop browser clients

**Project Type**: Monorepo web application (`backend/` + `frontend/`)

**Performance Goals**: Result-state transitions and restart resets should appear
to the acting tab immediately and to other tabs within one polling interval,
with a default target of about 2 seconds for cross-tab convergence

**Constraints**: HTTP polling only; no WebSockets; no database/persistence; no
authentication/session layer; keep room memory footprint minimal; preserve the
starter architecture; keep scope strictly to Scenario 4

**Scale/Scope**: Small multiplayer rooms running one completed round at a time,
with post-round review and manual restart validated through local multi-tab
testing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] The change is scoped to a concrete scenario/user story and preserves the
      README checkpoint order unless a deviation is justified.
- [x] All changed backend boundaries have explicit TypeScript types and Zod
      validation for request/response payloads.
- [x] Multiplayer synchronization remains HTTP polling against in-memory state
      only; no forbidden persistence or realtime transport is introduced.
- [x] The plan preserves the existing monorepo structure and documents any new
      dependency or abstraction that materially expands the surface area.
- [x] Verification covers every touched surface, including affected builds,
      affected tests, and manual two-tab validation for multiplayer/UI flows.

**Post-Design Re-Check**: Pass. The design keeps the existing room-centric
in-memory model, extends the same viewer-specific snapshot contract to cover
`results`, uses one additional host-only room action for restart, and stays
within the assignment’s polling-based single-round progression without adding
multiple rounds, timers, persistence, or new infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-scenario4.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts
    │   ├── schemas.ts
    │   └── schemas.test.ts
    ├── models/
    │   └── game.ts
    └── services/
        ├── roomStore.ts
        └── roomStore.test.ts

frontend/
└── src/
    ├── pages/
    │   ├── GamePage.tsx
    │   └── LobbyPage.tsx
    ├── services/
    │   ├── api.ts
    │   └── api.test.ts
    ├── state/
    │   └── roomStore.ts
    └── styles/
        └── app.css
```

**Structure Decision**: Keep result transitions and restart rules in
`backend/src/services`, request validation in `backend/src/api`, and all
client-facing result/lobby state orchestration in the existing frontend store
and pages. No new package, router namespace, or client state library is needed.

## Phase 0: Research Outcomes

- Extend room status from `lobby | playing` to `lobby | playing | results`
  instead of introducing a second room-like entity or archived results store.
- End the round inside the existing guess-submission path when the first correct
  accepted guess is recorded so scoring and status transition remain one atomic
  backend mutation.
- Preserve the completed round on `room.round` during `results` so the correct
  word, final scores, guess history, and any retained canvas state are all
  served from one stable snapshot until restart.
- Expose result-state behavior through the same `RoomSnapshot` contract used by
  create, join, start, fetch, drawing, clearing, and guessing, adding only the
  minimal new viewer fields needed for restart and result display.
- Implement restart as one host-only room-scoped action that resets the room to
  lobby state in place, preserving room code, host, and roster while clearing
  round-specific fields and zeroing participant scores.
- Keep the frontend on the existing route structure by rendering both active
  gameplay and result-state variants from `GamePage`, then relying on the
  existing lobby route after restart.
- Continue to use action responses for the acting tab and polling for other tabs
  so result transitions and restart propagation remain responsive without
  introducing forbidden realtime transport.

See [research.md](./research.md) for decisions, rationale, and alternatives.

## Phase 1: Design

### Backend Model Changes

- Update `backend/src/models/game.ts` to
  extend `RoomStatus` with a `results` state.
- Keep `round` present while the room is in `playing` or `results`, and extend
  `RoundState` with explicit completion metadata such as:
  - `endedAt`
  - any derived completion marker needed to distinguish active play from
    completed results within the same round object
- Extend `RoomSnapshot` with result-aware fields such as:
  - `canRestartGame`
  - `roundEndedAt`
  - existing `secretWord` visibility rules adapted so all viewers receive the
    completed word in `results`
- Preserve participant score totals during `results` and reset them only when a
  new round starts or a restart returns the room to the lobby.

### Result-State Transition Flow

1. A room begins in the existing Scenario 3 `playing` state.
2. A non-drawer submits a trimmed accepted guess.
3. The backend evaluates the guess case-insensitively against the active secret
   word.
4. If the guess is incorrect, the backend appends guess history, awards `0`,
   keeps the room in `playing`, and returns the updated gameplay snapshot.
5. If the guess is correct, the backend appends guess history, awards `100`,
   updates the participant score, stamps the round as ended, and changes
   `room.status` to `results` in the same mutation.
6. Once in `results`, drawing and guessing actions are no longer valid and must
   return a room-state conflict error.
7. Fetch responses for all viewers in the room now show the completed word,
   final scores, and full guess history until the host restarts.

### Restart and Reset Design

- Add a host-only restart action on the existing rooms API rather than creating
  a separate session or room-management surface.
- Restart is allowed only when:
  - the requester is the room host
  - the room is currently in `results`
- A successful restart must:
  - keep the same room code
  - keep the same host participant ID
  - keep the current ordered player roster
  - reset all participant scores to `0`
  - clear `round`
  - set `status` back to `lobby`
  - update timestamps
- Restart must not:
  - auto-start a new round
  - retain prior secret word visibility
  - retain prior guess history, drawer assignment, or drawing state
  - affect other rooms in any state

### Backend Validation and Request Changes

- Update `backend/src/api/schemas.ts` to
  add a restart request schema using the same participant identity rules as
  start.
- Keep existing draw, clear-canvas, and guess payload shapes unchanged.
- Extend `backend/src/api/rooms.ts` with a
  `POST /rooms/:code/restart` route that returns the updated viewer-specific
  room snapshot.
- Preserve consistent error mapping:
  - `403` for non-host restart attempts
  - `409` for restart attempts before `results`
  - `409` for draw or guess attempts after the room has already ended

### Backend Service Changes

- Update `backend/src/services/roomStore.ts`
  to add deterministic helpers for:
  - transitioning a room from `playing` to `results`
  - restarting a room from `results` to `lobby`
  - constructing result-aware room snapshots
- Keep guess submission as the authoritative place where completion occurs so
  the winning guess, final score change, and status transition remain atomic.
- Reuse the existing active-room lookup pattern, but split active-play checks
  from result-state checks where needed so restart and result fetches remain
  explicit.
- Ensure score resets happen on restart and on future new-round starts so stale
  totals never leak across rounds.

### Viewer-Visible Result Snapshot Behavior

- `RoomSnapshot` remains the only room/game payload returned to the frontend.
- Shared result fields visible to every viewer:
  - `status = "results"`
  - completed `secretWord`
  - final participant scores
  - full accepted guess history
  - preserved drawer identity from the completed round
- Viewer-specific fields:
  - `viewerCanDraw = false` in `results`
  - `viewerCanGuess = false` in `results`
  - `canRestartGame = true` only for the host while the room is in `results`
  - `wordVisibility = "visible"` for all viewers in `results`
- Lobby snapshots after restart should return:
  - no `round`
  - no result data
  - reset participant scores
  - normal Scenario 1 start eligibility rules

### Frontend Room Store, Game, Result, and Lobby Impacts

- Extend `frontend/src/services/api.ts`
  room snapshot types to include:
  - `status: "lobby" | "playing" | "results"`
  - `canRestartGame`
  - any round completion metadata exposed by the backend
- Add a `restartGame` API method and matching action in
  `frontend/src/state/roomStore.ts`.
- Update `frontend/src/pages/GamePage.tsx`
  to support two view modes from the same route:
  - active `playing` gameplay
  - read-only `results` review with secret word, final scores, full guess
    history, and host-only restart control
- Keep polling active on `GamePage` for both `playing` and `results` so the
  observing tab converges on the result transition and on restart.
- Update `frontend/src/pages/LobbyPage.tsx`
  so non-lobby room states continue routing users to the game/result screen,
  while restarted rooms settle back into the preserved lobby roster and reset
  start controls.
- Update `frontend/src/styles/app.css`
  only as needed for result banners, score emphasis, restart controls, and
  lobby-after-restart messaging.

### File-Level Change Plan

- `backend/src/models/game.ts`: add `results` status and result-state snapshot
  fields
- `backend/src/services/roomStore.ts`: implement correct-guess result
  transition, host-only restart, round reset, and result-aware snapshots
- `backend/src/services/roomStore.test.ts`: cover first-correct-guess round
  ending, result visibility, restart permissions, reset behavior, and room
  isolation
- `backend/src/api/schemas.ts`: add restart request validation
- `backend/src/api/schemas.test.ts`: cover restart request validation and any
  updated status-specific schema assumptions
- `backend/src/api/rooms.ts`: add restart route and result/restart conflict
  handling
- `frontend/src/services/api.ts`: extend snapshot types and add restart action
- `frontend/src/services/api.test.ts`: cover result snapshots and restart
  request behavior
- `frontend/src/state/roomStore.ts`: add restart action wiring and status-aware
  snapshot updates
- `frontend/src/pages/GamePage.tsx`: render result state, disable gameplay
  controls in results, and expose host-only restart
- `frontend/src/pages/LobbyPage.tsx`: handle post-restart lobby recovery and
  route non-lobby states back to `/game`
- `frontend/src/styles/app.css`: add result/restart presentation states

### Validation Strategy

- Automated backend validation:
  - room-store tests for correct guess transitioning `playing -> results`
  - room-store tests for word visibility and final-score consistency in results
  - room-store tests for host-only restart and restart-before-results rejection
  - room-store tests for score reset, round clear, and room isolation after
    restart
  - schema tests for restart request validation
- Automated frontend validation:
  - API service tests for result-state fetch and restart action responses
  - API service tests for `results` snapshot typing and lobby-after-restart
    snapshots
- Manual two-tab validation:
  - start a room and submit a correct guess to end the round
  - confirm both tabs enter `results` and reveal the same word, final scores,
    and full guess history
  - confirm guessing and drawing controls are no longer usable in `results`
  - attempt restart from the non-host tab and confirm rejection
  - restart from the host tab and confirm both tabs return to the same lobby
    roster with cleared round data and reset scores
  - repeat the flow with a second room active and confirm restart isolation

## Complexity Tracking

No constitution exceptions or additional architectural complexity are required
for this feature.
