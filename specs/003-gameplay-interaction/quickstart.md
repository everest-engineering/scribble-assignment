# Quickstart: Gameplay Interaction

## Backend Changes

### 1. Add types to `backend/src/models/game.ts`
- Add `Guess` interface (participantId, text, isCorrect, timestamp)
- Add `Drawing = number[][][]` type alias
- Add `guesses`, `drawing`, `hasCorrectGuess` to `Round`
- Add `guesses`, `drawing` to `RoomSnapshot`

### 2. Update `backend/src/api/schemas.ts`
- Add `guessSchema` (participantId required, text trimmed + min 1)

### 3. Update `backend/src/services/roomStore.ts`
- Add `submitGuess(code, participantId, text)`: validate drawer isn't guessing, check empty, compare case-insensitive, award score on correct
- Add `saveDrawing(code, participantId, drawing)`: validate drawer, store strokes
- Update `toRoomSnapshot()`: include guesses and drawing
- Update `startGame()`: initialize guesses=[], drawing=[], hasCorrectGuess=false

### 4. Update `backend/src/api/rooms.ts`
- Add `POST /:code/guess` route
- Add `POST /:code/drawing` route

## Frontend Changes

### 1. Create `frontend/src/components/Canvas.tsx`
- HTML5 Canvas with mouse event handlers (mousedown, mousemove, mouseup)
- Draw strokes in real-time
- "Clear Canvas" button
- Props: `drawing` (strokes to render), `onDrawingChange`, `readOnly`

### 2. Update `frontend/src/services/api.ts`
- Add `submitGuess(code, participantId, text)`
- Add `saveDrawing(code, participantId, drawing)`
- Update `RoomSnapshot` types with guesses, drawing

### 3. Update `frontend/src/state/roomStore.ts`
- Add `submitGuess(text)`: calls api, refreshes room
- Add `saveDrawing(drawing)`: calls api

### 4. Update `frontend/src/components/GuessForm.tsx`
- Accept onSubmit prop to call store.submitGuess
- Show error for empty guesses

### 5. Update `frontend/src/components/Scoreboard.tsx`
- Accept participants list, render scores from room data

### 6. Update `frontend/src/components/ResultPanel.tsx`
- Accept guesses list, render guess history

### 7. Update `frontend/src/pages/GamePage.tsx`
- Integrate Canvas (drawer mode: drawable, guesser mode: read-only)
- Wire GuessForm to store
- Pass scores and guesses to Scoreboard/ResultPanel

## Testing

- Add backend test for `submitGuess()`: correct, incorrect, empty, drawer-can't-guess
- Add backend test for `saveDrawing()`: drawer saves, guesser rejected
- Update frontend tests
