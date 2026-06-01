# Plan — Scenario 2 Game Start And Drawer Flow

## Files To Update

Backend:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/schemas.ts
- backend/src/api/rooms.ts

Frontend:
- frontend/src/services/api.ts
- frontend/src/state/roomStore.ts
- frontend/src/pages/GamePage.tsx
- frontend/src/styles/app.css

## Backend Changes

- Add a role field to each participant. Possible values: "drawer" or "guesser".
- Add currentWord and currentRound fields to the room.
- When the host starts the game, mark the host as drawer and everyone else as guesser.
- Pick the word from the starter list in order. First round gets the first word ("rocket").
- Set room status to "playing" and current round to 1.
- When returning room data, send the actual secret word only if the requesting player is the drawer. For guessers, send null for the word but always include the word length.
- Trim player names on create and join. Reject empty or whitespace-only names with an error.

## Frontend Changes

- Update the TypeScript types in api.ts to include role, currentWord, currentWordLength, and currentRound.
- Update GamePage to check the current player's role to know if they are the drawer.
- Show a "drawer" badge next to the drawer's name so everyone knows who is drawing.
- If the current player is the drawer, show the secret word on screen.
- If the current player is a guesser, show underscores matching the word length instead of the word.
- Add polling in GamePage every 2 seconds, same as LobbyPage, to keep room data fresh.

## Data Flow

1. Host clicks Start Game in the lobby.
2. Frontend sends POST /rooms/:code/start with the host's participant ID.
3. Backend checks the host and player count, then:
   - Sets room status to "playing".
   - Marks the host as drawer, everyone else as guesser.
   - Picks "rocket" as the word for round 1.
4. Backend sends back the room data. The word is set to the actual word for the drawer and null for everyone else. Word length is always included.
5. Frontend navigates to the game page.
6. Drawer sees their role badge and the secret word.
7. Guessers see the drawer badge and underscores hiding the word.
8. All players poll every 2 seconds to stay in sync.

## Testing

Backend:
- Starting a game gives the host the drawer role.
- Non-host players get the guesser role.
- The word is picked from the starter list in order.
- Room status changes to "playing".
- The drawer sees the word in the API response.
- A guesser gets null for the word but still gets the word length.
- Creating a room with an empty name fails.
- Joining a room with a whitespace-only name fails.

Frontend:
- The drawer sees the secret word on the game page.
- A guesser sees underscores instead of the word.
- The drawer is labeled with a badge so everyone knows who is drawing.
