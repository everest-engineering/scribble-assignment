# Data Model: Room Setup & Lobby

## Entities

### Room
Represents a game session.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 4-character unique uppercase code. |
| `status` | `"lobby" \| "game"` | Current state of the room. |
| `hostId` | `string` | The `id` of the participant who created the room. |
| `participants` | `Participant[]` | List of players (max 8). |
| `createdAt` | `string` | ISO timestamp. |
| `updatedAt` | `string` | ISO timestamp. |

### Participant
Represents a player.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique UUID. |
| `name` | `string` | Display name (unique within room). |
| `joinedAt` | `string` | ISO timestamp. |

---

## State Transitions

### 1. Create Room
- **Action**: `POST /api/rooms`
- **Transition**: `null` -> `lobby`
- **Result**: Room created, creator assigned as `hostId`, first participant added.

### 2. Join Room
- **Action**: `POST /api/rooms/:code/join`
- **Constraint**: `participants.length < 8`, `name` must be unique in room.
- **Transition**: `lobby` -> `lobby` (updated participants)

### 3. Start Game
- **Action**: `POST /api/rooms/:code/start`
- **Constraint**: `requestingParticipantId === hostId`, `participants.length >= 2`.
- **Transition**: `lobby` -> `game`

### 4. Close Room
- **Action**: Host leaves room.
- **Transition**: `lobby | game` -> `null` (deleted)
