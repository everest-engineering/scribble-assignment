---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated test tasks whenever backend logic or frontend
behavior changes, and always include manual validation tasks for user-visible
flows. Each user story must define how its acceptance criteria will be verified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below should default to this repository's monorepo layout unless the
  plan documents a justified exception

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Confirm affected files and validation commands from plan.md
- [ ] T002 Create or update supporting types/schemas/interfaces needed by the
      selected story slice
- [ ] T003 [P] Capture any required test fixtures or mock data updates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Add or update shared backend models in `backend/src/models/`
- [ ] T005 [P] Add or update room/game services in `backend/src/services/`
- [ ] T006 [P] Add or update API schemas/routes in `backend/src/api/`
- [ ] T007 Add or update shared frontend state in `frontend/src/state/`
- [ ] T008 Confirm error-handling and fallback states for affected flows
- [ ] T009 Document polling cadence or state transition assumptions if changed

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Verification for User Story 1 ⚠️

> **NOTE: Write or update automated checks before or alongside implementation,
> then confirm they fail when appropriate and pass after the change**

- [ ] T010 [P] [US1] Backend test coverage in `backend/src/**/*.test.ts`
- [ ] T011 [P] [US1] Frontend test coverage in `frontend/src/**/*.test.ts`
- [ ] T012 [US1] Manual multi-tab validation for [user journey]

### Implementation for User Story 1

- [ ] T013 [P] [US1] Update backend model/service files in `backend/src/...`
- [ ] T014 [P] [US1] Update backend API/schema files in `backend/src/api/...`
- [ ] T015 [P] [US1] Update frontend API/state files in `frontend/src/services/`
      or `frontend/src/state/`
- [ ] T016 [US1] Update UI flow in `frontend/src/pages/` and/or
      `frontend/src/components/`
- [ ] T017 [US1] Add validation and error handling for the story flow

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Verification for User Story 2 ⚠️

- [ ] T018 [P] [US2] Backend test coverage in `backend/src/**/*.test.ts`
- [ ] T019 [P] [US2] Frontend test coverage in `frontend/src/**/*.test.ts`
- [ ] T020 [US2] Manual multi-tab validation for [user journey]

### Implementation for User Story 2

- [ ] T021 [P] [US2] Update backend model/service files in `backend/src/...`
- [ ] T022 [P] [US2] Update backend API/schema files in `backend/src/api/...`
- [ ] T023 [P] [US2] Update frontend API/state files in `frontend/src/services/`
      or `frontend/src/state/`
- [ ] T024 [US2] Update UI flow in `frontend/src/pages/` and/or
      `frontend/src/components/`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Verification for User Story 3 ⚠️

- [ ] T025 [P] [US3] Backend test coverage in `backend/src/**/*.test.ts`
- [ ] T026 [P] [US3] Frontend test coverage in `frontend/src/**/*.test.ts`
- [ ] T027 [US3] Manual multi-tab validation for [user journey]

### Implementation for User Story 3

- [ ] T028 [P] [US3] Update backend model/service files in `backend/src/...`
- [ ] T029 [P] [US3] Update backend API/schema files in `backend/src/api/...`
- [ ] T030 [P] [US3] Update frontend API/state files in `frontend/src/services/`
      or `frontend/src/state/`
- [ ] T031 [US3] Update UI flow in `frontend/src/pages/` and/or
      `frontend/src/components/`

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in `README.md` or feature artifacts
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance or polling-efficiency adjustments across all stories
- [ ] TXXX [P] Additional automated coverage in `backend/src/**/*.test.ts` or
      `frontend/src/**/*.test.ts`
- [ ] TXXX Run final backend/frontend build and test commands
- [ ] TXXX Run final end-to-end multi-tab validation against acceptance criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Verification tasks MUST be completed before the story is treated as done
- Models/types before services
- Services/state before routes or UI integration
- Core implementation before cross-story integration
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All automated verification tasks for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch automated verification updates for User Story 1 together:
Task: "Backend test coverage in backend/src/**/*.test.ts"
Task: "Frontend test coverage in frontend/src/**/*.test.ts"

# Launch independent implementation work for User Story 1 together:
Task: "Update backend model/service files in backend/src/..."
Task: "Update frontend API/state files in frontend/src/services/ or frontend/src/state/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- Verify affected automated checks and manual acceptance flows before closing a story
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, forbidden architecture changes, same-file conflicts, or
  cross-story dependencies that break independence
