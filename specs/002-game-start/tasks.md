# Tasks — Scenario 2: Game Start & Drawer Flow

## Backend
- [x] T2.1 Add `drawerId` and `secretWord` to Room model
- [x] T2.2 Implement drawer assignment (host is drawer)
- [x] T2.3 Implement deterministic word selection (char-code sum of room code)
- [x] T2.4 Update `toRoomSnapshot` to hide word from non-drawers

## Frontend
- [x] T2.5 Show secret word to drawer only (in GamePage card title)
- [x] T2.6 Show "Waiting for drawing..." to guessers (CanvasDisplay)
- [x] T2.7 Navigate to game on successful start (status change detected in LobbyPage)
