# Tasks: Game Start & Drawer Flow

**Feature**: Game Start & Drawer Flow
**Branch**: 002-game-start-drawer

## Phase 1 — Setup

- [x] T101 Create `specs/002-game-start-drawer/tasks.md` and confirm feature metadata in `.specify/feature.json` (specs/002-game-start-drawer/tasks.md)

## Phase 2 — Backend model & store (BLOCKS all user stories)

- [x] T102 Extend `RoomStatus` type to `"lobby" | "playing" | "result"` (backend/src/models/game.ts)
- [x] T103 Add `Round` interface (`roundNumber`, `drawerParticipantId`, `secretWord`, `scores`, `guesses`, `isComplete`) (backend/src/models/game.ts)
- [x] T104 Add `Guess` interface (`participantId`, `text`, `isCorrect`, `timestamp`) (backend/src/models/game.ts)
- [x] T105 Add `canvasState: { strokes: Point[][] }` to Room model (backend/src/models/game.ts)
- [x] T106 Update `HostAwareRoomSnapshot` to include `currentRound` and `canvasState` (backend/src/models/game.ts)
- [x] T107 Add `startRoom(code, hostParticipantId)` to roomStore with validation (backend/src/services/roomStore.ts)
- [x] T108 Update `toRoomSnapshot()` to include round data, hide word from non-drawers (backend/src/services/roomStore.ts)

## Phase 3 — Backend API route

- [x] T109 Add `POST /rooms/:code/start` route with host validation, error responses (backend/src/api/rooms.ts)
- [x] T110 Add backend tests: successful start, not-host rejection, too-few-players, already-started, word visibility (backend/src/services/roomStore.test.ts)

## Phase 4 — Frontend API & store (BLOCKS US1)

- [x] T111 Add `api.startGame(code, participantId)` to API service (frontend/src/services/api.ts)
- [x] T112 Update `RoomSnapshot` type to include `currentRound` and `canvasState` (frontend/src/services/api.ts)
- [x] T113 Add `startGame()` method to `RoomStore` (frontend/src/state/roomStore.ts)

## Phase 5 — User Story 1: Host starts the game (Priority: P1)

- [x] T114 [US1] Update LobbyPage start button to call `roomStore.startGame()`, navigate only on success (frontend/src/pages/LobbyPage.tsx)
- [x] T115 [US1] Update GamePage to detect drawer vs guesser role, render appropriate view (frontend/src/pages/GamePage.tsx)
- [x] T116 [US1] Update GamePage to show secret word to drawer, hide from guessers (frontend/src/pages/GamePage.tsx)
- [x] T117 [US1] Add frontend tests for start flow and role-based rendering (frontend/src/pages/LobbyPage.test.tsx, frontend/src/pages/__tests__/GamePage.test.tsx)

## Phase 6 — Polish & Cross-Cutting

- [x] T118 Coverage: Add/adjust Vitest tests to reach 80% coverage for modified modules
- [x] T119 Bundle-size: Verify production client build is within 150KB budget — 59KB ✓
- [x] T120 Documentation: Update spec and plan with implementation notes
- [x] T121 Commit: Commit completed work and reference spec artifact

## Dependencies

- T102..T106 (model types) block all Phase 3 (API) and Phase 5 (frontend) tasks.
- T107 (startRoom) must be implemented before T109 (API route).
- T111..T113 (frontend API/store) must be implemented before T114..T116 (lobby/game page updates).

## Parallel Work

- [P] T110 (backend tests) and T117 (frontend tests) can be written in parallel by different engineers.
- [P] T118..T119 (coverage/bundle) can be worked in parallel after core behavior is implemented.

## Acceptance / Done Criteria

- All tasks completed and tests passing.
- Manual verification: two browser tabs can play through lobby → start → game with correct role/word visibility.
- Vitest coverage for modified modules >= 80%.
- Spec and plan updated and committed.
