# 003 – Gameplay Interaction

## Acceptance Criteria

- Drawer can draw freehand on an HTML canvas via pointer events
- Drawer can clear the canvas with a dedicated button
- Drawing is stored on the server as stroke arrays and replayed on all clients via polling
- Guessers can submit guesses via a form input
- Guesses are trimmed before submission; empty guesses are rejected
- Guess comparison is case-insensitive (`guess.toLowerCase() === word.toLowerCase()`)
- Guess history is synchronized to all players through 2-second polling
- Correct guesses score exactly 100 points; incorrect guesses score 0
- All player scores start at 0 when the game begins

## Implementation Details

- `frontend/src/components/DrawingCanvas.tsx`: Native HTML canvas with `PointerEvent` handlers; strokes captured as `Point[]` arrays; replay via `useEffect` on `drawCommands` prop
- `backend/src/services/roomStore.ts`: `submitGuess()` compares guess case-insensitively, awards 100 points on match, sets status to `"finished"`; `addDrawCommands()` appends stroke commands
- `backend/src/models/game.ts`: `DrawCommand` type (`{type: "stroke", points: Point[]}` or `{type: "clear"}`); `Guess` type with `isCorrect` flag
- `frontend/src/components/GuessForm.tsx`: Controlled input with `.trim()` guard, calls `onSubmit` prop with trimmed text, clears on submit
- `frontend/src/pages/GamePage.tsx`: Polls room state every 2 seconds; passes draw commands to canvas; wires guess submit to store
- `frontend/src/components/Scoreboard.tsx`: Renders sorted participant scores
- `frontend/src/components/ResultPanel.tsx`: Renders guess history with correct/incorrect indicators

## Dependencies

- Depends on: 002-game-start (drawer and word must be assigned)
- Used by: 004-result-restart (gameplay leads to result)
