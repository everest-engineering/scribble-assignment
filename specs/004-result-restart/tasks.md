# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend shared type definitions that both user stories depend on

- [x] T001 Extend `RoomStatus` union to `"lobby" | "game" | "result"` in `backend/src/models/game.ts`
- [x] T002 Update `RoomSnapshot.status` to `"lobby" | "game" | "result"` in `frontend/src/services/api.ts`

**Checkpoint**: TypeScript build must pass after T001 + T002 — no exhaustiveness errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend service changes that both user stories build on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Extend `submitGuess()` to set `status: "result"` on first correct guess in `backend/src/services/roomStore.ts`
- [x] T004 Extend `toRoomSnapshot()` to reveal `secretWord` to all viewers when `status === "result"` in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — US1 and US2 implementation can proceed

---

## Phase 3: User Story 1 — Result Screen (Priority: P1) 🎯 MVP

**Goal**: When a correct guess is submitted, all players auto-navigate to a result screen showing the secret word, final scores, and full guess history.

**Independent Test**: Start a game in two tabs. Submit the correct guess from the guesser tab. Within ≤2 seconds, both tabs should automatically navigate to `/result` and show the secret word, scores, and guess history.

### Implementation for User Story 1

- [x] T005 [P] [US1] Add `restartGame()` method to `frontend/src/services/api.ts` (deferred here so api.ts stays in sync — needed by US2 but safe to add now alongside T002)
- [x] T006 [US1] Add navigate-to-result `useEffect` in `frontend/src/pages/GamePage.tsx` (watches `room?.status === "result"` → `navigate("/result")`)
- [x] T007 [US1] Create `frontend/src/pages/ResultPage.tsx` with: secretWord display, Scoreboard render (scores per participant), ResultPanel render (guess history reverse order), 2s polling useEffect with clearInterval cleanup, navigate-to-lobby useEffect (watches `room?.status === "lobby"`)
- [x] T008 [US1] Register `/result` route pointing to `ResultPage` in `frontend/src/routes/index.tsx`

**Checkpoint**: US1 fully functional — both tabs navigate to result screen within 2s of correct guess; secret word visible to all

---

## Phase 4: User Story 2 — Host Restart (Priority: P1)

**Goal**: Host can restart from the result screen; all players return to lobby with participants preserved and round state cleared.

**Independent Test**: From the result screen, host clicks Restart. Both tabs navigate to the lobby within ≤2 seconds. Same players listed. Non-host does not see the Restart button.

### Implementation for User Story 2

- [x] T009 [US2] Add `restartRoomSchema` to `backend/src/api/schemas.ts`
- [x] T010 [US2] Add `restartRoom(code, participantId)` export to `backend/src/services/roomStore.ts` (returns null if not found; throws "Only the host can restart" if not host; saves lobby reset)
- [x] T011 [US2] Add `POST /:code/restart` route to `backend/src/api/rooms.ts` (403 for non-host, 404 for missing room, 200 with lobby snapshot)
- [x] T012 [US2] Add `restartGame()` action to `frontend/src/state/roomStore.ts` (calls `api.restartGame()`, calls `setRoomSnapshot(response.room)`)
- [x] T013 [US2] Add host-only Restart button to `frontend/src/pages/ResultPage.tsx` (visible only when `room.hostId === participantId`; calls `roomStore.restartGame()`)

**Checkpoint**: US2 fully functional — host restart clears round state, all tabs navigate to lobby within 2s; non-host sees no Restart button

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation of the complete four-scenario game loop

- [x] T014 Verify TypeScript builds cleanly (no type errors) in both `backend/` and `frontend/`
- [ ] T015 [P] Manual two-tab acceptance: correct guess → result screen → restart → lobby → start again (full loop)
- [ ] T016 [P] Verify edge case: guess submitted after round ends returns 400 "Game is not active"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — blocks US1 and US2
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; T013 depends on T007 (ResultPage must exist)
- **Polish (Phase 5)**: Depends on Phase 3 + Phase 4

### Within Each User Story

- Backend service/schema before backend route
- Backend route before frontend integration
- Frontend page before route registration

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003 and T004 can run in parallel (different methods in same file — be careful of conflicts)
- T005 is parallel-safe alongside T006–T008 (different file)
- T009, T010 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001 + T002 (type setup)
2. Phase 2: T003 + T004 (backend service)
3. Phase 3: T005 → T006 → T007 → T008 (frontend result screen)
4. **STOP and VALIDATE**: both tabs show result screen after correct guess

### Incremental Delivery

1. Complete Setup + Foundational → backend ready for result state
2. Add US1 → result screen working → validate
3. Add US2 → restart working → validate full loop
4. Polish → complete four-scenario game loop confirmed

---

## Notes

- T005 is placed in US1 phase but is also a prerequisite for US2 T012 — safe to do early
- ResultPage.tsx (T007) is a new file — the only new file in this scenario
- All other tasks are extensions of existing files
- Total: 16 tasks across 5 phases
