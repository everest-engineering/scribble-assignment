# Tasks: Room Setup & Lobby

| # | Task | Dependencies | Status |
|---|------|-------------|--------|
| 1 | Backend: Add `hostId` and `"playing"` status to Room model | Discovery | Done |
| 2 | Backend: Add start game schema, validate empty room codes | 1 | Done |
| 3 | Backend: Set `hostId` on room creation, add `startGame()` logic | 1 | Done |
| 4 | Backend: Add `POST /:code/start` route | 2, 3 | Done |
| 5 | Backend: Write tests for host tracking, start game, code validation | 1-4 | Done |
| 6 | Frontend: Add `hostId` to RoomSnapshot, add `startGame()` API method | 1, 4 | Done |
| 7 | Frontend: Add `startGame()` to room store | 6 | Done |
| 8 | Frontend: Add auto-polling, host detection, conditional start to lobby | 7 | Done |
| 9 | Frontend: Write API tests for startGame | 6 | Done |
| 10 | Validate Scenario 1 with two browser tabs | 1-9 | Done |
