# Research: Result, Restart & Final Validation

## Decisions

### 1. New Service Methods
- **Decision**: Implement `finishRound(code, participantId)` and `restartGame(code, participantId)` in `backend/src/services/roomStore.ts`.
- **Rationale**: Follows the existing pattern of using `roomStore.ts` as the single source of truth for state mutations.
- **Alternatives**: Mutating the room object directly in the API router (rejected for consistency).

### 2. Round-Robin Drawer Rotation
- **Decision**: In the `startGame` logic, identify the next drawer by finding the index of the `lastDrawerId` in the `participants` array and incrementing it (modulo length).
- **Rationale**: Ensures deterministic joined-order seniority as confirmed by the user.

### 3. Score Persistence
- **Decision**: Only clear `participant.score` when a participant is removed from the room (leaves or exits). The `restartGame` method will NOT reset scores.
- **Rationale**: Aligned with the user's preference for session-long score accumulation.

### 4. Late Guess Rejection
- **Decision**: Update `addGuess` to check `room.status`. If the status is not `playing`, reject the guess with a `403 Forbidden` error.
- **Rationale**: Preserves the finality of the round's "ledger" once the host finishes it.

## Current State Analysis

### Backend
- **startGame**: Currently resets all scores to 0 and assigns the host as the drawer. This needs to be changed to support rotation and persistence.
- **toRoomSnapshot**: Needs to reveal `secretWord` when status is `results`.

### Frontend
- **GamePage**: Needs to handle the `results` status and show a "Finish Round" button for the host.
- **LobbyPage**: Needs to reflect updated roles when the game is restarted.
