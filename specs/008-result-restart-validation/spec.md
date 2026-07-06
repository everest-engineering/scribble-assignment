# Feature Specification: Result, Restart, and Final Validation

**Feature Branch**: `008-result-restart-validation`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Shared result state visible to all players, clean restart to lobby with players preserved and round state cleared."

## Clarifications

### Session 2026-07-06

- Q: Should "full guess history" include all rounds' guesses or just the last round? → A: Last round only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Game Results (Priority: P1)

As a participant, I want to see the game results (correct word, final scores, and guess history) when the game ends so that I can review how everyone performed.

**Why this priority**: Viewing results is the closure for every game session. Without it, players have no way to see what the correct word was or compare final scores.

**Independent Test**: Can be fully tested by opening two browser tabs. Both tabs play through a game. The drawer ends the game. Both tabs see the result screen with the same correct word, scores, and guess history.

**Acceptance Scenarios**:

1. **Given** a game is in progress (drawing status), **When** the drawer ends the game, **Then** the room transitions to a result state visible to all participants.
2. **Given** the game is in result state, **When** any participant views the screen, **Then** they see the correct word from the final round, final cumulative scores for all players, and the guess history from the final round.
3. **Given** the game is in result state, **When** participants poll for room state, **Then** the result data (correct word, scores, guess history) is included in the snapshot response.

---

### User Story 2 - Host Restart Game (Priority: P1)

As the host, I want to restart the game from the result screen so that the same group can play another round without re-creating the room.

**Why this priority**: The restart flow keeps the group together and avoids friction. Without it, players would have to leave and rejoin a new room for each game.

**Independent Test**: Can be fully tested by opening two browser tabs that played a full game. The host clicks restart. Both tabs see the lobby with all participants still present and all game state reset.

**Acceptance Scenarios**:

1. **Given** the game is in result state, **When** the host clicks "Restart", **Then** all participants are returned to the lobby with their names preserved and all round-specific state (scores, guesses, canvas, current round, current drawer, secret word) is cleared.
2. **Given** the game is in result state and the current user is not the host, **When** the user views their screen, **Then** no "Restart" button is visible.
3. **Given** the game has been restarted and all participants are in the lobby, **When** the host starts a new game, **Then** the new game session begins fresh with the same players.

---

### Edge Cases

- What if a participant disconnects during the result screen? The result state is preserved in the room — the participant can reconnect and still see the results.
- What if the host disconnects during the result screen? The restart button becomes unavailable. Remaining players cannot restart the game without a host.
- What if a participant tries to draw or submit guesses during result state? All game actions (draw, guess, Next Word) must be rejected — only restart is available.
- What if only one player remains in the room when the host restarts? The restart still succeeds; the game can wait in the lobby for more players to join.
- What if the drawer ends the game when there are no guesses? The result screen shows an empty guess history, the correct word, and scores (all zero).
- What if a new player tries to join during result state? They can join the room (the room still exists) and see the result screen, or wait in the lobby after restart.
- What happens to the room state if all players leave during result screen? The room persists in result state until explicitly cleaned up or restarted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an "End Game" action available to the drawer during drawing status.
- **FR-002**: When the drawer ends the game, the room status MUST transition to a new "result" status.
- **FR-003**: In result status, the room snapshot MUST include the correct word from the final round, the final cumulative scores for all participants, and the guess history from the final round.
- **FR-004**: All participants MUST see the result state within one polling cycle (~2s) of the game ending.
- **FR-005**: The system MUST provide a "Restart" action available only to the host during result status.
- **FR-006**: When the host restarts, the room status MUST transition to "lobby", all round-specific state must be reset (scores reset to 0, guesses cleared, canvas cleared, current round reset to 0, current drawer cleared, secret word cleared, correctGuessersInRound cleared), and all existing participants MUST be preserved.
- **FR-007**: Non-host participants MUST NOT see or be able to trigger a restart.
- **FR-008**: While in result status, all gameplay actions (draw, clear canvas, submit guess, Next Word, submit canvas stroke) MUST be rejected.
- **FR-009**: After restart, the host MUST be able to start a new game (re-using the existing start game flow) with the preserved participants.

### Key Entities *(include if feature involves data)*

- **Room Status**: Extended to include "result" — a terminal display state showing game results with no gameplay actions available.
- **Game Result**: The final state of a completed game session, consisting of the final round's correct word, cumulative scores for all participants, and the final round's guess history.
- **Restart**: A host-only action that transitions the room from result status back to lobby status, preserving the participant list while clearing all game state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All participants in a room see identical result data (word, scores, guesses) within one polling cycle after the game ends.
- **SC-002**: The host can restart the game and all participants are returned to the lobby within one polling cycle (~2s).
- **SC-003**: After restart, the participant list is identical to the pre-restart participant list — no players are lost.
- **SC-004**: After restart, all game state is verified cleared: scores are 0, guesses empty, canvas empty, round is 0, no current drawer, no secret word.
- **SC-005**: A non-host participant who attempts to restart receives an error and the action is not performed.
- **SC-006**: While in result status, any attempt to draw, guess, or use Next Word is rejected.

## Assumptions

- The drawer ends the game via an "End Game" action (separate from "Next Word"), signaling the game session is complete.
- Guess history shown in the result screen is from the final round only. No cross-round guess persistence is needed.
- The same host designated at room creation is the only participant who can restart.
- After restarting, players remain in their current browser session — no reconnection or page reload is needed.
- The existing polling interval (~2s) is sufficient for result state synchronization.