# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm starting state before making any changes

- [ ] T001 Confirm both TypeScript builds pass on the current branch: run `npm run build` in `backend/` and `frontend/`; document any pre-existing errors before proceeding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared type definitions and server-side model that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add `Point` and `Guess` interfaces to `backend/src/models/game.ts` (see data-model.md for field definitions)
- [ ] T003 [P] Add `Point` and `Guess` types to `frontend/src/services/api.ts`; extend the existing `RoomSnapshot` interface with `guesses: Guess[]`, `scores: Record<string, number>`, `strokes: Point[][]`
- [ ] T004 Extend the `Room` interface in `backend/src/models/game.ts` with `guesses: Guess[]`, `scores: Record<string, number>`, `strokes: Point[][]` (depends on T002)
- [ ] T005 Extend the `RoomSnapshot` interface in `backend/src/models/game.ts` with `guesses: Guess[]`, `scores: Record<string, number>`, `strokes: Point[][]` (depends on T004)
- [ ] T006 [P] Add `guessSchema` (`{ playerName, guess }`) and `strokeSchema` (`{ points: [{x,y}] }`) to `backend/src/api/schemas.ts` (parallel with T004–T005; different file)
- [ ] T007 Update `startGame` in `backend/src/services/roomStore.ts` to initialise `guesses: []`, `scores: {}`, `strokes: []` on the room before saving (depends on T004)
- [ ] T008 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `guesses`, `scores`, and `strokes` from the room in the returned snapshot (depends on T005, T007)

**Checkpoint**: Both builds must pass with no type errors before proceeding to user story phases.

---

## Phase 3: User Story 1 — Drawer Draws on Canvas (Priority: P1) 🎯 MVP

**Goal**: Replace the canvas placeholder div with a functional freehand drawing surface for the drawer; strokes are stored server-side so they can later be synced to guessers.

**Independent Test**: Open the Game screen as the drawer. Press and drag the mouse on the canvas; a freehand line appears. Release and drag again; a new stroke begins. Click "Clear"; all lines disappear. Verify `POST /rooms/:code/stroke` is called after each `mouseup` and `POST /rooms/:code/clear` is called on "Clear" click.

- [ ] T009 [P] [US1] Add `addStroke(code: string, points: Point[])` and `clearStrokes(code: string)` service functions to `backend/src/services/roomStore.ts`; `addStroke` appends to `room.strokes`, `clearStrokes` resets `room.strokes` to `[]`; both reject with `HttpError(404)` if room not found and `HttpError(400)` if room is not in `"playing"` state
- [ ] T010 [P] [US1] Create `frontend/src/components/DrawingCanvas.tsx`: a `<canvas>` element that handles `mousedown`/`mousemove`/`mouseup` events for freehand drawing, calls `onStrokeComplete(points: Point[])` on `mouseup`, accepts `strokes: Point[][]` prop to redraw the canvas from a server-provided stroke list, and exposes a `readOnly` prop that disables mouse event handling for guessers
- [ ] T011 [US1] Add `POST /:code/stroke` and `POST /:code/clear` routes to `backend/src/api/rooms.ts`, using `strokeSchema` (from T006) and the `addStroke`/`clearStrokes` service functions (from T009) respectively (depends on T009, T006)
- [ ] T012 [P] [US1] Add `api.addStroke(code: string, points: Point[])` and `api.clearStrokes(code: string)` to `frontend/src/services/api.ts` (parallel with T009–T011; different file; depends on T003 for types)
- [ ] T013 [US1] Add `addStroke(points: Point[])` and `clearStrokes()` action methods to `frontend/src/state/roomStore.ts`; each method reads `this.state.room.code` and delegates to `api.addStroke` / `api.clearStrokes` (depends on T012)
- [ ] T014 [US1] In `frontend/src/pages/GamePage.tsx`, replace the `canvas-placeholder` div with `<DrawingCanvas>`; wire `onStrokeComplete` to `store.addStroke()` and `onClear` to `store.clearStrokes()`; add a "Clear" button below the canvas; compute `isDrawer = viewer?.name === room.drawerName` to pass `readOnly={!isDrawer}` and show the "Clear" button only when `isDrawer` (depends on T010, T013)

**Checkpoint**: Drawer draws and clears; network calls visible in DevTools; both builds pass.

---

## Phase 4: User Story 2 — Guesser Submits a Guess (Priority: P2)

