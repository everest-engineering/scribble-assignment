# Data Model: Game Start & Drawer Flow

## Entities

### Room
- `id` (string, unique): Room identifier.
- `status` (enum: 'lobby', 'in-game', 'ended'): Current state of the game.
- `participants` (Map<string, Participant>): List of players in the room.
- `drawerId` (string | null): ID of the current drawer (assigned to host on start).
- `currentWord` (string | null): The secret word for the current round (deterministically selected).
- `hostId` (string): ID of the room creator/host.

### Participant
- `id` (string, unique): Player identifier.
- `name` (string): Trimmed player name.
- `isDrawer` (boolean): Computed property (true if `id === drawerId`).

## Validation Rules
- `name`: Must be trimmed, not empty, not whitespace-only.
- `currentWord`: Must be deterministically selected from `backend/src/seed/starterData.ts`.

## State Transitions
- 'lobby' -> 'in-game': Triggered by `startGame`.
- 'in-game' -> 'ended': Triggered by game end condition or host disconnection.
