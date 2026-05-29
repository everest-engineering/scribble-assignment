# Data Model: Scenario 1 Room Setup & Lobby

## Room

**Purpose**: Represents one isolated multiplayer game room during the room setup
and lobby phase.

**Fields**:

- `code`: unique 4-character room identifier
- `status`: `"lobby" | "playing"`
- `hostParticipantId`: participant ID of the room host
- `participants`: ordered list of room members
- `createdAt`: room creation timestamp
- `updatedAt`: last room mutation timestamp

**Validation Rules**:

- `code` must be unique among active in-memory rooms
- `status` starts as `"lobby"`
- `hostParticipantId` must reference an existing participant in `participants`
- room start is allowed only when `participants.length >= 2`

**State Transitions**:

- `createRoom` creates a room in `lobby`
- `joinRoom` keeps the room in `lobby`
- `startRoom` transitions `lobby -> playing` only for the host and only when the
  minimum player count is satisfied

## Participant

**Purpose**: Represents a player currently associated with a room.

**Fields**:

- `id`: unique participant identifier
- `name`: display name supplied by the player or default fallback
- `joinedAt`: timestamp when the participant entered the room

**Validation Rules**:

- `id` must be unique within a room
- name validation beyond the current default/fallback behavior is deferred to
  Scenario 2

## Lobby Snapshot

**Purpose**: Represents the room state exposed to the current viewer during
room setup and lobby polling.

**Fields**:

- `code`: room identifier
- `status`: `"lobby" | "playing"`
- `participants`: current participants in the room
- `hostParticipantId`: participant ID for the room host
- `viewerIsHost`: whether the requesting participant is the host
- `canStartGame`: whether the requesting participant may start the game now
- `minimumPlayersToStart`: fixed value `2`

**Derived Rules**:

- `viewerIsHost = participantId === hostParticipantId`
- `canStartGame = viewerIsHost && status === "lobby" && participants.length >= 2`

## Start Game Command

**Purpose**: Represents the host's request to move the room out of the lobby.

**Fields**:

- `code`: target room identifier from the route
- `participantId`: caller identity from the current room session

**Validation Rules**:

- `code` must be a well-formed 4-character room code
- `participantId` must be present
- the room must exist
- the participant must match `hostParticipantId`
- the room must still be in `lobby`
- the room must contain at least 2 participants

## Room Code Input

**Purpose**: Represents user-provided room code entry during join and room fetch
operations.

**Normalization Rules**:

- trim leading and trailing whitespace
- convert letters to uppercase

**Validation Rules**:

- empty or whitespace-only input is rejected
- the normalized value must be exactly 4 characters
- the value must match the starter room-code character set expectations
