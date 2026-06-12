# Tasks: Game Rounds

**Input**: Design documents from `specs/002-game-rounds/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks included — not requested in spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — the repository is already initialized from the 001 implementation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend role assignment and word visibility — MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add role assignment to `startGame` in `backend/src/services/roomStore.ts` — set each participant's role (`"drawer"` for host, `"guesser"` for everyone else) after game starts
- [X] T002 [P] Populate `role` field in `toRoomSnapshot` in `backend/src/services/roomStore.ts` — when status is `"playing"` or `"finished"`, set each `ParticipantSnapshot.role` based on the participant's role on the Room
- [X] T003 Implement role-based word filtering in `toRoomSnapshot` in `backend/src/services/roomStore.ts` — use `viewerParticipantId` to look up the viewer's role; include `word` in the snapshot only if the viewer is the drawer; omit `word` (set to `undefined`) for guessers and unknown viewers

**Checkpoint**: Foundation ready — roles are assigned and visible in snapshots, word is hidden from guessers. User story implementation can now begin.

---

## Phase 3: User Story 1 — Drawer Assignment (Priority: P1) 🎯 MVP

**Goal**: Each player sees their role (drawer/guesser) and the drawer's identity on the game page.

**Independent Test**: Start a game with 2+ players. Verify the host sees "Drawer" and all others see "Guesser" in the Player Info panel. Verify all players see the drawer's name.

- [X] T004 [P] [US1] Add `word?: string` field to `RoomSnapshot` in `frontend/src/services/api.ts` (optional — may be absent for guessers)
- [X] T005 [US1] Show role indicator and drawer identity on `GamePage` in `frontend/src/pages/GamePage.tsx` — Player Info card displays "Role: Drawer" or "Role: Guesser" and "Drawer: <name>"
- [X] T006 [US1] Add auto-polling (2s interval) to `GamePage` in `frontend/src/pages/GamePage.tsx` — mount `pollRoom` on mount, clear on unmount (same pattern as `LobbyPage`)

**Checkpoint**: At this point, User Story 1 is complete. Roles are displayed correctly. The game page polls for updates.

---

## Phase 4: User Story 2 — Secret Word (Priority: P1)

**Goal**: Drawer sees the secret word; guessers see "Drawer is drawing..." placeholder. Word never leaks to guessers.

**Independent Test**: Start a game. As the host (drawer), see the word displayed as a banner above the canvas. As a guesser, see "Drawer is drawing..." placeholder instead of the word.

- [X] T007 [P] [US2] Show secret word banner above canvas on `GamePage` in `frontend/src/pages/GamePage.tsx` — render the word only when `participant.role === "drawer"` and `room.word` is present
- [X] T008 [US2] Show "Drawer is drawing..." placeholder on `GamePage` in `frontend/src/pages/GamePage.tsx` — render in the canvas area for guessers (when `participant.role === "guesser"`)

**Checkpoint**: At this point, User Story 2 is complete. Word visibility is correctly gated by role.

---

## Phase 5: User Story 3 — Game State Transitions (Priority: P2)

**Goal**: Room status transitions and game-page state awareness.

**Independent Test**: Start a game and verify the room status reflects `"playing"`. Attempt to join during an active game and verify rejection.

> **Note**: Most of US3 (lobby → playing transition, join rejection) was already implemented in 001. This phase covers remaining game-page state awareness.

- [X] T009 [P] [US3] Display room status on `GamePage` in `frontend/src/pages/GamePage.tsx` — show status indicator based on `room.status` (e.g., "Game in Progress" for `"playing"`, "Round Over" for `"finished"`)
- [X] T010 [US3] Handle `"finished"` state on `GamePage` in `frontend/src/pages/GamePage.tsx` — show "Drawer disconnected" message when status is `"finished"` due to drawer disconnect

**Checkpoint**: At this point, all three user stories are independently functional.

---

## Phase 6: Edge Cases — Drawer Disconnect

**Purpose**: Handle drawer disconnect gracefully — transition to `"finished"` and notify remaining players.

- [X] T011 [P] Add `POST /rooms/:code/leave` endpoint in `backend/src/api/rooms.ts` and `leaveRoom` service function in `backend/src/services/roomStore.ts` — remove the participant from the room; if the leaving participant is the drawer and the room status is `"playing"`, set status to `"finished"`; if room becomes empty, delete it
- [X] T012 Add Zod schema for leave request in `backend/src/api/schemas.ts` — validate `participantId` in request body
- [X] T013 Wire "Exit Game" button on `GamePage` in `frontend/src/pages/GamePage.tsx` to call leave endpoint — navigate to start page after leaving; add `leaveRoom` method to store
- [X] T014 [P] Add `leaveRoom` action to `RoomStore` in `frontend/src/state/roomStore.ts` — call `api.leaveRoom` and clear store state

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final build validation

- [X] T015 Run backend build — `cd backend && npm run build`
- [X] T016 Run frontend build — `cd frontend && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — not needed for 002
- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) can proceed in parallel if staffed
  - Or sequentially in priority order (US1 → US2)
- **Edge Cases (Phase 6)**: Depends on US1/US2 game page changes
- **Polish (Phase 7)**: Depends on all desired phases being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US3 (P2)**: Can start after Foundational (Phase 2) — Depends on T004 (word type) but otherwise independent

### Within Each Phase

- [P] tasks within a phase can run in parallel
- Service logic before frontend display
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003 (Foundational) can all run in parallel (different concerns in same file but non-overlapping)
- T004, T005, T006 (US1) can run partially in parallel (T004 is a type change; T005 and T006 are UI)
- T007, T008 (US2) can run in parallel (different UI areas)
- T009, T010 (US3) can run in parallel
- T011, T012 (Edge Cases) can run in parallel
- T015, T016 (Polish) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational backend changes in parallel:
Task: "T001 — Role assignment in startGame"
Task: "T002 — Role population in toRoomSnapshot"
Task: "T003 — Word filtering in toRoomSnapshot"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
2. Complete Phase 3: User Story 1 (Drawer Assignment)
3. **STOP and VALIDATE**: Start a game, verify roles display correctly on game page
4. Can deploy/demo with roles working

### Incremental Delivery

1. Complete Foundational → Backend role/word logic ready
2. Add US1 (Drawer Assignment) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Secret Word) → Test independently → Deploy/Demo
4. Add US3 (State Transitions) → Test independently
5. Add Edge Cases (Drawer Disconnect) → Test independently
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies (or non-overlapping concerns in same file)
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
