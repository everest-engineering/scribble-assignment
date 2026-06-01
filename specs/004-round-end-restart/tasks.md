# Tasks: Round End and Restart

**Input**: Design documents from `/specs/004-round-end-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because this feature changes shared room state, restart flow, and late-action validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared types and validation hooks that the round-end and restart flows will use.

- [x] T001 [P] Add ended-round snapshot fields and phase types in `backend/src/models/game.ts` and mirror them in `frontend/src/services/api.ts`
- [x] T002 [P] Add restart request validation hooks and round-end schema helpers in `backend/src/api/schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the room-state mechanics that every story depends on before any UI or route wiring is added.

**⚠️ CRITICAL**: No user story work should begin until the room can represent an active round, an ended round, and a restartable lobby in the shared backend state.

- [x] T003 [P] Add `round.phase` handling and end-of-round snapshot logic in `backend/src/services/roomStore.ts`
- [x] T004 [P] Add shared restart and late-action response handling in `backend/src/api/rooms.ts`

**Checkpoint**: The backend can now represent an ended round and expose the shared snapshot shape needed by the user stories.

---

## Phase 3: User Story 1 - End Round on Correct Guess (Priority: P1) 🎯 MVP

**Goal**: The first correct guess ends the round immediately and all players can see the correct word, guess history, and final scores.

**Independent Test**: Submit a correct guess during an active round and confirm every viewer sees the ended-round summary with the correct word, full guess history, and final scores.

### Tests for User Story 1

- [x] T005 [P] [US1] Add backend coverage in `backend/src/services/roomStore.test.ts` for first-correct-guess round ending and viewer-specific secret-word visibility
- [x] T006 [P] [US1] Add frontend coverage in `frontend/src/pages/GamePage.test.tsx` for the ended-round summary, correct word, guess history, and final scores

### Implementation for User Story 1

- [x] T007 [US1] Update `backend/src/services/roomStore.ts` so the first correct guess ends the round, freezes the summary, and exposes the correct word to all viewers after the round ends
- [x] T008 [US1] Update `frontend/src/components/ResultPanel.tsx`, `frontend/src/components/Scoreboard.tsx`, and `frontend/src/pages/GamePage.tsx` to render the ended-round summary consistently for every viewer

**Checkpoint**: User Story 1 should now be fully functional and independently testable.

---

## Phase 4: User Story 2 - Host Restarts the Game (Priority: P1)

**Goal**: The host can restart an ended round and return everyone to the lobby while preserving the participant list.

**Independent Test**: End a round, restart it as the host, and confirm all players return to the lobby with the same participants preserved and round-specific data cleared.

### Tests for User Story 2

- [x] T009 [P] [US2] Add backend coverage in `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts` for host restart preserving participants and clearing round-specific data
- [x] T010 [P] [US2] Add frontend coverage in `frontend/src/state/roomStore.test.ts` and `frontend/src/pages/GamePage.test.tsx` for host restart returning everyone to the lobby

### Implementation for User Story 2

- [x] T011 [US2] Add the restart request contract and route handling in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`
- [x] T012 [US2] Implement `restartRoom` in `backend/src/services/roomStore.ts` so the host can clear round state while preserving the participant list
- [x] T013 [US2] Wire `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/GamePage.tsx` so the host can restart from the end-of-round summary and navigate back to the lobby

**Checkpoint**: User Story 2 should now be fully functional and independently testable.

---

## Phase 5: User Story 3 - Reject Late Round Actions (Priority: P2)

**Goal**: Late guesses and drawing attempts do not change the finished round, and only the host can restart the game.

**Independent Test**: Try submitting a late guess or drawing after the round has ended and confirm the finished result does not change; also confirm a non-host restart is rejected.

### Tests for User Story 3

- [x] T014 [P] [US3] Add backend coverage in `backend/src/services/roomStore.test.ts` for rejecting draws, guesses, and non-host restart attempts after the round ends
- [x] T015 [P] [US3] Add frontend coverage in `frontend/src/components/GuessForm.test.tsx` and `frontend/src/pages/GamePage.test.tsx` for hiding or disabling round actions after the round ends and surfacing restart errors

### Implementation for User Story 3

- [x] T016 [US3] Harden `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts` so late round mutations are rejected and non-host restart attempts return clear errors
- [x] T017 [US3] Update `frontend/src/components/CanvasBoard.tsx`, `frontend/src/components/GuessForm.tsx`, and `frontend/src/pages/GamePage.tsx` so late drawing and guessing are blocked in the UI and restart failures are shown cleanly

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish documentation, fixture updates, and verification across the feature.

- [x] T018 [P] Update `specs/004-round-end-restart/quickstart.md` and `specs/004-round-end-restart/contracts/rooms.md` to match the final round-end and restart behavior
- [x] T019 [P] Refresh `frontend/src/services/api.test.ts` and `backend/src/services/roomStore.test.ts` fixtures for the ended-round payload shape
- [ ] T020 Run the relevant Vitest suites in `backend/` and `frontend/` and fix any regressions uncovered

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on the user stories that are being delivered

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - establishes the ended-round state
- **User Story 2 (P1)**: Can start after User Story 1 - restart relies on the ended-round summary
- **User Story 3 (P2)**: Can start after User Story 1 and User Story 2 - late-action rejection and host-only restart depend on the shared round-end and restart flow

### Within Each User Story

- Tests (if included) should be written and failing before implementation
- Backend state changes before frontend wiring
- Shared snapshot shape before UI rendering changes
- Story complete before moving to the next priority

### Parallel Opportunities

- Setup tasks T001 and T002 can run in parallel
- Foundational tasks T003 and T004 can run in parallel
- User Story 1 tests T005 and T006 can run in parallel
- User Story 2 tests T009 and T010 can run in parallel
- User Story 3 tests T014 and T015 can run in parallel
- Polish tasks T018 and T019 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm the round ends on the first correct guess and the summary is visible to all viewers

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 and verify the ended-round summary
3. Add User Story 2 and verify host restart back to the lobby
4. Add User Story 3 and verify late actions are rejected
5. Finish with documentation and test fixture cleanup

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Polish tasks are completed after the stories are merged together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing the story they cover
- Keep the restart flow HTTP-only and in-memory, matching the project constitution
