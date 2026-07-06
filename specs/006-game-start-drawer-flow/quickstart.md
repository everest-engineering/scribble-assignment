# Quickstart: Game Start and Drawer Flow

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Two browser tabs open

## Test Scenario 1: Player Name Validation

**Goal**: Empty/whitespace names are rejected with inline errors.

### Create Room — Empty Name
1. Go to `/create-room`
2. Leave player name empty
3. Click "Create and Continue"
4. **Expected**: Inline error message appears. Room is not created. URL remains `/create-room`.

### Create Room — Whitespace Name
1. Go to `/create-room`
2. Enter "   " (spaces) as player name
3. Click "Create and Continue"
4. **Expected**: Inline error message appears. Room is not created.

### Create Room — Trimmed Name
1. Go to `/create-room`
2. Enter "  Alice  " as player name
3. Click "Create and Continue"
4. **Expected**: Name is trimmed to "Alice". Navigates to `/lobby`.

### Join Room — Empty Name
1. Go to `/join-room`
2. Enter valid room code
3. Leave player name empty
4. Click "Join Lobby"
5. **Expected**: Inline error message appears. Room is not joined.

## Test Scenario 2: Game Start

**Goal**: Host can start the game with 2+ players.

1. **Tab 1 (host)**: Create room with name "Alice". Navigate to lobby.
2. **Tab 2 (joiner)**: Join the room with name "Bob".
3. **Tab 1**: Verify "Start Game" button is enabled.
4. **Tab 1**: Click "Start Game".
5. **Expected (Tab 1)**: Navigates to `/game`. Status is now "drawing". Round 1 shown.
6. **Expected (Tab 2)**: Auto-navigates to `/game` (via poll). Status is "drawing".

## Test Scenario 3: Drawer Identification

**Goal**: Host is clearly identified as drawer for round 1.

1. After game start from Scenario 2:
2. **Tab 1 (host/drawer)**: Verify "Drawer" (or equivalent) label is visible next to Alice's name.
3. **Tab 2 (Bob/guesser)**: Verify "Drawer" label is also visible next to Alice's name.
4. Both tabs agree on who the drawer is.

## Test Scenario 4: Secret Word Visibility

**Goal**: Drawer sees the word. Guesser does not.

1. After game start from Scenario 2:
2. **Tab 1 (host/drawer)**: Verify the secret word is displayed prominently (e.g., "rocket").
3. **Tab 2 (Bob/guesser)**: Verify NO secret word is visible anywhere on the screen.
4. **Tab 2**: Open browser DevTools → Network tab. Find the poll request to `GET /rooms/:code`.
5. **Tab 2**: Verify the response contains `"secretWord": null`.

## Test Scenario 5: Cannot Start Alone

**Goal**: Host cannot start with only 1 participant.

1. **Tab 1**: Create room as "Alice".
2. **Tab 1**: Verify "Start Game" button is disabled (greyed out).
3. **Tab 1**: Verify hint text "Need at least 2 players to start" is visible.
4. **Tab 2**: Join the room as "Bob".
5. **Tab 1**: Verify "Start Game" button is now enabled.

## Edge Cases to Verify

- Backend API rejection: Send POST to `/:code/start` via curl with < 2 players → expect 400
- Backend API rejection: Send POST to `/:code/start` as non-host participantId → expect 400
- Backend API rejection: Send create/join with empty name via curl → expect 400
- Secret word determinism: Start same room twice → same word for round 1
- Word wrapping: If testing with 5 words, round 6 should use word[5 % 5 = 0] = "rocket"
