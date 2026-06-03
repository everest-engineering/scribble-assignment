# Quickstart: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02

## Prerequisites

- Node.js 24+ installed
- Dependencies installed: `npm install` at repo root (or in `backend/` and `frontend/` separately)

## Running the project

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

## Running tests

```bash
# Backend tests (Vitest, node environment)
cd backend && npm test

# Backend tests with coverage
cd backend && npm run test:coverage

# Frontend tests (Vitest, jsdom environment)
cd frontend && npm test
```

## Key files for this feature

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Add `drawerId`, `currentWord` to `Room` and `RoomSnapshot` |
| `backend/src/seed/starterData.ts` | `STARTER_WORDS[0]` = "rocket" — the round 1 word |
| `backend/src/services/roomStore.ts` | `startRoom()`, `toRoomSnapshot()` — core logic changes |
| `backend/src/services/roomStore.test.ts` | TDD tests for new `startRoom` behaviour |
| `backend/src/api/rooms.ts` | `POST /:code/start` — pass `participantId` to `toRoomSnapshot()` |
| `shared/schemas/room.ts` | Add `drawerId`, `currentWord` to Zod schema |
| `frontend/src/pages/LobbyPage.tsx` | "Need at least 2 players" label on disabled Start button |
| `frontend/src/pages/GamePage.tsx` | Show drawer name + secret word to drawer only |

## TDD cycle for this feature

1. Write failing test in `roomStore.test.ts` for each new behaviour
2. Update `game.ts` types and `roomStore.ts` to make it pass
3. Update `shared/schemas/room.ts` Zod schema
4. Update `rooms.ts` API handler
5. Update `LobbyPage.tsx` and `GamePage.tsx` UI
6. Write frontend component tests

## Verifying the drawer flow manually

1. Open two browser tabs
2. Tab 1: Create room as "Alice" → note room code
3. Tab 2: Join room as "Bob" using that code
4. Tab 1 (Alice/host): Click "Start Game"
5. Tab 1: Should show "You are the drawer. Your word is: rocket"
6. Tab 2: Should show drawer name "Alice" but NOT show the word "rocket"
7. Inspect network tab on Tab 2 — `currentWord` field in GET response should be `null`
