# Data Model: Room Setup & Lobby

## Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 4-character alphanumeric unique identifier (uppercase) |
| `status` | `RoomStatus` | Current room state: `"lobby"` |
| `hostId` | `string` | UUID of the participant who created the room |
| `participants` | `Participant[]` | Ordered list of joined participants |
| `createdAt` | `string` (ISO 8601) | Timestamp of room creation |
| `updatedAt` | `string` (ISO 8601) | Timestamp of last mutation |

**Validation rules:**
- `code`: MUST be exactly 4 uppercase alphanumeric characters
- `code`: MUST be unique across all active rooms (regenerate on collision)
- `hostId`: MUST reference a valid `id` in `participants`
- `participants`: MUST have at least 1 participant after creation
- `status`: Only `"lobby"` for this scenario

## Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier (server-generated) |
| `name` | `string` | Display name; deduplicated with numeric suffix if collision occurs |
| `joinedAt` | `string` (ISO 8601) | Timestamp of join |

**Validation rules:**
- `name`: MUST be non-empty after trimming
- `name`: If duplicate, server appends " (2)", " (3)", etc. until unique

## RoomSnapshot

Public-facing view sent to clients (no internal fields leaked).

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current state |
| `hostId` | `string` | Host participant ID (new) |
| `participants` | `Participant[]` | Current participants |
| `availableWords` | `string[]` | Starter words (existing) |
| `roles` | `string[]` | Role options (existing) |

## State Transitions

```
[creation] → lobby ──(host starts game)──→ [in-progress] (Scenario 2)
```

Only `lobby` → `in-progress` transition is scoped here. The actual game start and `in-progress` state are defined in Scenario 2.

## API Data Flow

```
POST /rooms
  Request:  { playerName: string }
  Response: { participantId: string, room: RoomSnapshot }
  Logic:    create room → assign hostId → return snapshot

POST /rooms/:code/join
  Request:  { playerName: string }
  Response: { participantId: string, room: RoomSnapshot }
  Logic:    find room → deduplicate name → add participant → return snapshot
  Errors:   404 if room not found, 400 if empty name

GET /rooms/:code?participantId=
  Response: { room: RoomSnapshot }
  Logic:    find room → return snapshot
  Errors:   404 if room not found

POST /rooms/:code/start (new)
  Request:  { participantId: string }
  Response: { room: RoomSnapshot }
  Logic:    validate host → validate min 2 players → update status
  Errors:   403 if not host, 400 if <2 players, 404 if room not found
```
