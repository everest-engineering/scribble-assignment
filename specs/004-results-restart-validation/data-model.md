# Data Model: Results, Restart, and Final Validation

## Entities

### ResultSummary

- `correctWord: string` - word revealed to all players.
- `winnerId: string` - highest-scoring participant id.
- `winnerName: string` - display name for winner.

### Room

- `status: "results"` - result phase after correct guess.
- `participants: Participant[]` - preserved on restart.
- `round: RoundState | null` - cleared on restart.

### RoomSnapshot

- `result: ResultSummary | null`
- `secretWord: string | null`
- `scores: ScoreEntry[]`
- `guesses: Guess[]`

## Validation Rules

- Results are entered after the first correct guess.
- Restart requires current host.
- Restart is allowed only from results.
- Restart preserves room code and participants.
- Restart clears all round state.
