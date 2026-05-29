# Feature Plan: Scenario 3 — Gameplay Interaction

## Required Changes

### Backend
- Add `drawing`, `guesses`, and `scores` to the room model.
- Create drawer-only endpoints for drawing update and clear canvas.
- Create guess submission endpoint with trim validation and scoring rules.
- Ensure `secretWord` remains masked for non-drawers while `status === "game"`.
- Store guess history with participant identity, text, correctness, timestamp, and points.

### Frontend
- Extend `RoomSnapshot` to include drawing state, guess history, and scores.
- Add APIs for drawing updates, clear canvas, and guess submission.
- Add polling in `GamePage.tsx`.
- Render drawer and guesser UI states separately.
- Add interactive drawing controls for the drawer.
- Add guess form validation and updated guess history display.
- Add scoreboard rendering for participant points.

## Data Flow
- Drawer updates drawing → backend stores new `drawing` payload.
- Guesser submits a guess → backend appends a guess entry, scores it, and updates `scores`.
- All clients poll `GET /rooms/:code` and receive updated game state.

## File-Level Plan
- `backend/src/models/game.ts`: add drawing, guess history, and score fields.
- `backend/src/services/roomStore.ts`: initialize gameplay state and enforce permissions.
- `backend/src/api/schemas.ts`: add drawing and guess request validation.
- `backend/src/api/rooms.ts`: add drawing and guess endpoints.
- `frontend/src/services/api.ts`: add drawing and guess API methods.
- `frontend/src/state/roomStore.ts`: add gameplay actions.
- `frontend/src/pages/GamePage.tsx`: render drawer canvas, guess form, history, and scoreboard.
- `frontend/src/components/GuessForm.tsx`: add validation and submit handling.
- `frontend/src/components/Scoreboard.tsx`: render participant scores.

## Verification
- Confirm drawer-only drawing and clear actions work.
- Confirm guessers cannot submit empty guesses.
- Confirm guess history and scores sync across tabs.
- Confirm repeated correct guesses do not award extra points.
