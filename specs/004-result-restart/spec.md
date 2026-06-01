# Feature Specification: Result & Restart

**Feature Branch**: `004-result-restart`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "(Result & Restart): Showing end-of-round result states and resetting the game room cleanly back to the lobby."

## Clarifications

### Session 2026-05-31
- Q: Transition to Lobby Trigger → A: Manual only (Host must explicitly click a "Return to Lobby" button).
- Q: Result Screen Content → A: Yes, show the final drawing.
- Q: Host Disconnect → A: Auto-reassign host to the next oldest player.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Viewing Round Results (Priority: P1)

As a player (either drawer or guesser), I want to see the results at the end of the round so that I know what the word was and how everyone performed.

**Why this priority**: Core feedback loop of the game. Players need closure on what happened during the round.

**Independent Test**: Can be tested by triggering the end of a round and verifying that the result screen displays with correct data.

**Acceptance Scenarios**:

1. **Given** an active round where time expires or everyone guesses correctly, **When** the round ends, **Then** all players see a result screen showing the correct word and round scores.
2. **Given** the result screen is active, **When** a configured time passes or the host acts, **Then** the game prepares for the next phase.

---

### User Story 2 - Returning to Lobby (Priority: P1)

As a host, I want to be able to reset the game room back to the lobby state so that we can wait for new players or start a fresh game.

**Why this priority**: Essential for game continuity without having to create a new room.

**Independent Test**: Can be tested by returning an active or finished game room to the lobby state and verifying the UI and data reset properly.

**Acceptance Scenarios**:

1. **Given** a finished game, **When** the host chooses to return to the lobby, **Then** the game state is reset (canvas cleared, etc.) and all players see the lobby waiting screen.
2. **Given** players in the reset lobby, **When** the host starts the game again, **Then** a new game begins normally.

### Edge Cases

- What happens if a player disconnects while the result screen is showing?
- How does the system handle a host returning to the lobby while a round is still actively in progress?
- **Host Disconnect**: If the host disconnects, the system MUST automatically reassign host privileges to the next oldest player in the room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an end-of-round result view when a round concludes.
- **FR-002**: Result view MUST show the correct word that was being drawn.
- **FR-003**: Result view MUST display the points earned by each player in that round.
- **FR-004**: System MUST provide a mechanism to transition the room from the result state back to the lobby state.
- **FR-005**: Transitioning back to the lobby MUST cleanly reset game-specific state (e.g., clear the drawing canvas, reset round timers).
- **FR-006**: System MUST reset player scores to zero when returning to the lobby.
- **FR-007**: The transition from the result screen back to the lobby MUST be manually triggered by the host via a dedicated UI action.
- **FR-008**: Result view MUST display a snapshot of the final completed drawing.

### Key Entities

- **Game Room State**: Must track current phase (e.g., `playing`, `results`, `lobby`).
- **Round Result**: Data object containing the correct word, and player points earned during the round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of players in a room receive the end-of-round result view simultaneously within 1 second of round end.
- **SC-002**: Returning to lobby completely resets game data without requiring a page reload for any player.
- **SC-003**: Players can transition from playing to results, back to lobby, and start a new game successfully 100% of the time.

## Assumptions

- Round ends automatically when time is up or all guessers have guessed correctly.
- Host has the authority to return the room to the lobby.
- Returning to the lobby means entering a waiting state where new players can join before the host manually starts the next game.
