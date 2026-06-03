# Tasks: Gameplay Interaction

---

### T1: Backend — add Guess model, scores, and guess schema

**Files**: `backend/src/models/game.ts`, `backend/src/api/schemas.ts`

- Add `Guess` interface (participantId, participantName, text, isCorrect, createdAt)
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room`
- Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`
- Add `guessSchema` with `participantId: z.string()` and `text: z.string().min(1)`

**Verify**: `npm run build` passes in backend

---

### T2: Backend — submitGuess logic and snapshot updates

**Files**: `backend/src/services/roomStore.ts`

- Initialize `guesses: []` and `scores: {}` in `createRoom` and `startGame`
- Add `submitGuess(code, participantId, text)` function:
  - Validate room exists (404) and is in "playing" status (400)
  - Reject empty/whitespace-only text (400)
  - Reject if submitter is the drawer (400)
  - Compare `text.trim().toLowerCase()` against `secretWord.toLowerCase()`
  - Add guess to `guesses[]` with isCorrect flag
  - If correct and participant has no score yet, set `scores[participantId] = 100`
  - Return updated room snapshot
- Include `guesses` and `scores` in `toRoomSnapshot`

**Verify**: `npm run build` passes

---

### T3: Backend — guess route

**File**: `backend/src/api/rooms.ts`

- Add `POST /:code/guess` route that validates input and calls `submitGuess`

**Verify**: `npm run build` passes

---

### T4: Frontend — update types, API, and store

**Files**: `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

- Add `Guess` interface matching backend
- Add `guesses` and `scores` to `RoomSnapshot`
- Add `submitGuess(code, participantId, text)` to api object
- Add `submitGuess(text)` method to RoomStore

**Verify**: `npm run build` passes in frontend

---

### T5: Frontend — interactive canvas

**File**: `frontend/src/pages/GamePage.tsx`

- Replace canvas placeholder with a real `<canvas>` element
- Handle mouse events (mousedown, mousemove, mouseup) for drawing
- Add "Clear Canvas" button that wipes the canvas
- Only enable drawing if the viewer is the drawer

**Verify**: `npm run build` passes; drawer can draw, guessers see static canvas

---

### T6: Frontend — wire GuessForm, ResultPanel, Scoreboard

**Files**: `frontend/src/components/GuessForm.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/components/Scoreboard.tsx`

- `GuessForm`: call `roomStore.submitGuess(text)` on submit, show error on failure
- `ResultPanel`: render `room.guesses` list with name, text, correct/incorrect indicator
- `Scoreboard`: render `room.scores` mapped to participant names

**Verify**: `npm run build` passes; test with two tabs for guess sync

---

### T7: Verify with two browser tabs

- Tab A (drawer) sees interactive canvas + clear button
- Tab B (guesser) sees static canvas + guess input
- Tab B submits a guess → appears in both tabs' activity panel
- Tab B submits empty guess → error shown
- Tab B submits correct word (case-insensitive) → score 100, guess marked correct
- Tab B submits incorrect word → score stays 0, guess marked incorrect
