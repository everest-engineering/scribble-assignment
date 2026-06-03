---
description: "Task list for Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the project runs cleanly before making changes.

- [x] T001 Start backend (`cd backend && npm run dev`) and confirm `GET /health` returns `{ "ok": true }`
- [x] T002 Start frontend (`cd frontend && npm run dev`) and confirm the app loads at `http://localhost:5173`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the data model and backend store with the three new fields (`strokes`, `guesses`, `scores`). All four user stories depend on this phase.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `Stroke` interface (`{ points: Array<{x: number; y: number}>; color: string; lineWidth: number }`) and `Guess` interface (`{ id: string; participantId: string; text: string; correct: boolean; submittedAt: string }`) to `backend/src/models/game.ts`; add `strokes: Stroke[]`, `guesses: Guess[]`, and `scores: Record<string, number>` to both `Room` and `RoomSnapshot` interfaces
- [x] T004 In `createRoom`, initialize `strokes: []`, `guesses: []`, `scores: {}`; in `toRoomSnapshot`, include `strokes: room.strokes`, `guesses: room.guesses`, `scores: room.scores` in the returned snapshot in `backend/src/services/roomStore.ts`
- [x] T005 In the `startRoom` handler, after setting `room.status = "active"`, reset `room.strokes = []`, `room.guesses = []`, and initialize `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))` in `backend/src/api/rooms.ts`
- [x] T006 [P] Add `Stroke` and `Guess` types and add `strokes: Stroke[]`, `guesses: Guess[]`, `scores: Record<string, number>` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Run `npm run build` in `backend/` — TypeScript must compile with zero errors before proceeding. Confirm `GET /rooms/:code` response includes `"strokes": []`, `"guesses": []`, `"scores": {}` on a newly created room.

---

## Phase 3: User Story 1 — Interactive Drawing Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw strokes on a canvas and clear it. All players see the current canvas state refreshed via polling every ~2 seconds.

**Independent Test**: With two tabs — Tab A (drawer), Tab B (guesser) — Tab A draws a stroke and it appears on Tab B within ~2 seconds. Tab A clicks "Clear Canvas" and Tab B canvas clears within ~2 seconds. Tab B cannot draw.

### Implementation for User Story 1

- [x] T007 [US1] Add `strokeSchema` (`{ participantId: z.string(), stroke: { points: z.array(...), color: z.string().optional(), lineWidth: z.number().optional() } }`) and `clearSchema` (`{ participantId: z.string() }`) to `backend/src/api/schemas.ts`
- [x] T008 [US1] Add `POST /:code/stroke` handler (assert caller is drawer, append stroke to `room.strokes`, save, return snapshot) and `POST /:code/clear` handler (assert caller is drawer, set `room.strokes = []`, save, return snapshot) to `backend/src/api/rooms.ts`
- [x] T009 [P] [US1] Add `submitStroke(code: string, participantId: string, stroke: Stroke)` and `clearCanvas(code: string, participantId: string)` API methods to `frontend/src/services/api.ts`
- [x] T010 [P] [US1] Add `submitStroke(stroke: Stroke)` and `clearCanvas()` methods to the `RoomStore` class in `frontend/src/state/roomStore.ts`, each calling the corresponding API method and updating the room snapshot in store state
- [x] T011 [US1] Create `frontend/src/components/DrawingCanvas.tsx`: when `isDrawer` is true, render an interactive `<canvas>` with `onPointerDown`, `onPointerMove`, `onPointerUp` handlers that collect path points and call `store.submitStroke(stroke)` on pointer-up, plus a "Clear Canvas" button that calls `store.clearCanvas()`; when `isDrawer` is false, render a read-only `<canvas>` that uses `useEffect` to redraw all strokes in `room.strokes` whenever the prop changes (iterate strokes: `beginPath → moveTo(points[0]) → lineTo(...) → stroke()`)
- [x] T012 [US1] In `frontend/src/pages/GamePage.tsx`, replace the canvas placeholder `<div>` with `<DrawingCanvas room={room} isDrawer={isDrawer} store={roomStore} />`; add a `useEffect` with `setInterval` (~2000ms) that calls `roomStore.fetchRoom()` and is cleaned up on unmount — clears when `room` is null

