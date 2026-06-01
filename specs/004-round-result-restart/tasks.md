---

description: "Task list for Round Result and Restart feature"

---

# Tasks: Round Result and Restart

**Input**: Design documents from `specs/004-round-result-restart/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Manual two-browser verification tasks included per story. Backend unit tests included for store logic changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below match the existing project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and confirm feature prerequisite

- [x] T001 Verify backend tests pass with `cd backend && npx vitest run`
- [x] T002 Verify frontend build with `cd frontend && npx tsc --noEmit`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rename `"round_ended"` to `"results"` across shared type definitions. This MUST be done before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Rename `"round_ended"` to `"results"` in `RoomStatus` type in `backend/src/models/game.ts`
- [x] T004 [P] Update `RoomSnapshot.status` type from `"round_ended"` to `"results"` in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — View Round Results (Priority: P1) 🎯 MVP

**Goal**: After a round ends, all players see the results screen with the secret word, guess outcomes, and final scores.

**Independent Test**: Complete a full round (drawing + guesses), end the round, and confirm all players in the room see the results screen with the correct word, guess outcomes, and scores matching the round's events.

### Implementation for User Story 1

- [ ] T005 [US1] Update `submitGuess()` in `backend/src/services/roomStore.ts` to transition to `"results"` instead of `"round_ended"` (line ~272)
- [ ] T006 [US1] Update `revealWord()` in `backend/src/services/roomStore.ts` to transition to `"results"` instead of `"round_ended"` (line ~287)
- [ ] T007 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to show secret word when `status === "results"` instead of `"round_ended"` (line ~295)
- [ ] T008 [US1] Update `submitGuess()` and `revealWord()` guards in `backend/src/services/roomStore.ts` — they already check `status !== "playing"`, which covers "results" without changes, but verify `submitStrokes()` and `clearCanvas()` guards at lines ~211 and ~224 also cover "results" (they check `status !== "playing"` — no change needed, verify)
- [ ] T009 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx`: change `isRoundEnded` from `room.status === "round_ended"` to `room.status === "results"`, update label text from "Round Ended" to "Results"
- [ ] T010 [US1] Update `toRoomSnapshot()` check — verify the `showSecretWord` logic at line ~295 works for "results" status (it already shows secretWord to all when status is "round_ended"; update the condition to check for "results")
- [ ] T011 [US1] Run backend tests with `cd backend && npx vitest run` and fix any failures caused by the `"round_ended"` → `"results"` rename

**Checkpoint**: At this point, User Story 1 should be fully functional. Players transition to a results view automatically when the round ends, showing the word and scores.

---

## Phase 4: User Story 2 — Restart to Lobby (Priority: P1)

**Goal**: Any player can trigger a restart from the results screen, returning all players to the lobby with their player list preserved and all round data cleared.

**Independent Test**: Complete a round, trigger "Play Again" from any player, and confirm all players land in the lobby with the same players, no round artifacts, and the host can start a new game.

### Implementation for User Story 2

- [ ] T012 [US2] Add `playAgainSchema` in `backend/src/api/schemas.ts` — Zod schema with required `participantId: z.string()`
- [ ] T013 [US2] Implement `playAgain(code, participantId)` function in `backend/src/services/roomStore.ts`:
  - Validate room exists (404 if not)
  - Validate participantId is in room (404 if not)
  - Idempotent: if `room.status` is already `"lobby"`, return success with no changes
  - Reset: `status → "lobby"`, `drawerId → null`, `secretWord → null`, `strokes → []`, `clearVersion → 0`, `guesses → []`, `scores → new Map()`
  - Preserve: `participants`, `hostId`, `code`
  - Save and return cloned room
- [ ] T014 [US2] Add `POST /:code/play-again` route handler in `backend/src/api/rooms.ts` with `playAgainSchema` validation
- [ ] T015 [P] [US2] Add `playAgain(code, participantId)` API function in `frontend/src/services/api.ts`
- [ ] T016 [US2] Add `async playAgain()` method in `frontend/src/state/roomStore.ts` that calls the API and updates room snapshot
- [ ] T017 [US2] Add "Play Again" button in `frontend/src/pages/GamePage.tsx` visible to all players when `room.status === "results"`, wired to `roomStore.playAgain()`
- [ ] T018 [US2] Write backend test for `playAgain()` in `backend/src/services/roomStore.test.ts`:
  - Test reset resets all round data
  - Test players are preserved
  - Test idempotency (calling twice is safe)
  - Test non-participant cannot trigger
  - Test restart allows new game to start
- [ ] T019 [US2] Run `cd backend && npx vitest run` and fix any failures

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Full round → results → play again → lobby cycle is complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation of the complete flow

- [ ] T020 [P] Run backend tests: `cd backend && npx vitest run`
- [ ] T021 [P] Run frontend typecheck: `cd frontend && npx tsc --noEmit`
- [ ] T022 Run two-browser manual test: complete a round and verify results screen shows correct data (word, scores, guesses) for both drawer and guesser perspectives
- [ ] T023 Run two-browser manual test: click "Play Again" from one session, verify both sessions transition to lobby with all players preserved and no round artifacts
- [ ] T024 Run two-browser manual test: after restart, verify host can start a new game successfully
- [ ] T025 Run edge case test: verify guesses and drawing actions are rejected during results state
- [ ] T026 Run edge case test: verify simultaneous "Play Again" from two players is handled gracefully (idempotent)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 — Results (Phase 3)**: Depends on Foundational completion
- **US2 — Restart (Phase 4)**: Depends on US1 (results state must exist before restart can work) and Foundational completion
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational phase — No dependencies on other stories
- **User Story 2 (P1)**: Can start after User Story 1 is complete (restart requires results state to exist)

### Within Each User Story

- Backend before frontend
- Services before API routes
- Frontend API client before store method before UI
- Story complete before moving to next story

### Parallel Opportunities

- T001 and T002 can run in parallel (Phase 1)
- T003 and T004 can run in parallel (Phase 2 — different files)
- T010 is independent of T005-T009 and can run while those are being done
- T015 is independent of T012-T014 and can run while backend work is in progress
- T020 and T021 can run in parallel (Phase 5)
- US1 tasks that touch different files (e.g., backend vs frontend) can be parallelized

### Parallel Example: User Story 1

```bash
# Backend (T005, T006, T07) can run in parallel with Frontend (T009):
Task: "Update submitGuess() in backend/src/services/roomStore.ts"
Task: "Update GamePage.tsx to show results UI"
```

### Parallel Example: User Story 2

```bash
# Backend (T012, T013, T014) can run in parallel with Frontend API (T015):
Task: "Implement playAgain() in backend/src/services/roomStore.ts"
Task: "Add playAgain() API function in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (View Round Results)
4. **STOP and VALIDATE**: Test User Story 1 independently — play a round, verify results screen
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Results display) → Test independently → MVP achieved
3. Add User Story 2 (Restart) → Test independently → Full feature complete
4. Polish and validate complete cycle

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend + frontend)
   - Developer B: User Story 2 (can start after US1 backend is done)
3. Stories integrate naturally since US2 builds on US1

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The existing `submitStrokes()` and `clearCanvas()` guards already check `status !== "playing"`, which correctly rejects actions in `"results"` state — no changes needed there
- Commit after each task or logical group
- Stop at the Phase 3 checkpoint to validate the MVP independently
