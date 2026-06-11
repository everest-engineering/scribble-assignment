# Discovery Notes

## Observed Incomplete Behaviors

1. Users can create a room without entering any required input.
2. The game landing screen is not yet fully implemented. The scoreboard, activity feed, and canvas areas remain incomplete, and the Submit Guess action does not currently process user input.
3. The available words list is not displayed on the game landing screen.
4. The user's assigned role is not displayed in the game interface.

## Working Assumptions

1. There is currently no enforced limit on the number of players in a room.
2. A game session continues until the user explicitly clicks the Exit Game button.
3. Refreshing the page causes the user to leave the active game session.

## Relevant Files

- `frontend/src/pages/CreateRoomPage.tsx`: Handles the room creation form, which currently allows submission with an empty player name.
- `frontend/src/pages/GamePage.tsx`: Defines the game landing screen layout, including the canvas placeholder, player details, scoreboard, result panel, and exit flow.
- `frontend/src/components/GuessForm.tsx`: Renders the Submit Guess form, which currently prevents the default form submission without processing the entered guess.
- `frontend/src/components/Scoreboard.tsx`: Displays scoreboard information on the game landing screen.
- `frontend/src/components/ResultPanel.tsx`: Displays activity and result information on the game landing screen.
- `frontend/src/state/roomStore.ts`: Manages frontend room state, participant tracking, and room refresh behavior.
- `frontend/src/services/api.ts`: Defines the frontend API contract for creating rooms, joining rooms, and fetching room snapshots.
- `backend/src/api/schemas.ts`: Defines backend request validation for room creation and room joining.
- `backend/src/api/rooms.ts`: Provides backend API routes for creating, joining, and fetching rooms.
- `backend/src/services/roomStore.ts`: Manages in-memory room data, participant creation, available words, and room snapshot generation.
- `backend/src/models/game.ts`: Defines backend game model types for participants, rooms, and room snapshots.
