# Feature Specification: Result, Restart & Final Validation

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "When a round ends, all players see the correct word, final scores, and full guess history. The host can restart — everyone returns to the lobby with players preserved and round state cleared."

## User Scenarios & Testing

### User Story 1 - Result state after correct guess (Priority: P1)

When a guesser submits the correct word, the round ends. All players see the result: the correct word, final scores, and full guess history.

**Why this priority**: Core flow — players need to see the outcome.

**Independent Test**: Can be tested by submitting the correct word from one tab and verifying the other tab shows the result.

**Acceptance Scenarios**:

1. **Given** a game is in progress and a correct guess is submitted, **When** the round ends, **Then** all players see the correct word revealed.
2. **Given** the result state is displayed, **When** any player views the screen, **Then** they see the full guess history and final scores.
3. **Given** a correct guess ends the round, **When** the drawer views the screen, **Then** the canvas is read-only (drawing disabled).

---

### User Story 2 - Host restarts the game (Priority: P1)

The host can restart the game from the result screen. All players return to the lobby with their names preserved. Round-specific state (guesses, scores, drawer, secret word) is cleared.

**Why this priority**: Core flow — enables replay without rejoining.

**Independent Test**: Can be tested by ending a round, clicking restart as host, and confirming both tabs land on lobby with players intact.

**Acceptance Scenarios**:

1. **Given** the result state is displayed, **When** the host clicks "Play Again" (or "Restart"), **Then** the room status transitions to "lobby" and all participants are redirected to the lobby.
2. **Given** the result state is displayed, **When** a non-host views the screen, **Then** the restart button is disabled or hidden.
3. **Given** the host restarts, **When** the lobby loads, **Then** all previous participants are still in the room, but guesses, scores, drawerId, secretWord, and round are reset.

### Edge Cases

- What if a guesser submits a guess after the round has ended? — Rejected with a "Game is not in progress" error.
- What if all players leave before restart? — Room still exists in memory until server restarts.
- What if correct guess happens on the last possible guess? — Same behavior; round ends, result shown.

## Requirements

### Functional Requirements

- **FR-001**: Backend MUST transition room status from "playing" to "finished" when a correct guess is submitted.
- **FR-002**: Backend MUST reveal the secret word to all players when status is "finished" (include it in snapshot).
- **FR-003**: Backend MUST expose `POST /rooms/:code/restart` that only the host can call.
- **FR-004**: Backend MUST clear round state (guesses, scores, drawerId, secretWord, round) on restart while preserving participants.
- **FR-005**: Backend MUST set room status back to "lobby" on restart.
- **FR-006**: Frontend result screen MUST show the correct word, full guess history, and final scores.
- **FR-007**: Frontend MUST disable the canvas and guess input when status is "finished".
- **FR-008**: Frontend result screen MUST show "Play Again" button (host-only) and "Exit" button for all.
- **FR-009**: Frontend MUST redirect to lobby on successful restart.

### Key Entities

- **RoomStatus**: extended to include "finished".
- **RoomSnapshot**: `secretWord` is revealed to all when status is "finished".

## Success Criteria

- **SC-001**: Correct guess triggers result state visible to all within 2 seconds.
- **SC-002**: All players see the correct word, scores, and guess history.
- **SC-003**: Host can restart and both tabs return to lobby within 2 seconds.
- **SC-004**: After restart, previous guesses and scores are gone but participants list is intact.

## Assumptions

- The round ends immediately when any guesser submits the correct word.
- Only one round per game (drawer rotation is out of scope).
- Restart goes back to lobby; re-starting the game requires the host to click "Start Game" again.
