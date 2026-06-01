# Tasks: Game Start & Drawer Flow

## Dependencies
Tasks from 001-room-setup must be complete (hostId, name validation, polling).

## Task List
1. **Backend: Add game state to Room model** — Add `drawerId`, `secretWord`, `round` fields; add `playing`/`round_end` statuses.
2. **Backend: Implement startGame()** — Validate host + player count; assign drawer (first participant); select word via `round % words.length`; set status to `playing`.
3. **Backend: Filter secretWord in snapshot** — In `toRoomSnapshot()`, only show secretWord if viewer is the drawer.
4. **Backend: Add POST /rooms/:code/start route** — Wire schema + store method; return 403 for non-host, 400 for <2 players.
5. **Backend: Update tests** — Test startGame validation, drawer assignment, word selection, snapshot filtering.
6. **Frontend: Add startGame to API** — New method in `api.ts`.
7. **Frontend: Add game state to room store** — Add drawerId, secretWord, round.
8. **Frontend: Wire Start Game button** — Call API on click, navigate to /game on success.
9. **Frontend: Show drawer badge on GamePage** — Display "You are the DRAWER" if participantId === drawerId.
10. **Frontend: Show secret word or placeholder** — Drawer sees the word; guessers see "???".
