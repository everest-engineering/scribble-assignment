# Data Model: Room Setup & Lobby

## Room Status

```typescript
type RoomStatus = "lobby" | "playing" | "round_end" | "game_over"
```

Adds `"playing"`, `"round_end"`, `"game_over"` to the existing `"lobby"`.

## Participant (updated)

```typescript
interface Participant {
  id: string        // UUID
  name: string      // Trimmed, non-empty
  joinedAt: string  // ISO timestamp
  score: number     // Starts at 0
}
```

Adds `score` field (default 0).

## Room (updated)

```typescript
interface Room {
  code: string            // 4-char alphanumeric, uppercase
  status: RoomStatus      // "lobby" initially
  hostId: string          // Participant.id of the creator
  participants: Participant[]
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

Adds `hostId`.

## State Transitions

```
[create] → status: "lobby", hostId: creator.id
[join]   → status stays "lobby", new participant added
[start]  → status changes to "playing" (only if host + ≥2 players)
```

## Validation Rules

| Field | Rule |
|-------|------|
| `playerName` | Must be non-empty after trimming; whitespace-only rejected |
| `room.code` | 4 chars from safe alphabet; stored uppercase |
| `code` (join input) | Case-insensitive matched; non-existent codes → "Room not found" |
| `status` (join guard) | Only "lobby" rooms accept joins |

## Polling Contract

- Frontend polls `GET /rooms/:code?participantId=...` every ~2s while on lobby page
- Polling starts on lobby mount, stops on unmount (via `clearInterval`)
- Response includes current participant list, room code, status, and host indicator
