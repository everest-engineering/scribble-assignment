# Data Model: Game Start & Drawer Flow

## Room

Represents one in-memory game room.

**Fields**

- `code`: Unique room code.
- `hostId`: Player ID for the host.
- `status`: Current room phase. Values for this feature: `lobby`, `inProgress`.
- `participants`: Ordered list of players in the room.
- `currentRound`: Present only after the first round starts.
- `createdAt`: Room creation timestamp.
- `updatedAt`: Last mutation timestamp.

**Relationships**

- Has many `Player` records.
- Has zero or one active `Round`.
- `hostId` should refer to one player in `participants`.

**Validation Rules**

- A room can start only from `lobby`.
- A room must have at least two players before starting.
- Every active player must have a non-empty trimmed name.
- If `hostId` does not match a player, drawer fallback uses the first player.

**State Transitions**

- `lobby` -> `inProgress`: Host starts first round successfully.

## Player

Represents one participant in a room.

**Fields**

- `id`: Unique player identifier.
- `name`: Trimmed display name.
- `joinedAt`: Join timestamp.
- `isHost`: Whether this player is the room host.

**Validation Rules**

- `name` must be trimmed before storage and display.
- Empty or whitespace-only names are rejected.
- Multiple players may share the same display name.

## Round

Represents the first active round.

**Fields**

- `roundNumber`: `1` for this feature.
- `status`: `active` for this feature.
- `drawerId`: Player ID assigned to draw.
- `secretWord`: Deterministically selected word for the drawer.
- `startedAt`: Start timestamp.

**Relationships**

- Belongs to one `Room`.
- `drawerId` refers to one `Player` in the room.
- `secretWord` comes from the starter word list.

**Validation Rules**

- `drawerId` is host ID when possible, otherwise first participant ID.
- `secretWord` is the first starter word for round 1.
- Round state remains stable for the duration of the active round.

## RoomSnapshot

Viewer-safe room representation returned to the frontend.

**Fields**

- `code`
- `hostId`
- `gameState`
- `participants`
- `availableWords`
- `roles`
- `currentRound`

**Viewer-Specific Rules**

- `currentRound.drawerId`, `drawerName`, `roundNumber`, and `status` are visible to all players.
- `currentRound.secretWord` is included only when the requesting viewer is the drawer.
- Non-drawers receive no secret word value.

## StartGameRequest

Represents the viewer asking to start the room.

**Fields**

- `participantId`: Player ID of the requester.

**Validation Rules**

- Required.
- Must match the host to start the game.
- Non-host requests are rejected with a clear error.
