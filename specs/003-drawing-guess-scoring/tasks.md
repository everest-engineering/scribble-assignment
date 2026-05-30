---

description: "Task list for Scenario 3 gameplay interaction implementation"

---

# Tasks: Scenario 3 Gameplay Interaction

**Input**: Design documents from `/specs/003-drawing-guess-scoring/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated backend and frontend API coverage plus manual two-tab validation for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below follow this repository's monorepo layout

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active Scenario 3 artifacts and validation targets before editing code

- [X] T001 Review implementation inputs in `specs/003-drawing-guess-scoring/spec.md`, `specs/003-drawing-guess-scoring/plan.md`, and `specs/003-drawing-guess-scoring/contracts/rooms-scenario3.openapi.yaml`
- [X] T002 Confirm manual and automated validation steps in `specs/003-drawing-guess-scoring/quickstart.md`, `backend/src/api/rooms.ts`, and `frontend/src/pages/GamePage.tsx`
- [X] T003 [P] Capture shared canvas, guess-history, and score expectations from `specs/003-drawing-guess-scoring/data-model.md` and `specs/003-drawing-guess-scoring/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared gameplay-state, validation, and snapshot contract changes that all Scenario 3 stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Update shared gameplay room, round, canvas, and guess-history types in `backend/src/models/game.ts`
- [X] T005 [P] Extend shared gameplay room snapshot and session response types in `frontend/src/services/api.ts`
- [X] T006 [P] Add reusable gameplay request schemas for drawing, clear-canvas, and guess submission in `backend/src/api/schemas.ts`
- [X] T007 [P] Add shared gameplay action support in `frontend/src/state/roomStore.ts`
- [X] T008 Implement shared gameplay snapshot derivation and room action helpers in `backend/src/services/roomStore.ts`
- [X] T009 Implement shared gameplay response mapping for fetch and room action snapshots in `backend/src/api/rooms.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Drawer Sketches the Word (Priority: P1) 🎯 MVP

**Goal**: The assigned drawer can update a shared drawing surface and clear it for everyone in the room

**Independent Test**: Start a room, confirm only the drawer can add marks to the shared drawing surface, and confirm clearing the canvas resets it for both tabs

### Verification for User Story 1 ⚠️

- [X] T010 [P] [US1] Add drawer-only drawing and clear-canvas coverage in `backend/src/services/roomStore.test.ts`
- [X] T011 [P] [US1] Add drawing and clear-canvas request coverage in `frontend/src/services/api.test.ts`
- [ ] T012 [US1] Validate drawer-only drawing and shared clear-canvas behavior with `specs/003-drawing-guess-scoring/quickstart.md`

### Implementation for User Story 1

- [X] T013 [US1] Add canvas and stroke state fields in `backend/src/models/game.ts`
- [X] T014 [US1] Implement drawer-only stroke append and clear-canvas behavior in `backend/src/services/roomStore.ts`
- [X] T015 [US1] Add `/rooms/:code/drawing` and `/rooms/:code/drawing/clear` actions in `backend/src/api/rooms.ts`
- [X] T016 [P] [US1] Add draw and clear-canvas API/store methods in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T017 [US1] Build the shared drawing surface and drawer clear control in `frontend/src/components/DrawingSurface.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, the drawer can sketch and clear a shared canvas without opening guess or scoring behavior

---

## Phase 4: User Story 2 - Players Submit and Track Guesses (Priority: P2)

**Goal**: Non-drawers can submit trimmed guesses, blank guesses are rejected, and accepted guesses stay synced in room history

**Independent Test**: Start a round in two tabs, submit trimmed, blank, correct, and incorrect guesses, and confirm only valid guesses enter shared history in the same order for both players

### Verification for User Story 2 ⚠️

- [X] T018 [P] [US2] Add guess-trimming, empty-guess rejection, and ordered history coverage in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [X] T019 [P] [US2] Add guess-submission request and history snapshot coverage in `frontend/src/services/api.test.ts`
- [ ] T020 [US2] Validate trimmed, rejected, and synced guess-history behavior with `specs/003-drawing-guess-scoring/quickstart.md`

### Implementation for User Story 2

