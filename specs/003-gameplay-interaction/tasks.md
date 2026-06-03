# Tasks 003 — Gameplay Interaction

Ordered; later tasks depend on earlier ones.

## Backend
- [x] T1. Schemas: `strokeSchema`, `canvasUpdateSchema { participantId, strokes }`,
  `guessSchema { participantId, text }` (text trimmed + non-empty). *(none)*
- [x] T2. `roomStore.updateCanvas(code, participantId, strokes)`: require active
  round (409) and drawer (403); replace `round.strokes`. *(T1)*
- [x] T3. `roomStore.submitGuess(code, participantId, text)`: require active round
  (409); reject drawer (403); case-insensitive/trim compare; append to history;
  first correct → +100, set `winnerId`, status `results`. *(T1)*
- [x] T4. `api/rooms.ts`: `PUT /:code/canvas` and `POST /:code/guesses`. *(T2,T3)*

## Frontend
- [x] T5. `services/api.ts`: `updateCanvas` and `submitGuess`. *(none)*
- [x] T6. `state/roomStore.ts`: `updateCanvas`, `clearCanvas`, `submitGuess`. *(T5)*
- [x] T7. `components/DrawingCanvas.tsx`: interactive for drawer (commit on
  stroke-end), read-only render for guessers. *(T6)*
- [x] T8. `components/GuessForm.tsx`: trim, block empty, submit; disabled for
  drawer. *(T6)*
- [x] T9. `components/Scoreboard.tsx`: participants + live scores + drawer marker. *(none)*
- [x] T10. `components/GuessHistory.tsx`: render synced guesses, highlight correct. *(none)*
- [x] T11. `pages/GamePage.tsx`: wire canvas (+clear), guess form, scoreboard,
  history. *(T7,T8,T9,T10)*

## Tests / validation
- [x] T12. Backend tests for `submitGuess` and `updateCanvas` (all paths). *(T2,T3)*
- [x] T13. Manual two-tab: draw → sync, clear, wrong then correct guess, scores +
  history update. *(T11)*
- [x] T14. `npm run build` + `npm test` green for backend and frontend. *(all)*
