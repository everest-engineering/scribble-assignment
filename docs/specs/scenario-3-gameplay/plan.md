# Plan — Scenario 3 Gameplay Interaction

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
- frontend/src/components/GuessForm.tsx
- frontend/src/components/Scoreboard.tsx
- frontend/src/styles/app.css

## Backend Changes

- Add a guesses array to the room. Each entry stores guesser id, guesser name, guess text, and whether it was correct.
- Add a score field to each participant, starting at 0.
- Add a submitGuess function that:
  - Checks the guesser is not the drawer.
  - Trims the guess and rejects empty or whitespace-only guesses.
  - Compares guess against the secret word case-insensitively.
  - If correct and the player hasn't scored yet, adds 100 points.
  - Appends the guess to the room's guess history.
  - Returns the updated room.
- Update toRoomSnapshot to include the guesses list and each participant's score.
- Add a new POST route /:code/guess that accepts participantId and guess.

## Frontend Changes

- Update frontend types to include guesses on the snapshot and score on each participant.
- Add a submitGuess method to the room store.
- Update GuessForm to call the submitGuess API. Add frontend validation that rejects empty guesses before sending.
- Replace the canvas placeholder with a real HTML5 Canvas element for the drawer. Add mouse handlers for drawing lines. Add a Clear Canvas button that wipes the drawing.
- Replace the Scoreboard placeholder to show each player's name and current score from the snapshot.
- Add a guess history list showing all guesses with who guessed what and whether it was correct.

## Data Flow

1. Drawer draws on the canvas using mouse drag. Drawing stays local — nothing is sent to the server.
2. Drawer clicks Clear Canvas to wipe the drawing locally.
3. Guesser types a guess and clicks Submit.
4. Frontend trims the guess. If empty, show error and stop.
5. Frontend sends POST /rooms/:code/guess with participantId and guess text.
6. Backend trims the guess, checks the guesser is not the drawer, compares case-insensitively against the secret word.
7. Backend records the guess in the room history. If correct and the guesser hasn't scored yet, adds 100 to their score.
8. Backend returns the updated room snapshot.
9. The existing 2s polling picks up the changes. All players see the updated guess history and scores.

## Testing

Backend:
- Correct guess awards 100 points.
- Incorrect guess awards 0 points.
- Two different players guessing correctly each get 100 points.
- Same player guessing correctly twice only gets 100 once.
- Empty guess is rejected.
- Whitespace-only guess is rejected.
- "rocket", "ROCKET", "Rocket" all match.
- " rocket " is trimmed and matches.
- Drawer submitting a guess is rejected.
- Guess history is returned in every snapshot.

Frontend:
- Drawer sees an interactive canvas and a clear button.
- Guesser sees a guess input and submit button.
- Submitting an empty guess shows an error without calling the API.
- Scoreboard shows all players with their scores, updated via polling.
- Guess history shows all guesses with correct/incorrect markers, updated via polling.
