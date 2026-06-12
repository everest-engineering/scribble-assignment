# Discovery: Round Drawing, Guessing, and Scoring

## Scaffold Analysis (What the Starter Already Had)

After completing Feature 002, the scaffold supported:

- **Backend**: Room creation, join, fetch, start; host tracking; `drawerId` and `currentWord` assignment; word visibility filtered by viewer; `status: "lobby" | "playing"`.
- **Frontend**: Lobby with polling; Game page with drawer banner, word reveal for drawer, underscore placeholder for guessers, and ~2s polling.
- **UI Shell**: `Canvas`, `GuessForm`, `Scoreboard`, and `ResultPanel` components exist in `GamePage.tsx` but are all non-functional placeholders.
- **Data model**: `Room` has `participants`, `hostParticipantId`, `drawerId`, `currentWord`, `status`. No fields yet for strokes, guesses, scores, or history.

## Gaps (Incomplete Behaviors)

1. **Canvas is non-interactive**: The `Canvas` component renders a blank `<canvas>` element with no mouse/touch event handling. The drawer cannot draw, and no stroke data is captured or sent to the server.
2. **No canvas stroke endpoint**: The backend has no endpoint to receive, store, or broadcast drawing strokes. There is no `POST /rooms/:code/canvas` or equivalent.
3. **No canvas clear action**: There is no endpoint or UI action to clear the canvas and remove all strokes.
4. **No guess submission endpoint**: The backend has no `POST /rooms/:code/guess`. The `GuessForm` component is a visual placeholder with no submission handler.
5. **No guess validation logic**: There is no trimming, case-insensitive comparison, or empty-guess rejection. There is also no guard to prevent the drawer from submitting guesses.
6. **No scoring system**: There are no score fields on `Room` or `Participant`, and no logic to award 100 points for a correct guess or 0 for an incorrect one.
7. **No guess history tracking**: There is no ordered list of guesses with submitter identity, guess text, correctness flag, or timestamp.
8. **Scoreboard is a placeholder**: The `Scoreboard` component does not display real participant scores because no score data exists in the model.

## Assumptions

- **Assumption A1**: Canvas strokes are freehand lines only; no shapes, text, colors, or brush-size variations are required beyond a default black stroke.
- **Assumption A2**: Stroke coordinates are normalized to a fixed logical canvas size (e.g., 0–1000 units) so drawings render consistently across different screen sizes, rather than sending raw pixel coordinates.
- **Assumption A3**: Canvas state, guess history, and scores are piggybacked onto the existing `GET /rooms/:code` room snapshot polling endpoint, avoiding separate polling endpoints.
- **Assumption A4**: The round ends immediately on the first correct guess, transitioning the room to `results` status (implemented in Feature 004). Only one correct guess is possible per round.
- **Assumption A5**: There is no undo, redo, or per-stroke deletion beyond a global "Clear Canvas" action.
- **Assumption A6**: If the drawer leaves mid-round, all round state (canvas, guesses, scores, word, drawer) is cleared and the room returns to `lobby`.

## Relevant Files

| File | Role |
|------|------|
| `backend/src/services/roomStore.ts` | Needs `canvasStrokes`, `guessHistory`, `scores`, `addStroke`, `clearCanvas`, `submitGuess` |
| `backend/src/models/game.ts` | Needs `Stroke`, `GuessEntry`, `scores` map on `Room` |
| `backend/src/api/rooms.ts` | Needs `POST /rooms/:code/canvas`, `POST /rooms/:code/canvas/clear`, `POST /rooms/:code/guess` |
| `backend/src/api/schemas.ts` | Needs Zod schemas for stroke, guess, and canvas-clear payloads |
| `frontend/src/components/Canvas.tsx` | Needs mouse/touch event handlers, stroke capture, normalization, and API submission |
| `frontend/src/components/GuessForm.tsx` | Needs input handling, validation, and `submitGuess` API call |
| `frontend/src/components/Scoreboard.tsx` | Needs to read `room.scores` and render per-participant totals |
| `frontend/src/components/ResultPanel.tsx` | Needs to read `room.guessHistory` and render chronological guesses |
| `frontend/src/pages/GamePage.tsx` | Needs to wire up clear-canvas button and conditionally render guess form for non-drawers |
| `frontend/src/services/api.ts` | Needs client methods for `submitStroke`, `clearCanvas`, `submitGuess` |
| `frontend/src/state/roomStore.ts` | Needs store actions for stroke, clear, and guess submission |

## Open Questions / Unknowns (Resolved)

- Q: What is the canonical representation of a stroke stored server-side? → A: `{ points: [{x, y}], color: string, width: number }`.
- Q: Should canvas, history, and scores use separate endpoints or extend the room snapshot? → A: Extend the existing room snapshot endpoint with `canvasStrokes`, `scores`, and `guessHistory`.
- Q: What happens on the first correct guess? → A: Room auto-transitions to `results` status; the correct guesser receives 100 points.
- Q: Should stroke coordinates be normalized or raw pixels? → A: Normalize to a 0–1000 logical coordinate system and scale on render.
