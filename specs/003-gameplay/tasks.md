# Scenario 3 Tasks: Gameplay Interaction

Checklist of deliverables and implementation order:

- [x] **Backend: Canvas Endpoints**
  - [x] Add `canvasStrokes: Stroke[]` to `Room` and `RoomSnapshot` models
  - [x] Add `PUT /rooms/:code/canvas` endpoint to accept and store stroke data
  - [x] Support clearing canvas (send empty strokes array)
  - [x] Expose `canvasStrokes` in `toRoomSnapshot()` for all viewers

- [x] **Backend: Guess Verification**
  - [x] Add `guessHistory: GuessEntry[]` and `score: number` to models
  - [x] Add `POST /rooms/:code/guess` endpoint
  - [x] Trim guess and perform case-insensitive match against `secretWord`
  - [x] Award 100 points to participant on correct guess
  - [x] Append `GuessEntry` to `room.guessHistory`
  - [x] Expose `guessHistory` in `toRoomSnapshot()`

- [x] **Frontend: Drawing Canvas Interaction**
  - [x] Create `DrawingCanvas` component with mouse-drag stroke capture
  - [x] Debounce stroke sync to `PUT /rooms/:code/canvas` (800ms)
  - [x] Clear button clears local canvas and syncs empty strokes to backend
  - [x] Guessers receive read-only canvas rendered from polled `canvasStrokes`
  - [x] Integrate `DrawingCanvas` into `GamePage` (replacing placeholder)

- [x] **Frontend: Guessing & Synced Logs**
  - [x] `GuessForm` trims input and blocks submission if empty
  - [x] `GuessForm` calls `roomStore.submitGuess()` and shows correct/incorrect feedback
  - [x] `Scoreboard` renders live participant scores from polled room state
  - [x] `ResultPanel` renders synced guess history with correct-guess highlighting
  - [x] `GamePage` runs 2s polling loop for scores, canvas, and guess history sync
