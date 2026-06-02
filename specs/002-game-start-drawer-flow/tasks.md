---

description: "Task list for Game Start & Drawer Flow feature"

---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The spec defines manual validation with two browser tabs. No automated test tasks are generated unless explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`
- **Frontend**: `frontend/src/pages/GamePage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

Project is already scaffolded and initialized. No setup tasks required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `currentDrawerId`, `roundNumber` to `Room` interface; add `currentDrawerId`, `roundNumber`, `secretWord` to `RoomSnapshot` in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Trim Player Names and Reject Empty Names (Priority: P1) 🎯 MVP

**Goal**: Player names are trimmed server-side, empty/whitespace-only names are rejected with clear error messages

**Independent Test**: Enter a name with spaces around it (e.g., "  Alice  "), create a room, and verify the lobby shows "Alice" without surrounding spaces. Enter a whitespace-only name and verify an error is shown.

### Implementation for User Story 1

- [X] T002 [P] [US1] Add `.trim()` to `playerNameSchema` in `backend/src/api/schemas.ts`
- [X] T003 [P] [US1] Apply trimmed name in `displayName` and `createParticipant` helpers in `backend/src/services/roomStore.ts` (covered by T002 — Zod trim propagates through naturally)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Assign and Identify the Drawer (Priority: P1)

**Goal**: When the game starts, the host becomes the drawer, and all players see who the drawer is on the game screen

**Independent Test**: Start a game with two players. Confirm both players see the host identified as the drawer on the game screen.

### Implementation for User Story 2

- [X] T004 [P] [US2] Set `currentDrawerId` (host), `roundNumber` (1), roles (host=drawer, others=guesser) in `startGame()` in `backend/src/services/roomStore.ts`
- [X] T005 [P] [US2] Expose `currentDrawerId`, `roundNumber`, `roles` (computed per-participant) in `toRoomSnapshot()`; derive `secretWord` from `STARTER_WORDS[roundNumber - 1]` and filter per-participant (null for non-drawer, actual word for drawer) in `backend/src/services/roomStore.ts`
- [X] T006 [P] [US2] Add `currentDrawerId`, `roundNumber`, `secretWord` to frontend `RoomSnapshot` type; extend `status` union to `"lobby" | "playing"` in `frontend/src/services/api.ts`
- [X] T007 [US2] Show drawer indicator in `frontend/src/pages/GamePage.tsx` — display the drawer's name prominently and show "You are the drawer" badge for the drawer vs "Drawer: [name]" for guessers

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Display Secret Word to Drawer Only (Priority: P2)

**Goal**: The secret word is visible only to the drawer; guessers never see it in the UI or network data

**Independent Test**: Start a game and observe the drawer's screen shows the secret word. On the guesser's screen, confirm the word is not visible in any form (UI or network tab).

### Implementation for User Story 3

- [X] T008 [US3] Display secret word to drawer only in `frontend/src/pages/GamePage.tsx` — show the secret word prominently when the viewer is the drawer; show nothing (or placeholder) for guessers

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T009 Run build validation: `npm run build` in both `backend/` and `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) [sequential story completion]
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Depends on Foundational — requires T001 model changes; US1 must be complete for name trimming but drawer logic is independent
- **User Story 3 (P2)**: Depends on Foundational + US2 — US2 must implement backend word selection and frontend types before the word can be displayed

### Task Dependencies Within Each Story

- Models before services
- Services before endpoints/UI
- Core implementation before integration

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- All tasks within a user story marked [P] can run in parallel
- T004 and T005 modify different functions in the same file — can run in parallel but watch for merge conflicts
- T006 (frontend types) can run in parallel with T004 and T005
- T009 build validation can run in parallel across backend/ and frontend/

---

## Parallel Example: User Story 2

```bash
# Launch independent tasks together:
Task: "Set currentDrawerId, roundNumber, roles in startGame"
Task: "Expose currentDrawerId, roundNumber, roles in toRoomSnapshot; derive and filter secretWord"
Task: "Add new fields to frontend RoomSnapshot type"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test US1 independently (one browser tab)
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo
3. Add User Story 2 → Test independently → Demo (drawer assignment visible!)
4. Add User Story 3 → Test independently → Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3 (waits for US2 backend)
3. Stories complete and integrate incrementally

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- T001 was partially completed in Scenario 1 (`"playing"` status added). The `currentDrawerId`, `roundNumber` fields on `Room`, and `currentDrawerId`, `roundNumber`, `secretWord` on `RoomSnapshot` are **not** yet implemented.
- A2 finding: Frontend `status` type (`"lobby"` only) is addressed by T006 — the task already specifies the union fix.
- A4 finding: T005 already specifies `null` for non-drawer `secretWord`. No change needed.
- A6 finding: The start-game response propagation to polling guessers is transitively covered by the existing `GET /rooms/:code` polling flow (Scenario 1). No separate task needed.
- Secret word communication: The backend MUST filter `secretWord` per-participant in `toRoomSnapshot()` — guessers receive `null`. This ensures FR-007 compliance (word never leaves server for guessers).
