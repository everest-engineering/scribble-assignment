---

description: "Task list for Round Result & Restart feature implementation"

---

# Tasks: Round Result & Restart

**Input**: Design documents from `specs/004-round-result-restart/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/README.md

**Tests**: Test tasks ARE included — the feature specification mandates "User Scenarios & Testing" and plan.md references specific test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/`, `backend/src/services/`, `backend/src/api/`
- **Frontend**: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/services/`, `frontend/src/state/`, `frontend/src/routes/`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core model and service changes that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Extend `RoomStatus` type to include `"results"` in `backend/src/models/game.ts`
- [X] T002 Update `toRoomSnapshot()` to include `secretWord` for all viewers when `status === "results"` in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 2: User Story 1 — View Round Results (Priority: P1) 🎯 MVP

**Goal**: When a round ends (all guessers correct), every player sees a results screen showing the correct word, final per-player scores ranked descending, and the full chronological guess log.

**Independent Test**: Play a single round to completion; verify every participant sees the correct word, ranked score list, and full chronological guess history.

### Tests for User Story 1

- [X] T003 [P] [US1] Add unit test for `submitGuess()` auto-transition to `"results"` status when last guesser scores 100 in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T004 [US1] Implement `endRound` auto-transition in `submitGuess()` in `backend/src/services/roomStore.ts`
- [X] T005 [P] [US1] Extend `RoomSnapshot` type with `"results"` status in `frontend/src/services/api.ts`
- [X] T006 [P] [US1] Create `ResultsView` component displaying correct word, ranked score list, and chronological guess history in `frontend/src/components/ResultsView.tsx`
- [X] T007 [US1] Create `ResultsPage` with results display, "Loading results…" placeholder, and "Connection lost" error toast with auto-dismiss in `frontend/src/pages/ResultsPage.tsx`
- [X] T008 [P] [US1] Add `/results` route in `frontend/src/routes/index.tsx`
- [X] T009 [US1] Update `GamePage` to auto-navigate to `/results` when `status === "results"` in `frontend/src/pages/GamePage.tsx`
- [X] T010 [US1] Add results state handling to `roomStore` in `frontend/src/state/roomStore.ts`

**Checkpoint**: User Story 1 is fully functional — every player sees results after a round ends.

---

## Phase 3: User Story 2 — Host Restarts from Results (Priority: P2)

**Goal**: The host can trigger a restart from the results screen, returning all players to the lobby with player roster intact and all round-specific data cleared. Non-host players cannot trigger restart.

**Independent Test**: Host presses restart on results screen; verify all players land in lobby with same player list, no round data (secretWord, scores, guesses, drawerId cleared).

### Tests for User Story 2

- [X] T011 [P] [US2] Add unit tests for `restartGame()` — happy path, non-host rejection (403), wrong-status rejection (400) in `backend/src/services/roomStore.test.ts`
- [X] T012 [P] [US2] Add integration tests for `POST /rooms/:code/restart` — happy path, 403 non-host, 400 wrong status in `backend/src/api/rooms.test.ts`

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement `restartGame()` service in `backend/src/services/roomStore.ts`
- [X] T014 [P] [US2] Add `restartGameSchema` Zod schema in `backend/src/api/schemas.ts`
- [X] T015 [US2] Add `POST /:code/restart` route handler with host authorization in `backend/src/api/rooms.ts`
- [X] T016 [P] [US2] Add `restartRoom()` API function in `frontend/src/services/api.ts`
- [X] T017 [US2] Add `restartRoom()` action to `roomStore` in `frontend/src/state/roomStore.ts`
- [X] T018 [US2] Add host-only restart button and inline error handling to `ResultsPage` in `frontend/src/pages/ResultsPage.tsx`
- [X] T019 [US2] Update `LobbyPage` to display player list plus "Round in results" indicator when `status === "results"`, and transition to normal lobby on `"lobby"` after restart in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently — rounds complete to results, host restarts back to lobby.

---

## Phase 4: User Story 3 — Restart Reflects for Late Joiners (Priority: P3)

**Goal**: Players who join or reconnect during results see correct state (full results data); after restart they see lobby state (no residual round data).

**Independent Test**: Poll room state after restart from a fresh client connection; confirm lobby data is returned (not results data).

### Tests for User Story 3

- [X] T020 [P] [US3] Add test for late joiner during results receiving full results state in `backend/src/services/roomStore.test.ts`
- [X] T021 [P] [US3] Add test for late joiner after restart receiving lobby state in `backend/src/services/roomStore.test.ts`
- [X] T022 [P] [US3] Update `GamePage.test.tsx` for `"results"` status navigation behavior in `frontend/src/pages/GamePage.test.tsx`

**Checkpoint**: All user stories independently functional — late joiners see correct state at every phase.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Ensure spec compliance, stability, and quality across all stories.

- [X] T023 Run full test suite (`cd backend && npm test` and `cd frontend && npm test`) and fix any failures
- [X] T024 Quickstart validation: walk through quickstart.md steps end-to-end
- [X] T025 Verify all acceptance scenarios from spec.md are satisfied

**Checkpoint**: Feature complete and validated against spec.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion
- **User Story 2 (Phase 3)**: Depends on Phase 1 completion. UI tasks (T016-T019) depend on foundational tasks; backend tasks (T013-T015) depend on Phase 1.
- **User Story 3 (Phase 4)**: Depends on Phase 1 (back-end) and conceptually on US1+US2 (front-end). Tests reference state that exists after US1+US2 implementation.
- **Polish (Phase 5)**: Depends on all user story phases being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories. **MVP scope.**
- **US2 (P2)**: Can start after Foundational — shares no blocking dependency on US1, but the restart button UI (T018) is on the same page as US1's ResultsPage, so sequential ordering is practical.
- **US3 (P3)**: Depends on US1+US2 conceptually (late joiner tests verify both stories' behavior).

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All tasks marked [P] within a phase can run in parallel
- Phase 1 tasks (T001, T002) can be done in parallel
- Phase 2: T003, T005, T006, T008 can all run in parallel
- Phase 3: T011, T012, T013, T014, T016 can run in parallel
- Phase 4: T020, T021, T022 can run in parallel
- Frontend and backend tasks within a story are generally independent

---

## Parallel Example: User Story 1

```bash
# Launch test + independent frontend pieces together:
Task: "T003 [P] [US1] Add unit test for endRound transition"
Task: "T005 [P] [US1] Extend RoomSnapshot type in api.ts"
Task: "T006 [P] [US1] Create ResultsView component"
Task: "T008 [P] [US1] Add /results route"

