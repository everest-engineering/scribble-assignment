# Tasks: Post Game Experience

**Input**: Design documents from `/specs/004-post-game-experience/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. The spec does not explicitly request tests, so none are generated. Add test tasks manually if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — project structure is already established from the previous feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Add `"finished"` to the `RoundPhase` type union in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [ ] T002 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to reveal `secretWord` and actual `isCorrect` values to ALL players when `phase === "finished"`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Correct Guess Ends the Round (Priority: P1) 🎯 MVP

**Goal**: When a guesser submits the correct secret word, the round phase transitions to "finished". No more guesses or strokes are accepted.

**Independent Test**: Start a game as drawer, select a known word. As a guesser, submit the correct word. Verify the room snapshot phase is now "finished" via API. Verify submitting another guess returns an error.

### Implementation for User Story 1

- [ ] T003 [US1] Modify `submitGuess()` in `backend/src/services/roomStore.ts` to set `room.round.phase = "finished"` when a correct guess is detected
- [ ] T004 [US1] Add phase checks in `addStroke()` and `submitGuess()` in `backend/src/services/roomStore.ts` to reject submissions when `phase === "finished"` with descriptive errors
- [ ] T005 [US1] Add error handling in `POST /:code/strokes` and `POST /:code/guess` in `backend/src/api/rooms.ts` for the new "finished" phase errors

**Checkpoint**: At this point, User Story 1 should be fully functional — correct guess triggers round end, no further submissions accepted.

---

## Phase 4: User Story 2 — Result Screen Shows Round Summary (Priority: P1)

**Goal**: All players see a result screen when the phase is "finished", showing the correct secret word, player standings, and guess log.

**Independent Test**: Play a round to completion (correct guess). Verify the result screen displays: the secret word visible to all, each player's standing (correct/incorrect), and the full chronological guess log.

### Implementation for User Story 2

- [ ] T006 [US2] Add `"finished"` to the `RoundPhase` type in `frontend/src/services/api.ts` (if not already done in T001 — this is the frontend counterpart)
- [ ] T007 [US2] Update `GamePage.tsx` to render a result section when `phase === "finished"`, showing the secret word (now visible to all), final drawing canvas, player standings (computed from guesses), and the complete guess log
- [ ] T008 [US2] Add a `useEffect` in `GamePage.tsx` that navigates to `/lobby` when room status transitions to `"lobby"` (enables restart detection)

**Checkpoint**: At this point, User Story 2 should work — all players see the result screen with word, standings, and guesses.

---

## Phase 5: User Story 3 — Host Restarts the Game (Priority: P2)

**Goal**: On the result screen, the host sees a "Play Again" button. Clicking it resets the room to lobby with participants intact. All players see the lobby.

**Independent Test**: On the result screen as host, click "Play Again". Verify all players return to the lobby with the same participant list and room code, and the host can start a new game.

### Implementation for User Story 3

- [ ] T009 [P] [US3] Add `restartGame()` function in `backend/src/services/roomStore.ts` that validates caller is host and phase is "finished", resets `room.status` to `"lobby"`, sets `room.round` to `null`, and retains `room.participants`
- [ ] T010 [P] [US3] Add `POST /rooms/:code/restart` route handler in `backend/src/api/rooms.ts` that calls `restartGame()` and returns the updated room snapshot
- [ ] T011 [P] [US3] Add `api.restartGame()` method in `frontend/src/services/api.ts` and `store.restartGame()` method in `frontend/src/state/roomStore.ts`
- [ ] T012 [US3] Add "Play Again" button to the result section in `GamePage.tsx`, visible only to the host when `phase === "finished"`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T013 Run `npm run build` in backend to verify no type or compilation errors
- [ ] T014 Run `npm run build` in frontend to verify no type or compilation errors
- [ ] T015 Run through quickstart.md validation steps manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs "finished" phase to exist)
- **US3 (Phase 5)**: Depends on Foundational + US2 (needs result screen with host identification)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story dependencies
- **User Story 2 (P1)**: After US1 — needs "finished" phase to be triggerable
- **User Story 3 (P2)**: After US2 — needs result screen to host the restart button

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Story complete before moving to next priority

### Parallel Opportunities

- T001 (types) can run in parallel with T002 (visibility logic)
- T009 and T010 (US3) can run in parallel (service + route)
- T011 (frontend API) independent but needs restartGame() defined

---

## Parallel Example: User Story 3

```bash
# Launch both backend tasks together:
Task: "Add restartGame() in backend/src/services/roomStore.ts"
Task: "Add POST /rooms/:code/restart in backend/src/api/rooms.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types, visibility changes)
2. Complete Phase 3: User Story 1 (correct guess ends round)
3. **STOP and VALIDATE**: Test independently via API — submit correct guess, verify phase="finished"
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Correct guess ends round → **MVP!**
3. Add User Story 2 → Players see result screen
4. Add User Story 3 → Host can restart

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend round-end logic)
   - Developer B: User Story 2 (frontend result screen)
3. After US1 + US2: Both can work on US3 (backend restart + frontend button)
