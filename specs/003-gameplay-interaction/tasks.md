# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project is already initialized. No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend infrastructure + frontend API/store layer that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Add Point, Stroke, Guess types and Room/RoomSnapshot fields (scores, guesses, correctGuessers, canvasStrokes) in `backend/src/models/game.ts`
- [X] T002 [P] Add submitGuessSchema (with .trim().min(1).max(100)), saveCanvasSchema, clearCanvasSchema in `backend/src/api/schemas.ts`
- [X] T003 Add room store functions (submitGuess, saveCanvasState, clearCanvasState, getCanvasState, getGuesses) + update createRoom/startGame initializers in `backend/src/services/roomStore.ts`
- [X] T004 Add POST /:code/guess, GET /:code/canvas, POST /:code/canvas, POST /:code/canvas/clear routes in `backend/src/api/rooms.ts`
- [X] T005 [P] Add submitGuess, fetchCanvas, saveCanvas, clearCanvas API methods in `frontend/src/services/api.ts`
- [X] T006 Add store methods + state for guesses and canvas strokes; set up canvas polling at 1s and room polling at 2s in `frontend/src/state/roomStore.ts`

- [X] T007 [US2] Add auto-redirect to /game in lobby polling callback in `frontend/src/pages/LobbyPage.tsx` when `room.status === "playing"` (guard against redirect loop — only redirect if current path is not /game)

- [X] T008 [P] [US1] Create Canvas component with pointer-event drawing (pointerdown/move/up) + clear button; single fixed color (black) per spec assumption in `frontend/src/components/Canvas.tsx`
- [X] T009 [US1] Integrate Canvas into GamePage, add canvas polling for guessers at 1s interval, wire save/clear/clearCanvas, add CSS in `frontend/src/pages/GamePage.tsx` and `frontend/src/styles/app.css`

- [X] T010 [US3] Wire GuessForm to call roomStore.submitGuess, display error messages for empty/too-long guesses in `frontend/src/components/GuessForm.tsx`
- [X] T011 [US3] Wire Scoreboard to render real scores from room data in `frontend/src/components/Scoreboard.tsx`

- [X] T012 [US4] Wire ResultPanel to render guess history from room data in `frontend/src/components/ResultPanel.tsx`

- [X] T013 Run `npm run build` in both `backend/` and `frontend/` — fix any build errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — already complete
- **Phase 2 (Foundational)**: Blocks ALL user stories
- **Phase 3 (US2)**: Depends on Phase 2 — auto-redirect uses store polling
- **Phase 4 (US1)**: Depends on Phase 2 — canvas uses API and store
- **Phase 5 (US3)**: Depends on Phase 2 — guess submission uses API and store
- **Phase 6 (US4)**: Depends on Phase 2 + Phase 5 — guess history depends on guesses existing
- **Phase 7 (Polish)**: Depends on all phases

### User Story Dependencies

- **US2 (P1)**: Independent — can start right after Phase 2
- **US1 (P1)**: Independent of US2/US3/US4 — can start right after Phase 2
- **US3 (P1)**: Independent of US1/US2 — can start right after Phase 2
- **US4 (P2)**: Depends on US3 (needs guesses to display)

### Within Each User Story

- Backend before frontend
- Models before services
- Services before routes
- API client before store
- Store before UI components

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T005 can run in parallel with T004 (independent frontend/backend)
- US1, US2, US3 can start in parallel after Phase 2
- US4 depends on US3 (needs guesses data)

---

## Parallel Example: User Story 1

```bash
# T008 and API/store wiring can be done concurrently:
Task: "Create Canvas component in components/Canvas.tsx"
Task: "Update GamePage to integrate canvas + polling"
```

## Parallel Example: Phase 2

```bash
# T001 and T002 are independent:
Task: "Add types in models/game.ts"
Task: "Add schemas in api/schemas.ts"
```

---

## Implementation Strategy

### Recommended Order

1. **Phase 2**: Complete all backend + frontend infrastructure
2. **Phase 3 (US2)**: Auto-redirect (small, quick win)
3. **Phase 4 (US1)**: Canvas drawing (core gameplay loop)
4. **Phase 5 (US3)**: Guess submission & scoring
5. **Phase 6 (US4)**: Guess history display
6. **Phase 7**: Build validation

### Incremental Delivery

1. Foundational complete → Backend fully ready, frontend can call all endpoints
2. US2 done → Players auto-navigate to game (Scenario 2 flow + redirect)
3. US1 done → Drawer draws, guessers see canvas (core visual gameplay)
4. US3 done → Full guess/score loop works
5. US4 done → History visible to all (complete feature)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
