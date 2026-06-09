# Data Model: Room Setup & Lobby

## Room

A game session identified by a unique 4-character alphanumeric code.

| Field | Type | Description |
|-------|------|-------------|
| code | `string` | Unique 4-char alphanumeric identifier (primary key) |
| status | `"lobby" \| "in-progress" \| "finished"` | Current game phase |
| participants | `Participant[]` | Players currently in the room |
| hostId | `string` | UUID of the participant designated as host |
| createdAt | `string` (ISO 8601) | When the room was created |
| updatedAt | `string` (ISO 8601) | When the room was last modified |

**Constraints**:
- `code` is unique across all rooms (enforced by Map key in store)
- Room cannot transition backwards through status values
- At least 1 participant always present (the creator)

## Participant

A player within a room.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` (UUID) | Unique identifier for this participant session |
| name | `string` | Display name (1-50 chars, trimmed, non-empty) |
| joinedAt | `string` (ISO 8601) | When the participant joined |

**Constraints**:
- `id` is globally unique (UUID v4)
- `name` is unique only by display — duplicates permitted within a room
- A participant belongs to exactly one room

## RoomSnapshot

The view of a room sent to clients (read-only projection).

| Field | Type | Description |
|-------|------|-------------|
| code | `string` | Room code |
| status | `string` | Current room status |
| participants | `Participant[]` | All participants in the room |
| hostId | `string` | UUID of the host participant |
| availableWords | `string[]` | List of words for drawing rounds |
| roles | `string[]` | Available roles (drawer, guesser) |

## State Transitions

```
lobby ──(host starts game)──> in-progress ──(round ends)──> finished
                                                               │
                                                    (host restarts)
                                                               │
                                                               v
                                                            lobby
```

For this feature (Room Setup & Lobby), only the `lobby → in-progress`
transition is implemented.

## Validation Rules

| Input | Rule | Error |
|-------|------|-------|
| Player name | Must be non-empty after trim, ≤50 chars | "Name is required" |
| Room code (join) | Must match existing room code | "Room not found" |
| Room code (create) | Auto-generated, uniqueness guaranteed | N/A (internal) |
| Start game | Caller must be host | "Only the host can start the game" |
| Start game | Room must have ≥2 participants | "Need at least 2 players to start" |
| Join room | Room status must be "lobby" | "Game already in progress" |
