# Data Model: Scenario 1 — Room Setup & Lobby

**Phase**: 1 — Design & Contracts

## Entities

### Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 4-char alphanumeric (unique, generated) |
| `status` | `RoomStatus` | Always `"lobby"` in Scenario 1 |
| `participants` | `Participant[]` | Players in this room; first participant = creator |
| `hostId` | `string` | ID of the participant who created the room (NEW) |
| `createdAt` | `string` (ISO) | Room creation timestamp |
| `updatedAt` | `string` (ISO) | Last mutation timestamp |

**Validation**:
- `code`: 4 chars, uppercase, chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ambiguous chars excluded)
- `hostId`: Must match a participant ID in `participants[]`

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier |
| `name` | `string` | Display name (defaults to "Player") |
| `joinedAt` | `string` (ISO) | When this participant joined |

### RoomSnapshot

Public-facing view of a Room sent to clients.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current room status |
| `participants` | `Participant[]` | All participants |
| `hostId` | `string` | Creator's participant ID (NEW) |
| `availableWords` | `string[]` | Word list for drawing |
| `roles` | `ParticipantRole[]` | Available roles |

## State Transitions (Scenario 1)

```
[No Room] ──create──► [Room: lobby, participants=[creator], hostId=creator.id]
                           │
                           ├──join──► [Room: lobby, participants+=[joiner]]
                           │
                           └──start──► (Transition to game — handled in future scenarios)
```

## Key Relationships

- **Room 1──N Participant**: One room has many participants
- **Room.hostId references Participant.id**: Host must be an existing participant
- **Room ←→ RoomSnapshot**: Snapshot is a projection (DTO), not a separate entity
