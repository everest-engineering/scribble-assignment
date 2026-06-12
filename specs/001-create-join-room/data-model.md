# Data Model: Room Creation and Join

## Entities

### Room

Represents an isolated game session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `code` | `string` | 4 chars, uppercase alphanumeric, unique | Shareable room identifier |
| `status` | `RoomStatus` | `"lobby" \| "playing"` | Current phase of the session |
| `participants` | `Participant[]` | ordered by `joinedAt` | Players currently in the room |
| `hostParticipantId` | `string` | must match a participant `id` | Reference to the current host |
| `createdAt` | `ISO string` | — | Room creation timestamp |
| `updatedAt` | `ISO string` | — | Last mutation timestamp |

### Participant

Represents a player inside a room.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID v4, opaque | Unique player session identifier |
| `name` | `string` | non-empty after trim | Display name |
| `joinedAt` | `ISO string` | — | When the participant entered the room |

### RoomSnapshot

Public view of a room returned to clients. Excludes internal fields.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current status |
| `participants` | `Participant[]` | Visible player list |
| `hostId` | `string` | ID of the current host |
| `availableWords` | `string[]` | Fixed word list for the game |
| `roles` | `ParticipantRole[]` | Available roles |

## Relationships

- One **Room** contains many **Participant** (1:N).
- A **Room** designates exactly one participant as the host via `hostParticipantId`.
- A **Participant** belongs to exactly one room per session.

## Validation Rules

1. `playerName` must be non-empty after trimming; otherwise rejected with `400` and clear message.
2. `roomCode` must be exactly 4 uppercase alphanumeric characters for joins; otherwise rejected with `404`.
3. `participantId` (returned on create/join) must be included in subsequent `GET` and `POST /start` requests as proof of identity.
4. Only the participant matching `hostParticipantId` may trigger `POST /rooms/:code/start`.
5. `POST /rooms/:code/start` is rejected with `409` if fewer than 2 participants are present.

## State Transitions

```
lobby ──[host starts, >=2 players]──> playing
```

- **lobby**: Players can join; host can start; list refreshes via polling.
- **playing**: New joiners are rejected (409); room state is game-focused.

## Lifecycle

- **Creation**: `POST /rooms` → create room, add creator as first participant, set creator as host.
- **Join**: `POST /rooms/:code/join` → append participant, update `updatedAt`.
- **Host Transfer**: When host leaves, `hostParticipantId` transfers to the earliest-joined remaining participant (FIFO).
- **Cleanup**: Room deleted immediately when `participants.length === 0`. Idle rooms (lobby, no joins, no starts) older than 10 minutes are also deleted.
