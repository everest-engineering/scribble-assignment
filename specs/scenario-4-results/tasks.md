# Tasks - Scenario 4 Results And Restart

## Phase 1 - Backend Changes

### T-001 Add Result State

Files

- backend/src/models/game.ts

Dependencies

- None

Goal

- Add "results" status to the room status type.

### T-002 Add Restart Function

Files

- backend/src/services/roomStore.ts

Dependencies

- T-001

Goal

- Add restartGame function that clears current word, guesses, scores, and roles.
- Set room status back to "lobby" and reset all roles to "guesser".
- Only host can restart. Reject non-host attempts.

### T-003 Add Restart Route

Files

- backend/src/api/schemas.ts
- backend/src/api/rooms.ts

Dependencies

- T-002

Goal

- Add POST /:code/restart route that accepts participantId.

### T-004 Show Word To All On Results

Files

- backend/src/services/roomStore.ts

Dependencies

- T-001

Goal

- When room status is "results", send the correct word to all viewers (not hidden).

## Phase 2 - Frontend Changes

### T-005 Update Frontend Types

Files

- frontend/src/services/api.ts

Dependencies

- T-001

Goal

- Add "results" to the room status type on the frontend.

### T-006 Add Restart Method To Store

Files

- frontend/src/state/roomStore.ts

Dependencies

- T-003
- T-005

Goal

- Add restartGame method to the room store that calls the restart API.

### T-007 Build Result Screen

Files

- frontend/src/pages/GamePage.tsx
- frontend/src/styles/app.css

Dependencies

- T-004
- T-005

Goal

- Detect when room status is "results" and show result view.
- Show the correct word to all players.
- Show final scores for each player.
- Show full guess history from the round.

### T-008 Add Restart Button

Files

- frontend/src/pages/GamePage.tsx

Dependencies

- T-006
- T-007

Goal

- Show "Restart Game" button only for the host.
- On restart, navigate all players back to the lobby.

## Phase 3 - Testing

### T-009 Test Restart Backend

Dependencies

- T-002

Goal

- Restart clears word, guesses, scores, and roles.
- All players stay in the room after restart.
- Non-host cannot restart.
- Restart works a second time.

### T-010 Test Result Screen

Dependencies

- T-007

Goal

- Result screen shows correct word to all players.
- Result screen shows final scores and guess history.
- Only host sees the restart button.
- Restart navigates to lobby with players preserved.
