# Data Model: Room Setup & Lobby

**Date**: 2026-06-11
**Spec**: [spec.md](./spec.md)

## Entities

### Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | string (4 chars) | Unique room identifier. Generated server-side, uppercase. |
| `status` | `"lobby"` \| `"playing"` | Current room lifecycle state. |
| `hostId` | string | `participantId` of the room creator. Used for host-only actions. |
| `participants` | Participant[] | Ordered list of joined participants. |
| `createdAt` | ISO 8601 string | Timestamp of room creation. |
| `updatedAt` | ISO 8601 string | Timestamp of last mutation. |

**Validation rules**:
- `code`: Exactly 4 uppercase alphanumeric chars (excluding 0/O/1/I). Unique.
- `status`: Starts as `"lobby"`. Transitions to `"playing"` via start game.
- `hostId`: Must match a `participantId` in the `participants` array.

**State transitions**:

```
lobby ──(host clicks start, ≥2 players)──> playing
```

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique participant identifier. |
| `name` | string | Display name. Defaults to "Player" if not provided. |
| `joinedAt` | ISO 8601 string | When this participant joined. |

**Validation rules**:
- `name`: Trimmed, non-empty after trim. Default `"Player"` if omitted.
- `id`: Generated server-side via `randomUUID()`.

### RoomSnapshot (public view)

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Same as Room.code. |
| `status` | `"lobby"` \| `"playing"` | Current status. |
| `participants` | Participant[] | All participants. |
| `hostId` | string | The host's participantId. |
| `availableWords` | string[] | Starter word list (static). |
| `roles` | string[] | Role options (static). |

## Relationships

```
Room 1 ── * Participant
Room.hostId ── references ── Participant.id
```

## Identity & Uniqueness

- **Room.code**: Unique, generated with collision check.
- **Participant.id**: UUID, collision probability ignored.
- No uniqueness constraint on participant names within a room — multiple players
  may share the same display name.