- [X] T021 [US2] Enforce trimmed guess parsing and whitespace-only rejection in `backend/src/api/schemas.ts`
- [X] T022 [US2] Implement non-drawer guess submission and ordered guess-history append in `backend/src/services/roomStore.ts`
- [X] T023 [US2] Add `/rooms/:code/guesses` handling and guess error mapping in `backend/src/api/rooms.ts`
- [X] T024 [P] [US2] Add guess submission API/store methods in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T025 [US2] Update guess submission UI and synced history rendering in `frontend/src/components/GuessForm.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, guessers can submit valid guesses, rejected guesses stay out of history, and shared history remains synchronized

---

## Phase 5: User Story 3 - Correct Guesses Score Deterministically (Priority: P3)

**Goal**: Accepted guesses score 100 when correct and 0 when incorrect, and all players see the same score outcomes

**Independent Test**: Submit one correct guess and one incorrect guess in an active room, then confirm the correct guess earns 100 points, the incorrect guess earns 0 points, and both tabs show the same totals

### Verification for User Story 3 ⚠️

- [X] T026 [P] [US3] Add case-insensitive matching and deterministic 100-or-0 score coverage in `backend/src/services/roomStore.test.ts`
- [X] T027 [P] [US3] Add score-bearing gameplay snapshot coverage in `frontend/src/services/api.test.ts`
- [ ] T028 [US3] Validate score outcomes and room isolation with `specs/003-drawing-guess-scoring/quickstart.md`

### Implementation for User Story 3

- [X] T029 [US3] Add score totals, guess outcome fields, and viewer gameplay permission fields in `backend/src/models/game.ts`
- [X] T030 [US3] Implement case-insensitive guess evaluation and deterministic score assignment in `backend/src/services/roomStore.ts`
- [X] T031 [P] [US3] Expose score totals and viewer can-draw/can-guess fields in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T032 [US3] Render score totals, role-specific gameplay states, and guess score outcomes in `frontend/src/pages/GamePage.tsx` and `frontend/src/styles/app.css`

**Checkpoint**: All Scenario 3 drawing, guess-history, and deterministic scoring behavior should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and artifact alignment across the completed Scenario 3 slice

- [ ] T033 [P] Refresh Scenario 3 behavior notes in `specs/003-drawing-guess-scoring/quickstart.md` and `specs/003-drawing-guess-scoring/contracts/rooms-scenario3.openapi.yaml` if implementation wording changed
- [X] T034 Run backend validation for `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, and `backend/src/api/rooms.ts` with `cd backend && npm test && npm run build`
- [X] T035 Run frontend validation for `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/components/DrawingSurface.tsx`, `frontend/src/components/GuessForm.tsx`, and `frontend/src/pages/GamePage.tsx` with `cd frontend && npm test && npm run build`
- [ ] T036 Run the final end-to-end multi-tab Scenario 3 checks in `specs/003-drawing-guess-scoring/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion and defines the MVP slice
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should follow User Story 1 so guesses operate against the shared canvas and active round state
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from User Stories 1 and 2 being in place so score outcomes can be validated end to end
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories; establishes the shared drawing surface and drawer-only canvas control
- **User Story 2 (P2)**: Uses the active round and canvas flow from User Story 1 to support synchronized guess submission and history
- **User Story 3 (P3)**: Uses the accepted guess flow from User Story 2 to assign and display deterministic score outcomes

### Within Each User Story

- Verification tasks MUST be completed before the story is treated as done
- Shared types before services
- Services before routes or client state integration
- Client state before page-level UI behavior
- Manual two-tab validation before moving to the next priority

### Parallel Opportunities

- `T003` can run in parallel with `T001-T002`
- `T005-T007` can run in parallel once `T004` is defined
- `T010-T011`, `T018-T019`, and `T026-T027` can run in parallel within their user stories
- `T016`, `T024`, and `T031` can run in parallel with their paired backend work once the backend contract is stable
- `T033` can run in parallel with final validation once implementation is complete

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 automated verification together:
Task: "Add drawer-only drawing and clear-canvas coverage in backend/src/services/roomStore.test.ts"
Task: "Add drawing and clear-canvas request coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 1 implementation work together:
Task: "Implement drawer-only stroke append and clear-canvas behavior in backend/src/services/roomStore.ts"
Task: "Add draw and clear-canvas API/store methods in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 automated verification together:
Task: "Add guess-trimming, empty-guess rejection, and ordered history coverage in backend/src/api/schemas.test.ts and backend/src/services/roomStore.test.ts"
Task: "Add guess-submission request and history snapshot coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 2 implementation work together:
Task: "Implement non-drawer guess submission and ordered guess-history append in backend/src/services/roomStore.ts"
Task: "Add guess submission API/store methods in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 automated verification together:
Task: "Add case-insensitive matching and deterministic 100-or-0 score coverage in backend/src/services/roomStore.test.ts"
Task: "Add score-bearing gameplay snapshot coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 3 implementation work together:
Task: "Implement case-insensitive guess evaluation and deterministic score assignment in backend/src/services/roomStore.ts"
Task: "Expose score totals and viewer can-draw/can-guess fields in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm drawer-only drawing and shared clear-canvas behavior with two tabs
5. Demo the active-round canvas interaction on top of Scenario 2

### Incremental Delivery

1. Complete Setup + Foundational -> shared gameplay contract ready
2. Add User Story 1 -> validate shared drawing and clear-canvas -> MVP complete
3. Add User Story 2 -> validate trimmed guesses, blank-guess rejection, and synced history
4. Add User Story 3 -> validate deterministic 100-or-0 scoring and shared totals
5. Finish with Phase 6 validation and artifact cleanup

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After foundation is stable:
   - Developer A: backend service and route changes for the active story
   - Developer B: frontend store, component, and page changes for the active story
   - Developer C: automated verification updates in `backend/src/**/*.test.ts` and `frontend/src/services/api.test.ts`
3. Rejoin for manual two-tab validation at the end of each story

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Every task includes an exact file path and can be executed without additional artifact discovery
- Suggested MVP scope: Phase 3 / User Story 1 only
