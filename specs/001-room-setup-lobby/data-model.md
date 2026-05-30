# Data Model: Room Setup & Lobby

## Room

Represents one temporary Scribble lobby or started game, isolated by room code.

### Fields

- `code`: Unique room code used by participants to join.
- `status`: Current room state. Valid values for this feature: `lobby`, `in-game`.
- `hostParticipantId`: Participant id assigned when the room is created.
- `participants`: Ordered list of participants in this room.
- `createdAt`: ISO timestamp for room creation.
- `updatedAt`: ISO timestamp for the last room change.

### Validation Rules

- `code` must be non-empty after trimming when supplied by a user.
- `hostParticipantId` must reference a participant in `participants`.
- `status` starts as `lobby`.
- `status` can change from `lobby` to `in-game` only when the requester is host and at
  least two participants are present.
- Rooms are looked up only by exact normalized room code and never share participants.

### State Transitions

```text
lobby --host starts with 2+ participants--> in-game
```

Rejected transitions:

- `lobby` to `in-game` by a non-host.
- `lobby` to `in-game` with fewer than two participants.
- Any start transition for an unknown room.

## Participant

Represents one player inside a room.

### Fields

- `id`: Generated participant identifier used for host checks and viewer context.
- `name`: Display name shown in lobby.
- `joinedAt`: ISO timestamp for when the participant joined.

### Validation Rules

- `id` must be unique within a room.
- `name` should be display-safe and fall back to the existing default if not supplied.
- A participant belongs only to the room they created or joined.

## Room Snapshot

Represents the room state returned to a client.

### Fields

- `code`: Room code.
- `status`: Current room status.
- `hostParticipantId`: Host participant id.
- `participants`: Participants visible in this room.
- `availableWords`: Existing starter words retained for later features.
- `roles`: Existing starter roles retained for later features.

### Validation Rules

- `participants` must include the host participant.
- Snapshot data must be cloned from stored room state before returning.
- Snapshot must not include participants from other rooms.

## Start Game Request

Represents a host attempt to start a room.

### Fields

- `participantId`: The participant attempting to start the game.

### Validation Rules

- `participantId` is required and non-empty.
- Requester must match `hostParticipantId`.
- Room must contain at least two participants.
- Room must still be in `lobby` status.
