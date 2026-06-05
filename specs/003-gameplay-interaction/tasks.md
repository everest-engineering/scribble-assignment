---
description: "Task list for Gameplay Interaction (Scenario 3)"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Scenario prerequisites**: `001-scribble-game` and `002-game-start-drawer` fully implemented.

**Tests**: Not requested — manual two-tab validation per `quickstart.md`.

**Organization**: Tasks follow data-flow order: model → service → route → frontend types
→ frontend store → frontend UI. US1 (canvas drawing) establishes polling and canvas
infrastructure that all later stories depend on.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1–US5)
- Exact file paths in every description

---

## Phase 1: Setup

**Purpose**: Confirm Scenarios 1 and 2 pass as the baseline.

- [x] T001 Start both servers, complete a full Scenario 2 flow (create room → join → start game → verify drawer sees word, guesser does not) — both scenarios must pass before Scenario 3 work begins

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend shared types and initialise game-round state — required before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `Point` (`{x: number; y: number}`), `Stroke` (`Point[]`), and `Guess` (`{participantId, text, isCorrect, submittedAt}`) type exports; extend `Room` with `canvasStrokes?: Point[][]`, `guesses?: Guess[]`, `scores?: Record<string, number>`; extend `RoomSnapshot` with the same three optional fields — in `backend/src/models/game.ts`
- [x] T003 [P] Export `Point`, `Stroke`, `Guess` types; add `canvasStrokes?: Point[][]`, `guesses?: Guess[]`, `scores?: Record<string, number>` to `RoomSnapshot` — in `frontend/src/services/api.ts`
- [x] T004 In `startRoom()` in `backend/src/services/roomStore.ts`, after setting `room.drawerId` and `room.currentWord`, add: `room.canvasStrokes = []`, `room.guesses = []`, `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))`; in `toRoomSnapshot()`, spread `canvasStrokes`, `guesses`, and `scores` from the room unconditionally when they are defined

**Checkpoint**: Types compiled; startRoom() returns canvasStrokes/guesses/scores in snapshot.

---

## Phase 3: User Story 1 — Drawing Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer draws on a canvas; all players see the same drawing via polling.
Guessers cannot draw.

**Independent Test**: Draw strokes in the drawer tab. Within ~2 s, the guesser tab shows
the same drawing. Attempting to draw in the guesser tab produces no strokes.

### Implementation for User Story 1

- [x] T005 [US1] Add `strokeSchema = z.object({ participantId: z.string().min(1), points: z.array(z.object({ x: z.number(), y: z.number() })).min(1) })` to `backend/src/api/schemas.ts`
- [x] T006 [US1] Add `addStroke(code, participantId, points)` to `backend/src/services/roomStore.ts`: get room (404 if missing), validate `room.status === "active"` (400 if not), validate `participantId === room.drawerId` (403 if not), push `points` to `room.canvasStrokes`, call `saveRoom`; return `{ ok: true }`
- [x] T007 [US1] Add `POST /rooms/:code/stroke` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `strokeSchema`, call `addStroke(code.toUpperCase(), participantId, points)`, respond 200 `{ ok: true }`
- [x] T008 [P] [US1] Add `addStroke(code, participantId, points)` to the `api` object in `frontend/src/services/api.ts`: POST to `/rooms/:code/stroke` with `{ participantId, points }`, return `{ ok: boolean }`
- [x] T009 [US1] Add `async addStroke(points)` method to `RoomStore` in `frontend/src/state/roomStore.ts`: call `api.addStroke(this.state.room.code, this.state.participantId, points)` (no loading state — fire-and-forget is fine for stroke sends)
- [x] T010 [US1] In `frontend/src/pages/GamePage.tsx`: (a) add polling `useEffect` (~2 000 ms, calls `roomStore.fetchRoom()` with try/catch, clears error on success); (b) replace the canvas placeholder `<div>` with an HTML5 `<canvas ref={canvasRef}>` element; (c) for the drawer, attach `onMouseDown`/`onMouseMove`/`onMouseUp` handlers that accumulate `{x,y}` points from the event relative to the canvas bounding rect, then on `mouseUp` call `roomStore.addStroke(currentPoints)` and reset the buffer; (d) in a `useEffect` watching `room?.canvasStrokes`, clear the canvas (`ctx.clearRect`) and replay all strokes using `ctx.beginPath` / `moveTo` / `lineTo` / `stroke` — guessers only see this replay path, never have event listeners attached