**Checkpoint**: Drawer draws on Tab A; Tab B shows the same drawing within ~2s. Clear works on both tabs. Tab B canvas has no drawing controls.

---

## Phase 4: User Story 2 — Guess Submission & Validation (Priority: P1)

**Goal**: Guessers can submit trimmed, case-insensitively compared guesses. Empty guesses are rejected inline. Correct guesses show "Correct!", incorrect show "Incorrect". The drawer has no guess form.

**Independent Test**: In Tab B (guesser), submit blank guess — inline error, no record. Submit "ROCKET" — "Correct!" shown. Submit "pizza" — "Incorrect" shown. Tab A (drawer) has no guess input visible.

### Implementation for User Story 2

- [x] T013 [US2] Add `guessSchema` (`{ participantId: z.string(), text: z.string() }`) to `backend/src/api/schemas.ts`
- [x] T014 [US2] Add `POST /:code/guess` handler to `backend/src/api/rooms.ts`: parse with `guessSchema`; trim `text`; throw 400 if empty; throw 403 if `participantId === room.drawerId`; throw 403 if `room.guesses.some(g => g.participantId === participantId && g.correct)` (player already guessed correctly); compare `text.toLowerCase()` to `room.currentWord!.toLowerCase()` for correctness; create `Guess` object (`{ id: randomUUID(), participantId, text: trimmed, correct, submittedAt: now() }`); push to `room.guesses`; add `correct ? 100 : 0` to `room.scores[participantId]`; save; return `{ guess, room: toRoomSnapshot(updatedRoom, participantId) }`
- [x] T015 [P] [US2] Add `submitGuess(code: string, participantId: string, text: string)` API method returning `{ guess: Guess; room: RoomSnapshot }` to `frontend/src/services/api.ts`
- [x] T016 [P] [US2] Add `submitGuess(text: string)` method to `RoomStore` in `frontend/src/state/roomStore.ts`: trim text, call `api.submitGuess`, update store room snapshot, return the `Guess` result
- [x] T017 [US2] Rewrite `frontend/src/components/GuessForm.tsx`: accept `isDrawer: boolean`, `room: RoomSnapshot`, and `participantId: string` props; return `null` when `isDrawer` is true; derive `alreadyCorrect = room.guesses.some(g => g.participantId === participantId && g.correct)` — if true, render "You already guessed correctly!" and return (no form — handles session restore); add local state for `guessText` (string), `error` (string | null), `result` ("correct" | "incorrect" | null); on submit — trim, set error if empty, else call `roomStore.submitGuess(guessText)`, set `result` from returned guess's `correct` flag, clear `guessText` on success; if `result === "correct"`, show only "Correct!" (hide input and submit button); render input, inline error, and "Incorrect" message for incorrect submissions; update `<GuessForm>` call in `frontend/src/pages/GamePage.tsx` to pass `room={room}` and `participantId={participantId}` alongside `isDrawer`

**Checkpoint**: Tab B submits empty → inline error. Submits "ROCKET" → "Correct!". Submits "pizza" → "Incorrect". Tab A (drawer) has no form.

---

## Phase 5: User Story 3 — Synced Guess History (Priority: P2)

**Goal**: All players see a continuously updated list of all guesses submitted this round, with submitter name, guess text, and correct/incorrect label.

**Independent Test**: Tab B submits a correct and an incorrect guess. Both Tab A and Tab B show both guesses in the history list (name, text, outcome) within ~2 seconds.

### Implementation for User Story 3

