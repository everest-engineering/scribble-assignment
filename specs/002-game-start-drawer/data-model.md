# Data Model

## Entity: Player
- `id` (string): Unique identifier.
- `name` (string): Player's display name. Maximum 32 characters, trimmed. Must be unique within the lobby.
- `isDrawer` (boolean): Flag indicating if the player is the current drawer.

## Entity: GameState / Room
- `status` (enum: `'lobby' | 'playing'`): Current state of the game.
- `roundNumber` (number): Current round (starts at 1).
- `secretWord` (string | null): The word to be drawn. Sent to the Drawer, scrubbed (set to null or undefined) for non-drawers in the API payload.
- `wordLength` (number | null): The length of the secret word, provided to non-drawers to render the blank spaces.
- `drawerId` (string | null): ID of the player currently assigned as the drawer.
- `players` (array of Player): List of players in the room.

## State Transitions
1. **Lobby → Playing**: Triggered when the game is started. The host (first player in the array) is set as `isDrawer = true` and `drawerId` is populated. `roundNumber` becomes 1. `secretWord` is deterministically selected from the starter list.
