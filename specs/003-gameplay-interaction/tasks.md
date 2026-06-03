# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/api.md](contracts/api.md) · [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no unsatisfied dependencies)
- **[US#]**: User story this task belongs to
- No test tasks — TDD not requested in spec

---

## Phase 1: Setup (Data Model Foundation)

**Purpose**: Add the new types and model fields that every subsequent phase depends on. Nothing else can be built until these types exist.

- [ ] T001 Add `Point`, `Stroke`, `Guess` types; extend `Room` with `strokes`, `guesses`, `scores`; extend `RoomSnapshot` with `strokes`, `guesses`, `scores` in `backend/src/models/game.ts`
- [ ] T002 [P] Add `Point`, `Stroke`, `Guess` types and extend `RoomSnapshot` interface with `strokes`, `guesses`, `scores` in `frontend/src/services/api.ts`

**Checkpoint**: Type definitions are in place. Both packages compile. No runtime logic yet.

---

## Phase 2: Foundational (Backend Services & Schemas)

**Purpose**: Initialize the new model fields in the backend and register Zod validation schemas for the two new endpoints. MUST be complete before any user-story route can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Extend `startRoom()` to initialise `strokes = []`, `guesses = []`, `scores = {[id]: 0, ...}` for all participants; extend `toRoomSnapshot()` to include `strokes`, `guesses`, `scores` when `status === "playing"` in `backend/src/services/roomStore.ts`
- [ ] T004 [P] Add `updateCanvasSchema` (`participantId`, `strokes`) and `submitGuessSchema` (`participantId`, `text`) Zod schemas in `backend/src/api/schemas.ts`

**Checkpoint**: A started room's snapshot now carries `strokes: []`, `guesses: []`, `scores: {...}`. Schemas validate both new request shapes. Backend tests (`npm test` in `backend/`) still pass.

---

## Phase 3: User Story 1 — Drawer Can Draw and Clear the Canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer gets an interactive canvas; strokes are saved server-side and synced to all participants via the existing 2-second poll.

**Independent Test**: Open two tabs. Start a game. In Tab A (drawer) drag on the canvas — stroke appears immediately. Within ≤2 s it appears (read-only) in Tab B. Click Clear in Tab A — canvas blanks immediately for drawer and within ≤2 s for guesser.

### Implementation for User Story 1

- [ ] T005 [US1] Implement `updateCanvas(code, participantId, strokes)` in `backend/src/services/roomStore.ts` — validate room exists and is `"playing"`, validate `participantId === currentDrawerId` (else 400), replace `room.strokes` wholesale, return updated snapshot
- [ ] T006 [US1] Add `PATCH /rooms/:code/canvas` route in `backend/src/api/rooms.ts` — parse with `updateCanvasSchema`, call `updateCanvas()`, return `{ room: snapshot }`
- [ ] T007 [P] [US1] Add `api.updateCanvas(code, participantId, strokes)` method to `frontend/src/services/api.ts`
- [ ] T008 [P] [US1] Create `DrawingCanvas.tsx` in `frontend/src/components/` — interactive freehand drawing for the drawer using pointer events (`pointerdown`, `pointermove`, `pointerup`/`pointerleave`), calls `api.updateCanvas()` directly on each `pointerup` (component owns the API call — no callback prop); read-only render (no pointer handlers) for non-drawers; re-renders by clearing the canvas and redrawing all strokes from scratch on each `strokes` prop update (wholesale redraw — no diffing, server state is authoritative)
- [ ] T009 [US1] Integrate `DrawingCanvas` into `GamePage.tsx` — render below the word block, pass `strokes={room.strokes ?? []}`, `isDrawer={participantId === room.currentDrawerId}`, `roomCode={room.code}`, `participantId={participantId}` (component calls `api.updateCanvas()` internally — no `onUpdate` prop needed); include a "Clear" button (visible to drawer only) that calls `api.updateCanvas(room.code, participantId, [])` directly in `GamePage`
- [ ] T010 [P] [US1] Add canvas styles (`.drawing-canvas`, `.drawing-canvas--readonly`, `.clear-button`) in `frontend/src/styles/app.css`

**Checkpoint**: User Story 1 is fully functional. Canvas draws, clears, and syncs across tabs within ≤2 s.

---

## Phase 4: User Story 2 — Guessers Submit Guesses and Receive Immediate Feedback (Priority: P1)

**Goal**: Guessers can submit words; empty submissions are rejected client-side; the guess is evaluated server-side (trim + case-insensitive match); the result is visible immediately in the submitter's UI without waiting for the next poll.

**Independent Test**: As a guesser submit " ROCKET " (correct word is "rocket") — result appears as correct immediately. Submit "" — rejected with a validation message before any network request. Submit "airplane" — recorded as incorrect immediately.

### Implementation for User Story 2

- [ ] T011 [US2] Implement `submitGuess(code, participantId, text)` in `backend/src/services/roomStore.ts` — validate room is `"playing"`, validate submitter ≠ `currentDrawerId` (else 400), trim `text`, reject empty (else 400), evaluate case-insensitively against `currentWord`, apply FR-019 (award 100 pts only once per guesser per round), append `Guess` to `room.guesses`, update `room.scores`, return the new `Guess` object
- [ ] T012 [US2] Add `POST /rooms/:code/guesses` route in `backend/src/api/rooms.ts` — parse with `submitGuessSchema`, call `submitGuess()`, return `{ guess }` with status 201
- [ ] T013 [P] [US2] Add `api.submitGuess(code, participantId, text)` method returning `{ guess: Guess }` in `frontend/src/services/api.ts`
- [ ] T014 [P] [US2] Update `GuessForm.tsx` — accept `roomCode`, `participantId` props; add client-side empty/whitespace validation with inline error message (no network call on invalid input); call `api.submitGuess()` on valid submit; display the returned `correct` flag as immediate local feedback (store result in `useState`); clear input on success
- [ ] T015 [US2] Integrate `GuessForm` in `GamePage.tsx` — render only when `participantId !== room.currentDrawerId`; pass `roomCode={room.code}`, `participantId={participantId}`

**Checkpoint**: User Story 2 is fully functional. Correct/incorrect feedback is instant. Empty guesses are rejected before the network. The drawer sees no guess form.

---

## Phase 5: User Story 3 — Guess History Is Shared with All Players via Polling (Priority: P1)

**Goal**: All submitted guesses are visible to every participant (drawer and guessers) in chronological order, synced via the 2-second poll. Correct guesses are visually distinguished.

**Independent Test**: Two tabs. Guesser submits "airplane" (wrong) then "rocket" (correct). Both guesses appear in both tabs within ≤2 s. "rocket" is visually distinct (e.g., different colour or label) from "airplane".

### Implementation for User Story 3

- [ ] T016 [P] [US3] Update `ResultPanel.tsx` — accept `guesses: Guess[]` and `participants: Participant[]` props; render each guess as a list item showing the submitter's name (resolved from `participants` by `participantId`), guess text, and a correct/incorrect indicator; correct guesses styled differently; empty state shown when `guesses.length === 0`
- [ ] T017 [P] [US3] Add guess history styles (`.guess-list`, `.guess-list__item`, `.guess-list__item--correct`, `.guess-list__item--incorrect`, `.guess-list__empty`) in `frontend/src/styles/app.css`
- [ ] T018 [US3] Wire `ResultPanel` into `GamePage.tsx` — pass `guesses={room.guesses ?? []}` and `participants={room.participants}`

**Checkpoint**: User Story 3 is fully functional. Guess history updates on both tabs within ≤2 s. Correct guesses are visually distinguishable.

---

## Phase 6: User Story 4 — Scores Update When a Correct Guess Is Made (Priority: P2)

**Goal**: A live scoreboard shows every participant's current score (all start at 0). Scores increment by 100 on a correct guess and are synced to all participants via the 2-second poll.

**Independent Test**: Two tabs. Scores both show 0 at round start. Guesser submits correct word — guesser's score becomes 100 on both tabs within ≤2 s. Guesser submits correct word again — score stays 100 (FR-019).

### Implementation for User Story 4

- [ ] T019 [P] [US4] Update `Scoreboard.tsx` — accept `participants: Participant[]` and `scores: Record<string, number>` props; render each participant's name and current score; sorted by score descending
- [ ] T020 [P] [US4] Add scoreboard styles (`.scoreboard__row`, `.scoreboard__name`, `.scoreboard__score`) in `frontend/src/styles/app.css`
- [ ] T021 [US4] Wire `Scoreboard` into `GamePage.tsx` — pass `participants={room.participants}` and `scores={room.scores ?? {}}`

**Checkpoint**: User Story 4 is fully functional. Scoreboard reflects current scores on all tabs within ≤2 s. Repeated correct guesses don't double-award points.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Confirm all pre-existing tests still pass, run the manual quickstart verification, and verify CSS is consistent.

- [ ] T022 [P] Run `cd backend && npm test` — all pre-existing tests (16 backend tests) must pass; fix any regressions
- [ ] T023 [P] Run `cd frontend && npm test` — all pre-existing tests (5 frontend tests) must pass; fix any regressions
- [ ] T024 Follow `specs/003-gameplay-interaction/quickstart.md` 6-step manual verification with two browser tabs; confirm all 6 steps pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)         → no dependencies; start immediately
Phase 2 (Foundational)  → requires Phase 1 complete; BLOCKS all user stories
Phase 3 (US1 Canvas)    → requires Phase 2 complete
Phase 4 (US2 Guesses)   → requires Phase 2 complete; can run in parallel with Phase 3
Phase 5 (US3 History)   → requires Phase 4 backend complete (T011, T012) for guesses to exist; T016/T017 can be built earlier
Phase 6 (US4 Scoring)   → requires Phase 4 backend complete (T011, T012) for scores to be updated; T019/T020 can be built earlier
Phase 7 (Polish)        → requires all prior phases complete
```

### User Story Dependencies

| Story         | Depends On              | Notes                                                       |
| ------------- | ----------------------- | ----------------------------------------------------------- |
| US1 (Canvas)  | Foundational            | Independent of US2/US3/US4                                  |
| US2 (Guesses) | Foundational            | Independent of US1/US3/US4                                  |
| US3 (History) | US2 backend (T011–T012) | Display component (T016–T017) can be built before T011–T012 |
| US4 (Scoring) | US2 backend (T011–T012) | Display component (T019–T020) can be built before T011–T012 |

### Parallel Opportunities Per Phase

**Phase 1**: T001 ‖ T002  
**Phase 2**: T003 ‖ T004  
**Phase 3 (US1)**: T007 ‖ T008 ‖ T010 (after T005–T006 done)  
**Phase 4 (US2)**: T013 ‖ T014 (after T011–T012 done)  
**Phase 5 (US3)**: T016 ‖ T017  
**Phase 6 (US4)**: T019 ‖ T020  
**Phase 7**: T022 ‖ T023

> ⚠️ **Note**: T009, T015, T018, and T021 all modify `GamePage.tsx` and MUST run sequentially (not in parallel).

---

## Implementation Strategy

### MVP First (User Stories 1 + 2, minimum playable game)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: US1 Canvas (T005–T010)
4. Complete Phase 4: US2 Guess Submission (T011–T015)
5. **STOP and VALIDATE**: drawer draws, guesser guesses with immediate feedback — core loop works
6. Add Phase 5: US3 Guess History → shared visibility
7. Add Phase 6: US4 Scoring → competitive dimension
8. Phase 7: Polish

### Incremental Delivery

- **After Phase 3**: Drawer can draw and clear; strokes sync to guessers ✅
- **After Phase 4**: Guessers can submit; instant feedback; scoring computed ✅
- **After Phase 5**: Full guess history visible to all; synced via poll ✅
- **After Phase 6**: Live scoreboard; 100-pt awards capped per guesser per round ✅
