# Data Model: Game Start and Drawer Flow

## Room

Represents one active drawing game session.

**Fields**

- `code`: Unique room code.
- `status`: Room lifecycle state, `lobby` before start and `playing` after first round start.
- `participants`: Ordered list of players in the room.
- `hostParticipantId`: Participant ID preferred for first drawer assignment.
- `currentRound`: Present only after first round starts.
- `createdAt`: Room creation timestamp.
- `updatedAt`: Last room mutation timestamp.

**Relationships**

- A room has many participants.
- A room has zero or one current round for this feature.
- A room's current round references one participant as drawer.

**Validation Rules**

- A room can start only from lobby state.
- A room needs at least 2 participants to start.
- Joins are rejected once the room is playing.
- Failed starts do not create or replace `currentRound`.

## Participant

Represents a player in one room.

**Fields**

- `id`: Unique participant identifier.
- `name`: Trimmed display name.
- `joinedAt`: Join timestamp used for first-player fallback.

**Validation Rules**

- Names must contain at least one non-whitespace character after trimming.
- Names are stored and displayed trimmed.
- Drawer assignment can only reference an existing participant in the room.

## CurrentRound

Represents the first active round after the room starts.

**Fields**

- `roundNumber`: `1` for this feature.
- `drawerParticipantId`: Participant assigned to draw.
- `secretWord`: Deterministically selected word from the starter word list.
- `startedAt`: Timestamp when playing state began.

**Validation Rules**

- `drawerParticipantId` must reference a participant in the room.
- `secretWord` must come from the starter word list.
- `secretWord` remains stable for the round.
- A current round is created only when the room transitions from lobby to playing.

## RoomSnapshot

Represents room state returned to a specific viewer.

**Public Fields**

- `code`
- `status`
- `participants`
- `hostParticipantId`
- `viewerParticipantId`
- `isHost`
- `canStart`
- `currentRound.roundNumber`
- `currentRound.drawerParticipantId`
- `currentRound.drawerName`
- `viewerRole`
- `isDrawer`

**Drawer-Only Fields**

- `secretWord`: Present only when the viewer is the drawer.

**Validation Rules**

- Guesser snapshots omit `secretWord` entirely.
- Missing or unknown viewers never receive `secretWord`.
- Public round fields must match for all viewers in the same room.
