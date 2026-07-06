# Tasks: Result, Restart, and Final Validation

**Input**: Design documents from `specs/008-result-restart-validation/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Backend (Shared Infrastructure)

**Purpose**: Room model extension and service methods that both user stories depend on

- [ ] T001 Extend `RoomStatus` type with `"result"` in `backend/src/models/game.ts`
- [ ] T002 Implement `endGame()` in `backend/src/services/roomStore.ts` — validate drawer, transition to result, preserve final round state
- [ ] T003 Implement `restartGame()` in `backend/src/services/roomStore.ts` — validate host, clear round state, preserve participants
- [ ] T004 Add `POST /:code/end-game` route in `backend/src/api/rooms.ts`
- [ ] T005 Add `POST /:code/restart` route in `backend/src/api/rooms.ts`

**Checkpoint**: Backend ready — both endpoints functional and testable via curl/HTTP

---

## Phase 2: Frontend API & Store (Shared Infrastructure)

**Purpose**: Frontend service layer that both user stories consume

- [ ] T006 [P] Add `endGame()` and `restartGame()` methods to `frontend/src/services/api.ts`
- [ ] T007 Add `endGame()` and `restartGame()` methods to `frontend/src/state/roomStore.ts`

**Checkpoint**: Frontend can call both endpoints; store methods available for components

---

## Phase 3: User Story 1 — View Game Results (Priority: P1) 🎯 MVP

**Goal**: The drawer can end the game and all participants see the correct word, final scores, and guess history

**Independent Test**: Open two browser tabs. Play through a game. Drawer clicks "End Game". Both tabs show the correct word, same scores, and same guess history.

### Implementation for User Story 1

- [ ] T008 [US1] Create `ResultView.tsx` in `frontend/src/components/` — displays correct word, scores via Scoreboard, guess history via ResultPanel; no interactivity yet
- [ ] T009 [US1] Add "End Game" button (drawer only) and result state rendering in `frontend/src/pages/GamePage.tsx` — show ResultView when `status === "result"`

**Checkpoint**: User Story 1 fully functional — drawer can end game, all participants see the result screen

---

## Phase 4: User Story 2 — Host Restart Game (Priority: P1)

**Goal**: The host can restart the game from the result screen, returning everyone to the lobby with participants preserved and round state cleared

**Independent Test**: After seeing results (US1), host clicks "Restart". Both tabs show the lobby with all players still present and scores reset to 0.

### Implementation for User Story 2

- [ ] T010 [US2] Add "Restart" button (host only) to `ResultView.tsx` — wired to `roomStore.restartGame()`
- [ ] T011 [US2] Add lobby navigation on restart detection in `GamePage.tsx` — navigate to `/lobby` when poll detects `status === "lobby"` after restart

**Checkpoint**: User Story 2 fully functional — host restarts, all players return to lobby with preserved participants and cleared state

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and consolidation

- [ ] T012 Run `npm run build` in backend/ — verify no TypeScript errors
- [ ] T013 Run `npm run build` in frontend/ — verify no TypeScript errors
- [ ] T014 Run `npm test` in backend/ — verify all tests pass
- [ ] T015 Run `npm test` in frontend/ — verify all tests pass
- [ ] T016 Update AGENTS.md with Feature 008 entry (verify SPECKIT section includes plan + spec links)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Backend (Phase 1)**: No dependencies — can start immediately
- **Frontend API (Phase 2)**: Depends on Phase 1 (needs endpoint contracts defined)
- **US1 (Phase 3)**: Depends on Phase 1 + Phase 2 (needs backend endpoints + frontend API/store)
- **US2 (Phase 4)**: Depends on Phase 1 + Phase 2 (needs backend endpoints + frontend API/store); US1 is a prerequisite for testing but the implementation tasks are independent
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 + Phase 2 — backend must support endGame, frontend must have API methods
- **User Story 2 (P1)**: Depends on Phase 1 + Phase 2 — backend must support restartGame, frontend must have API methods. US1 does not block US2 implementation (T010-T011 are independent of T008-T009), but US2 requires US1 to be testable (must reach result state first)

### Within Each User Story

- Backend before frontend
- API/types before store methods
- Store methods before UI components
- Core functionality before polish

### Parallel Opportunities

- T002 (endGame service) and T003 (restart service) can be implemented in parallel if split across developers — different methods in the same file
- T004 (endGame route) and T005 (restart route) can be implemented in parallel — different route handlers in the same file
- T006 (API methods) is independent and can run in parallel with Phase 1 if contracts are agreed upon
- T008 (ResultView) and T009 (GamePage integration) must be sequential — component before page integration
- T010 (Restart button) and T011 (lobby navigation) can be implemented in parallel

---

## Parallel Example: User Story 1

```bash
# Backend + frontend API can start in parallel:
Task: "Implement endGame() in backend/src/services/roomStore.ts"
Task: "Add endGame() to frontend/src/services/api.ts"  (depends on contract only)

# Component and page integration are sequential:
Task: "Create ResultView.tsx in frontend/src/components/"
Task: "Add End Game button and result rendering in frontend/src/pages/GamePage.tsx"
```

## Parallel Example: User Story 2

```bash
# Restart button and lobby navigation can be done in parallel:
Task: "Add Restart button (host only) to ResultView.tsx"
Task: "Add lobby navigation on restart in GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Backend (model + service + routes)
2. Complete Phase 2: Frontend API & Store
3. Complete Phase 3: User Story 1 (End Game + Result View)
4. **STOP and VALIDATE**: Drawer can end game; all participants see results
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Backend + frontend foundation ready
2. Add US1 → End game action + result screen functional → Deploy/Demo (MVP!)
3. Add US2 → Host restart with player preservation → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 1 (backend) — all 5 tasks
2. Developer B: Phase 2 (frontend API/store) — can start once contracts are agreed
3. Once Phase 1 + 2 done:
   - Developer A: US1 (T008-T009)
   - Developer B: US2 (T010-T011)
4. Stories integrate independently into GamePage

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1 and US2 share the same backend endpoints but serve different user needs — both are P1
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
