# Implementation Plan: Phase 3 Gameplay Interaction

**Branch**: `004-gameplay-interaction` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-gameplay-interaction/spec.md`

**Note**: This plan is grounded in the current Express backend and React frontend
starter after Phase 1 and Phase 2.

## Summary

Implement Phase 3 gameplay interaction by keeping drawing local to the drawer while
extending the existing room model, room snapshot contract, and room polling flow to
support shared guess history, deterministic round scoring, and a `result` status
after the first correct guess. Backend state remains the single in-memory `Map`
inside `backend/src/services/roomStore.ts`; frontend state remains the existing
Context-backed `RoomStore` plus local canvas state inside the game screen.

## Technical Context

**Language/Version**: TypeScript on Node.js backend and React 18 frontend

**Primary Dependencies**: Express, Zod, React Router v6, Vite

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`; browser-local
canvas state for drawer drawing only

**Testing**: Existing app builds, backend `node:test` helpers where pure logic is
extractable, and manual two-browser validation

**Target Platform**: Local browser clients against a local Node.js HTTP API

**Project Type**: Web application with separate backend and frontend apps

**Performance Goals**: Accepted guesses and ended-round state appear for all players
in the same room on the next refresh cycle, within about 2 seconds

**Constraints**: No WebSockets, no persistent storage, no authentication, no
multiple rounds, no drawer rotation, no timers, no speed bonuses, no live stroke
broadcast, no Phase 4 result rendering or restart flow

**Scale/Scope**: Small classroom multiplayer sessions with several simultaneous
rooms and a small number of players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: backend and frontend contracts remain explicit and typed; Phase 3 widens
  room snapshots and adds a new guess-submission request boundary.
- Pass: every new input and transition has a validation strategy, including trimmed
  guesses, guesser-only submission, case-insensitive correctness, and result-state
  transition.
- Pass: shared game state remains deterministic and room-scoped inside the existing
  service layer; canvas state stays local and does not bloat room storage.
- Pass: scope stays inside Phase 3 only and excludes result rendering, restart,
  multiple rounds, timers, live stroke sync, persistence, and auth.
- Pass: verification plan includes both app builds and multi-client story
  validation, plus optional backend unit coverage for pure helpers.

## Project Structure

### Documentation (this feature)

