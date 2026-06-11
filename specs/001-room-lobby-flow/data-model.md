# Data Model: Room Setup and Lobby

## Room

Represents one isolated drawing game room.

### Fields

- `code: string`
  - Unique 4-character room code.
  - Stored normalized as uppercase.
- `status: "lobby" | "playing"`
  - `lobby`: players are waiting in the lobby.
  - `playing`: the Host has started the game.
- `hostParticipantId: string`
  - Participant id of the room creator.
- `participants: Participant[]`
  - Players currently associated with the room.
- `createdAt: string`
  - ISO timestamp when the room was created.
- `updatedAt: string`
  - ISO timestamp when the room last changed.

### Validation Rules

- `code` must match the generated room-code format.
- `hostParticipantId` must reference a participant in the same room.
- Room state is isolated by `code`; operations on one room must not mutate any
  other room.

### State Transitions

```text
lobby -- Host starts with at least 2 players --> playing
```

No transition back to `lobby` is included in this feature.

## Participant

Represents a player in a room.

### Fields

- `id: string`
  - Unique participant identifier.
- `name: string`
  - Trimmed display name.
- `joinedAt: string`
  - ISO timestamp when the player joined.

### Validation Rules

- `name` must be trimmed before storage.
- Empty or whitespace-only names must be rejected with clear feedback.

## Participant Snapshot

Represents participant data sent to clients.

### Fields

- `id: string`
- `name: string`
- `joinedAt: string`
- `isHost: boolean`
  - `true` only for the participant matching `Room.hostParticipantId`.

### Validation Rules

- Exactly one participant snapshot should have `isHost: true` while the host is
  present.

## Room Snapshot

Represents the room state sent to clients.

### Fields

- `code: string`
- `status: "lobby" | "playing"`
- `hostParticipantId: string`
- `participants: ParticipantSnapshot[]`
- `canStartGame: boolean`
  - Viewer-specific flag; `true` only when the viewer is Host, room status is
    `lobby`, and at least two players are present.
- `availableWords: string[]`
  - Existing starter word list retained for downstream game features.
- `roles: ParticipantRole[]`
  - Existing starter roles retained for downstream game features.

### Validation Rules

- `canStartGame` must be false when the viewer participant id is absent, unknown,
  non-host, fewer than two players are present, or room status is not `lobby`.

## Room Session Response

Represents the response after creating or joining a room.

### Fields

- `participantId: string`
  - The viewer's participant id.
- `room: RoomSnapshot`
  - Snapshot of the room from that viewer's perspective.

## Start Game Request

Represents a request to transition a room from lobby to playing.

### Fields

- `participantId: string`
  - Participant attempting to start the game.

### Validation Rules

- Participant must exist in the room.
- Participant must be the Host.
- Room must have at least two players.
- Room must still be in `lobby` state.

## Error States

- Empty room code: clear "room code is required" feedback.
- Invalid room code format: clear "room code format is invalid" feedback.
- Non-existent room code: clear "room cannot be found or joined" feedback.
- Non-host start attempt: clear "only the Host can start" feedback.
- Single-player start attempt: clear "at least two players required" feedback.
