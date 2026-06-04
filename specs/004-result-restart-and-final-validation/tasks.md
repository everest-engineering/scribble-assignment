# Tasks — Result, Restart & Final Validation

## Backend
1. Mark room `"finished"` on correct guess (already done in Group 3)
2. Return word to all in snapshot when finished
3. Add `restartGame()` function: host-only, reset to lobby, preserve players, clear round state
4. Add `POST /:code/restart` route

## Frontend
5. Show result card (word, scores, guesses) in GamePage when finished
6. Wire Restart button (host-only, visible when finished), navigate to /lobby

## Dependencies
- Group 3 must be complete
