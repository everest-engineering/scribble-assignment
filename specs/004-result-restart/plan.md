# Scenario 4 Plan: Result, Restart & Final Validation

## Proposed Changes

### Backend Changes

- **Game Completion Check**: In the guess route, check if all guessers have successfully guessed the word. If yes, transition room status to `RESULTS`.
- **POST /rooms/:code/restart**: Implement a restart route.
  - Verify that the requesting participant is the host.
  - Reset room status to `LOBBY`.
  - Reset all participant scores to `0`.
  - Clear `guessHistory`.
  - Clear `canvasData`.
  - Select a new secret word or clear the active word.
  - Keep the participant list intact (retaining host designation and join order).

### Frontend Changes

- **Results Screen**:
  - Show the secret word in full.
  - Render the sorted scoreboard list (descending by score).
  - Render the guess history log.
  - If `currentUser.isHost === true`, show the "Restart Game" button.
- **Restart Request**:
  - Attach a click handler to "Restart Game" which calls `POST /rooms/:code/restart`.
- **Lobby Redirection**:
  - All screens (including Results) poll the room status. When status is detected as `LOBBY`, clear local round state and redirect to the Lobby view.
