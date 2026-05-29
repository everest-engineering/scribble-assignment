# Data Model: Room Setup & Lobby

## Room

| Field | Type | Description |
|-------|------|-------------|
| code | string (4-char uppercase) | Unique room identifier |
| status | "lobby" \| "playing" \| "result" | Lifecycle state |
| hostId | string (UUID) | participant.id of the room creator; set on createRoom, never changes |
| participants | Participant[] | Ordered array; index 0 is always the host |
| createdAt | ISO8601 string | Set once at creation |
| updatedAt | ISO8601 string | Updated on any mutation |

**State transitions**:
```
lobby → playing   (via POST /rooms/:code/start, host only, ≥2 participants)
playing → result  (Group 4 — not in scope for this group)
result → lobby    (Group 4 — not in scope for this group)
```

## Participant

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Stable identity for the session |
| name | string (trimmed, min 1 char) | Display name |
| joinedAt | ISO8601 string | When they joined |

## RoomSnapshot (API response shape)

| Field | Type | Notes |
|-------|------|-------|
| code | string | Room code |
| status | "lobby" \| "playing" \| "result" | Current state |
| hostId | string | Identifies the host for frontend role detection |
| participants | Participant[] | Full list |
| availableWords | string[] | Seed word list (unchanged for this group) |
| roles | ParticipantRole[] | Seed roles (unchanged for this group) |

## Validation Rules

- `playerName`: required; trimmed before check; min 1 char after trim; max not enforced
- `code` (join): required; trimmed; normalised to uppercase; must match existing room
- `participantId` (start): required in body; must equal room.hostId