**Goal**: Wire the existing `GuessForm` to call `POST /rooms/:code/guess`; validate and score guesses server-side; store the result in `room.guesses` and update `room.scores`.

**Independent Test**: In a two-tab session, the guesser types "Rocket" and submits; the API returns `{ guess: { correct: true, points: 100 } }`. Submitting whitespace returns HTTP 400. Submitting "pizza" returns `{ guess: { correct: false, points: 0 } }`.

- [ ] T015 [US2] Add `submitGuess(code: string, playerName: string, guess: string)` to `backend/src/services/roomStore.ts`: trim the guess, reject with `HttpError(400, "Guess cannot be empty")` if blank, compare trimmed guess case-insensitively to `room.secretWord`, compute `correct` and `points` (100 / 0), create a `Guess` record with fields `{ playerName, text: trimmedGuess, correct, points, submittedAt: new Date().toISOString() }`, append to `room.guesses`, update `room.scores[playerName]`, and save the room (depends on T004, T007)
- [ ] T016 [US2] Add `POST /:code/guess` route to `backend/src/api/rooms.ts` using `guessSchema` (from T006) and `submitGuess` (from T015); respond with `{ guess: Guess }` (depends on T015, T006)
- [ ] T017 [P] [US2] Add `api.submitGuess(code: string, playerName: string, guess: string)` returning `{ guess: Guess }` to `frontend/src/services/api.ts` (parallel with T015–T016; different file; depends on T003)
- [ ] T018 [US2] Add `submitGuess(playerName: string, guess: string)` action to `frontend/src/state/roomStore.ts`; delegates to `api.submitGuess` using `this.state.room.code` (depends on T017)
- [ ] T019 [US2] Update `frontend/src/components/GuessForm.tsx` to accept an `onSubmit(guess: string): void` prop and call it on form submit with the current input value (clearing the field afterwards); in `frontend/src/pages/GamePage.tsx`, render `<GuessForm>` only when `!isDrawer` and pass `onSubmit={(guess) => store.submitGuess(viewer!.name, guess)}` (depends on T014 for `isDrawer`, T018)

**Checkpoint**: Guesser submits guesses; correct/incorrect scoring verified in DevTools; empty guess rejected; both builds pass.

---

## Phase 5: User Story 3 — All Players See Guess History, Scores, and Canvas via Polling (Priority: P3)

**Goal**: Wire 2-second polling in `GamePage`; update `Scoreboard` to show live scores; display guess history; redraw the guesser's canvas from server-supplied strokes on each cycle.

**Independent Test**: Drawer draws a line — within 2 seconds the guesser's canvas shows it. Guesser submits a correct guess — within 2 seconds both tabs show the updated score and guess history entry.

- [ ] T020 [US3] In `frontend/src/pages/GamePage.tsx`, add a `useEffect` that calls `store.pollRoom()` on a 2-second `setInterval` and clears the interval on unmount; verify subsequent renders receive updated `room.guesses`, `room.scores`, and `room.strokes` from the store (depends on T014, T019)
- [ ] T021 [P] [US3] Update `frontend/src/components/Scoreboard.tsx` to accept `scores: Record<string, number>` and `participants: Participant[]` props; render one row per participant showing their name and current score (0 if absent from scores); pass `room.scores` and `room.participants` from `GamePage.tsx` (parallel with T022; different component file; depends on T003)
- [ ] T022 [US3] Add a guess history section to `frontend/src/pages/GamePage.tsx` that renders `room.guesses` in submission order, showing guesser name, guess text, and points for each entry; render an empty state message when `room.guesses` is empty; also pass `room.scores` and `room.participants` as props to `<Scoreboard>` so live scores are displayed (depends on T020, T021; same file — do after T020)
- [ ] T023 [US3] In `frontend/src/pages/GamePage.tsx`, pass `room.strokes` as the `strokes` prop to the guesser's `<DrawingCanvas readOnly>` so the canvas redraws from the latest server stroke list on each polling cycle (depends on T020, T010; same file — do after T022)

**Checkpoint**: All four polling-sync scenarios in quickstart.md pass in two browser tabs; both builds pass.

---

## Phase 6: User Story 4 — Role-Appropriate Game Screen Views (Priority: P4)

**Goal**: Confirm the GamePage conditional rendering is fully correct: drawer sees interactive canvas + clear button + secret word; guesser sees read-only canvas + guess form; neither sees the other's elements.

