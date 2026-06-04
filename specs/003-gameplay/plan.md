# Plan — Gameplay Interaction

## State Changes
- Room.guesses: array of GuessEntry (participantId, participantName, text, isCorrect, timestamp)
- Room.scores: Record<string, number> mapping participantId to score
- Room.drawStrokes: array of strokes (each stroke is an array of {x, y} points)
- Room.status transitions to "finished" on correct guess
- RoomSnapshot includes drawStrokes for all participants

## Data Flow
```
POST /rooms/:code/guess { participantId, text }
  → Backend validates: is playing? is not drawer? is not empty?
  → Trims text, compares case-insensitively against secretWord
  → If correct: score += 100, status = "finished"
  → Records guess, returns updated RoomSnapshot

POST /rooms/:code/draw { participantId, stroke: [{x, y}, ...] }
  → Backend validates: is playing? is drawer?
  → Appends stroke to room.drawStrokes
  → Returns updated RoomSnapshot

POST /rooms/:code/clear-draw { participantId }
  → Backend validates: is playing? is drawer?
  → Clears room.drawStrokes
  → Returns updated RoomSnapshot

GET /rooms/:code?participantId=xxx (polling)
  → Returns RoomSnapshot with drawStrokes, guesses, scores
  → Frontend renders strokes on canvas for all participants
```

## Files
- `backend/src/models/game.ts` — Add DrawStroke type, drawStrokes to Room
- `backend/src/services/roomStore.ts` — Add submitGuess, submitDrawStroke, clearDrawing
- `backend/src/api/schemas.ts` — Add submitGuessSchema, submitDrawSchema, clearDrawSchema
- `backend/src/api/rooms.ts` — Add POST /:code/guess, POST /:code/draw, POST /:code/clear-draw
- `frontend/src/services/api.ts` — Add guess, draw, clearDraw methods
- `frontend/src/state/roomStore.ts` — Add submitGuess, submitDrawStroke, clearDrawing
- `frontend/src/components/Canvas.tsx` — Send strokes to backend, render received strokes
- `frontend/src/components/GuessForm.tsx` — Wire to API with validation
- `frontend/src/components/Scoreboard.tsx` — Display live scores
