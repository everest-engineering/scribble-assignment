---

description: "Task list for Result, Restart & Final Validation feature"

---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the web app structure from plan.md

---

## Phase 1: Setup (Shared Foundation)

**Purpose**: Review design documents and existing code to confirm scope and integration points

- [ ] T001 Review `specs/004-result-restart-validation/spec.md`, `plan.md`, `data-model.md`, `contracts/api.md`, and `quickstart.md` to confirm the result and restart scope.
- [ ] T002 [P] Review `backend/src/models/game.ts` and `backend/src/services/roomStore.ts` to understand the existing room model and snapshot contract.
- [ ] T003 [P] Review `frontend/src/state/roomStore.ts` and `frontend/src/services/api.ts` to understand the existing state management and API layer.

---

## Phase 2: Foundational Backend Room Status Extension

**Purpose**: Core backend model changes that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Extend room status type in `backend/src/models/game.ts` to include `"finished"` alongside existing statuses.
- [ ] T005 Add ResultState fields (`secretWord`, `scores`, `guessHistory`, `endedAt`) to the room model in `backend/src/models/game.ts`.

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - View result state after round ends (Priority: P1) 🎯 MVP

**Goal**: All players see the correct word, final scores, and full guess history when a round ends.

**Independent Test**: Start and finish a round, then verify every player's view shows the correct word, all final scores, and the complete guess history.

### Implementation for User Story 1

- [ ] T006 [US1] Expose result fields in RoomSnapshot when `status === "finished"` in `backend/src/services/roomStore.ts` (secretWord visible to all, scores, guessHistory, endedAt).
- [ ] T007 [P] [US1] Add result fields to the RoomSnapshot type in `frontend/src/services/api.ts`.
- [ ] T008 [P] [US1] Update `frontend/src/state/roomStore.ts` to handle `"finished"` status and store result data from snapshot.
- [ ] T009 [US1] Create `ResultScreen` component in `frontend/src/components/ResultScreen.tsx` that displays the correct word, final scores, and guess history.
- [ ] T010 [US1] Integrate `ResultScreen` into `frontend/src/pages/GamePage.tsx` when room status transitions to `"finished"`.
- [ ] T011 [US1] Ensure existing polling in `frontend/src/pages/GamePage.tsx` detects the transition to `"finished"` status.

**Checkpoint**: At this point, User Story 1 should be fully functional — all players see the result

---

## Phase 4: User Story 2 - Host restarts the game (Priority: P2)

**Goal**: Host can restart after result, returning everyone to lobby with participants preserved and round state cleared.

**Independent Test**: As the host, restart the game after a round ends and verify all players land in the lobby with participants intact and round state cleared.

### Implementation for User Story 2

- [ ] T012 [US2] Add `POST /rooms/:code/restart` endpoint in `backend/src/api/rooms.ts` that validates host identity and room status.
- [ ] T013 [US2] Implement restart logic in `backend/src/services/roomStore.ts`: clear secretWord, scores, guessHistory, canvasState, drawerId; transition status to `"lobby"`; preserve participants.
- [ ] T014 [P] [US2] Add `restartRoom` API call in `frontend/src/services/api.ts`.
- [ ] T015 [US2] Add restart action to `frontend/src/state/roomStore.ts` and wire to the API call.
- [ ] T016 [US2] Add restart button (host-only visibility) to `ResultScreen` in `frontend/src/components/ResultScreen.tsx`.
- [ ] T017 [US2] Handle non-host restart rejection (403) and wrong-status rejection (409) in `frontend/src/state/roomStore.ts` with appropriate error messages.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, and end-to-end validation

- [ ] T018 [P] Add backend tests in `backend/src/services/roomStore.test.ts` for finished state exposure, restart validation (host-only, wrong status), and round state clearing.
- [ ] T019 [P] Add frontend tests in `frontend/src/services/api.test.ts` for restartRoom API call.
- [ ] T020 [P] Update `specs/004-result-restart-validation/contracts/api.md` with any contract refinements discovered during implementation.
- [ ] T021 Run backend and frontend builds and verify end-to-end flow using `specs/004-result-restart-validation/quickstart.md` validation scenarios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and US1 completion (result screen must exist before restart button)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on US2
- **User Story 2 (P2)**: Requires US1 completion — restart is a follow-on action after viewing result

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (Setup review tasks)
- T007 and T008 can run in parallel (frontend type and store updates)
- T014 can run in parallel with T015/T016 (API call independent of store/UI)
- T018, T019, and T020 can run in parallel (polish tasks)

---

## Parallel Example: User Story 1

```bash
# Launch all parallel tasks together:
Task: "Add result fields to RoomSnapshot type in frontend/src/services/api.ts"
Task: "Update frontend room store for finished status in frontend/src/state/roomStore.ts"

# Remaining tasks are sequential (component depends on types, page depends on component):
Task: "Create ResultScreen component in frontend/src/components/ResultScreen.tsx"
Task: "Integrate ResultScreen into GamePage in frontend/src/pages/GamePage.tsx"
Task: "Add finished-state polling in frontend/src/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently — verify all players see result after round ends
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The `finished` status reuses the existing `GET /rooms/:code` endpoint — no new polling endpoint needed for result viewing
- Restart is host-only; non-host attempts return 403
- Result fields are visible to ALL players (secret word is no longer hidden)
