# Data Model: Room Setup & Lobby

## Entities

### Room

Existing fields (unchanged):

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` (4 chars) | Unique alphanumeric room identifier |
| `status` | `"lobby"` or `"playing"` | Room phase; transitions from `"lobby"` to `"playing"` when host starts the game |
| `participants` | `Participant[]` | Players in the room |
| `createdAt` | `string` (ISO) | Room creation timestamp |
| `updatedAt` | `string` (ISO) | Last activity timestamp |

New field:

| Field | Type | Description |
|-------|------|-------------|
| `hostId` | `string` (UUID) | Participant ID of the room host; set at creation, immutable for this feature |

### Participant (modified)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier |
| `name` | `string` | Display name; unique within a room |
| `joinedAt` | `string` (ISO) | When this participant joined |

No changes needed — host is tracked via `Room.hostId`, not a participant field.

### RoomSnapshot (modified)

Add `hostId` to the shape exposed to clients so the frontend can identify the host.

## Validation Rules

| Rule | Source | Enforcement |
|------|--------|-------------|
| Room code must be 4 alphanumeric chars | FR-002 | Backend generation only (not user-supplied) |
| Display name must be unique within room | FR-012 | Backend rejection with 409 on duplicate |
| Empty room code rejected | FR-004 | Zod schema + frontend form validation |
| Non-existent room code rejected | FR-005 | Backend returns 404 from `joinRoom` |
| Only host can start game | FR-008 | Backend validates `participantId === room.hostId` |
| At least 2 players to start | FR-009 | Backend checks `participants.length >= 2` |
| Room cleanup after 5min idle | FR-011 | Backend interval checks `updatedAt` |

## State Transitions

```
[Room Created] ──→ [Lobby] ──→ [Playing]
                     │
                     ├── Player joins (participants += 1)
                     ├── Polling refresh (no state change)
                     └── Idle 5min → Room removed (cleanup)
```

For this feature, rooms transition from `"lobby"` to `"playing"` when the host starts the game. The `"playing"` status signals all clients to navigate to the game view; the actual game rounds, scoring, and turn logic are deferred to a subsequent feature.
