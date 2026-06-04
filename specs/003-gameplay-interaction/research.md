# Research: Gameplay Interaction

## Decisions

- **Canvas Serialization**: Sync canvas by saving current drawing lines as a serialized JSON structure (or array of lines/points) in the room object. The frontend drawer POSTs the canvas state, and guessers poll it.
- **Guess Validation**: Validate guess input using Zod: trim the string and reject empty strings.
- **Score Calculation**: Store player scores in the room state. Upon a successful guess, verify if the player has already guessed correctly in the current round. If not, add 100 to their score.
- **Guess History Sync**: Store guess history in the room object. Sync the list of guesses via the standard GET room endpoint.
