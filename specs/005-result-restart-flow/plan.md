# Implementation Plan: Phase 4 Result State and Restart

**Branch**: `005-result-restart-flow` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-result-restart-flow/spec.md`

**Note**: This plan is grounded in the Phase 3 code now on `main`, where rooms
already support `result`, active game polling, local drawer canvas, shared scores,
and shared guess history.

## Summary

Complete Phase 4 by turning the existing ended-round `result` state into a shared
result reveal and by adding a host-only restart flow that clears round-owned room
state and sends all connected players back to the lobby. Backend work stays inside
the existing in-memory room service and viewer-specific room snapshots; frontend
work stays inside the current `GamePage`, `ResultPanel`, `Scoreboard`, API client,
and Context-backed `RoomStore`.

## Technical Context

**Language/Version**: TypeScript on Node.js backend and React 18 frontend

**Primary Dependencies**: Express, Zod, React Router v6, Vite

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`; browser-local
canvas state for drawer drawing only

**Testing**: Existing app builds, backend `node:test` coverage in
`backend/src/services/roomStore.test.ts`, and manual two-browser validation

**Target Platform**: Local browser clients against a local Node.js HTTP API

**Project Type**: Web application with separate backend and frontend apps

**Performance Goals**: Result reveal and restart changes propagate to other players
in the same room on the next refresh cycle, within about 2 seconds

**Constraints**: No WebSockets, no persistent storage, no authentication, no
multiple rounds, no drawer rotation, no timers, no speed bonuses, no custom word
packs, no extra game modes

**Scale/Scope**: Small classroom multiplayer sessions with several simultaneous
rooms and a small number of players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: backend and frontend contracts remain explicit and typed; Phase 4 widens the
  room snapshot visibility rules and adds one new restart write boundary.
- Pass: every new boundary has a validation strategy, including host-only restart,
  result-only restart eligibility, and result-state reveal rules.
- Pass: shared room state remains deterministic and room-scoped inside the existing
  service layer; restart clears transient round state rather than adding multi-round
  storage.
- Pass: scope stays inside Phase 4 only and excludes multiple rounds, rotation,
  timers, persistence, auth, and live drawing sync.
- Pass: verification plan includes both app builds, backend tests for reset/reveal
  helpers, and manual multi-client validation for result reveal and restart.

## Project Structure

### Documentation (this feature)