- [x] T018 [US3] Rewrite `frontend/src/components/ResultPanel.tsx` to accept `guesses: Guess[]` and `participants: Participant[]` as props; render each `Guess` as `"{participantName}: {guess.text} — ✓ Correct"` or `"✗ Incorrect"` in submission order; render "No guesses yet" when the list is empty
- [x] T019 [US3] In `frontend/src/pages/GamePage.tsx`, import `Guess` from `api.ts`; pass `room.guesses` and `room.participants` as props to `<ResultPanel>`

**Checkpoint**: After any guess, all three tabs (drawer + 2 guessers) show the full guess history within ~2 seconds.

---

## Phase 6: User Story 4 — Score Tracking (Priority: P2)

**Goal**: All players see a scoreboard showing each participant's current score. Scores start at 0 and update after each guess.

**Independent Test**: Game starts — all scores show 0. Tab B submits correct guess — Tab B score shows 100 on all tabs within ~2 seconds. Tab B submits incorrect guess — score stays 100.

### Implementation for User Story 4

- [x] T020 [US4] Rewrite `frontend/src/components/Scoreboard.tsx` to accept `scores: Record<string, number>` and `participants: Participant[]` as props; render each participant as `"{name}: {score} pts"` sorted by score descending
- [x] T021 [US4] In `frontend/src/pages/GamePage.tsx`, pass `room.scores` and `room.participants` as props to `<Scoreboard>`

**Checkpoint**: Scoreboard shows all participants at 0 on game start. Updates correctly after correct and incorrect guesses. Consistent across all tabs within ~2 seconds.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and end-to-end acceptance check.

- [x] T022 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [x] T023 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [x] T024 Complete the full validation flow in `specs/003-gameplay-interaction/quickstart.md` using two browser tabs and confirm all 11 checks in the validation table pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)** and **US2 (Phase 4)**: Both depend on Foundational; can run in parallel once Phase 2 is complete (different files)
- **US3 (Phase 5)**: Depends on US2 (guess records exist to display)
- **US4 (Phase 6)**: Depends on US2 (scores updated by guesses)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2
- **US2 (P1)**: Can start after Phase 2 — no dependency on US1
- **US3 (P2)**: Depends on US2 — guess list is empty without submissions
- **US4 (P2)**: Depends on US2 — scores change only via correct guesses

### Within Each User Story

- Backend schemas before backend handlers (T007 before T008; T013 before T014)
- Backend changes before frontend API changes (T003–T005 before T009–T016)
- Frontend API before store methods (T009 before T010; T015 before T016)
- Store methods before component wiring (T010 before T011–T012; T016 before T017)
- Component creation before GamePage wiring (T018 before T019; T020 before T021)

### Parallel Opportunities

- T006 (frontend foundational types) can run in parallel with T003–T005 (backend — different directories)
- T009 and T010 (frontend canvas API + store) can run in parallel — different files
- T015 and T016 (frontend guess API + store) can run in parallel — different files
- T022 and T023 (builds) can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: US1 (Canvas)
4. **STOP and VALIDATE**: Drawing and clearing visible to all players
5. Complete Phase 4: US2 (Guess Submission)
6. **STOP and VALIDATE**: Correct/incorrect feedback working for guesser

### Incremental Delivery

1. Setup + Foundational → backend ready, new fields in API
2. US1 → live canvas visible to all via polling ✅
3. US2 → guess submission + validation + scoring ✅
4. US3 → shared guess history ✅
5. US4 → scoreboard live ✅
6. Polish → builds clean, quickstart passes ✅

---

## Notes

- `[P]` tasks touch different files with no incomplete-task dependencies — safe to run in parallel
- `[US?]` label maps each task to its user story for traceability back to spec.md
- T011 note: use `useRef<HTMLCanvasElement>` to access the canvas DOM element directly; redraw all strokes on every render (clear then re-draw) to avoid stroke accumulation artifacts
- T014 note: `randomUUID` is already imported from `node:crypto` in `roomStore.ts` — use the same import in the guess handler
- T017 note: `GuessForm` currently has a `disabled` prop — replace with `isDrawer` prop and return null when true
