# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing types and schemas that all stories depend on

- [x] T001 [P] Add `"results"` to `RoomStatus` union in `backend/src/models/game.ts`
- [x] T002 [P] Add `endRoundSchema` and `restartRoomSchema` to `backend/src/api/schemas.ts`
- [x] T003 [P] Add `"results"` to `RoomSnapshot.status` type in `frontend/src/services/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend logic and API endpoints that all user stories depend on

- [x] T004 Fix `toRoomSnapshot` to reveal `currentWord` to ALL viewers when `room.status === "results"` in `backend/src/services/roomStore.ts`
- [x] T005 Implement `endRound(code: string)` function in `backend/src/services/roomStore.ts`
- [x] T006 Implement `restartRoom(code: string)` function in `backend/src/services/roomStore.ts`
- [x] T007 Add `POST /rooms/:code/end` endpoint in `backend/src/api/rooms.ts` (host-only, 403/404/409)
- [x] T008 Add `POST /rooms/:code/restart` endpoint in `backend/src/api/rooms.ts` (host-only, 403/404)
- [x] T009 Add backend tests for `endRound`, `restartRoom`, authorization, and state clearing in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Foundation ready - user story frontend work can now begin

---

## Phase 3: User Story 1 — Display Round Results (Priority: P1) 🎯 MVP

**Goal**: When a round ends, all players see a results screen with the revealed word, sorted scores, and complete guess history.

**Independent Test**: End a round via API, verify results screen displays word, scores, and guess history to all players.

### Implementation for User Story 1

- [x] T010 [P] [US1] Add `endRound()` and `restartRoom()` API methods to `frontend/src/services/api.ts`
- [x] T011 [P] [US1] Add `endRound()` and `restartRoom()` store methods to `frontend/src/state/roomStore.ts`
- [x] T012 [US1] Create `ResultsPage.tsx` in `frontend/src/pages/` showing revealed word, sorted scores, guess history
- [x] T013 [US1] Add `/results` route in `frontend/src/routes/index.tsx`
- [x] T014 [US1] Add "End Round" button (host-only) to `GamePage.tsx` that calls `endRound()` and navigates to `/results`
- [x] T015 [US1] Add `status === "results"` redirect in `LobbyPage.tsx` → `/results`

**Checkpoint**: At this point, users can end a round and see results with word, scores, and guess history

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P1)

**Goal**: After results display, the host can restart, returning all players to the lobby with round state cleared but players preserved.

**Independent Test**: Restart from results via host action, verify all players return to lobby with names intact and round state cleared.

### Implementation for User Story 2

- [x] T016 [US2] Add "Restart Game" button (host-only) to `ResultsPage.tsx` that calls `restartRoom()` and navigates to `/lobby`
- [x] T017 [US2] Add `status === "lobby"` redirect in `ResultsPage.tsx` → `/lobby` (for polling detection)
- [x] T018 [US2] Verify `restartRoom()` preserves participants and clears all round state (covered by T009 backend tests)

**Checkpoint**: At this point, the full game loop works: lobby → active → results → lobby

---

## Phase 5: User Story 3 — Non-Host Sees Restart Waiting State (Priority: P2)

**Goal**: Non-host players see a waiting message on the results screen with no restart button.

**Independent Test**: View results as a non-host, verify waiting message is shown and no restart button appears.

### Implementation for User Story 3

- [x] T019 [US3] Add conditional rendering in `ResultsPage.tsx`: show "Waiting for host to restart…" message when `!isHost`
- [x] T020 [US3] Verify restart button is hidden from non-hosts in `ResultsPage.tsx` (covered by T016 conditional)

**Checkpoint**: All user stories complete — role-based UX on results screen is correct

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T021 [P] Run backend tests — verify all 34 tests pass
- [x] T022 [P] Run frontend TypeScript check — verify zero errors
- [ ] T023 Run quickstart.md validation (manual end-to-end test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories proceed sequentially: US1 (P1) → US2 (P1) → US3 (P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 — builds on ResultsPage from T012
- **User Story 3 (P2)**: Can start after US1 — refines ResultsPage conditional rendering

### Within Each User Story

- Models/types before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001, T002, T003) are marked [P] — run in parallel
- API methods and store methods (T010, T011) are [P] — run in parallel
- Frontend page creation (T012) depends on T010/T011

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: End round, verify results display
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Results page with word, scores, guess history → Test independently
3. Add User Story 2 → Restart flow → Test independently → Full game loop!
4. Add User Story 3 → Non-host waiting state → Test independently
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