**Checkpoint**: Strokes visible across both tabs within ~2 s.

---

## Phase 4: User Story 2 — Clear Canvas (Priority: P1)

**Goal**: The drawer can clear the canvas; the blank canvas propagates to all players via
polling.

**Independent Test**: Drawer draws something, clicks Clear Canvas — guesser tab shows
blank within ~2 s. Guesser tab has no Clear Canvas button.

### Implementation for User Story 2

- [x] T011 [US2] Add `clearCanvasSchema = z.object({ participantId: z.string().min(1) })` to `backend/src/api/schemas.ts`
- [x] T012 [US2] Add `clearCanvas(code, participantId)` to `backend/src/services/roomStore.ts`: get room (404), validate active (400), validate drawer (403), set `room.canvasStrokes = []`, call `saveRoom`; return `{ ok: true }`
- [x] T013 [US2] Add `POST /rooms/:code/clear` route to `backend/src/api/rooms.ts`: parse with `roomCodeParamsSchema` and `clearCanvasSchema`, call `clearCanvas`, respond 200 `{ ok: true }`
- [x] T014 [P] [US2] Add `clearCanvas(code, participantId)` to the `api` object in `frontend/src/services/api.ts`
- [x] T015 [US2] Add `async clearCanvas()` to `RoomStore` in `frontend/src/state/roomStore.ts`
- [x] T016 [US2] In `frontend/src/pages/GamePage.tsx`, below the canvas, render a **Clear Canvas** button only when `isDrawer`; on click call `roomStore.clearCanvas()`

**Checkpoint**: Clear Canvas button visible only in drawer tab; clears for both within ~2 s.

---

## Phase 5: User Story 3 — Guess Submission & Validation (Priority: P1)

**Goal**: Guessers submit guesses that are trimmed, validated, and case-insensitively
matched. Correct guesses score 100; incorrect score 0. Empty guesses are rejected.
Drawers cannot guess.

**Independent Test**: Submit `"  ROCKET  "` as guesser — appears as "rocket", marked
correct, score becomes 100. Submit blank — error message shown, no history entry. Drawer
has no guess form.

### Implementation for User Story 3

- [x] T017 [US3] Add `guessSchema = z.object({ participantId: z.string().min(1), text: z.string().transform(s => s.trim()).pipe(z.string().min(1, "Guess cannot be empty")) })` to `backend/src/api/schemas.ts`
- [x] T018 [US3] Add `submitGuess(code, participantId, text)` to `backend/src/services/roomStore.ts`: get room (404), validate active (400), validate NOT drawer (403), build `Guess` with `isCorrect = text.toLowerCase() === room.currentWord?.toLowerCase()`, push to `room.guesses`, if `isCorrect` set `room.scores[participantId] = (room.scores[participantId] ?? 0) + 100`, call `saveRoom`; return the `Guess`
- [x] T019 [US3] Add `POST /rooms/:code/guess` route to `backend/src/api/rooms.ts`: parse with `roomCodeParamsSchema` and `guessSchema`, call `submitGuess(code.toUpperCase(), participantId, text)`, respond 200 `{ guess }`
- [x] T020 [P] [US3] Add `submitGuess(code, participantId, text)` to the `api` object in `frontend/src/services/api.ts`
- [x] T021 [US3] Add `async submitGuess(text)` to `RoomStore` in `frontend/src/state/roomStore.ts`: call `api.submitGuess(room.code, participantId, text)` inside `withLoading`; after success call `roomStore.fetchRoom()` to update snapshot
- [x] T022 [US3] Implement `GuessForm` in `frontend/src/components/GuessForm.tsx`: read `{ room, participantId }` from `useRoomState()`; derive `isDrawer = participantId === room?.drawerId`; if `isDrawer`, render nothing; otherwise render an input + Submit button; `handleSubmit`: trim the value, if empty set local error "Guess cannot be empty" and return early, otherwise call `roomStore.submitGuess(trimmedValue)` and clear the input on success

**Checkpoint**: Correct guess scores 100, incorrect scores 0, blank is rejected. Drawer
sees no form.

