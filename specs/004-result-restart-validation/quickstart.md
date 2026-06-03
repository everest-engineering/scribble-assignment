# Quickstart: Scribble Game Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03

## Prerequisites

- Node.js 18+ installed
- Dependencies installed: `npm install` in both `backend/` and `frontend/` (and `shared/` if a separate package)

## Running the App

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Backend starts on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Running Tests

```bash
# Backend tests (with coverage)
cd backend && npm test

# Frontend tests (with coverage)
cd frontend && npm test

# Watch mode (TDD)
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

Coverage gate: ≥ 80% line/branch coverage on both sides.

## Manually Testing This Feature

1. Open two browser tabs to `http://localhost:5173`.
2. **Tab A**: Create a room, note the code.
3. **Tab B**: Join with the room code.
4. **Tab A** (host): Start the game.
5. **Tab A**: Draw something on the canvas.
6. **Tab B**: Submit a correct guess (the word shown to the drawer).
7. Observe: Both tabs show the results screen with the correct word, scores (including drawer's 50-pt bonus), and guess history.
8. Observe: A "Returning to lobby in 30s…" countdown appears.
9. **Tab A** (host): Click "Return to Lobby" early.
10. Observe: Both tabs return to the lobby, player list preserved, no round data shown.

## Key Files for This Feature

| Layer | File | Purpose |
|-------|------|---------|
| Shared | `shared/schemas/room.ts` | Add `resultExpiresAt` to `roomSnapshotSchema` |
| Backend model | `backend/src/models/game.ts` | Add `resultExpiresAt` field to `Room` |
| Backend service | `backend/src/services/roomStore.ts` | `restartRoom()`, `checkResultExpiry()`, drawer scoring |
| Backend service test | `backend/src/services/roomStore.test.ts` | TDD tests for new service functions |
| Backend API | `backend/src/api/rooms.ts` | `POST /:code/restart` route |
| Backend schema | `backend/src/api/schemas.ts` | `restartRoomSchema` |
| Frontend API | `frontend/src/services/api.ts` | `restartGame()` |
| Frontend store | `frontend/src/state/roomStore.ts` | `restartGame()` action |
| Frontend component | `frontend/src/components/ResultsScreen.tsx` | Results screen UI + countdown |
| Frontend component test | `frontend/src/components/ResultsScreen.test.tsx` | Component tests |
| Frontend page | `frontend/src/pages/GamePage.tsx` | Mount ResultsScreen; extend polling; lobby navigation |
| Frontend page test | `frontend/src/pages/GamePage.test.tsx` | Updated/new tests |
