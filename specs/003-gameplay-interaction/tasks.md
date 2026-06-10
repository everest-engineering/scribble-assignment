---
description: "Task list for Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US3)

---

## Phase 1: Foundational

**Purpose**: Extend the data model and room store — all user stories depend on this.

- [x] T001 Add `Guess` interface (`participantId`, `text`, `isCorrect`, `submittedAt`) to `backend/src/models/game.ts`
- [x] T002 Add `scores: Record<string, number>` and `guesses: Guess[]` to `Room` interface in `backend/src/models/game.ts`
- [x] T003 Add `scores: Record<string, number>` and `guesses: Guess[]` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T004 [P] Add `Guess` interface and extend `RoomSnapshot` with `scores` and `guesses` in `frontend/src/services/api.ts`
- [x] T005 Initialize `scores` (all participants set to `0`) and `guesses` (`[]`) in `startGame()` in `backend/src/services/roomStore.ts`
- [x] T006 Extend `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to always include `scores` and `guesses` in the returned snapshot
- [x] T007 [P] Add unit tests for `startGame()` score/guess initialization and `toRoomSnapshot()` returning `scores` + `guesses` in `backend/src/services/roomStore.test.ts`

**Checkpoint**: `npm test` in backend passes. `POST /api/rooms/:code/start` response includes `scores: { [id]: 0, ... }` and `guesses: []`. `GET /api/rooms/:code?participantId=<id>` also returns these fields.

---

## Phase 2: User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1)

**Goal**: The drawer has a functional HTML5 canvas with draw and clear capabilities on the game screen.

**Independent Test**: Open the game as the drawer. Draw lines on the canvas — confirm the drawing appears. Click Clear — confirm the canvas is blank. No backend changes are needed to validate this story.

- [x] T008 [US1] Create `DrawingCanvas` component in `frontend/src/components/DrawingCanvas.tsx` — HTML5 `<canvas>` with `pointerdown`/`pointermove`/`pointerup` draw handlers, a "Clear" button that calls `ctx.clearRect()`, `aria-label="Drawing canvas"` on the canvas element, and `role="button"` + `onKeyDown` support on the Clear button for WCAG 2.1 AA keyboard accessibility
- [x] T009 [US1] Replace the canvas placeholder `<div>` in `frontend/src/pages/GamePage.tsx` with `<DrawingCanvas />` rendered when `isDrawer`; show a static `<p>Waiting for drawer...</p>` for guessers in the same slot

**Checkpoint**: Drawer tab renders a white canvas they can draw on and clear. Guesser tab shows the "Waiting for drawer..." message. No regressions on role badge, secret word display, or participant list.

---

## Phase 3: User Story 2 — Guesser Submits a Guess (Priority: P1)

**Goal**: Guessers can submit guesses; empty inputs are rejected; correct guesses award 100 points server-side.

**Independent Test**: As guesser, submit whitespace — expect rejection. Submit "ROCKET" (uppercase) when secret word is "rocket" — expect score increases from 0 to 100. Submit "pizza" — expect score stays at 100 and guess is recorded.

- [x] T010 Add `submitGuessSchema` to `backend/src/api/schemas.ts` — `z.object({ participantId: z.string(), text: z.string().trim().min(1, "Guess cannot be empty.") })`
- [x] T011 Add `submitGuess(code: string, participantId: string, text: string)` to `backend/src/services/roomStore.ts` — validates room is `active`, trims text, compares `text.toLowerCase() === room.secretWord!.toLowerCase()`, sets `isCorrect`, increments `scores[participantId]` by 100 if correct (initializes to 0 if missing), appends `Guess` to `room.guesses`, returns `{ guess, scoreAwarded, snapshot }`
- [x] T012 [P] Add unit tests for `submitGuess()` in `backend/src/services/roomStore.test.ts` — cover: empty/whitespace rejection, correct guess (case-insensitive: "ROCKET", "Rocket", "rocket"), incorrect guess (0 points, still recorded), score accumulates across multiple correct guesses
- [x] T013 [US2] Add `POST /:code/guess` route in `backend/src/api/rooms.ts` — parse `submitGuessSchema` from `request.body`, call `submitGuess()`, return `{ guess, scoreAwarded, room: snapshot }` on success; 404 if room not found; 400 if room not active
- [x] T014 [P] [US2] Add `api.submitGuess(code: string, participantId: string, text: string)` method to `frontend/src/services/api.ts` — `POST /rooms/:code/guess` returning `{ guess: Guess, scoreAwarded: number, room: RoomSnapshot }`
- [x] T015 [US2] Add `submitGuess(text: string): Promise<void>` method to `RoomStore` in `frontend/src/state/roomStore.ts` — validates non-empty client-side, calls `api.submitGuess(room.code, participantId, text)`, calls `setRoomSnapshot(response.room)` on success, sets `error` on failure
- [x] T016 [US2] Wire `GuessForm` in `frontend/src/components/GuessForm.tsx` — call `useRoomStore().submitGuess(guessText)` on form submit; show inline error message if the store's `error` is set; clear the input on successful submission; disable the button while `isLoading`

**Checkpoint**: Guesser submits "" → validation message appears, no guess recorded. Submits "ROCKET" → score becomes 100 in the next poll. Submits "pizza" → score unchanged, guess appears in subsequent poll.

---

## Phase 4: User Story 3 — Guess History Visible to All Players (Priority: P2)

**Goal**: Scoreboard shows live scores; ResultPanel shows full guess history; both update via polling.

**Independent Test**: Two tabs open (drawer + guesser). Guesser submits a guess. Within ≤ 3 seconds, both tabs show the guess in the history. Both tabs show the updated score.

- [x] T017 [P] [US3] Update `Scoreboard` in `frontend/src/components/Scoreboard.tsx` — accept `room: RoomSnapshot` prop (or use `useRoomState()`), render a list of participant names with their score from `room.scores`; show "0" for participants not yet in the scores map; order by score descending
- [x] T018 [P] [US3] Update `ResultPanel` in `frontend/src/components/ResultPanel.tsx` — accept `room: RoomSnapshot` prop (or use `useRoomState()`), render `room.guesses` as a list showing guesser name (look up from `room.participants`), guess text, and a ✓/✗ indicator for `isCorrect`; newest guesses at the top; use semantic `<ul>/<li>` for screen-reader compatibility
- [x] T019 [US3] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to pass `room` to `<Scoreboard />` and `<ResultPanel />` now that both components consume live room data

**Checkpoint**: Drawer and guesser tabs both show updated scores and guess history within the 2-second polling interval after each guess. No regressions on canvas or guess submission.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T020 [P] Run `npm test` in `backend/` — confirm all tests pass including T007 and T012 assertions
- [x] T021 [P] Run `npm test` in `frontend/` — confirm no regressions in existing tests
- [x] T022 Verify `DrawingCanvas` Clear button is reachable by Tab key and activatable by Enter/Space in `frontend/src/components/DrawingCanvas.tsx` (WCAG 2.1 AA)
- [x] T023 Run Quickstart Scenarios A–E from `specs/003-gameplay-interaction/quickstart.md` manually to confirm all end-to-end paths work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Start immediately — blocks US2 and US3 (scores/guesses fields must exist before submitGuess or rendering)
- **US1 (Phase 2)**: Independent of Phase 1 — DrawingCanvas is pure frontend, no model changes needed; can run in parallel with Phase 1
- **US2 (Phase 3)**: Depends on Phase 1 (T001–T007) — submitGuess uses the Guess model and scores map
- **US3 (Phase 4)**: Depends on Phase 1 (scores/guesses in snapshot) and benefits from US2 being done (so there's data to display)
- **Polish (Phase 5)**: Depends on all user stories complete

### Parallel Opportunities

- T001–T003 (backend model) + T004 (frontend type) — different files, all parallelizable
- T005 + T006 — different functions in the same file; safe in sequence (T005 then T006)
- T007 (tests) — can start after T001–T006
- T008–T009 (US1 canvas) — completely independent of Phase 1; run in parallel
- T010 + T011 (schema + service) — T010 is self-contained; T011 can start after T001–T006
- T012 (tests) — parallel with T013–T016 if using separate test file
- T013 (route) — depends on T010 + T011
- T014 (frontend api) — independent of T010–T013; parallel
- T015 (store method) — depends on T014
- T016 (GuessForm) — depends on T015
- T017 + T018 (Scoreboard + ResultPanel) — different files, fully parallel
- T020 + T021 (tests) — different directories, parallel

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Foundational model + store changes
2. Complete Phase 2 (US1): Canvas — immediately valuable, zero backend risk
3. Complete Phase 3 (US2): Guess submission + scoring
4. **Stop and validate**: End-to-end guess flow works; scoreboard may still show placeholder
5. Optionally demo before adding guess history UI

### Incremental Delivery

1. Foundation → verified model + store
2. Add US1 (canvas) → drawer can draw
3. Add US2 (guessing) → full gameplay loop functional
4. Add US3 (history UI) → full scoreboard + activity feed

---

## Notes

- T008's `DrawingCanvas` is local-only — no canvas state is sent to the server or synced to guessers; this is by design per the spec assumptions
- T011's `submitGuess` initializes `scores[participantId]` to 0 if it was not set at `startGame()` time (defensive guard), though `startGame()` already handles initialization in T005
- T016's `GuessForm` should call `useRoomStore()` directly (consistent with how `GamePage` accesses store state) rather than receiving a prop callback — this avoids prop-drilling through `GamePage`
- T017's `Scoreboard` — if `useRoomState()` is used internally instead of a prop, no `GamePage` change is needed for that component (simplifies T019)
- T018's `ResultPanel` — same as T017; prefer `useRoomState()` to avoid prop-drilling, which eliminates most of T019's work
