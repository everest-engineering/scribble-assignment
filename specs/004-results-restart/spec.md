# Feature Specification: Round Results, Final Scores & Restart Flow

**Feature Branch**: `004-results-restart`

**Created**: 2026-06-15

**Status**: Implemented

**Parent Feature**: `003-guess-submission-scoring`

**Input**: Scenario 4 from Scribble lab business requirements – round completion, result display, and restart mechanics.

## User Scenarios & Testing *(mandatory)*

### User Story 4 - Round results and restart flow (Priority: P3)

Players must see the final outcome and be able to restart cleanly while preserving the room and participants.

**Why this priority**: A complete game experience requires visible results and a restart path for the next round.

**Independent Test**: End a round, verify result state for all players, restart as host, and confirm the room returns to the lobby with players preserved.

**Acceptance Scenarios**:

1. **Given** the round has ended, **When** results are displayed, **Then** all players see the correct secret word, final scores, and complete guess history.
2. **Given** the host restarts the game from the result state, **When** restart is confirmed, **Then** the room returns to the lobby and all round-specific state is cleared while players remain in the room.
3. **Given** a restarted room returns to the lobby, **When** the host prepares the next round, **Then** no previous round guesses or scores persist beyond the displayed final result.

---

## Acceptance Criteria Mapping

| Scenario | Implementation | Validation |
|----------|---|---|
| Result display | All players see secretWord revealed, scores updated, full guess history | ResultPanel displays guesses with ✅/❌ indicators, secret word, scores |
| Round finished state | Room status changes; canRestartGame flag set | toRoomSnapshot() exposes canRestartGame metadata |
| Host restart action | POST /rooms/:code/restart resets to "lobby" status | Room returns to "lobby" with status reset; activeRound cleared |
| Participants preserved | Participants array remains intact after restart | Verify participant list unchanged, scores NOT reset (visible historically) |
| State cleanup | guesses, canvasCleared, and activeRound reset | Restarted room has fresh activeRound, empty guesses, canvasCleared=false |
| Score persistence | Historical scores shown in result; new round starts fresh | Scores visible in final ResultPanel; reset to 0 in next lobby |

---

## Edge Cases & Error Handling

- **Non-host attempts restart**: Reject with message "Only the host can restart the game".
- **Restart when round not finished**: Reject with message "Round must be finished to restart".
- **Multiple restarts in sequence**: Each restart clears state and starts fresh.
- **Player joins mid-result state**: Sees result display with correct word and final scores.
- **Polling during transition**: RoomSnapshot reflects correct canRestartGame state.

---

## Data Model

### Room Lifecycle States

```
lobby → active (round in progress) → finished (result shown) → lobby (after restart)
```

### ActiveRound Extensions

```typescript
interface ActiveRound {
  drawerId: string;
  secretWord: string;
  isFinished: boolean;
  finishedAt?: string;
}
```

### RoomSnapshot Extensions

```typescript
interface RoomSnapshot {
  ...
  guesses: Guess[];
  canvasCleared: boolean;
  canRestartGame: boolean;
}
```

### API Endpoints

- **POST /rooms/:code/restart** – Restart the round (host only)
