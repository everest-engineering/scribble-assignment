# Tasks: Round Result, Restart & Final Validation

**Input**: Design documents from `specs/005-round-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (all available)

**Tests**: Not requested by feature specification. Manual verification per acceptance scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below adjusted per plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup phase tasks needed — project already initialized with Express + React + TypeScript + Zod.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type and schema changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Extend `RoomStatus` union type with `"result"` in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [x] T002 Add `roundEndBodySchema` and `restartBodySchema` in `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Round Result Display (Priority: P1) 🎯 MVP

**Goal**: When a round ends, all players see the secret word, final ranked scores, and full guess history on a dedicated result screen.

**Independent Test**: Start a game with 2+ players in two browser tabs. Play through until all guessers guess correctly. Verify both tabs show the result screen with the correct word, all scores ranked, and the guess history visible.

### Implementation for User Story 1

- [x] T003 [P] [US1] Implement `endRound` function in `backend/src/services/roomStore.ts` — sets `room.status = "result"`, validates host-only, returns 403 for non-host
- [x] T004 [P] [US1] Add `POST /:code/round/end` route in `backend/src/api/rooms.ts` — calls `endRound`, returns room snapshot with `"result"` status
- [x] T005 [P] [US1] Modify `toRoomSnapshot` in `backend/src/services/roomStore.ts` — when `status === "result"`, include `currentWord` for ALL viewers (not just the drawer); scores are final
- [x] T006 [P] [US1] Auto-detect round end in `submitGuess` in `backend/src/services/roomStore.ts` — after a correct guess, check if all non-drawer participants have scored; if so, auto-transition to `"result"` status
- [x] T007 [US1] Add `endRound` API call in `frontend/src/services/api.ts` — wraps `POST /:code/round/end`
- [x] T008 [US1] Add `endRound` action in `frontend/src/state/roomStore.ts` — calls API, updates room state
- [x] T009 [US1] Create `ResultPage.tsx` in `frontend/src/pages/ResultPage.tsx` — displays the secret word (all players see it), final scores ranked highest-to-lowest, full guess history with guesser names and correct/incorrect markers; winning guess highlighted
- [x] T010 [US1] Add `/result` route in `frontend/src/App.tsx` — renders `ResultPage` component
- [x] T011 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — navigate to `/result` when `room.status === "result"` (use `useEffect` watching `room.status`)

**Checkpoint**: At this point, User Story 1 should be fully functional — a round that completes shows all players the result screen with word, scores, and guess history.

---

## Phase 4: User Story 2 — Host Restart to Lobby (Priority: P1)

**Goal**: After viewing results, the host can restart. All players return to the lobby with the same player list preserved and all round state cleared.

**Independent Test**: Complete a round and reach the result screen. As host, click "Restart / Play Again." Verify all players land in the lobby with the same player names, no scores visible, no word, no guesses, and no canvas. Then start a new game from the lobby successfully.

### Implementation for User Story 2

- [x] T012 [US2] Implement `restartGame` function in `backend/src/services/roomStore.ts` — clears `room.currentRound`, resets scores to `{}`, preserves `room.participants`, sets `room.status = "lobby"`, validates host-only
- [x] T013 [US2] Add `POST /:code/restart` route in `backend/src/api/rooms.ts` — calls `restartGame`, returns room snapshot with `"lobby"` status
- [x] T014 [US2] Add `restartGame` API call in `frontend/src/services/api.ts` — wraps `POST /:code/restart`
- [x] T015 [US2] Add `restartGame` action in `frontend/src/state/roomStore.ts` — calls API, updates room state, stops polling if needed
- [x] T016 [US2] Add restart button to `ResultPage.tsx` — host sees "Restart / Play Again" button; non-host sees "Waiting for host to restart..." message; button calls `store.restartGame()`
- [x] T017 [US2] Handle lobby navigation in `ResultPage.tsx` — when `room.status` becomes `"lobby"` (detected via polling), navigate to `/lobby` for all players

**Checkpoint**: At this point, User Stories 1 AND 2 should both work — the full round-complete → result → restart → lobby cycle functions end-to-end.

---

## Phase 5: User Story 3 — Simultaneous Result Transition (Priority: P2)

