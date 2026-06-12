# Data Model: Result, Restart & Final Validation

## Room Status

The room lifecycle gains a third explicit status:

| Status | Description |
|--------|-------------|
| `lobby` | Lobby — players can join, game not started |
| `playing` | Active round — drawer draws, guessers submit |
| `finished` | Round ended — result state displayed, restart available |

## Entities

### Room (extended)

Existing `Room` model gains:

- `status`: `"lobby" | "playing" | "finished"` — current room phase

### ResultState (new — embedded in Room when status === "finished")

- `secretWord`: string — the correct word from the completed round
- `scores`: Record<string, number> — final scores per participant ID
- `guessHistory`: Guess[] — complete guess list from the round
- `endedAt`: string — ISO timestamp of when the round ended

### RestartAction (new — request model)

- `initiatedBy`: string — participant ID of the requester
- `roomCode`: string — target room code

## Relationships

- A `Room` transitions `playing → finished → lobby` (lobby).
- `ResultState` is a read-only snapshot of round data; it is cleared on restart.
- `RestartAction` is authorized against the host identity in the room.

## Validation Rules

- `status` must be `"finished"` before restart is allowed.
- Only the room host may initiate restart.
- On restart, all round-specific fields are cleared: `secretWord`, `scores`,
  `guessHistory`, drawer identity, canvas state.
- On restart, participant list is preserved unchanged.
- ResultState fields are never mutated after creation — only cleared on restart.

## Snapshot Contract Changes

`RoomSnapshot` (returned by `GET /rooms/:code`) should expose:

- When `status === "finished"`:
  - `secretWord`: string (visible to ALL players)
  - `scores`: Record<string, number>
  - `guessHistory`: Guess[]
  - `endedAt`: string
- When `status !== "finished"`:
  - `secretWord`: undefined or omitted (except for drawer during playing)
  - Result-specific fields omitted

This contract ensures that in the finished state, the secret word is no longer
hidden — it is revealed to all participants as the round outcome.