# Sequential (depends on T004):
Task: "T004 [US1] Implement endRound in submitGuess"

# Can run after T004 completes:
Task: "T007 [US1] Create ResultsPage"
Task: "T009 [US1] Update GamePage navigation"
Task: "T010 [US1] Update roomStore with results state"
```

## Parallel Example: User Story 2

```bash
# Launch tests + independent pieces together:
Task: "T011 [P] [US2] Unit tests for restartGame"
Task: "T012 [P] [US2] Integration tests for restart endpoint"
Task: "T013 [P] [US2] Implement restartGame service"
Task: "T014 [P] [US2] Add restartGameSchema"
Task: "T016 [P] [US2] Add restartRoom API function"

# Depends on T013+T014:
Task: "T015 [US2] Add POST /restart endpoint"

# Depends on T016:
Task: "T017 [US2] Add restartRoom action to roomStore"
Task: "T018 [US2] Add restart button to ResultsPage"
Task: "T019 [US2] Update LobbyPage"
```

## Parallel Example: User Story 3

```bash
# All test tasks can run in parallel:
Task: "T020 [P] [US3] Late joiner during results test"
Task: "T021 [P] [US3] Late joiner after restart test"
Task: "T022 [P] [US3] Update GamePage test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1 (results display)
3. **STOP and VALIDATE**: Play a round to completion, verify results screen
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 (Results display) → Test independently → **MVP!**
3. Add US2 (Host restart) → Test independently → Deploy/Demo
4. Add US3 (Late joiner tests) → Test independently → Deploy/Demo
5. Polish — run full test suite, validate all acceptance scenarios

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend + frontend)
   - Developer B: User Story 2 (backend + frontend)
   - (US1 and US2 are largely independent)
3. Developer C: User Story 3 tests after US1+US2 are merged
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [US1], [US2], [US3] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
