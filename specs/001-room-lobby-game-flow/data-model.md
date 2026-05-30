# Data Model: Room Lobby Game Flow

## Entities

### Room
- `code: string` — uppercase room code.
- `status: "lobby" | "playing" | "results"` — current room phase.
- `hostId: string` — participant id for the current host.
- `participants: Participant[]` — participants currently in the room.
- `round: RoundState | null` — current single-round state when play has started.
- `createdAt: string` — ISO timestamp when the room was created.
- `updatedAt: string` — ISO timestamp when the room was last changed.

### Participant
- `id: string` — unique UUID assigned on join.
- `name: string` — display name after trimming; empty values are rejected.
- `joinedAt: string` — ISO timestamp when the participant joined.

### RoomSnapshot
- `code: string` — room code for the client.
- `status: "lobby" | "playing" | "results"` — stage indicator.
- `hostId: string` — current host.
- `participants: Participant[]` — visible participant list.
- `drawerId: string | null` — current drawer during play and results.
- `secretWord: string | null` — visible to the drawer during play and to all players in results.
- `drawing: DrawingData` — synced drawing state.
- `guesses: Guess[]` — synced guess history.
- `scores: ScoreEntry[]` — deterministic score table.
- `result: ResultSummary | null` — shared result details.
- `availableWords: string[]` — current word set from `backend/src/seed/starterData.ts`.
- `roles: string[]` — starter role list from `backend/src/seed/starterData.ts`.

### RoundState
- `drawerId: string` — deterministically selected drawer.
- `secretWord: string` — deterministically selected word.
- `drawing: DrawingData` — latest canvas payload.
- `guesses: Guess[]` — submitted guesses.
- `scores: Record<string, number>` — score by participant id.
- `result: ResultSummary | null` — populated when the correct word is guessed.

### DrawingData
- `paths: DrawingPath[]` — compact drawing paths sent by the drawer.

### Guess
- `id: string` — unique guess id.
- `participantId: string` — submitting participant.
- `playerName: string` — display name at submission time.
- `text: string` — trimmed guess text.
- `isCorrect: boolean` — whether the guess matched the secret word.
- `createdAt: string` — ISO timestamp.

### ResultSummary
- `correctWord: string` — the round word.
- `winnerId: string` — highest scoring player.
- `winnerName: string` — highest scoring player display name.

### Room Session
- `participantId: string` — viewer identity stored in frontend room state.
- `room: RoomSnapshot` — latest room snapshot returned by the backend.

## Validation rules

- `playerName` is required after trimming for create and join.
- `code` is normalized to uppercase for join and fetch operations.
- Invalid room codes or missing rooms return HTTP 404 with a user-friendly error.
- Start requires the current host and at least two players.
- Drawing updates and clear requests require the current drawer.
- Guesses are trimmed and empty guesses are rejected.
- Restart requires the current host and results status.

## Notes

- The backend keeps a single global `Map<string, Room>` for active rooms.
- The frontend keeps `participantId` and room snapshot in a singleton `RoomStore` during in-app navigation only.
- No persistence beyond process lifespan is permitted.
