# Tasks: Room Lobby Game Flow

**Input**: Design documents from `/specs/001-room-lobby-game-flow/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-endpoints.md`

## Feature Group Checkpoints

- [x] **Group 1 - Room setup and lobby**: Host tracking on room creation, trimmed player-name validation with clear errors, multi-room isolation tests, automatic lobby polling within about 2 seconds, and host-only start with a 2-player minimum.
- [x] **Group 2 - Game start and drawer flow**: Deterministic drawer assignment, deterministic secret word selection, and drawer-only word visibility during active play.
- [x] **Group 3 - Gameplay interaction**: Interactive drawing canvas, drawer-only clear canvas, validated guess submission, synced guess history by polling, and deterministic correct-guess scoring.
- [x] **Group 4 - Result, restart, and final validation**: Shared result state, host-only restart to lobby, players preserved, and round state cleared.

## Phase 1: Setup (Shared Discovery & Artifacts)

- [ ] T001 Review `specs/001-room-lobby-game-flow/plan.md`, `specs/001-room-lobby-game-flow/spec.md`, `specs/001-room-lobby-game-flow/contracts/api-endpoints.md`, and `specs/001-room-lobby-game-flow/data-model.md`
- [ ] T002 Create `specs/001-room-lobby-game-flow/tasks.md` with a dependency-ordered implementation plan for room setup, lobby, and game flow
- [ ] T003 Audit `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/pages/GamePage.tsx`
- [ ] T004 Update `specs/001-room-lobby-game-flow/contracts/api-endpoints.md` if the actual backend request/response shape differs from the current API contract
- [ ] T005 Update `specs/001-room-lobby-game-flow/data-model.md` if the implemented room snapshot or participant model differs from the current data model

---

## Phase 2: Foundational (Backend/Frontend Core)

- [ ] T006 [P] Implement or refine Zod validation for room lifecycle payloads in `backend/src/api/schemas.ts`
- [ ] T007 [P] Implement or refine room entity definitions in `backend/src/models/game.ts` and ensure room snapshot shape matches `data-model.md`
- [ ] T008 [P] Implement or refine in-memory room storage and lookup helpers in `backend/src/services/roomStore.ts`
- [ ] T009 [P] Implement or refine backend routes for room creation, join, and refresh in `backend/src/api/rooms.ts`
- [ ] T010 [P] Implement or refine backend routing registration in `backend/src/api/router.ts`
- [ ] T011 [P] Implement or refine frontend room session persistence in `frontend/src/state/roomStore.ts`
- [ ] T012 [P] Implement or refine frontend API client methods `createRoom()`, `joinRoom()`, and `fetchRoom()` in `frontend/src/services/api.ts`
- [ ] T013 [P] Implement or refine frontend route guards or redirect logic for lobby/game access in `frontend/src/routes/index.tsx`
- [ ] T014 [P] Implement backend error payload normalization for `404` and invalid room responses in `backend/src/api/rooms.ts`
- [ ] T015 [P] Add or update backend validation and room store tests in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [ ] T016 [P] Add or update frontend API tests in `frontend/src/services/api.test.ts`

---

## Phase 3: User Story 1 - Create room and enter lobby (Priority: P1)

**Goal**: Enable a player to create a new room, generate a room code, and navigate to the lobby showing the created player.

**Independent Test**: Verify that room creation navigates to `/lobby`, the room code is visible, and the creating player appears in the participant list.

- [ ] T017 [US1] Implement backend `POST /rooms` in `backend/src/api/rooms.ts` to create a room, generate an uppercase room code, and return `participantId` plus room snapshot
- [x] T018 [US1] Implement backend rejection of empty trimmed `playerName` values with a clear validation error in `backend/src/api/rooms.ts`
- [ ] T019 [US1] Implement frontend `CreateRoomPage.tsx` form submission to call `createRoom()` and navigate to `frontend/src/pages/LobbyPage.tsx`
- [ ] T020 [US1] Implement frontend lobby rendering in `frontend/src/pages/LobbyPage.tsx` so the room code and participant list are displayed from `RoomStore`
- [ ] T021 [US1] Ensure `frontend/src/state/roomStore.ts` stores `participantId` and latest room snapshot after room creation
- [ ] T022 [US1] Add validation to `frontend/src/pages/CreateRoomPage.tsx` so blank names are handled consistently with backend defaults

---

## Phase 4: User Story 2 - Join an existing room (Priority: P2)

**Goal**: Allow a second player to join an existing room using a room code and see both participants in the lobby.

**Independent Test**: Verify that a player can join with a valid room code and see both the existing player and themselves listed in the lobby.

