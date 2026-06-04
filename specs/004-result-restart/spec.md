# 004 – Result, Restart & Final Validation

## Acceptance Criteria

- When a correct guess is made, the game status transitions to `"finished"`
- The results view displays the correct secret word to all players
- Final scores are displayed, sorted from highest to lowest
- Full guess history is displayed with correct/incorrect labels
- Host can restart the game via a dedicated button
- Restart returns all players to the lobby (room status → `"lobby"`, frontend navigates to `/lobby`)
- All players remain in the room after restart (participant list preserved)
- Round-specific data is reset: `drawerId`, `secretWord`, `guesses`, `drawCommands`, `scores` are cleared

## Implementation Details

- `backend/src/services/roomStore.ts`: `submitGuess()` sets `status = "finished"` on correct guess; `restartGame()` clears round data but preserves `participants`
- `frontend/src/pages/GamePage.tsx`: Detects `room.status === "finished"` and renders results view with word, scores, guess history; host sees Restart button; non-hosts see "Waiting for host" message
- `frontend/src/pages/GamePage.tsx`: Polling loop detects `room.status === "lobby"` and navigates to `/lobby`
- `backend/src/api/rooms.ts`: `POST /restart` endpoint validates hostId

## Dependencies

- Depends on: 003-gameplay (game must finish to see results)
- Used by: None (final scenario)
