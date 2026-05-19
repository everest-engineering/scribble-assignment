# Data Model: Phase 1 Room Lobby Setup

## Entity: Participant

- `id: string`
  Room-scoped participant identifier returned to the client after create or join.
- `name: string`
  Trimmed display name. Must be non-empty after trimming. Duplicate names are
  allowed within the same room.
- `joinedAt: string`
  ISO timestamp for roster ordering and display continuity.
- `role: "host" | "player"`
  Phase 1 lobby role. The room creator is `host`; all later joiners are `player`.

Validation rules:

- Input names are trimmed before storage.
- Empty or whitespace-only names are rejected.
- Role is assigned by the backend service, not the client.

## Entity: Room

- `code: string`
  Exactly 4 uppercase characters from the easy-to-read alphabet.
- `status: "lobby" | "playing"`
  `lobby` before start; `playing` immediately after a valid host start.
- `hostId: string`
  Participant id of the room creator and sole Phase 1 start authority.
- `participants: Participant[]`
  Room-local roster.
- `createdAt: string`
  ISO timestamp of room creation.
- `updatedAt: string`
  ISO timestamp updated on joins and start transitions.

Validation rules:

- Codes must be unique among active in-memory rooms.
- Only rooms in `lobby` status accept new joins.
- Only `hostId` can start the room.
- A room must have at least 2 participants before start.

## Entity: RoomSnapshot

- `code: string`
- `status: "lobby" | "playing"`
- `hostId: string`
- `participants: Participant[]`
- `availableWords: string[]`
  Existing starter payload, unchanged in Phase 1 even though gameplay use is later.
- `roles: ParticipantRole[]`
  Existing starter payload, unchanged in Phase 1.

Purpose:

- Returned by create, join, fetch, and start endpoints.
- Gives the frontend enough information to derive `isHost`, `canStart`, and
  `disabledReason` without additional endpoints.

## Relationships

- One `Room` has one `hostId` that references exactly one `Participant.id`.
- One `Room` has many `Participant` entries.
- One `RoomSnapshot` mirrors one `Room` for client consumption.

## State Transitions

### Participant lifecycle

1. Create room -> participant is created with role `host`.
2. Join room -> participant is created with role `player`.
3. Participant remains in memory for the life of the room in Phase 1.

### Room lifecycle

1. Create room -> `status = "lobby"`, one host participant exists.
2. Join room -> still `status = "lobby"`, participant roster grows.
3. Start room -> valid host changes `status` from `"lobby"` to `"playing"`.
4. Once `status = "playing"`, further joins are rejected in Phase 1.

## Derived Frontend State

- `isHost = room.hostId === participantId`
- `canStart = isHost && room.status === "lobby" && room.participants.length >= 2`
- `disabledReason`
  - `"Only the host can start the game."` when `!isHost`
  - `"At least 2 players are required."` when host is alone
  - `null` when `canStart`
