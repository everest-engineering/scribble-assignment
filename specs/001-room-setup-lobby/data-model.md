# Data Model: Room Setup and Lobby

## Room

Represents one isolated drawing game session.

**Fields**

- `code`: Unique four-character room code for active rooms.
- `status`: Current room lifecycle state, initially `lobby`, transitioning when the host starts the game.
- `participants`: Ordered list of players currently associated with the room.
- `hostParticipantId`: Participant ID of the current host.
- `createdAt`: Room creation timestamp.
- `updatedAt`: Last room mutation timestamp.

**Validation Rules**

- `code` must uniquely identify one active room.
- Room codes entered by users are trimmed and normalized before lookup.
- A room can be joined only while it is in lobby state.
- Starting a room requires host identity and at least 2 participants.

**State Transitions**

- `not created` -> `lobby`: host creates room.
- `lobby` -> `lobby`: player joins, player list refreshes, or host transfer occurs before start.
- `lobby` -> `in game`: host starts with at least 2 players.
- `lobby` -> `removed`: no players remain before start.

## Participant

Represents a player in one room.

**Fields**

- `id`: Unique participant identifier.
- `name`: Display name shown in the lobby.
- `joinedAt`: Timestamp when the player joined the room.

**Validation Rules**

- Player name is trimmed before submission and backend storage.
- Empty player names are rejected in the frontend and backend for this feature.
- A participant ID must belong to the target room before it can be used for viewer-specific snapshots or start attempts.

## Host

Represents the participant allowed to start the game.

**Fields**

- `participantId`: References a participant in the same room.
- `canStart`: Derived from room status, participant count, and host identity.

**Validation Rules**

- The creator becomes host immediately after room creation.
- Only the current host can start the game.
- If the host leaves before start, host control transfers to the longest-waiting remaining participant.

## RoomSnapshot

Represents the room data returned to frontend clients.

**Fields**

- `code`: Room code.
- `status`: Current room status.
- `participants`: Current lobby participants.
- `hostParticipantId`: Current host participant ID.
- `viewerParticipantId`: Participant ID used to derive viewer-specific fields when provided.
- `isHost`: Whether the requesting participant is the host.
- `canStart`: Whether the requesting participant can start the game now.
- `availableWords`: Existing starter word list retained for downstream gameplay.
- `roles`: Existing starter role list retained for downstream gameplay.

**Validation Rules**

- Snapshot data must only describe the requested room.
- Room isolation must prevent participants or host status from other rooms appearing in the snapshot.