```text
specs/004-gameplay-interaction/
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
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts

frontend/
├── src/
│   ├── components/
│   │   ├── GuessForm.tsx
│   │   ├── ResultPanel.tsx
│   │   └── Scoreboard.tsx
│   ├── pages/
│   │   └── GamePage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Keep the current monorepo web-app layout. Backend work stays
within the existing room model, service, schemas, and routes. Frontend work stays
within the existing game page, game-related components, API client, and `RoomStore`.
No new top-level dependency or new state subsystem is required.

## Phase 0 Research

### Decisions

- Decision: keep drawing state local to the drawer's browser session instead of
  storing stroke data in backend room state.
  Rationale: the Phase 3 spec explicitly excludes live stroke broadcast and
  persistence, so backend-owned drawing data would add state without user value.
  Alternatives considered: storing strokes on `Room`, adding a separate in-memory
  drawing store, broadcasting strokes through polling.

- Decision: add a single `POST /rooms/:code/guesses` endpoint for guess submission
  instead of overloading `GET /rooms/:code` or creating multiple guess-related write
  endpoints.
  Rationale: one explicit room-scoped write boundary keeps validation, error
  handling, and task decomposition simple for trimmed text, role checks, and scoring.
  Alternatives considered: query-string guess submission, generic room mutation
  endpoint, client-side-only guess simulation.

- Decision: store guess history, scores, winner identity, and ended-round metadata
  directly on `Room`.
  Rationale: the existing room service is already the single source of truth for
  round state, and Phase 3 still operates on one room-local round only.
  Alternatives considered: separate score map outside the room, separate history
  store keyed by room code, frontend-derived scores.

- Decision: reuse the existing 2-second polling pattern for active game-state sync
  rather than introducing push transport.
  Rationale: Phase 1 already established acceptable room polling behavior, and Phase
  3 requirements only need shared guesses and result-state visibility within about 2
  seconds.
  Alternatives considered: WebSockets, server-sent events, manual refresh only.

- Decision: use `result` as the canonical ended-round room status and preserve the
  Phase 2 secret-word visibility rule in all viewer-specific snapshots.
  Rationale: `result` is the clarified status target for Phase 4, and keeping
  guesser snapshots word-safe avoids introducing a new privacy exception during
  Phase 3.
  Alternatives considered: `finished` status, staying in `playing` with a side flag,
  revealing the word to all viewers immediately at round end.

## Phase 1 Design

### State Model Changes

- Backend `RoomStatus` in
  [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  widens from `"lobby" | "playing"` to `"lobby" | "playing" | "result"`.
- Backend `Room` gains the Phase 3 shared round fields:
  `guessHistory`, `scores`, `winnerId`, and `endedAt`, while preserving the Phase 2
  `drawerId`, `guesserIds`, and `secretWord`.
- Backend `GuessEntry` becomes a first-class entity stored in room history and
  projected in room snapshots.
- Backend `RoomSnapshot` becomes richer for `playing` and `result` rooms:
  all viewers receive shared guess history and score state; only the drawer
  continues to receive `secretWord`.
- Frontend `RoomSnapshot` in
  [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  widens to include guess history, scores, winner identity, and `result` status.
- Frontend `RoomStore` in
  [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  derives game-facing state such as guess-history items with display names,
  score rows, whether the viewer can submit guesses, and whether active polling
  should continue.

### File-Level Changes

- [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  Add `GuessEntry`, score metadata, winner metadata, and `result` to room/snapshot
  types.

- [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts)
  Initialize scores when a room starts, keep guess history room-scoped, add guess
  normalization and correctness helpers, add a `submitGuess` service operation, and
  project Phase 3 snapshot fields through `toRoomSnapshot(room, viewerParticipantId)`.

- [backend/src/api/schemas.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/schemas.ts)
  Add a trimmed non-empty guess schema and preserve existing room and participant-id
  validation rules.

- [backend/src/api/rooms.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/rooms.ts)
  Add `POST /rooms/:code/guesses`, map new service failure reasons to HTTP errors,
  and ensure fetch/start/create/join all return the widened room snapshot contract.

- [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  Add Phase 3 snapshot types and a `submitGuess(code, participantId, guessText)`
  client method.

- [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  Generalize lobby-only polling into active room polling, derive guesser submission
  permissions, expose score and history data to components, and keep stale room data
  visible during transient polling failures.

- [frontend/src/pages/GamePage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/GamePage.tsx)
  Replace the fake canvas block with a real interactive canvas for the drawer, add a
  clear action, start and stop game polling with the existing visibility behavior,
  and stop redirecting away when the room enters `result`.

- [frontend/src/components/GuessForm.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/components/GuessForm.tsx)
  Wire the form to trimmed submission, fast feedback, disabled states, and viewer
  role restrictions.

- [frontend/src/components/Scoreboard.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/components/Scoreboard.tsx)
  Replace placeholder content with participant scores derived from the room snapshot.

- [frontend/src/components/ResultPanel.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/components/ResultPanel.tsx)
  Use the existing placeholder component name to render Phase 3 guess activity and,
  once available, ended-round winner context without implementing the dedicated
  Phase 4 result flow.

### API Contract Changes

- `POST /rooms`
  Response remains `{ participantId, room }`, and the `room` snapshot remains a
  lobby snapshot for the newly created host session.

- `POST /rooms/:code/join`
  Response remains `{ participantId, room }`, and joins remain limited to lobby
  rooms only.

- `GET /rooms/:code`
  Response remains `{ room }`, but `room` now supports three viewer-specific states:
  lobby, playing, and result. Playing/result snapshots include shared guess history,
  shared score state, winner identity once known, and drawer-only `secretWord`.

- `POST /rooms/:code/start`
  Request stays `{ participantId }`. Success response remains `{ room }`, but the
  started room now includes zeroed scores and empty guess history in addition to the
  existing Phase 2 fields.

- `POST /rooms/:code/guesses`
  Request becomes `{ participantId, guessText }`.
  Success response returns `{ room }` for the submitting viewer after the guess is
  applied.
  Error mapping:
  - `404` room not found
  - `403` viewer is not allowed to guess (drawer or unknown participant)
  - `409` room is not in `playing` state because it is still `lobby` or already `result`
  - `422` guess text is empty after trimming

### Data Flow

- Game polling
  `GamePage` starts active room polling on mount for `playing` and `result` rooms.
  The polling interval reuses the Phase 1 cadence of 2 seconds, skips work while the
  document is hidden, and stops on unmount or leave-room. Poll failures set an error
  message but keep the last good guess history and scores visible.

- Guess submission
  Guesser types into `GuessForm`.
  Frontend trims and rejects blank input for fast feedback.
  Valid submissions call `POST /rooms/:code/guesses`.
  Backend trims again, verifies role and room status, compares case-insensitively,
  appends to guess history, updates scores if needed, and returns the updated
  viewer-specific room snapshot.

- Incorrect guess
  Snapshot stays in `playing`.
  Guess history grows by one item.
  Scores remain unchanged at 0.
  Other clients see the new history entry on the next polling tick.

- Correct guess
  Backend normalizes the text, matches against the stored secret word, marks the
  winning guess, sets the winner score to 100, stores `winnerId`, stamps `endedAt`,
  and transitions `status` from `playing` to `result`.
  Submitter receives the new snapshot immediately; other clients see the same
  `result` state and final scores on the next polling tick.

- Local drawing
  Drawer input writes only to the local canvas element in the browser.
  Clear action resets that local canvas state.
  No canvas data is sent to the backend or other viewers in Phase 3.

### Verification Strategy

- Build validation:
  - `cd backend && npm run build`
  - `cd frontend && npm run build`
- Optional backend unit coverage:
  - guess normalization
  - case-insensitive correctness helper
  - first-correct scoring transition
  - viewer-safe room snapshot shaping for `playing` and `result`
- Manual multiplayer validation:
  - drawer can draw and clear locally
  - guesser-only submission is enforced
  - blank guesses are rejected
  - incorrect guesses appear for all players within about 2 seconds
  - first correct guess awards 100 and moves all clients to `result` state on refresh
  - cross-room history and score isolation hold
