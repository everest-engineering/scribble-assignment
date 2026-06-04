# Plan: Room Setup & Lobby

## Files to Create

- `.specify/discovery.md` — Discovery notes with incomplete behaviors and assumptions
- `.specify/memory/constitution.md` — Architecture decisions and constraints
- `specs/001-room-setup/spec.md` — Feature spec for room setup
- `specs/001-room-setup/plan.md` — This file
- `specs/001-room-setup/tasks.md` — Task checklist

## Files to Modify

- `backend/src/models/game.ts` — Add `hostId`, `RoomStatus` expansion, new types
- `backend/src/api/schemas.ts` — Add name trimming, new request schemas
- `backend/src/services/roomStore.ts` — Add host tracking, `startGame()`, `restartGame()`
- `backend/src/api/rooms.ts` — Add `POST /start`, `POST /restart` endpoints
- `frontend/src/services/api.ts` — Fix `API_BASE_URL` typo, add new types and methods
- `frontend/src/state/roomStore.ts` — Add `startGame()`, `restartGame()`, `isHost()`
- `frontend/src/pages/LobbyPage.tsx` — Auto-polling, host-only start, min 2 players
- `frontend/src/components/Scoreboard.tsx` — Accept scores/participants props
- `frontend/src/components/ResultPanel.tsx` — Accept guesses prop

## Implementation Order

1. Update backend types and schemas
2. Add host tracking to roomStore
3. Add roomStore tests
4. Add API endpoints
5. Update frontend API client and store
6. Update LobbyPage with polling and host logic
7. Run tests and verify
