# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation: Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Display Round Results (Priority: P1)

When a round ends, all players (drawer and guessers) see a results screen showing the correct word, final scores for all players, and the complete guess history. The results screen replaces the game view.

**Why this priority**: Without results, players have no feedback on the round outcome or sense of closure. This is essential for the game loop.

**Independent Test**: Can be fully tested by ending a round and verifying the results screen displays the correct word, all scores, and the complete guess history to all players.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the results, **Then** the correct secret word is prominently displayed.
2. **Given** a round has ended, **When** any player views the results, **Then** all player scores are shown, sorted by score (highest first).
3. **Given** a round has ended, **When** any player views the results, **Then** the complete guess history is visible, showing each guess with its correctness.

---

### User Story 2 — Host Restarts the Game (Priority: P1)

After the results are displayed, the host can restart the game. On restart, all players are returned to the lobby with their names preserved. All round-specific state (strokes, guesses, scores, word, drawer assignment) is cleared.

**Why this priority**: Without restart, players must create a new room to play again, breaking the flow. This completes the game loop.

**Independent Test**: Can be fully tested by restarting from results and verifying all players return to the lobby with their names intact and round state cleared.

**Acceptance Scenarios**:

1. **Given** results are displayed and the host clicks restart, **When** the restart completes, **Then** all players are navigated to the lobby page.
2. **Given** the host restarts the game, **When** players enter the lobby, **Then** all original players (including joiners) are preserved with their names.
3. **Given** the host restarts the game, **When** the round state is cleared, **Then** strokes, guesses, scores, and word selection are all reset to their initial values.

---

### User Story 3 — Non-Host Sees Restart Waiting State (Priority: P2)

After results are displayed, non-host players see a waiting state indicating the host must restart. They cannot restart themselves.

**Why this priority**: Prevents confusion about who can restart; completes the role-based UX.

**Independent Test**: Can be fully tested by viewing results as a guesser and verifying the UI shows a waiting message without a restart button.

**Acceptance Scenarios**:

1. **Given** results are displayed and the player is not the host, **When** they view the results screen, **Then** they see a message indicating they are waiting for the host to restart.
2. **Given** results are displayed and the player is not the host, **When** they view the results screen, **Then** no restart button is shown to them.

---

### Edge Cases

- What happens if a player leaves during the results screen? The player is removed from the lobby on restart (only active connections are preserved via room state).
- What if the host tries to restart before all players have seen the results? The host can restart at any time; non-host players are immediately navigated back to the lobby.
- What if the restart fails? The room state should remain in "results" mode; the host can try again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the correct secret word to all players when the round ends.
- **FR-002**: System MUST display final scores for all players, sorted highest to lowest, when the round ends.
- **FR-003**: System MUST display the complete guess history to all players when the round ends.
- **FR-004**: System MUST allow only the host to restart the game from the results screen.
- **FR-005**: System MUST return all players to the lobby page when the host restarts the game.
- **FR-006**: System MUST preserve all player names in the room when restarting (no players are removed).
- **FR-007**: System MUST clear all round-specific state (strokes, guesses, scores, word, drawer assignment) when restarting.
- **FR-008**: System MUST reset the room status to "lobby" when restarting.
- **FR-009**: System MUST show a waiting message to non-host players on the results screen (no restart button).
- **FR-010**: System MUST sync the round-end state to all players via HTTP polling.

### Key Entities

No new entities. Uses existing Room, RoomSnapshot, Guess, PlayerScore, and Stroke types from previous scenarios.

### State Transitions

- Room status: "active" → "results" (round ended) → "lobby" (restart)
- On restart: `room.strokes = []`, `room.guesses = []`, `room.playerScores` reset to 0, `room.drawerId = null`, `room.currentWord = null`, `room.hasScored = []`, `room.status = "lobby"`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results screen within one polling cycle (~2 seconds) of the round ending.
- **SC-002**: The correct word, final scores, and complete guess history are displayed identically to all players (0% discrepancy across player views).
- **SC-003**: After restart, all players return to the lobby within one polling cycle (~2 seconds) of the host clicking restart.
- **SC-004**: 100% of round-specific state (strokes, guesses, scores, word) is cleared on restart; room status is "lobby".
- **SC-005**: 100% of player names are preserved after restart (no player data loss).

## Assumptions

- The round ends via a host-initiated action (explicit "End Round" or "Restart" button), not automatically via a timer (timers are out of scope per project constraints).
- Players are not removed from the room on restart; only round state is cleared.
- The results screen is a simple view; no additional game logic occurs during results display.
- HTTP polling interval remains ~2 seconds for syncing round-end and restart states.
- Only one round is played at a time (no cumulative multi-round scoring in scope).
