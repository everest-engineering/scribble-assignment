# Scenario 3 Plan: Gameplay Interaction

## Proposed Changes

### Backend Changes

- **Canvas State**: Add a `canvasData` field (e.g., array of strokes/lines or a string representation) to the room state on the backend.
- **PUT /rooms/:code/canvas**: Add an endpoint for the drawer to submit new drawing data or clear the canvas.
- **POST /rooms/:code/guess**: Add an endpoint for guessers to submit guesses.
  - Trim the guess string and perform a case-insensitive check against the room's `secretWord`.
  - Add the guess to the `guessHistory` array on the room state (format: `{ playerId, playerName, guessText, correct: boolean }`).
  - If correct, add 100 points to the participant's score.

### Frontend Changes

- **Canvas Component**:
  - For the drawer, track mouse drag events to draw on canvas. Debounce and upload state to `PUT /rooms/:code/canvas`.
  - For guessers, poll `GET /rooms/:code` (which includes canvas data) and update the canvas canvas render context.
- **Guess Submit Form**:
  - Handle form submission, calling `.trim()`. If the result is empty, block submit and show warning.
  - Otherwise, send `POST /rooms/:code/guess` to the backend.
- **Lobby & Scoreboard UI**:
  - Poll the room state to retrieve scores and guesses. Render them reactively.
