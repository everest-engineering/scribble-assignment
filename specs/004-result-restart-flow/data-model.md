# Data Model: Result Restart Flow

## Entity: Room

Represents an isolated in-memory game room.

### Fields Added or Extended

- `status`: Extend lifecycle values to include result state after playing and before restart.
- `currentRound`: Active gameplay data while status is playing; cleared on restart.
- `completedRound`: Read-only result data while status is result; cleared on restart.
- `scores`: Round score values while playing/result; cleared or reset to lobby baseline on restart.
- `updatedAt`: Updated when ending a round and when restarting.

### Validation Rules

- Room code remains unchanged through result display and restart.
- Room participants and host identity remain unchanged through restart.
- Result snapshots are available only when status is result.
- Restart mutates only the addressed room.

## Entity: CurrentRound

Represents the active one-round gameplay state before the round ends.

### Fields Used for Result

- `roundNumber`: Number, remains `1` for this feature.
- `drawerParticipantId`: Participant ID for the assigned drawer.
- `secretWord`: Answer revealed to all players only after the round ends.
- `canvas`: Final canvas state at end-of-round time.
- `guesses`: Ordered accepted guess history.
- `correctGuessParticipantIds`: Participants who received a correct-guess award.
- `startedAt`: ISO timestamp when the round started.

### Validation Rules

- End-round requires an existing active round.
- Drawing, clearing, and guessing are valid only before the room enters result state.
- Active round data is not preserved after restart.

## Entity: CompletedRound

Represents the revealable result snapshot for the ended round.

### Fields

- `roundNumber`: Number for the completed round, remaining `1` for this scope.
- `drawerParticipantId`: Participant ID of the completed round drawer.
- `drawerName`: Display name for the completed round drawer.
- `secretWord`: Revealed answer visible to all current players in result state.
- `canvas`: Final canvas state from the completed round.
- `guesses`: Ordered accepted guess history from the completed round.
- `scores`: Final score entries for all current players at end-of-round time.
- `startedAt`: ISO timestamp from the active round.
- `endedAt`: ISO timestamp when the room entered result state.

### Validation Rules

- Created only by the end-round transition from playing state.
- Does not accept mutations after creation.
- Cleared completely by restart.
- Secret word from this entity is never returned after restart.

## Entity: RestartAction

Represents a host request to move from result state back to lobby.

### Fields

- `roomCode`: Code for the room being restarted.
- `participantId`: Requesting participant ID.

### Validation Rules

- Room must exist.
- Participant must belong to the room.
- Participant must be the host.
- Room status must be result.
- Restart must perform one atomic transition to lobby.

## Entity: RoomSnapshot

Represents the room state returned to a viewer through direct responses and polling.

### Result-State Shape

- `status`: Result state.
- `participants`: Current player list.
- `hostParticipantId`: Preserved host.
- `viewerParticipantId`: Current viewer when supplied.
- `isHost`: Whether the viewer is host.
- `completedRound`: Revealed result data.
- `scores`: Final scores for display.

### Lobby-State Shape After Restart

- `status`: Lobby state.
- `participants`: Same current player list.
- `hostParticipantId`: Same host.
- `canStart`: Existing start eligibility behavior.
- No active or completed round data.
- No scores from the completed round.
- No canvas, guesses, secret word, drawer assignment, or correctness tracking.

## State Transitions

1. `lobby` -> `playing`: Existing start flow initializes one active round.
2. `playing` -> `result`: End-round transition copies revealable active-round outcome into completed result data and stops gameplay mutations.
3. `result` -> `lobby`: Host restart preserves room identity and participants while clearing all round-specific state.

## Reset Matrix

- **Room code**: Preserved when ending the round and preserved on restart.
- **Host participant ID**: Preserved when ending the round and preserved on restart.
- **Participants**: Preserved when ending the round and preserved on restart.
- **Current round**: Copied to completed result data when ending the round and cleared on restart.
- **Completed result data**: Created when ending the round and cleared on restart.
- **Secret word**: Revealed in result state and cleared on restart.
- **Drawer assignment**: Shown in result state and cleared on restart.
- **Canvas**: Shown as final canvas in result state and cleared on restart.
- **Guess history**: Shown in result state and cleared on restart.
- **Scores**: Shown as final scores in result state and reset on restart.
- **Correct-guess tracking**: No longer mutable in result state and cleared on restart.
