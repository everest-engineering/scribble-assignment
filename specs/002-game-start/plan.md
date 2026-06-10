# Scenario 2 Plan: Game Start & Drawer Flow

## Proposed Changes

### Backend Changes

- **POST /rooms/:code/start**: Implement a new route to transition a room's state to "active". Verify that the request is sent by the host player.
- **Drawer Selection**: Randomly or deterministically select a player from the participants list to be the drawer. Update the room status and assign the drawer's ID to `currentDrawerId`.
- **Word Selection**: Pick a secret word from the predefined array of words (`rocket`, `pizza`, etc.). Assign it to `secretWord` on the room state.
- **Filtering sensitive info**: Modify `GET /rooms/:code` route so that the `secretWord` is omitted from the response unless the requesting client matches the `currentDrawerId`.

### Frontend Changes

- **Start Game API Call**: In Lobby, when the Host clicks the active "Start Game" button, trigger a `POST /rooms/:code/start` request to the backend.
- **Game Screen Polling**: Implement HTTP polling on the Lobby component or within the room store. When the polled state shows the status is active, navigate all participants to the Game route (`/room/:code/game`).
- **Game UI Layout**: On the game page, read the current player ID and compare it with `currentDrawerId`.
  - If they are the drawer, render the drawing tool panel, the canvas in interactive mode, and display the plaintext `secretWord`.
  - If they are a guesser, disable canvas editing (readonly canvas view) and show the secret word placeholder (e.g., `_ _ _ _ _`).
