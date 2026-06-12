# Quickstart: Result, Restart & Final Validation

## Prerequisites

- Node.js installed
- Backend dependencies installed in `backend/`
- Frontend dependencies installed in `frontend/`
- Backend server running (`cd backend && npm run dev`)
- Frontend server running (`cd frontend && npm run dev`)
- Prior features complete: room setup (001), game start (002), gameplay (003)

## Setup Commands

1. Start the backend:
   - `cd backend && npm run dev`
2. Start the frontend:
   - `cd frontend && npm run dev`

## Validation Scenarios

### 1. Confirm result state after round ends

- Start a room, have at least one other player join, and start the game.
- Play through a round until it ends.
- Expected: all players see the result screen showing the correct word,
  final scores, and full guess history.

### 2. Verify host-only restart

- As the host on the result screen, click restart.
- Expected: all players transition to the lobby with participants preserved
  and round state cleared (scores reset to 0, no guess history visible).

### 3. Verify non-host restart rejection

- As a non-host player on the result screen, attempt to trigger restart.
- Expected: the action is rejected with an error message; the result screen
  remains unchanged.

### 4. Verify late-joiner sees result

- While the result screen is displayed, have a new player join the room.
- Expected: the new player sees the same result data (correct word, scores,
  guess history) as existing players.

### 5. Verify host-left scenario

- The host disconnects after the round ends.
- Expected: remaining players see the result screen but cannot restart.
- The host rejoins the room.
- Expected: the host can now restart the game normally.

## Expected Results

- Result screen shows correct word, final scores, and full guess history.
- Restart preserves all participants and resets scores to 0.
- Non-host restart attempts are rejected.
- Late joiners receive the current result state.
- Host must be present to restart.
