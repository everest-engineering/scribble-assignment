# Data Model: Result & Restart Flow

## Key Entities

### Room

Represents the shared game container for a room.

- `code: string` — unique room code
- `hostId: string` — participant ID of the room host
- `participants: Participant[]` — active players in the room
- `gameState: "lobby" | "inProgress" | "finished"`
- `currentRound?: Round` — details for the active or finished round

### Participant

Represents a player in the room.

- `id: string` — unique participant identifier
- `name: string` — trimmed display name
- `isHost: boolean` — true if the participant created the room or is the current host

### Round

Represents the current or completed round.

- `roundNumber: number`
- `status: "active" | "finished"`
- `drawerId: string`
- `drawerName: string`
- `secretWord: string`
- `guessHistory: Guess[]`
- `totalScore: number`
- `result?: RoundResult`

### Guess

Represents a submitted guess during the round.

- `participantId: string`
- `participantName: string`
- `text: string`
- `normalizedText: string`
- `isCorrect: boolean`
- `score: number`
- `submittedAt: number`

### RoundResult

Represents the resolved outcome of a finished round.

- `finishedAt: number`
- `correctWord: string`
- `finalScores: Record<string, number>`

## State Transitions

### From `lobby` to `inProgress`

- A host starts the game.
- `gameState` becomes `inProgress`.
- `currentRound` is initialized with a drawer, `secretWord`, and `guessHistory`.

### From `inProgress` to `finished`

- The round completes.
- `currentRound.status` becomes `finished`.
- `currentRound.result` is populated with final score summary.
- `gameState` becomes `finished`.

### From `finished` to `lobby` (restart)

- The host triggers `POST /rooms/:code/restart`.
- `currentRound` is cleared or reset.
- `gameState` becomes `lobby`.
- `participants`, `hostId`, and `code` remain unchanged.

## Validation Rules

- `participants` must remain intact across restart.
- `secretWord` and `guessHistory` must be preserved in the result view, then cleared during restart.
- `Round.status` must clearly indicate whether the snapshot is active or finished.
- `gameState` must be authoritative for client rendering: `finished` renders results, `lobby` renders lobby, `inProgress` renders game.
