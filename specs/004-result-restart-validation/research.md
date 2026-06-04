# Research: Result, Restart & Final Validation

## Decisions

- **Round End Trigger**: Transition room to `"results"` status when all guessers have guessed correctly or the host manually triggers round end.
- **Results Exposure**: When status is `"results"`, the server returns the unmasked `currentWord` to all players (so guessers see what the word was).
- **Restart Processing**: The host POSTs to the `/:code/restart` route. The server resets the room status to `"lobby"`, sets all players' scores to 0, resets `hasGuessedCorrectly` to false, clears `currentWord` and `drawingData`, and keeps all participants in the room.
- **Lobby Redirection**: The frontend detects the status transition back to `"lobby"` via polling and redirects the user view to the lobby interface.
