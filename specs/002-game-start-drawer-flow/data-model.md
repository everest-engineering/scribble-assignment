# Data Model: Game Start & Drawer Flow

## Extensions to Existing Entities

### Room (new fields)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currentRound` | `number` | — | Current round number (starts at 1). Set when game starts. |
| `drawerId` | `string` | — | Participant ID of the current round's drawer. Set when game starts. |
| `secretWord` | `string` | — | The secret word for the current round. Selected deterministically. |

### RoomSnapshot (new fields)

| Field | Type | Condition | Description |
|-------|------|-----------|-------------|
| `currentRound` | `number` | Always present when `status === "playing"` | Current round number. |
| `drawerId` | `string` | Always present when `status === "playing"` | Participant ID of the drawer. |
| `secretWord` | `string` (optional) | Only present when `viewerParticipantId === room.drawerId` | The secret word for the round. Filtered server-side. |

## State Transitions

```text
[lobby] ──→ startGame() ──→ [playing]
  status: "lobby"              status: "playing"
                                currentRound: 1
                                drawerId: room.hostId
                                secretWord: STARTER_WORDS[0]  ← "rocket"
```

## Validation Rules (additions)

- `startGame()`: Room must have `status === "lobby"`. Caller must be host (`hostId === playerId`). Participants must be ≥ 2.
- `toRoomSnapshot()`: `secretWord` field in snapshot is `undefined` unless `viewerParticipantId === room.drawerId`.
- Word selection: `STARTER_WORDS[currentRound - 1]`. For round 1, index 0 → `"rocket"`.

## Relationships

- Room has exactly 1 drawer (a participant in that room) when status is "playing".
- The drawer is always the host in the first round.
- The secret word belongs to the room's current round.
