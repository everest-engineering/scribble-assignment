# Quickstart: Join Validation

## Verification

### 1. Empty room code
1. Open the frontend (`http://localhost:5173`)
2. Click "Join Room"
3. Leave room code field empty
4. Enter a player name
5. Click "Join Lobby"
6. **Expected**: Error message "Invalid room code. Please try again with correct one." appears below the form. You are NOT redirected.

### 2. Whitespace-only room code
1. On the Join Room screen, enter spaces in the room code field
2. Click "Join Lobby"
3. **Expected**: Same error message appears.

### 3. Non-existent room code
1. On the Join Room screen, enter "ZZZZ" as the room code
2. Enter a player name
3. Click "Join Lobby"
4. **Expected**: Same error message appears.

### 4. Valid room code (regression)
1. Open a second tab, create a room, note the code
2. In the first tab, enter the code and a player name
3. Click "Join Lobby"
4. **Expected**: You are redirected to the lobby. The participant list shows both players.

### 5. Case-insensitive matching (regression)
1. Create a room with code "ABCD" in one tab
2. In another tab, enter "abcd" (lowercase) as the room code
3. **Expected**: You successfully join the room.

## Build Validation

```bash
cd backend && npm run build && npm test
cd frontend && npm run build && npm test
```
