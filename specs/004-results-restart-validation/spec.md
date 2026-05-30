# Feature Specification: Results, restart, and final validation

**Feature Branch**: `004-results-restart-validation`

**Created**: 2026-05-31

**Status**: Draft

**Input**: Scenario 4 from the Scribble lab: shared result state, final scores, correct-word reveal, and clean host-only restart.

## Scenario Statement

**Given** a round has ended, **When** the result state is displayed and the host restarts, **Then** all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Show shared results (Priority: P1)

After a correct guess, all players see the same result state.

**Why this priority**: Players need a shared end-of-round outcome before restarting.

**Independent Test**: Submit the correct word from a guesser and verify host and guest both see results after polling.

**Acceptance Scenarios**:

1. **Given** a correct guess is submitted, **When** the room updates, **Then** the room status becomes results.
2. **Given** a player views the results state, **When** the page renders, **Then** it shows the correct word, winner, final scores, and full guess history.
3. **Given** another player is still polling the game page, **When** results are reached, **Then** they see the same result state.

---

### User Story 2 - Restart from results (Priority: P2)

The host restarts the game from the results screen and sends everyone back to the lobby with players preserved and round state cleared.

**Why this priority**: Restart completes the single-round lifecycle without creating a new room.

**Independent Test**: Reach results, restart as host, and verify players remain while round state is cleared.

**Acceptance Scenarios**:

1. **Given** the room is in results, **When** the host restarts, **Then** the room returns to lobby.
2. **Given** the room restarts, **When** the lobby renders, **Then** the same players remain in the room.
3. **Given** the room restarts, **When** the next lobby snapshot is loaded, **Then** drawing, guesses, result, drawer, word, and scores are cleared or reset.
4. **Given** a player is polling the results state, **When** the host restarts, **Then** that player returns to the lobby.
5. **Given** a non-host is on the results screen, **When** they attempt to restart, **Then** restart is blocked.

### Edge Cases

- Restart is available only from results.
- Restart does not create a new room code.
- Restart does not persist player state across a full browser refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enter a shared results state after the first correct guess.
- **FR-002**: System MUST show the correct word, winner, final scores, and full guess history in results.
- **FR-003**: System MUST allow only the host to restart.
- **FR-004**: System MUST allow restart only while the room is in results.
- **FR-005**: System MUST preserve players and room code on restart.
- **FR-006**: System MUST clear all round state on restart, including drawer, secret word, drawing, guesses, scores, and result state.
- **FR-007**: System MUST return all polling players to the lobby after restart.

### Key Entities

- **Result Summary**: Correct word and winner information.
- **Room**: Owns the current status and resettable round state.
- **Participant**: Remains in the room across restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the same result state after polling.
- **SC-002**: Host can restart from results.
- **SC-003**: Non-host restart attempts are rejected.
- **SC-004**: Restart preserves players and room code while clearing round state.

## Clarifications

- Restart returns to lobby rather than immediately starting another round.
- Multiple rounds and drawer rotation remain out of scope.
