# Quickstart: Room Creation and Join Validation

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

### Scenario 1: Create a Room and Become Host

1. Open the frontend URL in **Tab 1**.
2. Click **Create Room**.
3. Enter a valid name (e.g., `Alice`) and submit.
4. **Expected**: You land on the lobby page showing:
   - Room code badge (4 chars).
   - `Alice` listed as a participant.
   - A "Start Game" button is visible (host-only).

### Scenario 2: Join a Room via Code

1. In **Tab 2**, open the frontend URL.
2. Click **Join Room**.
3. Enter a name (e.g., `Bob`) and the room code from Tab 1.
4. **Expected**: You land on the lobby page showing both `Alice` and `Bob`.
5. In **Tab 1**, wait ~2 seconds without refreshing.
6. **Expected**: `Bob` appears automatically in the participant list (polling).

### Scenario 3: Validation Errors

- **Empty name on create**: Submit Create Room with only spaces.
  - **Expected**: Clear error message; room is not created.
- **Invalid room code on join**: Submit Join Room with code `ZZZZ`.
  - **Expected**: Clear error message; no navigation occurs.
- **Join in-progress game**: Start the game from Tab 1, then try joining from a new tab.
  - **Expected**: Clear error message that the game is already in progress.

### Scenario 4: Host Starts the Game

1. With at least 2 players in the lobby (Scenarios 1 + 2):
2. In **Tab 1** (host), click **Start Game**.
3. **Expected**: Both tabs transition to the game screen.
4. In **Tab 2** (non-host), verify there is no Start Game control.

### Scenario 5: Minimum Players Check

1. Have only the host in the lobby (do not join from Tab 2).
2. Click **Start Game**.
3. **Expected**: Action is blocked with a clear message that at least 2 players are required.

## Automated Tests

Run the existing test suites to verify contracts:

```bash
cd backend && npm test
cd frontend && npm test
```

## Acceptance Gate

All scenarios above must pass before proceeding to the next feature group (Gameplay).
