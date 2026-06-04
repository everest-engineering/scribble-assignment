# Data Model: Room Lobby Access

## Entities

### Room

- `code`: Unique 4-character room code.
- `status`: `lobby` or `game`.
- `hostParticipantId`: Identifier for the player who created the room.
- `participants`: Ordered list of room participants.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last mutation timestamp.

### Participant

- `id`: Unique participant identifier.
- `name`: Display name used in the lobby and game flows.
- `joinedAt`: Join timestamp.

### RoomSnapshot

- `code`: Room code.
- `status`: Current room state.
- `hostParticipantId`: Host identity exposed to the current room view.
- `participants`: Current participant list.
- `availableWords`: Starter word list shown to the room.
- `roles`: Starter role list shown to the room.

## Relationships

- A `Room` has one `hostParticipantId`.
- A `Room` has many `Participant` records.
- A `RoomSnapshot` is a read model derived from a `Room` for the current viewer.

## Validation Rules

- Room codes are unique within the active in-memory session.
- Joining requires a valid existing room code.
- A room cannot transition from `lobby` to `game` unless the caller is the host.
- A room cannot transition from `lobby` to `game` unless it has at least two
  participants.
- All room reads and writes must remain scoped to the target room code.

## State Transitions

- `create` → room created in `lobby` with the creator as host and first
  participant.
- `join` → participant added to the matching room and lobby snapshot refreshed.
- `start` → room status changes from `lobby` to `game` for every participant in
  that room.

## Invariants

- Mutating one room must never alter another room's participants, status, or
  host.
- Read responses must never expose direct mutable references to backend room
  objects.
- The host participant remains stable for the lifetime of the room unless the
  room is reset by later game flow.
