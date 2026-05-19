# Quickstart: Game Start and Drawer Flow

## Prerequisites

- Backend running on `http://localhost:3001` (`cd backend && npm run dev`)
- Frontend running on `http://localhost:5173` (`cd frontend && npm run dev`)

## Test Flow

### 1. Create a Room

1. Open `http://localhost:5173` in Tab A (host).
2. Click "Create Room", enter name (e.g., "Alice"), submit.
3. **Expected**: Lobby with Alice listed as Host, room code visible.

### 2. Join as Second Player

1. Open `http://localhost:5173` in Tab B (guesser).
2. Click "Join Room", enter the room code and name (e.g., "Bob"), submit.
3. **Expected**: Both tabs show Alice (Host) and Bob in the participant list.

### 3. Host Starts Game — Drawer View

1. In Tab A (Alice/host), click "Start Game".
2. **Expected**:
   - Both tabs navigate to game screen.
   - Tab A shows Alice labeled as "Drawer".
   - Tab A shows the secret word (e.g., a word from the list).
   - Tab B shows Bob not as drawer.
   - Tab B does NOT show the secret word — sees a placeholder/animation instead.

### 4. Verify Word Isolation

1. Inspect network responses in Tab B (guesser).
2. **Expected**: The `currentRound.secretWord` field is `undefined` (or absent) in all API responses for Tab B.
3. Inspect network responses in Tab A (drawer).
4. **Expected**: The `currentRound.secretWord` field contains the actual word.

### 5. Verify Deterministic Word Selection

1. Note the secret word from Tab A.
2. Refresh or restart (create a new room with different players).
3. Use the same room code (manually create with code? — not possible, codes are generated).
4. **Expected**: Different room codes may produce different words. Same code always produces the same word (verifiable by noting code → word mapping).

### 6. Verify Name Validation

1. Start a room, try to start game with 2+ valid players.
2. **Expected**: Game starts successfully.
3. (Edge case: can't easily test invalid names at game start since names are validated on create/join.)

### 7. Verify Error Conditions

| Test | Action | Expected Error |
|------|--------|----------------|
| Start with 1 player | Host tries to start alone | "At least 2 players are needed to start" |
| Non-host starts | Bob clicks Start | "Only the host can start the game" |
| Start with empty word list | (Dev: temporarily clear words array) | "Game cannot start: word list is unavailable" |
