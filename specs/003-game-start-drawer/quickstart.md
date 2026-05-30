# Quickstart: Game Start & Drawer Flow

**Phase 1 output** | **Date**: 2026-05-30

## How to Test This Feature

### Prerequisites

- Backend and frontend running (`npm run dev` in both `backend/` and `frontend/`)
- Two browser tabs open to the app

### Test: Successful game start (all names valid)

1. Tab A: Enter a name, click "Create Room"
2. Tab B: Enter a different name, enter the room code from Tab A, click "Join Room"
3. Tab A: Click "Start Game"
4. **Expected**: Both tabs transition to the game view. Tab A shows "You are the drawer" with the word "rocket". Tab B shows "Drawer: [Tab A's name]" but NO word.

### Test: Invalid name rejected

1. Tab A: Create a room
2. Tab B: Join with a name of `"   "` (whitespace-only)
3. Tab A: Click "Start Game"
4. **Expected**: Game does not start. Tab B sees an inline text input to enter a valid name. Tab A's view shows the lobby still.
5. Tab B: Enter a valid name
6. **Expected**: Game starts automatically. Both tabs transition to game view.

### Test: Non-host cannot start

1. Tab A: Create a room
2. Tab B: Join the room
3. Tab B: Verify there is no "Start Game" button visible
4. **Expected**: Only Tab A (the host) has the start control.

### Test: Deterministic word selection

1. Create two separate rooms (each with 2+ players)
2. Start the game in both rooms
3. **Expected**: The word in both rooms is `"rocket"` (first word in `STARTER_WORDS`)

### Test: Word hidden from non-drawers

1. Tab A (host): Create room → Start game
2. Tab B (other player): Confirm the `currentWord` field is absent from API response in browser devtools
3. **Expected**: Tab B's network tab shows `GET /rooms/:code` response without `currentWord`

## Running Tests

```bash
# Backend
cd backend && npx vitest run

# Frontend
cd frontend && npx vitest run
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Round type, RoomStatus extension |
| `backend/src/services/roomStore.ts` | Name validation, awaiting_rename state, drawer assignment, word selection |
| `backend/src/api/rooms.ts` | Start game validation, rename endpoint |
| `backend/src/api/schemas.ts` | Rename request schema, updated response types |
| `backend/src/seed/starterData.ts` | Expanded word list |
| `frontend/src/pages/GamePage.tsx` | Drawer identification, word display, guessing UI |
| `frontend/src/state/roomStore.ts` | Round state, rename action, polling for awaiting_rename |
| `frontend/src/services/api.ts` | Updated fetchRoom/startGame types, rename API call |
| `frontend/src/components/DrawerIndicator.tsx` | NEW: drawer badge component |
