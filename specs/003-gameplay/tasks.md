# Tasks: Gameplay Interaction

## Dependencies
Tasks from 002-game-start must be complete (start game working, drawer assigned, word selected).

## Task List
1. **Backend: Add Guess model + game state** — Add Guess interface, guesses[], scores{}, canvasData to Room and RoomSnapshot.
2. **Backend: Implement submitGuess()** — Trim word, reject empty, case-insensitive compare; score 100 for correct; set round_end on correct.
3. **Backend: Implement updateCanvas()** — Store data URL on Room.
4. **Backend: Add routes** — POST /rooms/:code/guess, PUT /rooms/:code/canvas.
5. **Backend: Update tests** — Test guess validation, scoring, canvas storage.
6. **Frontend: Create Canvas component** — HTML5 Canvas with 2D context, brush drawing (mousedown/mousemove/mouseup), clear button.
7. **Frontend: Wire Canvas to GamePage** — Drawer sees interactive canvas; uploads data URL on mouseup.
8. **Frontend: Wire GuessForm** — Submit calls API; validate non-empty; disable for drawer.
9. **Frontend: Show guess history** — Display guesses list from snapshot.
10. **Frontend: Show scores** — Update Scoreboard to display real scores.
11. **Frontend: Poll snapshot** — Auto-poll GET /rooms/:code in GamePage to refresh guesses, scores, canvasData, status.
12. **Frontend: Handle round_end** — Disable guess form when status is round_end.
