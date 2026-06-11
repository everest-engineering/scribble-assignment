---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include focused tests for behavior changes unless the plan documents a docs-only or manual-validation-only reason.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/api/`, `backend/src/services/`, `backend/src/models/`
- **Frontend**: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`, `frontend/src/state/`, `frontend/src/styles/`
- **Docs/Specs**: `docs/`, `specs/[###-feature-name]/`
- Test files normally live beside the TypeScript source they validate, following the current repo pattern.

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

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Verify existing TypeScript, Vite, React, Express, and Zod setup
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Define or update TypeScript game models in `backend/src/models/`
- [ ] T005 [P] Define or update Zod request/response schemas in `backend/src/api/schemas.ts`
- [ ] T006 [P] Update API routing and centralized error handling in `backend/src/api/` as needed
- [ ] T007 Update in-memory room/game state management in `backend/src/services/roomStore.ts`
- [ ] T008 Update frontend API contracts in `frontend/src/services/api.ts`
- [ ] T009 Update frontend room/session state in `frontend/src/state/roomStore.ts`
- [ ] T010 Document polling, validation, and no-database/no-auth constraints in the plan

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Backend API/service test in `backend/src/[path]/[name].test.ts`
- [ ] T012 [P] [US1] Frontend state/component test in `frontend/src/[path]/[name].test.tsx`

### Implementation for User Story 1

- [ ] T013 [P] [US1] Update backend model/schema in `backend/src/models/` or `backend/src/api/schemas.ts`
- [ ] T014 [US1] Implement backend service logic in `backend/src/services/roomStore.ts`
- [ ] T015 [US1] Implement API route behavior in `backend/src/api/rooms.ts`
- [ ] T016 [US1] Implement frontend API/state updates in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [ ] T017 [US1] Implement page/component UI in `frontend/src/pages/` or `frontend/src/components/`
- [ ] T018 [US1] Add validation feedback and graceful error handling

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T019 [P] [US2] Backend API/service test in `backend/src/[path]/[name].test.ts`
- [ ] T020 [P] [US2] Frontend state/component test in `frontend/src/[path]/[name].test.tsx`

### Implementation for User Story 2

- [ ] T021 [P] [US2] Update backend model/schema in `backend/src/models/` or `backend/src/api/schemas.ts`
- [ ] T022 [US2] Implement backend service/API behavior in `backend/src/services/` and `backend/src/api/`
- [ ] T023 [US2] Implement frontend state and UI behavior in `frontend/src/`
- [ ] T024 [US2] Integrate with User Story 1 components if needed

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T025 [P] [US3] Backend API/service test in `backend/src/[path]/[name].test.ts`
- [ ] T026 [P] [US3] Frontend state/component test in `frontend/src/[path]/[name].test.tsx`

### Implementation for User Story 3

- [ ] T027 [P] [US3] Update backend model/schema in `backend/src/models/` or `backend/src/api/schemas.ts`
- [ ] T028 [US3] Implement backend service/API behavior in `backend/src/services/` and `backend/src/api/`
- [ ] T029 [US3] Implement frontend state and UI behavior in `frontend/src/`

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional focused tests in existing `*.test.ts` or `*.test.tsx` patterns
- [ ] TXXX Constitution scope check: no WebSockets, databases, authentication, sessions, or unrelated dependencies
- [ ] TXXX Run quickstart.md validation

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

- Tests MUST be written and FAIL before implementation unless the plan documents a manual-validation-only exception
- Models and schemas before services
- Services before endpoints and frontend integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Backend schema/model work and frontend state work can run in parallel when they touch different files
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Backend API/service test in backend/src/[path]/[name].test.ts"
Task: "Frontend state/component test in frontend/src/[path]/[name].test.tsx"

# Launch backend model/schema work and frontend state work together:
Task: "Update backend model/schema in backend/src/models/ or backend/src/api/schemas.ts"
Task: "Implement frontend API/state updates in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Demo or validate if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo/Validate (MVP!)
3. Add User Story 2 → Test independently → Demo/Validate
4. Add User Story 3 → Test independently → Demo/Validate
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
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
