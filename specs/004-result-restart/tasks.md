# Tasks: Result, Restart & Final Validation

## Dependencies
Tasks from 003-gameplay must be complete (guesses, scoring, canvas working).

## Task List
1. **Backend: Implement restartGame()** — Validate host; reset status=lobby, drawerId=null, secretWord=null, round=0, guesses=[], scores={}, canvasData=null; preserve participants.
2. **Backend: Add POST /rooms/:code/restart route** — Wire schema + store method.
3. **Backend: Update tests** — Test restart validation and state reset.
4. **Frontend: Add restartGame to API + store** — New method.
5. **Frontend: Show result state on GamePage** — When status is round_end, show result panel with correct word, final scores, full guess history.
6. **Frontend: Host-only restart button** — Show "Restart Game" button for host; show "Waiting for host to restart..." for others.
7. **Frontend: Wire restart** — On restart, navigate to /lobby; auto-polling picks up the reset state.
8. **Verification** — Two-browser test: join, play round, see results, restart, verify lobby shows with players preserved.
