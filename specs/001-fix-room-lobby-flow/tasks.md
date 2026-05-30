---

description: "Task list for fixing room lobby flow"

---

# Tasks: Fix Room Lobby Flow

**Input**: Design documents from `specs/001-fix-room-lobby-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md

**Tests**: Test tasks are not included — this feature uses manual two-browser-tab
testing per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- All changes are in `frontend/src/` — backend is unmodified

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project builds and basic structure

- [x] T001 Verify frontend and backend projects build successfully with `npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix the root cause — the API URL typo — which blocks all user
stories from working.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Fix API_BASE_URL typo in frontend/src/services/api.ts — change
  `"http://localhost:3001/bug"` to `"http://localhost:3001"`

**Checkpoint**: Foundation ready — user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Create and join a room (Priority: P1) 🎯 MVP

**Goal**: Players can create a room with a valid name, and another player can
join using the room code. Empty/whitespace names and empty codes are rejected
with inline errors.

**Independent Test**: Open two browser tabs, create a room in one, join in the
other with the room code. Both players appear.

### Implementation for User Story 1

- [x] T003 [P] [US1] Add inline name validation in
  frontend/src/pages/CreateRoomPage.tsx — guard against empty/whitespace-only
  name before calling roomStore.createRoom()
- [x] T004 [P] [US1] Add inline name and room code validation in
  frontend/src/pages/JoinRoomPage.tsx — guard against empty/whitespace-only
  name and empty code before calling roomStore.joinRoom()

**Checkpoint**: At this point, User Story 1 should be fully functional and
testable independently

---

## Phase 4: User Story 2 - Refresh lobby to see updated participants (Priority: P2)

**Goal**: Clicking "Refresh Room" shows a loading indicator while fetching and
displays an inline error if the fetch fails.

**Independent Test**: Open two tabs in the same room, join the second player,
click "Refresh Room" in the first tab — both players appear and loading
indicator shows during the request.

### Implementation for User Story 2

- [x] T005 [US2] Wrap fetchRoom() with withLoading() in
  frontend/src/state/roomStore.ts — replace raw api.fetchRoom() call with
  this.withLoading() to set isLoading state
- [x] T006 [P] [US2] Wire refreshError display in
  frontend/src/pages/LobbyPage.tsx — ensure server errors during refresh show
  as inline messages in the Status card

**Checkpoint**: All user stories should now be independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full fix end-to-end

- [x] T007 Run manual validation tests per quickstart.md — test all acceptance
  scenarios from spec.md: create, join, refresh, empty input validation, error
  display, server-down handling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user
  stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No
  dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — No
  dependencies on other stories

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- T003 and T004 are [P] (different files: CreateRoomPage.tsx vs
  JoinRoomPage.tsx) — can run in parallel
- T005 and T006 are [P] (different files: roomStore.ts vs LobbyPage.tsx) — can
  run in parallel (after T005)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch both form validation tasks together:
Task: "Add inline name validation in frontend/src/pages/CreateRoomPage.tsx"
Task: "Add inline name and code validation in frontend/src/pages/JoinRoomPage.tsx"
```

## Parallel Example: User Story 2

```bash
# T005 must finish first (store change), then T006 can run in parallel with T005's consumers:
Task: "Wrap fetchRoom with withLoading in frontend/src/state/roomStore.ts"
Task: "Wire refreshError display in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T003 + T004)
   - Developer B: User Story 2 (T005 + T006)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break
  independence