---

## Phase 6: User Story 4 — Guess History Sync (Priority: P1)

**Goal**: All players see the full guess history in submission order. Correct guesses are
visually distinguished. History is kept in sync via the existing polling loop.

**Independent Test**: Submit three guesses. Both tabs show all three in order, with the
correct guess styled differently, within ~2 s.

### Implementation for User Story 4

- [x] T023 [US4] In `frontend/src/components/ResultPanel.tsx`, read `{ room }` from `useRoomState()`; render `room?.guesses` as an ordered list; each entry shows the guesser's display name (looked up from `room.participants`), guess text, and a "✓ Correct" or "✗ Wrong" label; if no guesses yet, show "No guesses yet."

**Checkpoint**: History visible on both tabs in submission order; correct/incorrect
visually distinct.

---

## Phase 7: User Story 5 — Scoring (Priority: P1)

**Goal**: All scores start at 0 on game start. Scores update after correct guesses and
are visible to all players on the scoreboard.

**Independent Test**: On game start, all scores are 0. After a correct guess, the
guesser's score shows 100 on both tabs within ~2 s.

### Implementation for User Story 5

- [x] T024 [US5] In `frontend/src/components/Scoreboard.tsx`, read `{ room }` from `useRoomState()`; render `room?.scores` as a list of player name + score pairs (look up names from `room.participants`); if scores not yet available, show "Waiting for game to start."

**Checkpoint**: Scoreboard shows 0 for all on game start; updates to 100 after correct
guess.

---

## Phase 8: Polish & Validation

**Purpose**: End-to-end verification and build confirmation.

- [x] T025 Walk through all five scenarios in `specs/003-gameplay-interaction/quickstart.md` with two browser tabs — all acceptance scenarios must pass
- [x] T026 [P] Run `cd backend && npm run build` — must exit 0 with no TypeScript errors
- [x] T027 [P] Run `cd frontend && npm run build` — must exit 0 with no TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Scenarios 1+2 green — blocks all
- **Foundational (Phase 2)**: T002+T003 parallel; T004 sequential after (same file as earlier tasks); blocks all user stories
- **US1 (Phase 3)**: Depends on Phase 2; T005→T007 backend, T008→T010 frontend (T008 [P] with T005–T007)
- **US2 (Phase 4)**: Depends on Phase 2; independent of US1 (different service function); T011→T013 backend, T014→T016 frontend
- **US3 (Phase 5)**: Depends on Phase 2; T017→T019 backend, T020→T022 frontend
- **US4 (Phase 6)**: Depends on US3 (needs guesses stored and polled)
- **US5 (Phase 7)**: Depends on Phase 2 + US3 (scores set in startRoom/submitGuess)
- **Polish (Phase 8)**: All phases complete

### Parallel Opportunities

```bash
# Phase 2
T002  # backend/src/models/game.ts
T003  # frontend/src/services/api.ts

# Within US1/US2/US3 — frontend api.ts can be done while backend route is built
T008  # frontend/src/services/api.ts  [P] with T005–T007
T014  # frontend/src/services/api.ts  [P] with T011–T013
T020  # frontend/src/services/api.ts  [P] with T017–T019

# Phase 8: builds
T026  # backend build
T027  # frontend build
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phases 1–2 → baseline + types
2. T005–T010 (US1) → drawer draws, guesser sees
3. **STOP and VALIDATE**: drawing visible in both tabs

### Full Delivery

1. Phases 1–2 → foundation
2. US1 → drawing canvas + polling
3. US2 → clear canvas
4. US3 → guess submission + scoring logic
5. US4 → history rendered
6. US5 → scoreboard rendered
7. Phase 8 → full validation + builds

---

## Notes

- T010 is the most complex single task — it combines polling, canvas element, mouse
  event listeners, and stroke replay; split into sub-steps if needed during implementation
- T004 touches `roomStore.ts` (foundational init); T006, T012, T018 also touch the
  same file — run them sequentially within their phases
- The polling `useEffect` added in T010 covers US3, US4, US5 display updates too —
  no additional polling needed for later stories
- `GuessForm` currently has an empty handler; T022 replaces it with real logic
- `Scoreboard` and `ResultPanel` currently show hardcoded placeholders; T024 and T023
  replace them with live data
