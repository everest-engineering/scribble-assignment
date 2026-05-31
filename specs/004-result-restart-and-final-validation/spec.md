## Scenario 4 — Result, Restart & Final Validation

### Acceptance Criteria

**AC4.1 — Result state**
- When a correct guess is made, the room status changes to `"finished"`.
- All players see:
  - The secret word (revealed to everyone).
  - Final scores for all participants.
  - Full guess history (who guessed what and whether it was correct).
- The result state is available via the standard GET /rooms/:code endpoint.

**AC4.2 — Host restart**
- Only the host sees a "Restart Game" button in the result state.
- Clicking it calls POST /rooms/:code/restart.
- Non-host participants see: "Waiting for host to restart..."

**AC4.3 — Restart behavior**
- Restart resets:
  - Room status to `"lobby"`.
  - `drawerId` to `null`.
  - `secretWord` to `null`.
  - `drawingData` to empty.
  - `guesses` to empty.
  - All participant scores to 0.
- Restart preserves:
  - All participants in the room.
  - The host (hostId unchanged).
- After restart, all players are redirected to the lobby.

### Edge Cases

- Restart with only 1 player remaining: host cannot start until a second player joins.
- Restart does not change the room code.
- Multiple restarts work identically (state is fully reset each time).
