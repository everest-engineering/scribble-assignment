# Research: Game Start & Drawer Flow

## Decisions

- **Username Trimming/Validation**: Implement trimming in Express schema validation using Zod's `string().trim().min(1)` (reject empty strings). Re-validate on both create and join routes.
- **Role Assignment**: Start the game by assigning the host as `drawer` and all other players as `guesser`.
- **Word Selection**: Deterministically select the first word from `STARTER_WORDS` ("rocket") upon game start.
- **Word Masking**: The room snapshot returned to clients will check the player's role: if they are a guesser, the server replaces `currentWord` with a masked version (e.g. replacing non-space characters with underscores).

## Rationale

- Ensures the frontend doesn't need complex parsing logic for the secret word layout.
- Prevents leakage of the secret word to the client since guessers never receive the unmasked string over HTTP polling.

## Alternatives Considered

- Frontend-side masking: Rejected because guessers could easily view the secret word in the browser's developer console or network tab.
