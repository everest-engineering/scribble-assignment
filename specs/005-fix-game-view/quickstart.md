# Quickstart — Game View Transition Validation

## Prerequisites

- Node.js 24.x
- Backend and frontend dependencies installed (`cd backend && npm install`, `cd frontend && npm install`)
- Two browser tabs/windows (or two browser profiles)

## Setup

```bash
# Terminal 1: Start the backend
cd backend
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

The backend runs on `http://localhost:3001`, the frontend on `http://localhost:5173`.

---

## Validation Scenarios

### Scenario 1: All players see game view on host start (FR-001, FR-004)

1. Open **Window A** → navigate to `http://localhost:5173` → Create a room as "Alice"
2. Open **Window B** → navigate to `http://localhost:5173` → Join the room as "Bob"
3. In **Window A** (host), click **"Start Game"**
4. **Expected**: Both windows navigate to `/game` within 3 seconds
5. **Expected**: Alice sees "Your Word" card with a word; Bob sees "Canvas" with "Drawer is drawing..."

### Scenario 2: Lobby refresh during game (FR-005)

1. Start a game with 2+ players per Scenario 1
2. In **Window B** (non-host), hard-refresh the lobby page (enter `/lobby` manually)
3. **Expected**: Within one poll cycle (~2s), the page redirects to `/game`
4. **Expected**: Bob's role ("guesser") is displayed

### Scenario 3: Join room after game started (FR-007)

1. Start a game with 2+ players per Scenario 1
2. Open **Window C** → navigate to `http://localhost:5173` → Join the same room as "Charlie"
3. **Expected**: Error message "Game already in progress" is displayed; Charlie is not admitted

### Scenario 4: Direct navigation to game page while in lobby (FR-006)

1. Open a room in the lobby (do not start the game)
2. In a new tab, enter `http://localhost:5173/game`
3. **Expected**: Page redirects to `/lobby`

### Scenario 5: Game ended state (Edge case)

1. Start a game; the drawer ("Alice") clicks **"Exit Game"**
2. **Expected**: Alice returns to home; the room status changes to `"finished"`
3. In **Window B** (Bob), the status line changes to "Drawer disconnected"

---

## Verification Commands

### Build check (must pass before commit)

```bash
cd backend && npm run build
cd frontend && npm run build
```

### Existing tests

```bash
cd backend && npm test
cd frontend && npm test
```

---

## References

- [Data Model](../specs/005-fix-game-view/data-model.md)
- [API Contracts](../specs/005-fix-game-view/contracts/api.md)
- [Feature Spec](../specs/005-fix-game-view/spec.md)
