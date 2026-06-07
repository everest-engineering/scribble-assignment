# Tasks: Game Start & Drawer Flow

## Backend
- [x] 2.1 — Add `POST /rooms/:code/start` endpoint
- [x] 2.2 — Implement room status transition `"lobby"` → `"playing"`
- [x] 2.3 — Implement drawer assignment (first participant by join order)
- [x] 2.4 — Implement deterministic word selection (index-based from sorted availableWords)
- [x] 2.5 — Add `currentDrawerId`, `currentWord`, `status` to Room model
- [x] 2.6 — Update `toRoomSnapshot` to hide `currentWord` from non-drawer viewers
- [x] 2.7 — Add host-only check on start endpoint

## Frontend
- [x] 2.8 — Add `startGame()` to API client
- [x] 2.9 — Add `startGame()` to room store
- [x] 2.10 — Wire "Start Game" button in LobbyPage to call API
- [x] 2.11 — Navigate to `/game` on successful start
- [x] 2.12 — Update GamePage to detect role (drawer vs guesser) from snapshot

## Validation
- [x] 2.13 — Manual test: start game, verify drawer assignment, word visibility
