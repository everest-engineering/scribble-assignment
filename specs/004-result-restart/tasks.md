# Scenario 4 Tasks: Result, Restart & Final Validation

Checklist of deliverables and implementation order:

- [x] **Backend: Results & Restart Routes**
  - [x] Implement checks to auto-transition status to `RESULTS` on complete guesses
  - [x] Implement `POST /rooms/:code/restart` endpoint
  - [x] Enforce that only the host can restart the room
  - [x] Clear canvas, guess history, and reset scores to 0 on restart

- [x] **Frontend: Results Interface**
  - [x] Render final scoreboard (sorted by score) and final guess history log
  - [x] Render "Restart Game" button exclusively for the host on Results screen
  - [x] Call the backend restart endpoint on click
  - [x] Poll room state and redirect players to Lobby screen once status is `LOBBY`