```text
specs/005-result-restart-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       ├── roomStore.ts
│       └── roomStore.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── ResultPanel.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Keep the existing monorepo web-app layout. Backend changes
stay in the existing room model/service/routes/test files. Frontend changes stay in
the current game-facing page, components, API client, and `RoomStore`. No new
top-level dependency or new state system is required.

## Phase 0 Research

### Decisions

- Decision: reveal `secretWord` and the real winning guess text to all viewers only
  while `room.status === "result"`.
  Rationale: this satisfies Phase 4 shared-result requirements while keeping the
  stricter drawer-only secrecy rule intact during `playing`.
  Alternatives considered: always reveal after any correct guess field appears,
  keep guesser redaction forever, add a separate `isRevealed` flag.

- Decision: add a single `POST /rooms/:code/restart` endpoint instead of overloading
  `POST /rooms/:code/start` or using a generic room-mutation route.
  Rationale: restart has distinct validation, authorization, and reset semantics,
  so a dedicated room-scoped action stays easiest to test and review.
  Alternatives considered: reusing `/start`, generic `PATCH /rooms/:code`, client-
  side-only restart simulation.

- Decision: restart resets the existing room object in place rather than creating a
  new room code or new participant sessions.
  Rationale: the spec requires preserving room code, host, and participants, and
  the current polling/session-restore flow already knows how to reconcile a room
  returning to `lobby`.
  Alternatives considered: create a replacement room, remove and recreate room
  sessions, track round counters.

- Decision: preserve the current Phase 3 drawer-canvas lock in `result` and add an
  explicit canvas cleanup path on restart.
  Rationale: the code already blocks drawing in `result`; Phase 4 only needs to
  preserve that behavior and clear stale local canvas state when the room returns to
  `lobby`.
  Alternatives considered: re-enable canvas in `result`, persist canvas across
  restart, move canvas state into backend room data.

- Decision: reuse the existing active-room 2-second polling flow for both result
  reveal and restart convergence.
  Rationale: Phase 1 and Phase 3 already established acceptable polling behavior,
  and Phase 4 only needs consistent room snapshots within the same latency target.
  Alternatives considered: manual refresh only, push transport, separate restart
  polling channel.

## Phase 1 Design

### State Model Changes

- Backend `Room` in
  [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  keeps the existing Phase 3 fields, but Phase 4 changes how they are projected and
  reset:
  - `secretWord` becomes visible to all viewers in `result`
  - `guessHistory` becomes fully unredacted in `result`
  - restart clears `drawerId`, `guesserIds`, `secretWord`, `guessHistory`, `scores`,
    `winnerId`, and `endedAt`
- Backend `RoomSnapshot` stays the same type shape, but result-state semantics
  change:
  - `secretWord` is present for every viewer in `result`
  - result `guessHistory` contains real guess text for every viewer
  - lobby after restart returns to the existing lobby snapshot shape with no
    round-specific fields
- Frontend `RoomSnapshot` in
  [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  keeps the same Phase 3 interface, but consumers now treat `result` snapshots as
  shared reveal snapshots instead of drawer-only word snapshots.
- Frontend `RoomStore` in
  [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  derives new result-facing state:
  - `canRestart`
  - `restartDisabledReason`
  - result-visible `visibleSecretWord` for all viewers
  - post-restart cleanup so local room/session state routes back to the lobby cleanly

### File-Level Changes

- [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  Keep the current room/result fields but document Phase 4 snapshot semantics in the
  types if comments or naming need alignment.

- [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts)
  Add a `restartRoom(code, participantId)` service operation, add helpers to clear
  round-owned fields deterministically, and update `toRoomSnapshot(room,
  viewerParticipantId)` so `result` viewers all receive the revealed word and full
  history.

- [backend/src/services/roomStore.test.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.test.ts)
  Extend existing coverage for result-state reveal, host-only restart, result-only
  restart rejection, and cleared-lobby invariants after restart.

- [backend/src/api/schemas.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/schemas.ts)
  Add a restart request schema for `participantId`, reusing the same trimmed
  participant-id validation pattern used by start/guess actions.

- [backend/src/api/rooms.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/rooms.ts)
  Add `POST /rooms/:code/restart`, map restart failure reasons to HTTP errors, and
  return the same viewer-specific room snapshot envelope used elsewhere.

- [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  Add `restartRoom(code, participantId)` and align result-snapshot typing comments
  with the new shared-reveal semantics.

- [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  Add restart action support, derive host-only restart control state for result
  rooms, ensure result polling continues until the room returns to `lobby`, and keep
  last good room data visible during transient refresh failures.

- [frontend/src/pages/GamePage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/GamePage.tsx)
  Preserve the existing result-state canvas lock, clear local canvas state when the
  room transitions back to `lobby`, and wire the result view restart control.

- [frontend/src/components/ResultPanel.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/components/ResultPanel.tsx)
  Convert the activity-only panel into the dedicated Phase 4 result presentation,
  including revealed word, winner context, and full round history.

- [frontend/src/components/Scoreboard.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/components/Scoreboard.tsx)
  Adjust labels or emphasis so final scores and winner state read correctly in
  `result` and after restart back in `lobby`.

### API Contract Changes

- `POST /rooms`
  Response stays `{ participantId, room }`. Newly created rooms still return lobby
  snapshots only.

- `POST /rooms/:code/join`
  Response stays `{ participantId, room }`. Join remains lobby-only.

- `GET /rooms/:code`
  Response stays `{ room }`, but `result` snapshots now become shared reveal
  snapshots:
  - all viewers receive `secretWord`
  - all viewers receive full `guessHistory` including the correct winning text
  - all viewers keep shared `scores`, `winnerId`, and `drawerId`

- `POST /rooms/:code/guesses`
  Request stays `{ participantId, guessText }`. Success still returns `{ room }`,
  but when the accepted guess ends the round, the returned room snapshot now uses
  the Phase 4 result-state reveal rules.

- `POST /rooms/:code/restart`
  Request: `{ participantId }`
  Success response: `{ room }` where `room` is a lobby snapshot with preserved
  participants and no round-specific fields.
  Error mapping:
  - `404` room not found
  - `403` viewer is not the host
  - `409` room is not in `result`

### Data Flow

- Result reveal
  First correct guess already moves the room to `result`.
  On the next snapshot projection, `toRoomSnapshot()` now reveals `secretWord` and
  full history to every viewer in that room.
  `GamePage` and `ResultPanel` render the dedicated result view from the existing
  polled room state.

- Restart flow
  Host clicks restart in the result view.
  Frontend calls `POST /rooms/:code/restart`.
  Backend validates room exists, room is in `result`, and requester is `hostId`.
  Backend clears round-owned fields and sets `status = "lobby"`.
  Host receives the cleared lobby snapshot immediately.
  Other connected players converge on the cleared lobby snapshot on the next polling
  tick, and `GamePage` route logic returns them to `/lobby`.

- Local canvas cleanup
  Drawer canvas remains locked during `result`.
  When the local room snapshot changes from active game state back to `lobby`, the
  game screen clears local canvas state before navigating away so stale marks do not
  survive into the next round.

### Implementation Sequence

1. Backend snapshot and reset helpers
   Update `toRoomSnapshot()` result visibility rules and add room-reset helpers in
   `backend/src/services/roomStore.ts`.
2. Backend models, schemas, route, and tests
   Add restart result types, restart schema, `POST /rooms/:code/restart`, and extend
   `roomStore.test.ts`.
3. Frontend API and store updates
   Add restart client method plus derived result/restart state in
   `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`.
4. Result UI updates
   Turn `ResultPanel` into Phase 4 result view, adjust `Scoreboard`, and wire
   restart controls in `GamePage.tsx`.
5. Canvas/lobby return cleanup
   Preserve locked canvas in `result`, clear local canvas on lobby return, and
   verify route transitions.
6. Manual two-browser validation last
   Validate shared reveal, non-host restart disablement, host restart, refresh
   persistence, and room isolation.

### Testing Strategy

- Automated
  - `backend npm test`
  - extend room-store tests for:
    - result snapshot reveals word/history to guessers
    - restart rejected for non-host
    - restart rejected outside `result`
    - restart preserves `code`, `hostId`, `participants`
    - restart clears round-owned fields
- Build validation
  - `backend npm run build`
  - `frontend npm run build`
- Manual multiplayer
  - end a round and confirm both players see same revealed word and full history
  - confirm non-host restart control is visible but disabled with reason
  - restart as host and confirm both clients return to lobby with same players
  - refresh during `result` and after restart to confirm state persistence and reset
  - verify a second room is unaffected

### Risks and Mitigations

- Risk: result reveal accidentally leaks to `playing` snapshots too early.
  Mitigation: keep visibility branching in `toRoomSnapshot()` strictly keyed on
  `room.status === "result"` and cover with room-store tests.

- Risk: restart leaves stale round fields behind in the in-memory room.
  Mitigation: centralize reset logic in one helper and assert the cleared invariants
  in tests.

- Risk: non-host clients remain stranded on `/game` after restart.
  Mitigation: preserve current polling cadence for `result`, keep lobby redirect
  logic in `GamePage`, and verify convergence in two-browser testing.

- Risk: local drawer canvas survives restart visually even though shared room state
  is reset.
  Mitigation: explicitly clear the local canvas when room status returns to `lobby`.

## Post-Design Constitution Check

- Pass: typed backend/frontend contracts remain explicit; no undocumented `any`
  additions are needed.
- Pass: new restart request validation and result-state reveal rules are explicit and
  testable.
- Pass: room state remains deterministic, minimal, and scoped to the existing
  service-owned in-memory `Map`.
- Pass: design stays strictly inside Phase 4 and does not introduce multiple rounds,
  rotation, timers, persistence, or auth.
- Pass: verification remains visible through builds, extended backend tests, and
  documented multi-client manual checks.
