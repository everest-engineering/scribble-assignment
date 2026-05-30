# Data Model: Room Setup & Lobby

**Feature**: 001-room-setup-lobby | **Date**: 2026-05-30

## Entity Relationship

```text
Room 1──* Participant
Room ── hostParticipantId ──> Participant (creator, immutable for session)
```

## Room (internal — backend)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Unique 4-character uppercase alphanumeric code |
| `status` | `"lobby" \| "playing"` | yes | Lifecycle; `"playing"` set when host starts |
| `hostParticipantId` | `string` | yes | UUID of creating participant |
| `participants` | `Participant[]` | yes | Ordered list of joined players |
| `createdAt` | `string` (ISO) | yes | Creation timestamp |
| `updatedAt` | `string` (ISO) | yes | Last mutation timestamp |

### Validation rules

- `code` must be unique across in-memory store
- `hostParticipantId` MUST reference a participant in `participants` after create
- `status` MUST be `"lobby"` to allow join or start; joins allowed only in `"lobby"` for this feature
- Room isolation: all lookups keyed by `code`; no cross-room participant leakage

### State transitions

```text
[create] ──> lobby
lobby ──(host start, ≥2 players)──> playing
```

Restart and round state are out of scope (Scenario 4).

## Participant (internal — backend)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | yes | Stable session identity |
| `name` | `string` | yes | Display name; defaults to `"Player"` if omitted |
| `joinedAt` | `string` (ISO) | yes | Join timestamp |

### Validation rules (Scenario 1)

- Name optional at API layer; trimming/empty rejection deferred to Scenario 2
- Duplicate names within a room allowed

## RoomSnapshot (API response — viewer-safe)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Room code |
| `status` | `"lobby" \| "playing"` | yes | Current room phase |
| `hostParticipantId` | `string` | yes | Host participant id for UI authorization |
| `participants` | `ParticipantSnapshot[]` | yes | Lobby list |
| `availableWords` | `string[]` | yes | Starter word list (unchanged) |
| `roles` | `("drawer" \| "guesser")[]` | yes | Starter roles (unchanged) |

## ParticipantSnapshot (API response)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Participant id |
| `name` | `string` | yes | Display name |
| `joinedAt` | `string` | yes | Join time |
| `isHost` | `boolean` | yes | `true` when `id === room.hostParticipantId` |

## RoomSessionResponse

Returned by `POST /rooms` and `POST /rooms/:code/join`:

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | Caller's participant id (store in frontend session) |
| `room` | `RoomSnapshot` | Initial snapshot |

## Frontend session state (`RoomState`)

| Field | Type | Description |
|-------|------|-------------|
| `room` | `RoomSnapshot \| null` | Latest snapshot |
| `participantId` | `string \| null` | Local player id from create/join |
| `error` | `string \| null` | Last user-facing error |
| `isLoading` | `boolean` | True for explicit actions (create/join/start), not poll ticks |

### Derived lobby UI values (not persisted)

| Derived | Logic |
|---------|-------|
| `isHost` | `participantId === room.hostParticipantId` |
| `canStart` | `isHost && room.status === "lobby" && room.participants.length >= 2` |
| `startBlockedReason` | Copy for non-host, `<2` players, or loading |

## Mapping spec requirements to model

| Requirement | Model support |
|-------------|---------------|
| FR-001 | `Room.code` generated on create |
| FR-002 | `hostParticipantId` set in `createRoom` |
| FR-006 | Rooms stored in `Map<code, Room>` |
| FR-010–FR-011 | Start mutation checks `hostParticipantId` and `participants.length` |
| FR-013 | `ParticipantSnapshot.isHost` |
