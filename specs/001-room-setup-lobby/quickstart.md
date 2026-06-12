# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js installed
- Backend dependencies installed in `backend/`
- Frontend dependencies installed in `frontend/`

## Setup Commands

1. Start the backend:
   - `cd backend && npm run dev`
2. Start the frontend:
   - `cd frontend && npm run dev`

## Validation Scenarios

### 1. Create a room as host

- Open the frontend in a browser.
- Navigate to Create Room.
- Enter a player name and submit.
- Expected: room code is displayed, lobby opens, and the creator is marked as host.

### 2. Join an existing room

- Open a second browser tab or window.
- Navigate to Join Room.
- Enter a player name and the room code from the host.
- Expected: second player enters the same lobby and sees the shared participant list.

### 3. Reject invalid or empty room code

- In the second browser, leave the room code blank or submit an invalid code.
- Expected: validation error is shown and the join is rejected.

### 4. Verify lobby polling

- With the host in the lobby, join the room from another tab.
- Expected: the host's lobby reflects the new player within ~2 seconds.

### 5. Verify host-only start gating

- Ensure only the host sees or can activate the start control.
- Ensure the host cannot start unless at least two players are present.

## Notes

- Use the `backend/src/services/roomStore.ts` and `frontend/src/state/roomStore.ts` files for the implementation.
- If the join flow fails, verify the room code is uppercased and that the backend is running.
