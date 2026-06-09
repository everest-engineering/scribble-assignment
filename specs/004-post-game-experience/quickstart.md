# Quickstart: Post Game Experience

## Prerequisites

- Node.js 18+ and npm 9+
- Two browser tabs (for testing multiplayer)
- Drawing & Guessing feature must be fully implemented and running

## Start the Backend

```bash
cd backend && npm run dev
```

## Start the Frontend

```bash
cd frontend && npm run dev
```

## Verify the Feature

### Setup: Play a Round to Completion

1. Open Tab A → Create Room → Start Game
2. Open Tab B → Join Room
3. Identify the drawer tab, select a word
4. Draw some strokes on the canvas

### Verify Correct Guess Ends the Round

1. On the guesser's tab (Tab B), submit the correct secret word
2. Verify both tabs show the result screen within 2 seconds
3. Verify the result screen shows "Round Over" or similar indicator

### Verify Result Screen Contents

1. On either tab, verify the correct secret word is visible to all
2. Verify player standings are shown (who guessed correctly)
3. Verify the complete guess log is displayed chronologically
4. Verify the final drawing canvas is still visible

### Verify Incorrect Guess Does Not End the Round

1. Start a new round, have the guesser submit an incorrect word
2. Verify the game continues normally (no result screen)

### Verify Host Restart

1. On the result screen, verify the host sees a "Play Again" button
2. Verify non-host players do NOT see the restart button
3. As host, click "Play Again"
4. Verify both tabs transition back to the lobby
5. Verify participant list is intact (same two players)
6. Verify round data (secret word, strokes, guesses) is cleared

### Verify New Game After Restart

1. In the lobby, click "Start Game" as host
2. Verify a new game begins with fresh role assignment and new word options
3. Verify canvas is empty and no previous guesses are visible

## Build Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must pass without errors.
