# Data Model: Room Setup and Lobby

**Feature**: Scenario 1 | **Date**: 2026-06-03

## Entities

### Participant

| Field | Type | Rules |
|-------|------|-------|
| `id` | string (UUID) | Server-generated |
| `name` | string | 1–24 chars after trim |
| `joinedAt` | string (ISO) | Set on join/create |

### Room

| Field | Type | Rules |
|-------|------|-------|
| `code` | string | 4 chars, uppercase alphanumeric (existing generator) |
| `status` | `"lobby"` | Only value in Scenario 1 |
| `hostParticipantId` | string | Set to creator participant id; immutable in Scenario 1 |
| `participants` | Participant[] | Max 8 |
| `createdAt` | string (ISO) | Set on create |
| `updatedAt` | string (ISO) | Updated on mutation |

### RoomSnapshot (client view)

| Field | Type | Notes |
|-------|------|-------|
| `code` | string | Same as room |
| `status` | `"lobby"` | Same as room |
| `hostParticipantId` | string | **New** — for host UI gating |
| `participants` | Participant[] | Shallow copy |
| `availableWords` | string[] | From seed (unchanged) |
| `roles` | ParticipantRole[] | From seed (unchanged) |

## Validation Rules

### Player name (`normalizePlayerName`)

1. Trim whitespace
2. If empty after trim → throw/reject: `"Player name is required"`
3. If length > 24 → reject: `"Player name must be 24 characters or fewer"`
4. Return trimmed string

### Room code (join)

1. Trim and uppercase on client before submit
2. If empty after trim → reject: `"Room code is required"`
3. If length !== 4 → reject: `"Room code must be 4 characters"`
4. Server uppercases param lookup (existing)

### Join capacity

- If `room.participants.length >= 8` before adding → reject with 409 `"Room is full"`

## State Transitions (Scenario 1)

```text
[none] --createRoom--> lobby (host = creator, 1 participant)
lobby --joinRoom--> lobby (+participant, max 8)
lobby --(Scenario 2 start)--> playing  [OUT OF SCOPE]
```

## Relationships

- One Room has one Host (Participant referenced by `hostParticipantId`)
- One Room has 1–8 Participants
- Room codes are unique keys in the in-memory Map

## Identity & Isolation

- Rooms keyed by `code` in `Map<string, Room>`
- No cross-room references; each API call scopes to a single code
