---

description: "Task list for Game Start & Drawer Flow feature"

---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Tests**: The spec.md mandates user scenarios and acceptance testing. Test tasks are included to verify each story independently.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- **Tests**: `.test.ts` files co-located with source

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the feature branch is ready and existing code compiles/passes

- [X] T001 Checkout `002-game-start-drawer` branch and verify both `backend` and `frontend` compile with `npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model and type changes that both user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add `drawerId` and `secretWord` fields to `Room` interface in `backend/src/models/game.ts`
- [X] T003 [P] Add `drawerId` (always present) and `secretWord` (`string | undefined`) to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [X] T004 [P] Update frontend `RoomSnapshot` type in `frontend/src/services/api.ts` — add `drawerId: string` and `secretWord?: string`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Game Starts and Drawer Is Assigned (Priority: P1) 🎯 MVP

**Goal**: When the host starts a game with 2+ players, the room transitions to "playing", the host is assigned as the drawer with a deterministically selected secret word, and the drawer identity + word (drawer-only) are exposed in all game state responses.

**Independent Test**: Create a room with 2+ players via API, call `POST /rooms/:code/start`, then verify:
- Room status is `"playing"`
- `drawerId` equals `hostId`
- The drawer participant receives `secretWord` in `GET /rooms/:code?participantId=<drawerId>`
- Non-drawer participants do NOT receive `secretWord`

### Tests for User Story 1

- [X] T005 [P] [US1] Write backend unit tests for deterministic word selection (DJB2 hash) in `backend/src/services/roomStore.test.ts`
- [X] T006 [P] [US1] Write backend unit tests for `startGame()` drawer assignment and snapshot filtering in `backend/src/services/roomStore.test.ts`
- [X] T007 [P] [US1] Write backend API contract test for `POST /rooms/:code/start` in `backend/src/api/rooms.test.ts`
- [X] T008 [P] [US1] Write frontend test for GamePage polling and drawer/secretWord display in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement DJB2 hash function for deterministic word selection in `backend/src/services/roomStore.ts`
- [X] T010 [US1] Update `startGame()` in `backend/src/services/roomStore.ts` to set `drawerId = hostId` and `secretWord` via DJB2 hash
- [X] T011 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `drawerId` always and `secretWord` only when `viewerParticipantId === room.drawerId`
- [X] T012 [US1] Update `POST /rooms/:code/start` route in `backend/src/api/rooms.ts` to return full snapshot via `toRoomSnapshot()`
- [X] T013 [P] [US1] Add polling to `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` (~2s interval, navigates away if status !== "playing")
- [X] T014 [P] [US1] Show drawer indicator and secret word in `frontend/src/pages/GamePage.tsx` — display "You are the drawer!" + secret word for drawer, "Drawer: <name>" for guessers

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 — Player Names Are Validated (Priority: P1)

**Goal**: When a player creates or joins a room, their display name is trimmed of leading/trailing whitespace. If the result is empty, contains invalid characters, or exceeds 15 characters, the request is rejected with the message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".

**Independent Test**: Attempt to create/join rooms with whitespace-padded names, empty names, names with invalid characters, and names over 15 chars. Verify the system's responses match the acceptance scenarios.

### Tests for User Story 2

- [X] T015 [P] [US2] Write backend Zod schema tests for name validation rules (trim, regex, max 15) in `backend/src/api/schemas.test.ts`
- [X] T016 [P] [US2] Write backend route tests for name validation in create/join in `backend/src/api/rooms.test.ts`

### Implementation for User Story 2

- [X] T017 [P] [US2] Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` — add `.trim()`, `.min(1)`, `.max(15)`, `.regex(/^[A-Za-z0-9 _-]+$/)` on `playerName`; set error message to "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores"
- [X] T018 [US2] Wire name trimming in `POST /` route handler in `backend/src/api/rooms.ts` before passing to `createRoom()`
- [X] T019 [US2] Wire name trimming in `POST /:code/join` route handler in `backend/src/api/rooms.ts` before passing to `joinRoom()`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 — Secret Word Is Deterministically Selected (Priority: P2)

**Goal**: Verify that the same room setup always produces the same secret word, and the word is always from the starter list.

**Independent Test**: Create two rooms with identical participant setups, start both games, and verify both produce the same secret word from the starter list.

### Tests for User Story 3

- [X] T020 [P] [US3] Write determinism tests — create two identically configured rooms and assert they produce the same secret word in `backend/src/services/roomStore.test.ts`
- [X] T021 [P] [US3] Write edge case tests — empty word list guard, single-word list, hash distribution in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 3

> NOTE: Core implementation (DJB2 hash, `startGame()` logic, `toRoomSnapshot()`) is completed in Phase 3 (US1). This phase verifies and hardens the determinism guarantee.

- [X] T022 [US3] Add empty word list guard in `startGame()` in `backend/src/services/roomStore.ts` — return 400 if `STARTER_WORDS` is empty

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and cleanup

- [X] T023 [P] Run `cd backend && npm test` and fix any failures
- [X] T024 [P] Run `cd frontend && npm test` and fix any failures
- [ ] T025 Run manual validation per `quickstart.md` — test game start flow and name validation in browser
- [ ] T026 [P] Verify polling consistently navigates from Lobby → Game on "playing" status
- [ ] T027 [P] Verify non-drawer never receives `secretWord` in any API response (including polling)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — can start simultaneously with US2
- **US2 (Phase 4)**: Depends on Foundational — can start simultaneously with US1
- **US3 (Phase 5)**: Depends on US1 implementation (reuses DJB2 hash and `startGame()` results) — tests only
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — Completely independent from US1 (different files)
- **User Story 3 (P2)**: Depends on US1 implementation — Tests only, no new implementation beyond empty-list guard

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 2 tasks marked [P] can run in parallel (different files: backend `game.ts`, frontend `api.ts`)
- US1 and US2 are fully parallelizable (different files, no shared dependencies)
- T005/T006/T013/T014 (US1 tests and frontend) can run in parallel with T009/T010/T011/T012 (US1 backend)
- T015/T016/T017 (US2 backend) can run in parallel with US1 tasks
- T020/T021 (US3 tests) can run after US1 implementation is done

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: T005 "Backend unit tests for deterministic word selection"
Task: T006 "Backend unit tests for startGame()"
Task: T007 "Backend API contract test for POST /rooms/:code/start"
Task: T008 "Frontend test for GamePage"

# Launch US1 backend + frontend together:
Task: T009 "Implement DJB2 hash in roomStore.ts"
Task: T013 "Add polling to GamePage.tsx"

# After T009-T010, launch remaining UI:
Task: T014 "Show drawer indicator and secret word in GamePage.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch all US2 tasks together (all independent):
Task: T015 "Zod schema tests for name validation"
Task: T017 "Update createRoomSchema and joinRoomSchema"
Task: T018 "Wire name trimming in POST /"
Task: T019 "Wire name trimming in POST /:code/join"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (BLOCKS all stories)
3. Complete Phase 3: User Story 1 — game start, drawer assignment, secret word
4. **STOP and VALIDATE**: Test US1 independently
5. At this point, the core game loop is functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Game start works, drawer sees word → **MVP!**
3. Add User Story 2 → Name validation protects against bad input
4. Add User Story 3 → Determinism verified by tests
5. Polish → Full validation pass

### Parallel Team Strategy

With two developers:
1. Both complete Setup + Foundational together
2. Developer A: User Story 1 (game start & drawer flow)
3. Developer B: User Story 2 (name validation)
4. Both stories complete independently with no merge conflicts (different files)
5. Developer A adds US3 tests after US1 implementation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
