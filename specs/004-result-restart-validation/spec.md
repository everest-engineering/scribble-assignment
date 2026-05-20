# Feature Specification: Result, Restart And Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Result, Restart And Final Validation"

## Clarifications

### Session 2026-05-20

- Q: What triggers a round to end? → A: Two triggers both apply — (1) all guessers have guessed correctly, or (2) a round timer expires. The timer duration is configurable via a room setting `timerDuration` (default: 300 seconds / 5 minutes).
- Q: How should the timer be configured? → A: A `timerDuration` room setting (in seconds, default 300), set at game start. No separate enable/disable flag; setting to 0 means no timer.

## User Scenarios & Testing

### User Story 1 - All players see round result state (Priority: P1)

As any player in a round that has just ended, I want to see the correct word, final scores, and full guess history from the completed round so that I can learn the answer and see how everyone performed.

**Why this priority**: The result display is the core value of this feature; without it, players have no closure after a round ends.

**Independent Test**: Can be tested by completing a round (e.g., after someone guesses correctly or all guesses are in) and verifying that every player's screen shows the correct word, the final scores, and the complete guess history.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the game page, **Then** they see the correct word for the completed round.
2. **Given** a round has ended, **When** any player views the game page, **Then** they see the final scores reflecting all points earned during the round.
3. **Given** a round has ended, **When** any player views the game page, **Then** they see the full guess history including which guesses were correct.
4. **Given** a round has ended, **When** any player views the game page, **Then** the canvas state from the completed round is still visible.

---

### User Story 2 - Host restarts the game (Priority: P1)

As the host of a room where a round has ended, I want to restart the game so that a new round can begin without requiring players to rejoin.

**Why this priority**: The restart action is the trigger that returns players to the lobby and enables the next game cycle.

**Independent Test**: Can be tested by having the host click a restart button visible only to them in the result state and verifying all players are redirected to the lobby.

**Acceptance Scenarios**:

1. **Given** a round has ended and the result state is displayed, **When** the host clicks the restart button, **Then** all players in the room are redirected to the lobby.
2. **Given** a round has ended and the result state is displayed, **When** the host clicks the restart button, **Then** the lobby shows the same list of players that were in the room before restart.
3. **Given** a round has ended, **When** a non-host player views the result state, **Then** they do NOT see a restart button.

---

### User Story 3 - Round state cleared on restart (Priority: P1)

As a player returning to the lobby after a restart, I want all previous round data (canvas, guesses, current round scores) to be cleared so that the next game starts fresh.

**Why this priority**: Without clearing round state, the next game would inherit stale data from the previous round, breaking gameplay.

**Independent Test**: Can be tested by completing a round, restarting, and verifying the lobby shows no active round state (no canvas, no guesses, no current round scores, no active drawer).

**Acceptance Scenarios**:

1. **Given** players have returned to the lobby after a restart, **When** any player views the lobby, **Then** there is no active round (no current round data).
2. **Given** players have returned to the lobby after a restart, **When** any player views the lobby, **Then** cumulative scores from completed rounds are preserved and visible.
3. **Given** players have returned to the lobby after a restart, **When** any player views the lobby, **Then** the host sees the same start-game mechanism as when the room was first created.

### Edge Cases

- What happens if the host disconnects before clicking restart? (The result state remains visible to all players, but no one can restart; reconnect or room timeout handling is separate scope.)
- What happens if a non-host player refreshes the page during the result state? (The player rejoins and still sees the result state, since the round is marked as ended.)
- What happens if the host refreshes the page? (The host rejoins and sees the result state with their host privileges intact.)
- What happens to the room if no one restarts? (The room remains in the result state indefinitely until the host clicks restart or the room expires.)
- How does a player know who the host is? (The host is implicitly the room creator; the host's identity is visible in the player list or similar means.)
- What happens to participants who joined after the game started? All room members, regardless of when they joined, are preserved in the lobby on restart. No one is removed.

## Requirements

### Functional Requirements

- **FR-001**: System MUST detect when a round has ended and transition the room to a "result" state. A round ends when either (a) all guessers have guessed the secret word correctly, or (b) the round timer expires.
- **FR-002**: The round timer duration MUST be configurable per room via a `timerDuration` setting (in seconds, default: 300). A value of 0 means no timer (round runs until all guessers guess correctly).
- **FR-003**: In the result state, all players MUST see the correct word for the completed round.
- **FR-004**: In the result state, all players MUST see the final scores (cumulative from all completed rounds).
- **FR-005**: In the result state, all players MUST see the complete guess history from the completed round.
- **FR-006**: In the result state, the canvas from the completed round MUST remain visible.
- **FR-007**: The host MUST see a "Restart" button in the result state that non-host players do not see.
- **FR-008**: When the host clicks restart, System MUST transition the room back to "lobby" state.
- **FR-009**: On restart, all players MUST be redirected to the lobby.
- **FR-010**: On restart, the player list MUST be preserved (no one is removed).
- **FR-011**: On restart, all round-specific data (canvas, guesses, current round scores, secret word, drawer assignment) MUST be cleared.
- **FR-012**: On restart, cumulative scores from completed rounds MUST be preserved.
- **FR-013**: On restart, the host MUST be able to start a new game from the lobby using the same start-game mechanism.

### Key Entities

- **Result State**: A game state displayed after a round ends, showing the correct word, final scores, full guess history, and the final canvas. Contains a restart action available only to the host.
- **Room Restart**: The transition from result state to lobby state triggered by the host. Preserves the player list and cumulative scores while clearing all round-specific data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All players see the correct word, final scores, and full guess history within one polling cycle after the round ends.
- **SC-002**: The restart button is visible only to the host and appears within the result state.
- **SC-003**: All players are redirected to the lobby within one polling cycle after the host clicks restart.
- **SC-004**: The player list on restart is identical to the player list before restart.
- **SC-005**: No round-specific data (canvas, guesses, current round scores) is visible in the lobby after restart.
- **SC-006**: Cumulative scores are unchanged after restart compared to before restart.

## Assumptions

- Round end is triggered by two mechanisms: (1) all guessers guess correctly, or (2) the round timer (`timerDuration`, default 300s) expires. A value of 0 disables the timer.
- The timer duration is set as a room-level configuration at game start and does not change mid-game.
- The host is the participant who created the room. Their host status persists across round restarts.
- Players remain connected during the result state and restart transition.
- The result state replaces the active gameplay UI; no separate result page is needed.
- Cumulative scores are the sum of points earned across all completed rounds in the game session.
- No round timer or room expiry is defined here; rooms persist indefinitely in result state until the host restarts.
