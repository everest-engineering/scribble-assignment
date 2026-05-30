# Data Model: Game Start and Drawer Flow

## Entities

### Room

- `status: "lobby" | "playing" | "results"` - moves from lobby to playing on valid start.
- `hostId: string` - participant allowed to start.
- `participants: Participant[]` - source for drawer assignment.
- `round: RoundState | null` - initialized on start.

### RoundState

- `drawerId: string` - host or first player selected for the first round.
- `secretWord: string` - deterministic word from starter list.
- `drawing` - initialized empty for later gameplay.
- `guesses` - initialized empty for later gameplay.
- `scores` - initialized for participants.

### RoomSnapshot

- `drawerId: string | null` - visible to all players.
- `secretWord: string | null` - visible only to the drawer while playing.

## Validation Rules

- Player names must already be trimmed and non-empty.
- Start requires current host.
- Start requires at least two players.
- Secret word selection is deterministic.
