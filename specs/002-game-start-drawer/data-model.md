# Data Model: Game Start — First Round Drawer & Secret Word

## Entities

### Room

Represents an isolated game session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `code` | `string` | 4 chars, uppercase alphanumeric, unique | Shareable room identifier |
| `status` | `RoomStatus` | `"lobby" \| "playing"` | Current phase of the session |
| `participants` | `Participant[]` | ordered by `joinedAt` | Players currently in the room |
| `hostParticipantId` | `string` | must match a participant `id` | Reference to the current host |
| `drawerId` | `string \| null` | must match a participant `id` when set | Current drawer (null in lobby) |
| `currentWord` | `string \| null` | non-empty when set | Secret word for the active round (null in lobby) |
| `createdAt` | `ISO string` | — | Room creation timestamp |
| `updatedAt` | `ISO string` | — | Last mutation timestamp |

### Participant

Represents a player inside a room.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID v4, opaque | Unique player session identifier |
| `name` | `string` | non-empty after trim | Display name (stored trimmed) |
| `joinedAt` | `ISO string` | — | When the participant entered the room |

### RoomSnapshot

Public view of a room returned to clients. Excludes internal fields.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current status |
| `participants` | `Participant[]` | Visible player list |
| `hostId` | `string` | ID of the current host |
| `drawerId` | `string \| null` | ID of the current drawer (null in lobby) |
| `currentWord` | `string \| null` | Secret word if viewer is drawer; otherwise `null` |
| `availableWords` | `string[]` | Fixed word list for the game |

## Relationships

- One **Room** contains many **Participant** (1:N).
- A **Room** designates exactly one participant as the host via `hostParticipantId`.
- A **Room** designates exactly one participant as the drawer via `drawerId` when `status === "playing"`.
- A **Participant** belongs to exactly one room per session.

## Validation Rules

1. `playerName` must be non-empty after trimming; otherwise rejected with `400` and clear message.
2. `roomCode` must be exactly 4 uppercase alphanumeric characters for joins; otherwise rejected with `404`.
3. `participantId` (returned on create/join) must be included in subsequent `GET` and `POST /start` requests as proof of identity.
4. Only the participant matching `hostParticipantId` may trigger `POST /rooms/:code/start`.
5. `POST /rooms/:code/start` is rejected with `409` if fewer than 2 participants are present.
6. `currentWord` in `RoomSnapshot` is populated only when the requesting viewer's `participantId` matches `drawerId`.

## State Transitions

```
lobby ──[host starts, >=2 players]──> playing
playing ──[host/drawer leaves]──> lobby
```

- **lobby**: Players can join; host can start; `drawerId` is `null`; `currentWord` is `null`.
- **playing**: New joiners are rejected (409); `drawerId` is set to host; `currentWord` is set to first starter word.
- **lobby (after reset)**: When host leaves during `playing`, `status` returns to `lobby`, `drawerId` and `currentWord` are cleared.

## Lifecycle

- **Creation**: `POST /rooms` → create room, add creator as first participant, set creator as host.
- **Join**: `POST /rooms/:code/join` → append participant, update `updatedAt`.
- **Start**: `POST /rooms/:code/start` → set `status = "playing"`, `drawerId = hostParticipantId`, `currentWord = STARTER_WORDS[0]`.
- **Host Transfer / Reset**: When host leaves during `playing`, set `status = "lobby"`, `drawerId = null`, `currentWord = null`, then transfer host to earliest-joined remaining participant.
- **Cleanup**: Room deleted immediately when `participants.length === 0`. Idle rooms (lobby, no joins, no starts) older than 10 minutes are also deleted.
