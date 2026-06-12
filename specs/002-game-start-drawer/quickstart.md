# Quickstart: Game Start — First Round Drawer & Secret Word Validation

## Prerequisites

- Node.js 22 (run `nvm use` from repo root if using nvm)
- Two browser tabs or windows

## Start the Application

1. **Backend**:
   ```bash
   cd backend && npm run dev
   ```
   Expected: `Backend listening on http://localhost:3001`

2. **Frontend**:
   ```bash
   cd frontend && npm run dev
   ```
   Expected: Vite dev server URL (usually `http://localhost:5173`)

## Validation Scenarios

### Scenario 1: Host Starts the Game and Becomes Drawer

1. Open the frontend URL in **Tab 1**.
2. Click **Create Room**, enter `Alice`, and submit.
3. In **Tab 2**, click **Join Room**, enter `Bob` and the room code.
4. In **Tab 1** (host), click **Start Game**.
5. **Expected**: Both tabs transition to the game screen.
6. In **Tab 1** (drawer), verify:
   - The secret word `rocket` is displayed.
   - A clear indication that "You are the drawer" (or similar) is shown.
7. In **Tab 2** (guesser), verify:
   - The secret word is NOT displayed; instead, underscores matching the word length are shown (e.g., `_ _ _ _ _`).
   - The drawer (`Alice`) is clearly identified.

### Scenario 2: Minimum Players Check

1. Have only the host in the lobby (do not join from Tab 2).
2. Click **Start Game**.
3. **Expected**: Action is blocked with a clear message that at least 2 players are required.

### Scenario 3: Non-Host Cannot Start

1. With at least 2 players in the lobby, refresh **Tab 2** and re-join as a new participant (or observe from a third tab).
2. **Expected**: The **Start Game** button is not visible to non-host players.

### Scenario 4: Host Leaves Mid-Round

1. Start the game with 2 players (Scenarios 1 setup).
2. In **Tab 1** (host/drawer), navigate back to the lobby or close the tab.
3. Wait ~2 seconds in **Tab 2**.
4. **Expected**: Tab 2 is automatically redirected back to the lobby screen. The room status returns to `lobby`, and the secret word is no longer visible.

### Scenario 5: Name Trimming Validation

1. Attempt to create a room with name `  Alice  `.
2. **Expected**: Name is trimmed to `Alice` and accepted.
3. Attempt to create a room with only whitespace `   `.
4. **Expected**: Clear error message; room is not created.

## Automated Tests

Run the existing test suites to verify contracts:

```bash
cd backend && npm test
cd frontend && npm test
```

## Acceptance Gate

All scenarios above must pass before proceeding to the next feature group (Gameplay).
