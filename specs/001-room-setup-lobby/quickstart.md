# Quickstart: Room Setup and Lobby

## Prerequisites

- Backend running on `http://localhost:3001` (`cd backend && npm run dev`)
- Frontend running on `http://localhost:5173` (`cd frontend && npm run dev`)

## Test Flow

### 1. Create a Room

1. Open `http://localhost:5173` in a browser tab.
2. Click "Create Room" on the start screen.
3. Enter a player name (e.g., "Alice") and submit.
4. **Expected**: You land on the Lobby screen, see your name in the participant
   list, your room code displayed in a badge, and a host indicator next to your
   name.

### 2. Join the Room

1. Open a **second browser tab** and navigate to `http://localhost:5173`.
2. Click "Join Room".
3. Enter the room code from step 1 and a player name (e.g., "Bob").
4. **Expected**: Bob lands on the Lobby screen and sees both Alice and Bob in
   the participant list.

### 3. Verify Auto-Refresh

1. With both tabs open on the Lobby, join with a third player from another tab.
2. **Expected**: Within ~2 seconds, all lobby screens update to show the new
   player without manual refresh.

### 4. Verify Host Gating

1. In Bob's tab (non-host), look for the "Start Game" button.
2. **Expected**: Bob does NOT see a start button, or the button is disabled.

### 5. Verify Minimum Players

1. In Alice's tab (host), click "Start Game".
2. **Expected** with only Alice in the room: Error message "At least 2 players
   are needed to start".
3. Join with Bob (2 players now present).
4. In Alice's tab, click "Start Game".
5. **Expected**: Room status transitions to "active" and both tabs navigate to
   the game screen.

### 6. Verify Room Isolation

1. In a third tab, create a new room with a different player.
2. **Expected**: The new room has a different code, empty participant list
   (except the creator), and no visibility into the first room.

### 7. Verify Error Handling

| Test | Action | Expected Error |
|------|--------|----------------|
| Empty code | Submit join with blank code | "Room code is required" |
| Wrong code | Submit join with non-existent code | "Room not found" |
| Invalid name | Create room with name >16 chars | Validation error |
| Room full | Fill room with 8 players, try 9th | "Room is full" |
