# Feature Specification: Result & Restart Flow

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Scenario 4"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display Round Results to All Players (Priority: P1)

When a round ends, every player needs to see the same final result state so the outcome is clear and agreed upon. The result view should include the correct secret word, final scores, and the full guess history for that round.

**Why this priority**: Players expect a shared conclusion to the round before restarting or ending the game. Without a common result screen, the game feels incomplete and confusing.

**Independent Test**: After a round finishes, open the game screen in two browser windows. Both should show the same final result summary, including the right secret word and the same history of guesses.

**Acceptance Scenarios**:

1. **Given** the round has completed, **When** any player views the game screen, **Then** they see the final result panel with the correct word and the final score state.
2. **Given** multiple players are active when the round ends, **When** they refresh or re-enter the game screen, **Then** the result state remains visible to all of them with the same data.
3. **Given** guess history exists for the round, **When** the result screen is displayed, **Then** the full ordered list of guesses and correctness outcomes is visible to all players.

---

### User Story 2 - Restart the Game from the Result State (Priority: P1)

After the result state is shown, the host must be able to restart the game so everyone returns to the lobby and can play another round with the same players.

**Why this priority**: Restarting from the result flow completes the game lifecycle and enables repeat play without rejoining.

**Independent Test**: A host clicks restart on the result screen and all players are returned to the lobby with the same participant list present.

**Acceptance Scenarios**:

1. **Given** the round has ended and the result screen is visible, **When** the host clicks restart, **Then** all players are returned to the lobby and the room state is reset for a new game.
2. **Given** the game restarts, **When** any player views the lobby, **Then** the same players are still present and no round state from the previous game remains active.
3. **Given** it is not the host viewing the result screen, **When** they attempt to restart, **Then** restart controls are either unavailable or do not trigger restart behavior.

---

### User Story 3 - Preserve Room Participants Across Restart (Priority: P2)

When the game restarts, the current players should remain in the room so the same group can play again without rejoining.

**Why this priority**: Requiring players to rejoin after every round would interrupt flow and reduce playability.

**Independent Test**: After a host restarts the game, open the lobby view and verify the current participant list is unchanged.

**Acceptance Scenarios**:

1. **Given** the game has ended and players remain in the room, **When** the host restarts, **Then** the player list in the lobby matches the list from the previous round.
2. **Given** a player refreshes during the restart transition, **When** they return to the lobby, **Then** they still see the same room participants and no stale round data.

---

### Edge Cases

- If the result screen is visible and the host leaves before restart, the room should preserve the current participant list and require a new host or first player to restart.
- If a player refreshes during the result screen, they should still see the same final result when the page reloads.
- If a restart request fails, the player should remain on the result screen with a clear error message and no partial state change.
- If the room is restarted while a second browser tab is still showing the old game screen, the old view should either refresh or show the lobby once the next polling update arrives.
- Restart should clear only the previous round state, not the list of players, room code, or host identity.
- The correct secret word from the completed round should still be visible in the result state for every player after round completion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a final result screen to all players when a round ends.
- **FR-002**: The result screen MUST include the correct secret word, final scores, and full guess history for the completed round.
- **FR-003**: The system MUST preserve the result state after page refresh or re-entry until the host restarts the room.
- **FR-004**: The system MUST allow only the host to restart the game from the result screen.
- **FR-005**: The system MUST return all players to the lobby when the host restarts the game.
- **FR-006**: The system MUST preserve the current participant list across the restart.
- **FR-007**: The system MUST clear previous round-specific state when restarting, including secret word visibility, guess history, and round score.
- **FR-008**: The system MUST communicate restart failures with a clear user-visible message and avoid partial room state changes.
- **FR-009**: The system MUST preserve room code and host identity after restart.
- **FR-010**: The system MUST keep the same lobby polling or state refresh behavior available after restart.

### Key Entities

- **Room**: The shared game container that holds players, the current phase, lobby state, and round lifecycle.
- **Result State**: The post-round view showing the final outcome of the completed round.
- **Restart Action**: The host-triggered transition that clears round state and returns players to the lobby.
- **Participant List**: The set of players that remain in the room across restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of completed rounds show a result screen with the correct secret word and final scores to all active players.
- **SC-002**: 100% of players who refresh on the result screen see the same result state after reload.
- **SC-003**: 100% of restart attempts by the host return all active players to the lobby without requiring rejoin.
- **SC-004**: 100% of restarts preserve the previous participant list and host identity.
- **SC-005**: 100% of restarts clear the previous round's secret word, guess history, and score state before a new round begins.
- **SC-006**: At least 90% of manual validation checks confirm result visibility and restart behavior in under 2 minutes.

## Assumptions

- Scenario 1-3 behavior is already implemented or available as dependencies, including room creation, lobby polling, game start, drawer assignment, guess history sync, and scoring.
- The room remains active and the same players remain connected long enough to view the result state and restart without rejoining.
- Restart is handled by the same in-memory room model and does not require durable persistence.
- The host role persists across the restart unless the host leaves; replacing the host is out of scope for this scenario.
- Result state is a transition state distinct from an active round and lobby; it should not be treated as a fresh lobby state until the restart completes.
