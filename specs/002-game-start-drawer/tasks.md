# Tasks: Game Start & Drawer Flow

1. **Extend RoomStatus and models** — Add `playing`, `drawerId`, `secretWord`, `scores` to backend and frontend types
   - Depends on: Feature 001 complete

2. **Name validation schema** — Update create/join schemas with trim + min(1); update frontend forms
   - Depends on: none

3. **Implement selectWord** — Deterministic hash function in roomStore
   - Depends on: task 1

4. **Implement startGame** — Service function with host/lobby/2-player checks
   - Depends on: tasks 1, 3

5. **Update toRoomSnapshot** — Viewer-aware secretWord inclusion
   - Depends on: task 1

6. **Add POST /rooms/:code/start route** — Wire schema, handler, error codes
   - Depends on: task 4

7. **Frontend startGame API + store** — api.startGame, roomStore.startGame
   - Depends on: task 6

8. **Update LobbyPage** — Call startGame on button click; navigate to /game on success
   - Depends on: task 7

9. **Update GamePage** — Drawer word display, guesser placeholder, lobby redirect guard
   - Depends on: tasks 5, 7

10. **Block join during game** — Return 409 if room not in lobby
    - Depends on: task 1

11. **Unit tests + two-browser validation**
    - Depends on: tasks 8, 9, 10
