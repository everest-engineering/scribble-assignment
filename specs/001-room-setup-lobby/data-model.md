# Data Model: Room Setup & Lobby

## Entities

### `Room`

Represents an active game session.

- **`code`** (`string`): The 6-character alphanumeric unique identifier (e.g., "A1B2C3"). Primary Key.
- **`players`** (`Player[]`): List of players currently in the room. Max 20.
- **`status`** (`'lobby' | 'playing'`): Current state of the room.
- **`lastActivityAt`** (`number`): Timestamp (milliseconds) of the last polling request received from any player in this room. Used for idle cleanup.

### `Player`

Represents a user within a specific room.

- **`username`** (`string`): The player's chosen name. Must be unique within the room.
- **`isHost`** (`boolean`): True if this player created the room. Only one host per room initially.

## State Transitions

- **Room Creation**: A new `Room` is created with status `'lobby'` and one `Player` (the host). `lastActivityAt` is initialized to `Date.now()`.
- **Player Joins**: A new `Player` is added to the `players` array. `lastActivityAt` is updated.
- **Player Leaves**: A `Player` is removed from the `players` array. If the `Player` was the host, or if `players.length === 0`, the `Room` is destroyed.
- **Idle Cleanup**: Every 1 minute, the backend scans all rooms. If `Date.now() - room.lastActivityAt > 5 * 60 * 1000` (5 minutes), the `Room` is destroyed.
