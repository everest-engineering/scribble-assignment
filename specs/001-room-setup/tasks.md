# Tasks — Feature Group 1

## Backend Tasks
- [x] FG1-B1: Update Room model — add hostId, expand RoomStatus type
- [x] FG1-B2: Add name validation utility (trim, reject empty/whitespace)
- [x] FG1-B3: Update createRoom to store hostId
- [x] FG1-B4: Update joinRoom to validate names, return proper errors
- [x] FG1-B5: Update toRoomSnapshot to expose hostId
- [x] FG1-B6: Add startGame service function (host check, min 2 players check)
- [x] FG1-B7: Add POST /rooms/:code/start endpoint
- [x] FG1-B8: Add schemas for name validation and start game

## Frontend Tasks
- [x] FG1-F1: Fix API base URL (remove /bug suffix)
- [x] FG1-F2: Add startGame API method
- [x] FG1-F3: Add startGame to roomStore
- [x] FG1-F4: Add automatic polling (~2s) to LobbyPage
- [x] FG1-F5: Gate "Start Game" button behind hostId check
- [x] FG1-F6: Disable "Start Game" when < 2 players
- [x] FG1-F7: Add host indicator to LobbyPage
- [x] FG1-F8: Navigate to /game on successful start

## Dependencies
- FG1-B1, FG1-B2 first (model and utility)
- Then FG1-B3 through FG1-B8 (backend routes)
- Frontend depends on backend being complete