- [ ] T023 [US2] Implement backend `POST /rooms/:code/join` in `backend/src/api/rooms.ts` with uppercase room code normalization and room existence checking
- [ ] T024 [US2] Implement backend 404 response for invalid room codes in `backend/src/api/rooms.ts`
- [ ] T025 [US2] Implement frontend `JoinRoomPage.tsx` form submission to call `joinRoom()` and navigate to `frontend/src/pages/LobbyPage.tsx`
- [ ] T026 [US2] Ensure `frontend/src/state/roomStore.ts` updates the current room snapshot and `participantId` after a successful join
- [ ] T027 [US2] Ensure `frontend/src/pages/LobbyPage.tsx` displays the updated participant list after join
- [ ] T028 [US2] Preserve join form values in `frontend/src/pages/JoinRoomPage.tsx` when join requests fail

---

## Phase 5: User Story 3 - Refresh lobby and start game (Priority: P3)

**Goal**: Refresh the lobby state from the backend and permit navigation to the game page while preserving room context.

**Independent Test**: Verify that lobby refresh updates the participant list and that Start Game navigates to `/game` with the same room session.

- [ ] T029 [US3] Implement backend `GET /rooms/:code?participantId=...` refresh endpoint in `backend/src/api/rooms.ts` returning the latest room snapshot
- [ ] T030 [US3] Implement frontend `LobbyPage.tsx` refresh behavior to call `fetchRoom()` and update the lobby state
- [ ] T031 [US3] Implement frontend `LobbyPage.tsx` UI for refresh status and retryable error messages when refresh fails
- [ ] T032 [US3] Implement frontend Start Game navigation from `frontend/src/pages/LobbyPage.tsx` to `frontend/src/pages/GamePage.tsx`
- [ ] T033 [US3] Ensure `frontend/src/pages/GamePage.tsx` uses the preserved `RoomStore` state and does not lose room context on entry
- [ ] T034 [US3] Implement redirect logic in `frontend/src/routes/index.tsx` or `frontend/src/pages/LobbyPage.tsx` / `frontend/src/pages/GamePage.tsx` when room session state is missing

---

## Phase 6: User Story 4 - Recover from invalid join / missing room (Priority: P4)

**Goal**: Surface recoverable errors for invalid room joins or missing rooms and preserve form state during recovery.

**Independent Test**: Verify that invalid join attempts show a clear error and the entered room code/name remain on screen.

- [ ] T035 [US4] Implement frontend invalid-room error handling in `frontend/src/pages/JoinRoomPage.tsx` with a visible message and preserved input values
- [ ] T036 [US4] Implement backend `404` payloads and error messages for join and fetch routes in `backend/src/api/rooms.ts`
- [ ] T037 [US4] Implement missing-room recovery in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx` by redirecting to the start page or showing an error before navigation
- [ ] T038 [US4] Update `frontend/src/services/api.ts` to normalize room codes to uppercase before join/fetch requests and handle backend 404 errors consistently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Review, documentation, validation, and cleanup across the feature.

- [ ] T039 [P] Review and sync `specs/001-room-lobby-game-flow/quickstart.md` with the implemented room creation, join, lobby refresh, and game navigation flows
- [ ] T040 [P] Validate implemented behavior against acceptance criteria in `specs/001-room-lobby-game-flow/spec.md`
- [ ] T041 [P] Perform code cleanup and consistency review in `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/services/api.ts`, and `frontend/src/pages`
- [ ] T042 [P] Update any developer notes or README guidance if the room lobby flow behavior changed from the starter app expectations
- [ ] T043 [P] Add an explicit validation task to confirm the backend remains memory-only and no persistent storage is introduced in backend runtime
- [ ] T044 [P] Add an explicit validation task to confirm the Exit Game flow returns the user to the lobby and preserves the current room session state
- [ ] T045 [P] Conduct final manual validation of the user stories by exercising Create Room, Join Room, Refresh Lobby, Start Game, Exit Game, and invalid room recovery flows

---

## Dependencies & Execution Order

- **Phase 1** must be completed first to align discovery, artifacts, and the feature contract.
- **Phase 2** must complete before any user story implementation begins; it provides the foundational backend/frontend core and validation.
- **Phase 3** through **Phase 6** can proceed in priority order after Phase 2, with each story independently testable.
- **Phase 7** is the final polish stage after all user stories are implemented.

### Story Order

1. User Story 1 (P1): Create room and enter lobby
2. User Story 2 (P2): Join an existing room
3. User Story 3 (P3): Refresh lobby and start game
4. User Story 4 (P4): Recover from invalid join / missing room

### Parallel Opportunities

- `T006`, `T007`, `T008`, `T009`, `T010`, `T011`, `T012`, `T013`, `T014`, `T015`, and `T016` can be executed in parallel within Phase 2 where team capacity allows
- Story implementation tasks within each user story are ordered, but separate stories can be worked in parallel once Phase 2 is complete
- `T039`, `T040`, `T041`, `T042`, and `T043` are cross-cutting validation and review tasks suitable for parallel execution after implementation

### MVP Scope

- The MVP is User Story 1: room creation, lobby entry, room code display, and participant list rendering.
- After MVP validation, add User Story 2 for join flow, User Story 3 for lobby refresh/start game, and User Story 4 for error recovery.
