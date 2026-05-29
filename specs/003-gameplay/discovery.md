# Scenario 3 Discovery: Gameplay Interaction

## Gaps (Incomplete Behaviors)

- The backend does not store drawing state, guess history, or participant scores.
- There is no drawing API or permission enforcement for the drawer.
- There is no clear-canvas action available.
- The guess form does not submit guesses to the backend or validate input.
- Guess history and scoreboard are placeholders with no synced data.
- There is no backend scoring logic for correct/incorrect guesses.

## Assumptions

- Drawing data can be stored as serializable path or stroke data.
- Guess text should be trimmed, normalized, and compared case-insensitively.
- Correct guesses score 100 points once per participant per round.
- The first correct claim should automatically move the room into `results`, while host restart will return the room back to `lobby`.
- History and score updates should sync through polling, not WebSockets.

## Relevant Files

- `backend/src/services/roomStore.ts` — gameplay state, guess scoring, and round transitions.
- `backend/src/models/game.ts` — drawing, guesses, scores, and room status definitions.
- `backend/src/api/rooms.ts` — guess and draw route handlers.
- `frontend/src/services/api.ts` — submission APIs for drawing, guessing, and game control.
- `frontend/src/state/roomStore.ts` — state actions for guesses, drawing, and room polling.
- `frontend/src/pages/GamePage.tsx` — gameplay UI, guess form, and result rendering.
