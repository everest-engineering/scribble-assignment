# Tasks: Result & Restart

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(Project is already initialized. Proceed to Phase 2).*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Update Room schema and types to support the `results` phase in `backend/src/models/` (or equivalent types file)
- [x] T002 [P] Update frontend state types to support the `results` phase in `frontend/src/state/` (or equivalent types file)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Viewing Round Results (Priority: P1) 🎯 MVP

**Goal**: Display the result screen with the correct word, player points earned, and a snapshot of the final drawing when a round concludes.

**Independent Test**: Trigger the end of a round (timer or all guesses) and verify the frontend transitions to the `results` phase, displaying the required data and the disabled drawing canvas.

### Implementation for User Story 1

- [x] T003 [P] [US1] Implement logic to automatically transition from `playing` to `results` (preserving canvas and word) in `backend/src/services/roomStore.ts`
- [x] T004 [P] [US1] Create the `ResultScreen` component displaying word, sorted scores, and read-only canvas snapshot in `frontend/src/components/ResultScreen.tsx`
- [x] T005 [US1] Update the game view to conditionally render the new `ResultScreen` when the room phase is `results` in `frontend/src/pages/` (or equivalent game page)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The round should end properly and show results.

---

## Phase 4: User Story 2 - Returning to Lobby (Priority: P1)

**Goal**: Enable the host to manually reset the game room back to the lobby state, clearing the canvas, words, and resetting all player scores to 0.

**Independent Test**: As the host on the result screen, click "Return to Lobby" and verify that all players are moved back to the lobby, and the room's data is fully zeroed out. Verify that if the host disconnects, a new host is automatically assigned.

### Implementation for User Story 2

- [x] T006 [P] [US2] Add logic to auto-reassign the host role to the next oldest player upon host disconnect in `backend/src/services/roomStore.ts`
- [x] T007 [US2] Implement the room state reset function (clear canvas/word, zero scores, phase to lobby) in `backend/src/services/roomStore.ts`
- [x] T008 [US2] Implement the `POST /api/rooms/:roomId/reset` endpoint utilizing the reset function in `backend/src/api/` (or equivalent router file)
- [x] T009 [P] [US2] Add the "Return to Lobby" button strictly for the host in `frontend/src/components/ResultScreen.tsx`
- [x] T010 [US2] Implement the frontend API call and button integration to trigger the room reset in `frontend/src/state/roomStore.ts` and `ResultScreen.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. The full loop from playing -> results -> lobby is complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T011 Run the manual testing guide outlined in `quickstart.md`
- [x] T012 Code cleanup and ensure Zod validation is strictly applied on the reset endpoint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Starts immediately - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in sequential priority order (P1 → P1)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates into US1's ResultScreen component, so T009/T010 depend on T004.

### Parallel Opportunities

- Foundational tasks (T001, T002) can run in parallel.
- US1 Backend state transitions (T003) and Frontend component creation (T004) can run in parallel.
- US2 Backend logic (T006, T007) and Frontend UI addition (T009) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently to verify the round ends properly.

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently
3. Add User Story 2 → Test independently
4. Complete Polish phase.
