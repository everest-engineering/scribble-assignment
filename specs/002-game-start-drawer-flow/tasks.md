# Tasks: Game Start & Drawer Flow

| # | Task | Dependencies | Status |
|---|------|-------------|--------|
| 1 | Backend: Add `drawerId`, `secretWord`, `round` to Room model | S1 Complete | Done |
| 2 | Backend: Require playerName with trim, reject empty/whitespace | 1 | Done |
| 3 | Backend: Add `selectWord()`, assign drawer on start, gate secretWord | 1, 2 | Done |
| 4 | Backend: Write tests for drawer assignment, word selection, gating | 1-3 | Done |
| 5 | Frontend: Add drawerId, secretWord?, round to RoomSnapshot type | 1 | Done |
| 6 | Frontend: Add client-side name validation to CreateRoomPage | 2 | Done |
| 7 | Frontend: Add client-side name/code validation to JoinRoomPage | 2 | Done |
| 8 | Frontend: Update GamePage with drawer display, secret word, role | 5 | Done |
| 9 | Validate Scenario 2 with two browser tabs | 1-8 | Done |
