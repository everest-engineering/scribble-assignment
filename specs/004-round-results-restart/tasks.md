# Tasks: Round Results and Game Restart

**Input**: Design documents from `/specs/004-round-results-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisite build health before extending feature 004.

- [x] T001 Verify backend and frontend build successfully before implementing feature 004

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model, service, and schema changes that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Extend RoomStatus with `"results"` in `backend/src/models/game.ts`
- [x] T003 [P] Extend RoomSnapshot status type with `"results"` in `frontend/src/services/api.ts`
- [x] T004 Update `toRoomSnapshot` to reveal `currentWord` for all viewers when `status === "results"` in `backend/src/services/roomStore.ts`
- [x] T005 [P] Update `joinRoom` service and `backend/src/api/rooms.ts` join endpoint to reject rooms in `"results"` state with `409`
- [x] T006 [P] Update `cleanupIdleRooms` to clean up idle `"results"` rooms in `backend/src/services/roomStore.ts`
- [x] T007 [P] Add `endRoundSchema` and `restartGameSchema` in `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Round Ends and Results Are Displayed (Priority: P1) 🎯 MVP

**Goal**: When a round ends (automatically or by host action), the room enters `"results"` state and all participants see the secret word, final scores, and full guess history.

**Independent Test**: End a round via host action or by having any guesser submit the correct word; verify all clients see the results view with word, scores, and history within ~3 seconds (next poll).

### Implementation for User Story 1

- [x] T008 [US1] Implement `endRound()` service function in `backend/src/services/roomStore.ts`
- [x] T009 [US1] Update `submitGuess()` to auto-transition room to `"results"` on the first correct guess in `backend/src/services/roomStore.ts`
- [x] T010 [US1] Wire `POST /:code/end` endpoint in `backend/src/api/rooms.ts`
- [x] T011 [P] [US1] Add `api.endRound()` helper in `frontend/src/services/api.ts`
- [x] T012 [US1] Update `GamePage` to render results UI branch when `status === "results"` in `frontend/src/pages/GamePage.tsx`
- [x] T013 [US1] Add End Round button (host only) during `playing` state in `frontend/src/pages/GamePage.tsx`
- [x] T014 [US1] Extend polling `useEffect` to include `"results"` state in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Host Restarts Game (Priority: P2)

**Goal**: From the results screen, the host can restart the game, returning all players to the lobby while preserving the player list and host, and clearing all round-specific state.

**Independent Test**: Trigger restart from the results screen and verify all clients transition to the lobby within ~3 seconds with players intact and round state cleared.

### Implementation for User Story 2

- [x] T015 [US2] Implement `restartGame()` service function in `backend/src/services/roomStore.ts`
- [x] T016 [US2] Wire `POST /:code/restart` endpoint in `backend/src/api/rooms.ts`
- [x] T017 [P] [US2] Add `api.restartGame()` helper in `frontend/src/services/api.ts`
- [x] T018 [US2] Add Restart Game button (host only) in results UI in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and acceptance verification.

- [x] T019 [P] Run backend build check with `npm run build` in `backend/`
- [x] T020 [P] Run frontend build check with `npm run build` in `frontend/`
- [x] T021 Validate `quickstart.md` scenarios in browser with two tabs

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

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — Integrates with US1 results UI but is independently testable.

### Within Each User Story

- Models before services.
- Services before endpoints.
- Core implementation before UI integration.
- Story complete before moving to next priority.

### Parallel Opportunities

- All Setup tasks marked `[P]` can run in parallel.
- All Foundational tasks marked `[P]` can run in parallel (within Phase 2).
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows).
- `api.endRound()` (T011) and `GamePage` results UI (T012) can run in parallel (different files).
- `api.restartGame()` (T017) can run in parallel with backend `restartGame` / route work (T015, T016).
- Different user stories can be worked on in parallel by different team members.

---

## Parallel Example: User Story 1

```bash
# Launch backend service and route work together:
Task: "Implement endRound() in backend/src/services/roomStore.ts"
Task: "Wire POST /:code/end endpoint in backend/src/api/rooms.ts"

# Launch frontend API and page work together:
Task: "Add api.endRound() helper in frontend/src/services/api.ts"
Task: "Update GamePage to render results UI branch in frontend/src/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Test User Story 1 independently with two browser tabs.
5. Deploy/demo if ready.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!).
3. Add User Story 2 → Test independently → Deploy/Demo.
4. Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (backend + frontend).
   - Developer B: User Story 2 (backend + frontend).
3. Stories complete and integrate independently.

---

## Notes

- `[P]` tasks = different files, no dependencies.
- `[Story]` label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- Commit after each task or logical group.
- Stop at any checkpoint to validate story independently.
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence.
