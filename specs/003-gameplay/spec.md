# Scenario 3: Gameplay Interaction

## Objective
Enable the drawer to interact with the shared canvas and let guessers submit case-insensitive guesses that are synced and scored.

## Acceptance Criteria
- Drawer canvas interactions are available and can be cleared.
- Guess text is trimmed and normalized to lower-case before scoring.
- Guesses are appended to a synced history array on the backend.
- Clients refresh room state every 2 seconds and receive the latest guess history.
- Correct guesses award exactly 100 points to the guessing participant.
- Only the first correct guess in a round awards points; later guesses do not re-award.

## Contracts
- Backend contract: `POST /api/rooms/:code/guess` accepts `{ participantId, text }`.
- Backend contract: room snapshot includes `guesses[]` and `scores{}`.
- Backend contract: correct guess scoring is deterministic and case-insensitive.
- Backend contract: `POST /api/rooms/:code/restart` clears the current round state and retains connected players.
- Frontend contract: `GuessForm` trims and normalizes input before POST.
- Frontend contract: `ResultPanel` renders `room.guesses` and host restart action.

## Files
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/components/Canvas.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `backend/src/models/game.ts`
