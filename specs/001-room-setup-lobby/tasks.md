---
description: "Task list for Room Setup, Lobby & Drawer Flow implementation"
---

# Tasks: Room Setup, Lobby & Drawer Flow

**Input**: Design documents from `specs/001-room-setup-lobby/`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create feature docs and register feature path in `.specify/feature.json` (specs/001-room-setup-lobby/spec.md)
- [ ] T002 [P] Add TypeScript interfaces for `Participant` and `Room` in `backend/src/models/game.ts`
- [ ] T003 [P] Add shared type exports (if needed) for backend/frontend in `backend/src/models/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Implement in-memory `rooms` map and core helpers in `backend/src/services/roomStore.ts`
- [ ] T005 Implement `toRoomSnapshot` sanitizer in `backend/src/services/roomStore.ts`
- [ ] T006 Update Zod schemas in `backend/src/api/schemas.ts` to enforce trimmed non-empty `playerName` and normalized comparisons
- [ ] T007 [P] Add `start` handler stub to `backend/src/api/rooms.ts` (route: `POST /rooms/:code/start`) and wire error handling for host validation and minimum participant checks
- [ ] T008 [P] Add unit tests for `roomStore` helper functions in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Foundational tasks must be completed before user story implementation.

---

## Phase 3: User Story Implementation (Priority: P1)

### User Story 1 - Create Room (US1)

- [ ] T009 [US1] Implement `createRoom` function in `backend/src/services/roomStore.ts` to create `Participant`, generate `Room.code`, set `hostId`, and store room
- [ ] T010 [US1] Ensure `POST /rooms` in `backend/src/api/rooms.ts` calls `createRoom` and returns `201` with `{ participantId, room }`
- [ ] T011 [US1] Add API contract test for room creation in `backend/tests/api/createRoom.test.ts`

### User Story 2 - Join Room and Name Validation (US2)

- [ ] T012 [US2] Implement `joinRoom` in `backend/src/services/roomStore.ts` with normalization (trim, collapse) and duplicate-name rejection (case-insensitive)
- [ ] T013 [US2] Ensure `POST /rooms/:code/join` in `backend/src/api/rooms.ts` uses `joinRoom` and returns appropriate errors (400 on duplicate)
- [ ] T014 [US2] Add contract tests for join validation and duplicate-name behavior in `backend/tests/api/joinRoom.test.ts`

### User Story 3 - Multi-Room Isolation (US3)

- [ ] T015 [US3] Add tests verifying multi-room isolation in `backend/tests/integration/multiRoomIsolation.test.ts` (create two rooms, perform ops, assert isolation)

### User Story 4 - Lobby Polling (US4)

- [ ] T016 [US4] Add `fetchRoom` support and snapshot format tests in `backend/tests/api/fetchRoom.test.ts`
- [ ] T017 [US4] Implement client-side polling in `frontend/src/pages/LobbyPage.tsx` (default 2000ms) that calls `roomStore.fetchRoom()`
- [ ] T018 [US4] Add front-end integration test (or mock-based test) asserting that `roomStore` updates within ~2s when server state changes

### User Story 5 - Host-only Start & Minimum Players (US5)

- [ ] T019 [US5] Implement `startGame` in `backend/src/services/roomStore.ts` that validates `participantId === hostId` and `participants.length >= 2`
- [ ] T020 [US5] Extend `startGame` behavior to assign `currentDrawer`, choose a `secretWord`, and set `gameStarted = true`
- [ ] T021 [US5] Implement `POST /rooms/:code/start` handler in `backend/src/api/rooms.ts` to call `startGame` and return the viewer-aware snapshot or error
- [ ] T022 [US5] Add contract tests to verify start permission, minimum players, drawer assignment, and drawer-only secret visibility in `backend/tests/api/startGame.test.ts`

### User Story 7 - Gameplay Interaction (US7)

- [ ] T023 [US7] Extend `backend/src/models/game.ts` to include `guesses` array and `scores` map on `Room` and update shared types used by snapshots
- [ ] T024 [US7] Implement `POST /rooms/:code/guesses` in `backend/src/api/rooms.ts` and implement `submitGuess(code, participantId, text)` in `backend/src/services/roomStore.ts` to:
	- validate trimmed non-empty `text`
	- append guess to `room.guesses` with `{ participantId, text, timestamp, correct }`
	- award +100 to `room.scores[participantId]` on correct guess
	- return viewer-aware snapshot
- [ ] T025 [US7] Update `toRoomSnapshot` to include `guesses` and `scores` in snapshots while still redacting `secretWord` for non-drawers
- [ ] T026 [US7] Add unit/contract tests for guess submission behavior in `backend/tests/api/guesses.test.ts` (validation, correct detection, scoring)
- [ ] T027 [US7] Add client-side `api.submitGuess(code, participantId, text)` and expose `roomStore.submitGuess()` which calls the API and refreshes state
- [ ] T028 [US7] Update `frontend/src/pages/GamePage.tsx` to display recent `guesses` and `scores` and to submit guesses via `GuessForm` (with client-side trimming and normalization before sending)
- [ ] T029 [US7] Ensure gameplay polling (2s) continues to refresh `guesses` and `scores` for synchronized UI; add integration test or mock that asserts new guesses appear within ~2 seconds

### User Story 9/10 - Results & Restart (US9/US10)

- [ ] T030 [US9] Add a `results` view in `frontend/src/pages/GamePage.tsx` or a separate `ResultsPage.tsx` that renders `scores` and recent `guesses`, highlighting winners
- [ ] T031 [US10] Implement `POST /rooms/:code/restart` in `backend/src/api/rooms.ts` and `restartRoom(code, participantId)` in `backend/src/services/roomStore.ts` to:
	- validate host-only permission
	- clear `guesses`, `secretWord`, and `currentDrawer`
	- reset `scores` entries to `0` for all participants
	- set `gameStarted = false` and return viewer-aware snapshot
- [ ] T032 [US10] Add contract tests for restart behavior in `backend/tests/api/restart.test.ts` (host success, non-host 403, players preserved)
- [ ] T033 [US10] Wire a host-only `Restart Round` button in the frontend results view which calls the API and then refreshes state


---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T023 [P] Improve error messages and validation responses in `backend/src/api/errorHandler` and tests
- [ ] T024 [P] Add client-side name normalization in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T025 [P] Add `startGame` client call to `frontend/src/services/api.ts` and expose via `roomStore` actions
- [ ] T026 [P] Update documentation (README) in `specs/001-room-setup-lobby/` describing poll interval and API expectations

---

## Out-of-Scope (explicit)

- Timers for game rounds (OUT OF SCOPE)
- Drawer rotation / drawing turn management (OUT OF SCOPE)
- Any database or persistent storage integration (OUT OF SCOPE) — in-memory only

---

## Dependencies & Execution Order

- Foundational (T004–T008) must complete before any `US` tasks (T009+)
- Within each user story, implement core backend (e.g., `createRoom`/`joinRoom`) before adding frontend UI hooks and polling
- Tests should be added alongside implementation tasks (unit tests for helpers, contract tests for endpoints)

## Parallel Opportunities

- Type definitions and model files (T002, T003) can be done in parallel with schema updates (T006)
- Frontend UI changes (T017, T023, T024) can proceed in parallel once API endpoints are available

## Estimated Task Counts

- Backend implementation & tests: ~12 tasks
- Frontend implementation & tests: ~5 tasks

---

## Notes

- Keep strict validation and follow constitution: Node.js 18, React functional components, 2s polling, in-memory storage only.
- Each task above lists the file path to modify or create for clarity and execution.
