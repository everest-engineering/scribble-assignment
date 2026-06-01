# Quickstart: Game Start and Drawer Flow

## Prerequisites

- Backend and frontend dev servers running (`cd backend && npm run dev` + `cd frontend && npm run dev`)
- Browser open at `http://localhost:5173`

## Manual Test Scenarios

### Scenario 1: Join with Valid Name

1. Open `http://localhost:5173` in Browser A
2. Click "Create Room", enter "Alice" → redirected to `/lobby`
3. Open `http://localhost:5173` in Browser B (incognito)
4. Click "Join Room", enter code from Browser A, enter "Bob" → both see each other in participant list

### Scenario 2: Reject Empty / Whitespace Name

1. On join screen, submit empty string → see error message
2. Submit `"   "` (spaces) → see error message
3. Submit `"  Alice  "` → name trims to "Alice" and join succeeds

### Scenario 3: Reject Duplicate Name

1. Browser A joined as "Alice"
2. Browser B tries to join with "Alice" → see error: "Name already taken"
3. Browser B tries to join with "alice" → succeeds (case-sensitive)

### Scenario 4: Reject Name Over 20 Characters

1. Enter name longer than 20 characters → see error message

### Scenario 5: Start Game as Host

1. Two+ players in lobby (Browser A = host who created room)
2. Browser A clicks "Start Game" → both browsers navigate to `/game`
3. Browser A sees "You are the drawer" and the secret word
4. Browser B sees "You are the guesser", no secret word visible

### Scenario 6: Non-Host Cannot Start

1. Browser B (non-host) is in lobby
2. Browser B has no "Start Game" button (or sees disabled button)

### Scenario 7: Cannot Start with One Player

1. Only Browser A in lobby
2. "Start Game" button is disabled or shows "Need at least 2 players"

### Scenario 8: Drawer Leaves Mid-Game

1. Game started with 3+ players
2. Drawer (Browser A) navigates away → new drawer assigned from remaining players
3. Remaining players see updated drawer assignment on next poll

### Scenario 9: Deterministic Behavior

1. Create room with players A, B, C
2. Start game → note drawer and word
3. Create new room with same players A, B, C in same order
4. Start game → same drawer and same word (verifiable by testing)

### Scenario 10: Word Visible Only to Drawer

1. Game in progress, Browser A is drawer
2. Browser A sees secret word displayed prominently
3. Browser B (guesser) sees "The word has been selected" or similar placeholder
4. Browser B's network tab shows `secretWord` is absent from the API response
