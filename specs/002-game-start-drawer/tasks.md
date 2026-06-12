# Tasks: Game Start — First Round Drawer & Secret Word

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project is ready for feature extension.

- [ ] T001 Verify backend and frontend dev servers start and existing tests pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend shared types, schemas, services, and state that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Extend `backend/src/models/game.ts` with `drawerId` and `currentWord` on `Room`, and `drawerId`/`currentWord` on `RoomSnapshot` (remove `roles` array)
- [ ] T003 [P] Extend `frontend/src/services/api.ts` `RoomSnapshot` type with `drawerId: string | null` and `currentWord: string | null` (remove `roles`)
- [ ] T004 Update `backend/src/services/roomStore.ts` `createRoom` to initialize `drawerId: null` and `currentWord: null`
- [ ] T005 Update `backend/src/services/roomStore.ts` `toRoomSnapshot` to include `drawerId` and viewer-based `currentWord` (actual word for drawer, `null` for guesser)
- [ ] T006 Update `backend/src/api/rooms.ts` to pass `participantId` into `toRoomSnapshot` for both `GET /:code` and `POST /:code/start` endpoints

**Checkpoint**: Foundation ready — types, snapshot logic, and frontend API types support all user stories.

---

## Phase 3: User Story 1 - Host Starts the Game and First Round Begins (Priority: P1) 🎯 MVP

**Goal**: Host starts the game; room transitions to `playing`; first round begins; all players move to the game screen.

**Independent Test**: Two players in a lobby; host clicks Start Game; both tabs transition to the game screen.

### Implementation for User Story 1

- [ ] T007 [US1] Update `backend/src/services/roomStore.ts` `startGame` to set `status = "playing"`, `drawerId = hostParticipantId`, and `currentWord = STARTER_WORDS[0]`
- [ ] T008 [US1] Update `backend/src/services/roomStore.ts` `removeParticipant` to reset room to `lobby`, clear `drawerId` and `currentWord`, and transfer host when the host leaves during `playing`
- [ ] T009 [P] [US1] Add ~2s automatic polling loop to `frontend/src/pages/GamePage.tsx` using `fetchRoom`
- [ ] T010 [P] [US1] Ensure `frontend/src/pages/LobbyPage.tsx` auto-redirects to `/game` when `room.status === "playing"` and `frontend/src/pages/GamePage.tsx` auto-redirects to `/lobby` when `room.status === "lobby"`. Also ensure both pages redirect to `/` (StartPage) when no valid `participantId` exists in local state.

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Drawer Is Clearly Identified (Priority: P1)

**Goal**: All players can clearly see who the current drawer is.

**Independent Test**: Start game with two players; verify drawer sees "You are the drawer" and guesser sees "[Name] is drawing". (Requires US1 backend changes for `drawerId` population.)

### Implementation for User Story 2

- [ ] T011 [P] [US2] Add drawer identification banner to `frontend/src/pages/GamePage.tsx` (drawer sees "You are the drawer"; guessers see "[Name] is drawing")

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Secret Word Deterministically Selected and Visible Only to Drawer (Priority: P1)

**Goal**: Secret word is deterministically selected (`rocket`) and visible only to the drawer; guessers see underscores.

**Independent Test**: Start game; verify drawer tab shows "rocket" and guesser tab shows "_ _ _ _ _". (Requires US1 backend changes for `currentWord` population.)

### Implementation for User Story 3

- [ ] T012 [P] [US3] Add secret word display for drawer in `frontend/src/pages/GamePage.tsx`
- [ ] T013 [P] [US3] Add underscore placeholder (matching word length) for guessers in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: All P1 user stories independently functional.

---

## Phase 6: User Story 4 - Player Name Validation (Priority: P2)

**Goal**: Player names are trimmed; empty/whitespace-only names are rejected with `400 Bad Request` and a clear message.

**Independent Test**: Attempt to create/join with "   " and verify `400` response with clear message.

### Implementation for User Story 4

- [ ] T014 [US4] Add API-level test in `backend/src/api/rooms.ts` test file (or `roomStore.test.ts`) to verify `400` response for empty/whitespace-only names via Zod schema validation

**Checkpoint**: All user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, tests, and validation.

- [ ] T015 [P] Update `backend/src/services/roomStore.test.ts` to cover `drawerId`, `currentWord`, host-leave reset logic, and `toRoomSnapshot` viewer filtering
- [ ] T016 [P] Update `frontend/src/services/api.test.ts` for new `RoomSnapshot` fields (`drawerId`, `currentWord`)
- [ ] T017 Run quickstart.md validation scenarios
- [ ] T018 Run `npm run build` in backend and frontend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories.
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — depends on US1 backend changes (`drawerId` in snapshot) but UI is independently implementable.
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — depends on US1 backend changes (`currentWord` in snapshot) but UI is independently implementable.
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) — independent; backend validation already exists from feature 001.

### Within Each User Story

- Models/services before endpoints
- Endpoints before frontend API types
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 (type updates) can run in parallel.
- T004, T005, and T006 (backend service/route updates) have dependencies: T004 → T005 → T006.
- T007 and T008 (backend logic changes) are in the same file but touch different functions; sequential is safer.
- T009 and T010 (frontend polling/redirects) can run in parallel.
- T011, T012, and T013 (GamePage UI features) can run in parallel.
- T014 (name validation test) is independent.
- T015 and T016 (test updates) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch backend tasks together:
Task: "Update startGame in backend/src/services/roomStore.ts"
Task: "Update removeParticipant in backend/src/services/roomStore.ts"

# Launch frontend tasks together:
Task: "Add polling loop to frontend/src/pages/GamePage.tsx"
Task: "Update LobbyPage.tsx auto-redirect behavior"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test with two browser tabs; host starts game, both show game screen
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently
4. Add User Story 3 → Test independently
5. Add User Story 4 → Test independently
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend start/reset logic + frontend polling)
   - Developer B: User Story 2 (drawer UI)
   - Developer C: User Story 3 (secret word UI)
   - Developer D: User Story 4 (validation tests)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
