# Quickstart: Result & Restart Flow

## Purpose

This quickstart describes the manual steps to validate Scenario 4 after the feature is implemented.

## Setup

1. Start the backend:

```bash
cd backend
npm install
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

3. Open two browser tabs and navigate to `http://localhost:5173`.

## Validation Steps

### Step 1: Join a Room

1. In Tab A, create a room and note the room code.
2. In Tab B, join the same room using the code.
3. Confirm both tabs see the same participant list in the lobby.

### Step 2: Complete a Round

1. Use the existing game flow from Scenario 3 to play a round to completion.
2. Confirm that both tabs eventually see the final result state.
3. Verify the result panel includes:
   - the correct secret word
   - the same final scores for all players
   - the same ordered guess history

### Step 3: Restart from Result

1. In Tab A (host), click the restart button on the result screen.
2. Confirm both Tab A and Tab B return to the lobby.
3. Confirm the room code is unchanged.
4. Confirm both tabs still show the same participant list.

### Step 4: Verify State Reset

1. After restart, ensure the old round state is cleared:
   - `currentRound` should no longer show a finished round
   - the secret word should not remain visible
   - guess history from the completed round should not be reused for the next round
2. Confirm the lobby polling behavior still updates the participant list normally.

## Notes

- If the restart button is visible to a non-host, this is a bug.
- If restart fails, the result screen should remain visible and display a clear error message.
- The result view should survive a browser refresh while the room remains in finished state.
