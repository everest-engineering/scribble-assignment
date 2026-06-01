# Feature Specification: Round End and Restart

**Feature Branch**: `004-round-end-restart`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "When a round ends, all players can view the correct word, final scores, and guess history. The host can restart the game, returning all players to the lobby while preserving the player list and clearing all round-related data. Round should end when any correct guess is done"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - End Round on Correct Guess (Priority: P1)

When any player submits a correct guess, the round should end immediately so everyone can see the correct word, the guess history, and the final scores.

**Why this priority**: The game needs a clear finish condition before the end-of-round summary can be shown or the game can be restarted.

**Independent Test**: Submit a correct guess during an active round and confirm the room transitions into an end-of-round view for all players, showing the correct word, completed guess history, and final scores.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a player submits the correct guess, **Then** the round ends and all players see the correct word.
2. **Given** a round has ended, **When** players view the room, **Then** they can see the full guess history and final scores.
3. **Given** a round has ended, **When** players continue viewing the room, **Then** the end-of-round summary stays consistent for everyone.

---

### User Story 2 - Host Restarts the Game (Priority: P1)

The host should be able to restart the game from the end-of-round state and return everyone to the lobby while keeping the same player list.

**Why this priority**: Restart is the only way to begin the next round without recreating the room.

**Independent Test**: End a round, restart it as the host, and confirm all players return to the lobby with the same participants preserved and round-specific data cleared.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the host restarts the game, **Then** all players return to the lobby.
2. **Given** a restart has completed, **When** players view the room, **Then** the player list is preserved.
3. **Given** a restart has completed, **When** players view the room, **Then** the round-related data from the previous game is cleared.

---

### User Story 3 - Reject Late Round Actions (Priority: P2)

Once a round has ended, additional guesses or drawing actions should not change the finished round, and only the host should be allowed to restart the game.

**Why this priority**: The finished round must remain stable so the end-of-round summary cannot be altered after the result is decided.

**Independent Test**: Try submitting a late guess or drawing after the round has ended and confirm the finished result does not change; also confirm only the host can restart.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** a player submits another guess, **Then** the finished result does not change.
2. **Given** a round has ended, **When** a player tries to draw, **Then** the finished result does not change.
3. **Given** a round has ended, **When** a non-host tries to restart the game, **Then** the restart is rejected.

### Edge Cases

- What happens if two players submit the correct guess at nearly the same time?
- What happens if a correct guess arrives while the host is restarting the game?
- What happens if the host tries to restart while the room is already in the lobby?
- What happens if a late guess arrives after the round has already ended?
- What happens if a player reconnects while the end-of-round summary is being shown?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST end the round immediately when the first correct guess is accepted.
- **FR-002**: The system MUST show the correct word to all players once the round has ended.
- **FR-003**: The system MUST preserve the full guess history for the ended round until the game is restarted.
- **FR-004**: The system MUST show the final scores for all players once the round has ended.
- **FR-005**: The system MUST allow the host to restart an ended round and return all players to the lobby.
- **FR-006**: The system MUST preserve the room's player list when the host restarts the game.
- **FR-007**: The system MUST clear all round-specific data when the host restarts the game.
- **FR-008**: The system MUST reject additional round actions that arrive after the round has ended.
- **FR-009**: The system MUST prevent non-host players from restarting the game.
- **FR-010**: The system MUST keep the end-of-round view consistent for all players while the room remains in that state.

### Key Entities *(include if feature involves data)*

- **Round Result**: The end-of-round state that exposes the correct word, guess history, and final scores.
- **Restart State**: The reset state that returns the room to the lobby while keeping the player list intact.
- **Guess History**: The ordered list of guesses that led to the round result.
- **Final Score**: The score total shown to each player when the round ends.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of rounds, the first correct guess ends the round and exposes the round result to all players.
- **SC-002**: In 100% of ended rounds, players can view the correct word, final scores, and guess history without needing to recreate the room.
- **SC-003**: In 100% of valid restarts, the host returns the room to the lobby while keeping the same player list intact.
- **SC-004**: In 100% of restart flows, round-specific data is cleared before the next game begins.
- **SC-005**: In repeated room views after the round ends, all players see the same finished result until the host restarts the game.

## Assumptions

- A round is considered finished as soon as the first correct guess is accepted.
- The host remains the same player across a restart unless they leave the room.
- Round history and scores remain visible until the host restarts the game.
- Players keep the same room code across restart cycles.
- The room continues to use the existing polling-based synchronization model.
