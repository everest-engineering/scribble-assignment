# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 4: Result, Restart & Final Validation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared Result State (Priority: P1)

As a player, I want to see the final results when a round ends so that I can see who won and what the correct word was.

**Why this priority**: Closing the feedback loop and providing closure to the gameplay interaction.

**Independent Test**: Correct guess triggers "results" state; all players see the final scores and the secret word.

**Acceptance Scenarios**:

1. **Given** a round has ended (via correct guess), **When** a player views the game screen, **Then** they see the "Round Complete" message, the correct word, and final scores.
2. **Given** a round has ended, **When** a player views the result panel, **Then** they see the full guess history for that round.

---

### User Story 2 - Host Restarts to Lobby (Priority: P1)

As a host, I want to restart the game after a round ends so that we can play again with the same group of players.

**Why this priority**: Enables replayability without forcing everyone to join a new room.

**Independent Test**: Host clicks "Restart Round" and all players are returned to the Lobby screen with cleared game state.

**Acceptance Scenarios**:

1. **Given** the game is in the "results" state, **When** the host clicks "Restart Round", **Then** the room status transitions to "lobby" and all players see the Lobby screen.
2. **Given** the game has restarted, **When** a player looks at the lobby, **Then** all participants are preserved, but the canvas and guess history are empty.

---

### Edge Cases

- What happens if a player joins while the room is in "results" state?
- Does the scoreboard persist across restarts? (Spec says "all round state cleared", implying scores reset).
- Can a non-host player see the "Restart" button? (FR-003 says MUST restrict to host).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition all players to the "results" view when the round ends.
- **FR-002**: System MUST reveal the correct secret word to all participants during the "results" phase.
- **FR-003**: System MUST provide a "Restart Round" action exclusive to the room host.
- **FR-004**: System MUST reset room status to "lobby" and clear all round-specific data (drawing, guesses, roles) upon restart.
- **FR-005**: System MUST preserve the list of participants and their host status during a restart.
- **FR-006**: System MUST reset participant scores to zero upon returning to the lobby.

### Key Entities *(include if feature involves data)*

- **Result Snapshot**: Extension of Room Snapshot containing final scores and the revealed secret word.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of players are automatically transitioned to the result view within 2 seconds of round end.
- **SC-002**: Host restart returns all players to the lobby within 2 seconds.
- **SC-003**: No drawing data or guess history leaks from the previous round into the new lobby session.

## Assumptions

- Participants do not change during the "results" phase (though they may leave).
- "Restart" resets all scores for the next round.