**Independent Test**: Open two tabs after game start. Tab A (drawer): canvas interactive, "Clear" visible, secret word visible, no guess input. Tab B (guesser): canvas read-only (drawing disabled), guess input visible, no secret word.

- [ ] T024 [US4] In `frontend/src/pages/GamePage.tsx`, verify all role gates are in place: `isDrawer = viewer?.name === room.drawerName`; "Clear" button only when `isDrawer`; `DrawingCanvas readOnly={!isDrawer}`; `GuessForm` only when `!isDrawer`; secret word display in the Player Info card only when `room.secretWord` is present (server already omits it for guessers — no additional client guard needed); cross-check all four acceptance scenarios from US4 in quickstart.md (depends on T020, T021, T022, T023)

**Checkpoint**: quickstart.md Scenario 6 passes; both builds pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T025 [P] Run `npm run build` in both `backend/` and `frontend/`; confirm zero TypeScript errors and no uses of `any` without documented justification
- [ ] T026 [P] Run all seven validation scenarios from `specs/003-gameplay-interaction/quickstart.md` in two browser tabs and confirm all pass
- [ ] T027 Review all new and modified files for out-of-scope additions (no new npm top-level dependencies, no WebSockets, no authentication, no persistence); confirm each commit maps to a task ID

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user story phases**
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational completion; shares `GamePage.tsx` with US1 so T019 depends on T014
- **US3 (Phase 5)**: Depends on US1 + US2 completion (polling wires the canvas and guess form together)
- **US4 (Phase 6)**: Depends on US3 completion (all GamePage elements must be in place)
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational — no story dependencies
- **US2 (P2)**: Can start after Foundational; T019 depends on T014 (`isDrawer` flag from US1)
- **US3 (P3)**: Depends on US1 (strokes/canvas) and US2 (guesses/scores) both complete
- **US4 (P4)**: Depends on US3 (full GamePage assembled)

### Within Each Phase

- Models before services; services before routes; routes before frontend wiring
- Frontend component (T010) can be built in parallel with backend service (T009)
- Frontend api.ts additions (T012, T017) can be built in parallel with backend tasks

---

## Parallel Opportunities

### Foundational Phase

```
Parallel group A (can start together):
  T002 — add Point/Guess to backend models
  T003 — add Point/Guess/extend RoomSnapshot in frontend api.ts

Sequential after T002:
  T004 → T005 → T007 → T008  (all backend/src/models or roomStore.ts)

Parallel with T004–T008:
  T006 — schemas.ts (different file)
```

### US1 Phase

```
Parallel group (can start together after Foundational):
  T009 — backend addStroke/clearStrokes service
  T010 — frontend DrawingCanvas component
  T012 — frontend api.ts addStroke/clearStrokes

Sequential:
  T011 (depends on T009, T006)
  T013 (depends on T012)
  T014 (depends on T010, T013)
```

### US2 Phase

```
Parallel group (can start after Foundational):
  T015 — backend submitGuess service
  T017 — frontend api.ts submitGuess

Sequential:
  T016 (depends on T015, T006)
  T018 (depends on T017)
  T019 (depends on T014, T018)
```

### US3 Phase

```
Parallel:
  T021 — Scoreboard component (different file)

Sequential (all touch GamePage.tsx):
  T020 → T022 → T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T008)
3. Complete Phase 3: US1 (T009–T014)
4. **STOP and VALIDATE**: Drawer canvas draws and syncs; quickstart Scenarios 1 and 2 pass
5. Continue to US2 when ready

### Incremental Delivery

1. Setup + Foundational → type-safe baseline; both builds pass
2. US1 → drawer draws; strokes reach server → quickstart Scenarios 1–2 pass
3. US2 → guessers submit guesses; scoring works → quickstart Scenarios 3–5 pass
4. US3 → full polling sync across tabs → quickstart Scenarios 2–5 pass end-to-end
5. US4 → role gates confirmed → quickstart Scenario 6 passes
6. Polish → all seven quickstart scenarios pass; clean builds

---

## Notes

- **[P]** tasks touch different files and have no dependency on concurrent in-progress tasks
- **[Story]** labels map each task to a specific user story for traceability back to spec.md
- Verify both TypeScript builds pass (`npm run build`) before marking any task done (constitution §V)
- Validate each story's acceptance scenarios with two browser tabs before moving to the next story
- Each commit should reference the task ID (e.g., `T009: add addStroke/clearStrokes to roomStore`)
- No `any` types without documented justification; no new top-level npm dependencies
