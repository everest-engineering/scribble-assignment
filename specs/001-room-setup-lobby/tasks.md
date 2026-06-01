# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/http-api.md

**Organization**: Tasks are grouped by phase and user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P] [Story] Description`

- **[ID]**: Task identifier (T001-T0XX)
- **[P]**: Can run in parallel *(yes/no)*
- **[Story]**: Which user story (US1-US5)
- Include exact file paths and line numbers where applicable

## Phase 0: Discovery & Setup (Shared Infrastructure)

**Purpose**: Inspect existing code, document gaps, and prepare development environment.

- [ ] **T001** Create discovery notes with:
  - ≥3 incomplete behaviors from the starter (examine CreateRoomPage, JoinRoomPage, LobbyPage, roomStore.ts, rooms.ts)
  - ≥2 assumptions (e.g., polling cadence ~2s is acceptable latency; player names don't need to be unique)
  - List of relevant files to modify
  - File: `specs/001-room-setup-lobby/DISCOVERY.md` (new)

- [ ] **T002** [P] Run backend tests to confirm starter baseline
  - Command: `cd backend && npm test`
  - Verify roomStore.test.ts and schemas.test.ts pass
  - Document any pre-existing failures

- [ ] **T003** [P] Run frontend tests to confirm starter baseline
  - Command: `cd frontend && npm test`
  - Verify api.test.ts and any component tests pass
  - Document any pre-existing failures

---

## Phase 1: Backend Foundation (Blocking)

**Purpose**: Establish type system, validation schemas, and room store logic. All backend user story work depends on this.

### Type System

- [ ] **T004** Update/create `backend/src/models/game.ts` to define:
  - `Player` interface: `{ id, name, isHost }`
  - `Room` interface: `{ code, hostId, participants, gameState, createdAt }`
  - `GameState` type: `"lobby" | "inProgress" | "finished"`
  - Export all types for use in API layer
  - Test: Verify types compile without errors

### Validation Schemas

- [ ] **T005** Update `backend/src/api/schemas.ts`:
  - Create `PlayerNameSchema`: Zod string, min 1 char, trimmed via `.trim()`
  - Create `CreateRoomSchema`: `{ playerName: PlayerNameSchema }`
  - Create `JoinRoomSchema`: `{ playerName: PlayerNameSchema }`
  - Create `RoomCodeSchema`: Zod string, case-insensitive normalization (lowercase)
  - Export all schemas
  - Test: Verify valid/invalid inputs are caught (empty names, special chars allowed)

### RoomStore Service

- [ ] **T006** Refine `backend/src/services/roomStore.ts`:
  - Add `generateCode()` method: 4-6 alphanumeric, case-insensitive, unique
  - Add `generatePlayerId()` method: UUID v4 or nanoid
  - Update `createRoom(playerName: string)`: 
    - Validate name via schema (reject empty/whitespace)
    - Generate unique code
    - Generate player ID
    - Create room with host as first participant
    - Return `{ code, playerId, room }`
  - Update `joinRoom(code: string, playerName: string)`:
    - Validate name via schema
    - Normalize code to lowercase
    - Verify code exists (throw if not)
    - Check if player already in room by name/ID; if yes, update; if no, add
    - Generate new player ID if first-time join
    - Return `{ room, playerId }`
  - Add `getRoom(code: string)`: Return room or undefined
  - Ensure room isolation (no leakage between rooms)
  - Test: All methods tested with valid/invalid inputs

### RoomStore Tests

- [ ] **T007** Update `backend/src/services/roomStore.test.ts`:
  - Test `createRoom()`: Creates unique code, sets host, returns correct shape
  - Test `joinRoom()`: Adds player, normalizes code, rejects invalid code
  - Test duplicate joins: Rejoining same player updates entry, no duplication
  - Test room isolation: Two rooms with different codes have separate participants
  - Test name validation: Empty/whitespace names rejected
  - Test code uniqueness: Multiple rooms have different codes
  - Coverage target: >90% for roomStore

### API Endpoint Updates

- [ ] **T008** Update `backend/src/api/rooms.ts`:
  - `POST /rooms`: 
    - Extract and validate `playerName` via schema
    - Call `roomStore.createRoom(playerName)`
    - Return 201 with response shape: `{ code, hostId, participants, playerId }`
    - Return 400 if validation fails
  - `POST /rooms/:code/join`:
    - Extract and validate `playerName` via schema
    - Normalize `:code` to lowercase
    - Call `roomStore.joinRoom(code, playerName)`
    - Return 200 with response shape: `{ code, participants, playerId, isHost: false }`
    - Return 404 if room not found
    - Return 400 if validation fails
  - `GET /rooms/:code`:
    - Normalize `:code` to lowercase
    - Call `roomStore.getRoom(code)`
    - Return 200 with response shape: `{ code, hostId, participants, gameState }`
    - Return 404 if room not found
  - Use centralized error handler for consistency
  - Test: All endpoints tested with valid/invalid inputs

- [ ] **T009** Run backend test suite:
  - Command: `cd backend && npm test`
  - Verify all backend tests pass
  - Verify no regressions in existing tests

---

## Phase 2: Frontend Foundation (Can start after Phase 1; independent from Phase 3)

**Purpose**: Establish frontend state management, API client updates, and component scaffolding. User story implementation can begin once this is complete.

### Frontend State Management

- [ ] **T010** Update `frontend/src/state/roomStore.ts` (Zustand):
  - Add state fields:
    - `currentCode: string | null`
    - `currentPlayerId: string | null`
    - `isHost: boolean`
    - `participants: Player[]`
    - `isPolling: boolean`
    - `lastPollTime: number | null`
    - `pollError: string | null`
  - Add actions:
    - `createRoom(playerName: string): Promise<void>` — calls API, sets currentCode, currentPlayerId, isHost, participants
    - `joinRoom(code: string, playerName: string): Promise<void>` — calls API, sets state
    - `leaveRoom(): void` — clears all room state
    - `startPolling(code: string): void` — sets isPolling, begins polling loop
    - `stopPolling(): void` — stops polling, clears pollError
    - `_setParticipants(participants: Player[]): void` — internal, used by polling
    - `_setPollError(error: string | null): void` — internal
  - Type safety: All types strict, no `any`
  - Test: Verify actions update state correctly

### API Client Updates

- [ ] **T011** Update `frontend/src/services/api.ts`:
  - Add `createRoom(playerName: string): Promise<{ code, hostId, participants, playerId }>`
  - Add `joinRoom(code: string, playerName: string): Promise<{ code, participants, playerId, isHost }>`
  - Add `getRoom(code: string): Promise<{ code, hostId, participants, gameState }>`
  - All methods use Zod validation for responses
  - Error handling: Throw errors with user-friendly messages
  - Test: Each method tested with mocked responses

- [ ] **T012** Update `frontend/src/services/api.test.ts`:
  - Test `createRoom()`: Valid response, error handling
  - Test `joinRoom()`: Valid response, 404 handling, 400 handling
  - Test `getRoom()`: Valid response, 404 handling
  - Test network errors: No UI crash, error message returned
  - Coverage target: >90% for api.ts polling/error paths

---

## Phase 3: User Story Implementation (US1-US5)

### US1: Host Creates a Room

- [ ] **T013** Update `frontend/src/components/CreateRoomPage.tsx`:
  - Add form state: `playerName`
  - Add input validation: trim, non-empty, show error if invalid
  - On submit: Call `roomStore.createRoom(playerName)`
  - Handle success: Navigate to LobbyPage
  - Handle error: Display error message, remain on form
  - Test: Form submits with valid name, navigates to lobby; invalid name shows error

- [ ] **T014** Verify backend `POST /rooms` endpoint works:
  - Manual test: curl or Postman `POST /rooms` with valid name
  - Verify response includes code, hostId, participants with host marked
  - Test: Invalid name returns 400

- [ ] **T015** Add integration test (backend):
  - Test file: `backend/tests/integration/create-room.test.ts` (new)
  - Test: Create room, verify room in store, code is unique
  - Test: Invalid name returns 400

### US2: Joiner Joins Room by Code

- [ ] **T016** Update `frontend/src/components/JoinRoomPage.tsx`:
  - Add form state: `code`, `playerName`
  - Add input validation: trim both, non-empty, show errors
  - On submit: Call `roomStore.joinRoom(code, playerName)`
  - Handle success: Navigate to LobbyPage
  - Handle errors (404, 400, network): Display specific error message, remain on form
  - Test: Valid join navigates to lobby; invalid code/name shows appropriate error

- [ ] **T017** Verify backend `POST /rooms/:code/join` endpoint works:
  - Manual test: Create room, join with valid code and name
  - Verify response includes participants with both players
  - Test: Invalid code returns 404; invalid name returns 400

- [ ] **T018** Add integration test (backend):
  - Test file: `backend/tests/integration/join-room.test.ts` (new)
  - Test: Create room, join room, verify both in participants
  - Test: Join invalid code returns 404
  - Test: Join with empty name returns 400

### US3: Lobby Polling for Real-Time Updates

- [ ] **T019** Update `frontend/src/components/LobbyPage.tsx`:
  - On mount: Call `roomStore.startPolling(currentCode)`
  - Display participants list from `roomStore.participants`
  - On unmount: Call `roomStore.stopPolling()`
  - If `pollError` is set: Display subtle error indicator
  - Rerender when `participants` changes
  - Test: New participant appears in list within ~3 seconds after joining from another browser

- [ ] **T020** Implement polling loop in `frontend/src/state/roomStore.ts`:
  - `startPolling(code)`: 
    - Set `isPolling: true`
    - Start `setInterval` that calls `getRoom(code)` every ~2000ms
    - On success: Update `participants`, clear `pollError`
    - On error: Set `pollError`, retry next interval
    - Use `AbortController` or cleanup function to cancel on `stopPolling()`
  - `stopPolling()`: 
    - Clear interval, set `isPolling: false`, `pollError: null`
  - Test: Polling runs correctly, updates state, handles errors gracefully

- [ ] **T021** Verify backend `GET /rooms/:code` endpoint works:
  - Manual test: Poll a room multiple times, verify consistent response
  - Test: Invalid code returns 404

- [ ] **T022** Add integration test (frontend):
  - Test file: `frontend/src/state/roomStore.test.ts` (new, or extend existing)
  - Test: Polling starts/stops correctly
  - Test: Participants update on poll success
  - Test: Network error handled gracefully

### US4: Host-Only Start Game with Minimum Validation

- [ ] **T023** Update `frontend/src/components/LobbyPage.tsx`:
  - Display "Start Game" button only if `roomStore.isHost === true`
  - Button disabled if `roomStore.participants.length < 2`
  - Show tooltip/message: "At least 2 players required to start" when disabled
  - On click: Validate `participants.length >= 2`, then navigate to GamePage (placeholder, game start out of scope)
  - Test: Button only visible to host, disabled with <2 players, enabled with ≥2 players

- [ ] **T024** Update `frontend/src/styles/app.css`:
  - Add styles for host indicator (e.g., badge or label)
  - Add styles for disabled button state
  - Add styles for start button (primary color, hover, disabled)
  - Verify responsive design on mobile

- [ ] **T025** Add integration test (frontend):
  - Test file: `frontend/src/components/LobbyPage.test.tsx` (new, or extend existing)
  - Test: Start button visible only to host
  - Test: Button disabled/enabled based on participant count

### US5: Room Isolation & Multi-Room Support

- [ ] **T026** Manual multi-room test:
  - Open two browser instances (or two tabs)
  - Tab A: Create Room X
  - Tab B: Create Room Y
  - Verify Tab A sees Room X participants only; Tab B sees Room Y participants only
  - Tab A join/leave does not affect Tab B
  - Document test results in: `specs/001-room-setup-lobby/MANUAL_TESTS.md` (new)

- [ ] **T027** Add backend test for room isolation:
  - Test file: `backend/tests/integration/room-isolation.test.ts` (new)
  - Create two rooms, verify isolation, join each, verify participants don't cross rooms

---

## Phase 4: Testing & Validation

### Manual End-to-End Testing

- [ ] **T028** Two-browser scenario test:
  - Start backend and frontend
  - Browser 1: Create room, see self as host in lobby
  - Browser 2: Join room via code, see both players
  - Browser 1: See new participant appear within ~3 seconds (via polling)
  - Browser 1 (host): See Start button enabled with 2 players
  - Browser 2: Verify Start button not visible
  - Document results in: `specs/001-room-setup-lobby/MANUAL_TESTS.md`

- [ ] **T029** Error handling test:
  - Try to create room with empty name → see error
  - Try to join with invalid code → see 404 error
  - Try to join with empty name → see error
  - Turn off backend → polling error shown but UI doesn't crash; restart backend, polling resumes
  - Document results in: `specs/001-room-setup-lobby/MANUAL_TESTS.md`

- [ ] **T030** Multi-room isolation test:
  - Create Room A and Room B
  - Add players to each
  - Verify participants lists are independent
  - Document results in: `specs/001-room-setup-lobby/MANUAL_TESTS.md`

### Automated Test Suite

- [ ] **T031** Run full backend test suite:
  - Command: `cd backend && npm test`
  - Verify all tests pass, no regressions

- [ ] **T032** Run full frontend test suite:
  - Command: `cd frontend && npm test`
  - Verify all tests pass, no regressions

- [ ] **T033** Build both apps:
  - Command: `cd backend && npm run build`
  - Command: `cd frontend && npm run build`
  - Verify no TypeScript errors, builds succeed

---

## Phase 5: Documentation & Review

- [ ] **T034** Create discovery notes: `specs/001-room-setup-lobby/DISCOVERY.md`
  - Document ≥3 gaps found in starter code
  - Document ≥2 assumptions made
  - List all modified files

- [ ] **T035** Create manual test results: `specs/001-room-setup-lobby/MANUAL_TESTS.md`
  - Document all manual tests executed (T028-T030)
  - Record pass/fail for each scenario
  - Document any issues found and how they were resolved

- [ ] **T036** Code review checklist:
  - All TypeScript types are strict (no `any`)
  - All input validation uses Zod
  - All error handling is centralized or documented
  - All polling logic is non-blocking and cancellable
  - All tests pass with >90% coverage for modified files
  - No console.error or console.log left behind (except debug flags)
  - Code follows project structure conventions

- [ ] **T037** Update spec artifacts:
  - Ensure spec.md, plan.md, data-model.md are in sync with implementation
  - Document any deviations from plan and rationale
  - Commit all artifacts together

---

## Summary

- **Total Tasks**: 37
- **Phases**: 5 (Discovery, Backend, Frontend, User Stories, Testing & Review)
- **Parallel-Ready**: T002-T003, T010-T012 can run in parallel with other phases
- **Blockers**: Phase 1 (backend) must complete before Phase 3 user story work; Phase 2 (frontend state) must complete before Phase 3
- **Estimated Effort**: Backend 2-3 days; Frontend 2-3 days; Testing 1 day; **Total 5-7 days**

---

## Next Steps

1. Begin with Phase 0: Discovery. Document gaps and assumptions.
2. Proceed to Phase 1: Backend. Implement types, schemas, and RoomStore.
3. Implement Phase 2: Frontend. Update state management and API client.
4. Implement Phase 3: User stories, one at a time.
5. Phase 4: Comprehensive testing.
6. Phase 5: Documentation and review.

