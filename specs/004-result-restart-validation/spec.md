# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation: Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round End Results Display (Priority: P1)

As a player, I want to see the correct secret word, final scores, and full guess history at the end of the round so that I can review the game results.

**Why this priority**: Crucial feedback loop for players to see the outcome of the game.

**Independent Test**: Transition the game to the end state, verify all clients display the correct secret word, final scores of all participants, and the full list of submitted guesses.

**Acceptance Scenarios**:

1. **Given** a round has ended where the secret word was "rocket", **When** the game transitions to the results state, **Then** all participants (drawer and guessers) see a screen displaying "The secret word was: rocket", the final scores of all players, and the complete guess history logs.

---

### User Story 2 - Host Restart to Lobby (Priority: P1)

As a host, I want to restart the game so that everyone returns to the lobby with players preserved and all round state cleared.

**Why this priority**: Allows players to play multiple games without needing to create new rooms and re-join.

**Independent Test**: As Host, click restart, and verify all player clients return to the lobby screen with correct host and player configurations preserved and scores reset.

**Acceptance Scenarios**:

1. **Given** the room is in the results state with Alice (Host) and Bob, **When** Alice clicks "Restart Game", **Then** the room status transitions back to "lobby", all scores are reset to 0, the active word is cleared, and both Alice and Bob remain in the room.
2. **Given** the game is restarted, **When** Bob views the screen, **Then** he is back in the lobby and sees Alice as the host, waiting for the host to start the game.

---

### Edge Cases

- **Non-host attempting restart**: If a guesser or non-host player attempts to trigger restart, the system must reject the request.
- **Player leaves during results**: If a player leaves during the results screen, they are removed from the room list; when the game restarts to lobby, the remaining players list matches who is still in the room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support a round end state where the secret word is revealed to all players.
- **FR-002**: The results view MUST display the correct secret word, final scores, and the complete guess history.
- **FR-003**: The system MUST allow the Host to trigger a game restart from the results screen.
- **FR-004**: The system MUST reject restart requests from non-host players.
- **FR-005**: On restart, the system MUST transition the room status to "lobby".
- **FR-006**: On restart, the system MUST preserve all currently joined players in the room, reset all scores to 0, and clear all active game state (e.g. current drawing canvas data, guess history, active words).

### Key Entities

- **Room**: Now includes status "results" in addition to "lobby" and "active".
- **GameResult**: Represents the summary of the round: final scores, revealed secret word, and guess logs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within 1 second of round ending, all clients show the results view.
- **SC-002**: Upon restart, all clients show the lobby view within 1 second.
- **SC-003**: All player names are preserved correctly on restart.

## Assumptions

- Preserved players maintain their host or participant role when returning to the lobby.
- A round ends either after a time limit, or when all guessers guess correctly, or by host manual end (we default to simple round end triggers as required).
