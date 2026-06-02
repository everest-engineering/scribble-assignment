# Data Model: Gameplay Flow Build-Out

## Entities

### Room
Represents a game room and its current lifecycle state.

- `code: string` — unique room identifier, 4-character alphanumeric code
- `status: "lobby" | "active" | "results"` — current room phase
- `hostId: string` — participant ID of the host who created the room
- `participants: Participant[]` — players currently in the room
- `round: Round | null` — current round state when a game is active
- `createdAt: string` — ISO timestamp when the room was created
- `updatedAt: string` — ISO timestamp for the latest room mutation
- `availableWords: string[]` — words available for secret-word selection
- `guesses: Guess[]` — cumulative guess history for the current round

### Participant
Represents a player in the room.

- `id: string` — unique participant identifier
- `name: string` — trimmed display name
- `joinedAt: string` — ISO timestamp when the player joined
- `score: number` — accumulated score across rounds
- `role: "drawer" | "guesser"` — current role during an active round

### Round
Represents the active game round.

- `drawerId: string` — participant ID of the current drawer
- `secretWord: string` — selected secret word visible only to the drawer
- `startedAt: string` — ISO timestamp when the round began
- `endedAt: string | null` — ISO timestamp when the round ended
- `status: "active" | "finished"` — round completion state

### Guess
Represents a submitted guess.

- `id: string` — unique guess identifier
- `participantId: string` — who submitted the guess
- `text: string` — trimmed guess text
- `normalizedText: string` — lowercased trimmed value used for comparison
- `correct: boolean` — whether the guess matched the secret word
- `createdAt: string` — ISO timestamp of submission

### Scoreboard
A derived view from `participants[].score`.

- `players: Participant[]` — scores ordered by descending score
- `correctGuesses` and `totalGuesses` can be derived from `guesses` if needed

## Validation Rules

- Player names MUST be trimmed and cannot be empty or whitespace-only.
- Room codes MUST be validated as existing codes when joining.
- Guess text MUST be trimmed before submission and rejected if empty after trimming.
- Secret words MUST be visible only to the drawer; other players must not receive the value in their snapshot.
- Host-only actions (game start, restart) MUST be guarded by `hostId` and room phase state.

## State Transitions

- `lobby` → `active`: host starts the game when at least two players are present.
- `active` → `results`: a round ends, either by correct guess or by explicit completion rule.
- `results` → `lobby`: host restarts the game, preserving participants and clearing round data.

## Notes

- The user-visible room snapshot may omit `secretWord` for non-drawer viewers.
- `status` is intentionally explicit to support conditional UI and backend validation.
