# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Two browser tabs open

## Validation Scenarios

### Scenario 1: Host starts game → all see game screen

1. Open Tab A → Navigate to `http://localhost:5173` → Create a room with name "Alice"
2. Open Tab B → Navigate to `http://localhost:5173` → Join the same room with name "Bob"
3. Tab A (Alice, host): Click **Start Game**
4. **Expected**: Both tabs show the game screen within 3 seconds
5. **Expected**: Tab A identifies Alice as "drawer"
6. **Expected**: Tab B identifies Bob as "guesser"

### Scenario 2: Drawer sees secret word

1. Complete Scenario 1
2. Tab A (drawer): **Expected**: The secret word is displayed prominently (e.g., "rocket")
3. Tab B (guesser): **Expected**: No secret word is visible anywhere on screen

### Scenario 3: Guesser cannot draw

1. Complete Scenario 1
2. Tab B (guesser): Verify canvas controls are disabled/hidden
3. **Expected**: Guesser cannot interact with the canvas

### Scenario 4: Deterministic drawer assignment

1. Create a room as Alice, join as Bob → start game
2. **Expected**: Alice (host) is the drawer every time

### Scenario 5: Deterministic word selection

1. Create room with code "ABCD", start game → note the word
2. Recreate room (same creation path) → start game again
3. **Expected**: Same word is selected for rooms created with the same code

### Scenario 6: Page refresh preserves game state

1. Complete Scenario 1
2. Refresh Tab A or Tab B
3. **Expected**: Both return to the game screen with correct role and drawer identity (via polling)
