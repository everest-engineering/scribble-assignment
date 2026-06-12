# Quickstart: Gameplay Interaction

## Prerequisites

- Node.js installed
- Backend dependencies installed in `backend/`
- Frontend dependencies installed in `frontend/`
- Backend server running (`cd backend && npm run dev`)
- Frontend server running (`cd frontend && npm run dev`)

## Setup Commands

1. Start the backend:
   - `cd backend && npm run dev`
2. Start the frontend:
   - `cd frontend && npm run dev`

## Validation Scenarios

### 1. Confirm active round state

- Start a room and have at least one guesser join.
- Start the game as the host.
- Expected: the game view loads with drawer/guesser UI and the correct room state.

### 2. Submit valid and invalid guesses

- As a guesser, enter `  correctWord  ` and submit.
- Expected: the guess is trimmed, compared case-insensitively, and marked correct if it matches the target.
- Enter only whitespace and submit.
- Expected: the guess is rejected with a validation message and does not appear in guess history.

### 3. Verify shared guess history and scores

- Submit a guess from one player.
- Open a second browser tab for another participant.
- Expected: after polling, both players see the same guess history and score updates.

### 4. Verify drawer canvas clear behavior

- As the drawer, clear the canvas.
- Expected: the drawer immediately sees the canvas clear without breaking active guess history.

## Expected Results

- Correct guesses earn `100` points.
- Incorrect guesses earn `0` points.
- Guess history is shared across all players via polling.
- Canvas actions remain local to the active drawer view and do not reset guess history.
