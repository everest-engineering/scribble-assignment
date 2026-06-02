# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Scenario 1 (Room Setup & Lobby) is fully implemented and functional
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`

## Setup

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## Test Flow (Two Browser Tabs)

### US1: Name Trimming & Validation

1. Open Tab A at `http://localhost:5173`
2. Click "Create Room"
3. Enter `"  Alice  "` (with spaces) as the display name
4. Click submit → verify lobby shows `"Alice"` (no surrounding spaces)
5. Go back, try creating a room with `"   "` → verify error message, no room created
6. Open Tab B, try joining with empty name → verify error message

### US2: Drawer Assignment

1. Tab A creates a room as "Alice"
2. Tab B joins the room as "Bob"
3. Tab A clicks "Start Game"
4. Verify: both tabs navigate to the game screen
5. Verify: both tabs clearly show "Alice" as the drawer
6. Verify: Tab A (Alice) sees a "You are the drawer" indicator
7. Verify: Tab B (Bob) sees "Alice" identified as the drawer

### US3: Secret Word Visibility

1. After game has started (from US2):
2. Verify: Tab A (Alice, drawer) sees the secret word displayed on screen
3. Verify: Tab B (Bob, guesser) does NOT see the secret word anywhere
4. Verify: Check network tab on Tab B → the word is not present in any API response

### Edge Cases

- Single player cannot start (from Scenario 1 rule)
- Non-host cannot start (from Scenario 1 rule)
- Names with internal spaces preserved (e.g., "Alice B" stays as "Alice B")
- Secret word is the same for the same room across multiple sessions

## Validation

```bash
cd backend && npm run build && npm test
cd frontend && npm run build
```