**Goal**: All players transition to the result screen at approximately the same time when the round ends. No player is left in the guessing state while others see results.

**Independent Test**: Start a game with 3+ players. Have one player guess correctly, ending the round. Verify all players see the result screen within 2 seconds of the round ending, even if they are in different browser tabs or have slightly delayed polling.

### Implementation for User Story 3

- [x] T018 [US3] Ensure `GamePage.tsx` polls with consistent interval and immediately detects `"result"` status — verify the existing 2-second polling interval is sufficient; navigation to `/result` occurs on the next poll cycle after status change
- [x] T019 [US3] Handle slow-polling player edge case in `LobbyPage.tsx` and `GamePage.tsx` — when a player polls and receives `"result"` status from any prior state (`"playing"` or `"lobby"`), route them to `/result`; when they poll and receive `"lobby"` status from `"result"` state, route them to `/lobby`

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and quality improvements

- [x] T020 Handle host transfer on disconnect during result state — when host disconnects (detected via 30s polling inactivity), transfer `isHost` flag to the next eligible participant in `backend/src/services/roomStore.ts`
- [x] T021 Handle late joiner during result screen — when a player joins a room with `status === "result"`, they receive the current result data (word, scores, guesses) via the existing join + snapshot flow in `backend/src/services/roomStore.ts`
- [x] T022 Handle round end with zero guesses — when a round transitions to `"result"` from `submitGuess` auto-detect or `endRound` with no guesses, the result screen shows the word, zero scores, and an empty guess history; no crash or empty-state bugs
- [ ] T023 Run quickstart.md validation — perform two-browser-tab manual verification per the quickstart verification steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already exists
- **Foundational (Phase 2)**: No prior dependencies — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 are independent and can proceed in parallel (if staffed)
  - US3 refines the transition behavior and depends on US1 being complete to test against
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — independent from US1; both share ResultPage component
- **User Story 3 (P2)**: Depends on US1 (needs the result screen to exist to test transitions)

### Within Each User Story

- Backend service functions before API routes
- API routes before frontend API calls
- Frontend API calls before store actions
- Store actions before page components

### Parallel Opportunities

- T003 and T004 can run in parallel (different files: roomStore.ts vs rooms.ts)
- T003 and T005 can run in parallel (different functions in same file — careful merging)
- T006, T007 can run in parallel (different files: api.ts vs roomStore.ts)
- T012 and T013 can run in parallel (different files: roomStore.ts vs rooms.ts)
- T014 and T015 can run in parallel (different files: api.ts vs roomStore.ts)

---

## Parallel Example: User Story 1

```bash
# Launch backend model + route changes together:
Task: "Implement endRound in backend/src/services/roomStore.ts (T003)"
Task: "Add POST /:code/round/end route in backend/src/api/rooms.ts (T004)"

# Launch backend snapshot changes + auto-detect together:
Task: "Modify toRoomSnapshot for result state in backend/src/services/roomStore.ts (T005)"
Task: "Auto-detect round end in submitGuess in backend/src/services/roomStore.ts (T006)"

# Launch frontend API + store together:
Task: "Add endRound API call in frontend/src/services/api.ts (T007)"
Task: "Add endRound action in frontend/src/state/roomStore.ts (T008)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (type + schema changes)
2. Complete Phase 3: User Story 1 (round end → result screen)
3. **STOP and VALIDATE**: Manually test via two-browser-tab — verify result screen shows word, scores, guess history
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 (result display) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (restart to lobby) → Test independently → Deploy/Demo
4. Add User Story 3 (simultaneous transition) → Test independently → Deploy/Demo
5. Add Polish (edge cases) → Final validation

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 2 Foundational (types + schemas — 2 tasks)
2. Once Foundational is done:
   - Developer A: User Story 1 backend (T003-T006)
   - Developer B: User Story 1 frontend (T007-T011)
3. Then:
   - Developer A: User Story 2 backend (T012-T013)
   - Developer B: User Story 2 frontend (T014-T017)
4. Then:
   - Developer A: User Story 3 (T018-T019)
   - Developer B: Polish (T020-T023)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test tasks included — spec does not request TDD; manual verification per acceptance scenarios
