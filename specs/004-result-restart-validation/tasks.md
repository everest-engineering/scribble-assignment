# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Backend Infrastructure

**Purpose**: Types, store functions, schemas, and routes for round-end and restart.

- [X] T001 [P] Add "result" to RoomStatus union type in `backend/src/models/game.ts`
- [X] T002 Add endRound() (idempotent — accepts already-"result") and restartGame() functions (preserves scores, clears round state per field map); update submitGuess() with auto-end detection (guard: only if nonDrawerParticipants.length > 0) and include `status` in the response in `backend/src/services/roomStore.ts`
- [X] T003 [P] Add endRoundSchema and restartGameSchema in `backend/src/api/schemas.ts`
- [X] T004 Add POST /:code/end-round and POST /:code/restart routes in `backend/src/api/rooms.ts`
- [X] T005 Update getSecretWord() to allow both "playing" and "result" statuses; update toRoomSnapshot() visibility logic to reveal secretWord to all when status is "result" in `backend/src/services/roomStore.ts`

---

## Phase 2: Frontend Infrastructure

**Purpose**: Updated types, API methods, and store methods.

- [X] T006 [P] Update RoomSnapshot.status to include "result" in `frontend/src/services/api.ts`
- [X] T007 Add endRound() and restartGame() API methods in `frontend/src/services/api.ts`
- [X] T008 Add endRound() and restartGame() store methods (restartGame must call setCanvasStrokes([]) to clear stale local canvas state) in `frontend/src/state/roomStore.ts`

---

## Phase 3: Result View Component

**Purpose**: Reusable result display showing correct word, final scores, and guess history.

- [X] T009 Create ResultView component in `frontend/src/components/ResultView.tsx`
- [X] T010 Add result view styles in `frontend/src/styles/app.css`

---

## Phase 4: GamePage Integration

**Purpose**: Wire result detection, End Round button, and ResultView into GamePage.

- [X] T011 In GamePage: change room poll redirect condition from `!== "playing"` to `=== "lobby"`; add "result" status detection to show ResultView instead of game UI; add End Round button for drawer (visible when status === "playing" && isDrawer); add canvas polling guard (`status !== "playing"` → skip) in `frontend/src/pages/GamePage.tsx`

---

## Phase 5: Build Validation

- [ ] T012 Run `npm run build` in both `backend/` and `frontend/` — fix any build errors

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1**: Backend — no dependencies (foundational)
- **Phase 2**: Frontend types/API/store — no dependency on backend (types mirror each other)
- **Phase 3**: ResultView component — depends on Phase 2 (uses store/API types)
- **Phase 4**: GamePage integration — depends on Phase 1 + Phase 2 + Phase 3
- **Phase 5**: Build validation — depends on all phases

### Parallel Opportunities
- T001 and T003 can run in parallel (different files)
- Phase 2 can start after T001-T002 are known (types mirror backend)
- T006+ can start in parallel with T003-T005

### User Story Mapping
- **US1 (P1)** → T001, T002, T004 (round-end logic)
- **US2 (P1)** → T005, T009, T010, T011 (result display)
- **US3 (P1)** → T002, T003, T004, T007, T008, T009, T010, T011 (restart flow)
- **US4 (P2)** → T011 (auto-detect result via polling)

---

## Implementation Strategy

### Recommended Order
1. T001: Add "result" to RoomStatus
2. T002: endRound, restartGame, auto-end in submitGuess
3. T005: Update toRoomSnapshot for result state
4. T003 + T004: Schemas and routes
5. T006 + T007 + T008: Frontend types, API, store
6. T009 + T010: ResultView component + CSS
7. T011: GamePage integration
8. T012: Build validation
