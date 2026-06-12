# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation
Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View result state after round ends (Priority: P1)

All participants, regardless of role (drawer or guesser), should be able to see the outcome of the completed round.

**Why this priority**: Viewing the result (correct word, scores, guess history) is the closure step for every round — no restart can occur before players have seen the result.

**Independent Test**: Start and finish a round, then verify every player's view shows the correct word, all final scores, and the complete guess history.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the result screen, **Then** the correct secret word is displayed.
2. **Given** a round has ended, **When** any player views the result screen, **Then** the final scores for all participants are displayed.
3. **Given** a round has ended, **When** any player views the result screen, **Then** the full guess history from that round is displayed.
4. **Given** a player joins the room after a round has ended, **When** they view the result screen, **Then** they see the same correct word, final scores, and guess history as the other participants.

---

### User Story 2 - Host restarts the game (Priority: P2)

The host can start a new round by returning all players to the lobby, preserving the participant list and clearing all round-specific data.

**Why this priority**: Restart depends on the result screen being available first. Players must see the result before they can start a fresh round.

**Independent Test**: As the host, restart the game after a round ends and verify all players land in the lobby with participants intact and round state cleared.

**Acceptance Scenarios**:

1. **Given** a round has ended and the result screen is displayed, **When** the host selects restart, **Then** all players return to the lobby with the same participant list.
2. **Given** a round has ended and the result screen is displayed, **When** the host selects restart, **Then** all round-specific state (secret word, canvas, guess history, scores, drawer assignment) is cleared.
3. **Given** a round has ended and a non-host player attempts to restart, **When** they trigger the restart action, **Then** the action is rejected and the result screen remains unchanged.

---

### Edge Cases

- What happens if a player disconnects and reconnects while the result screen is shown? They should see the same result state as other players upon reconnecting.
- What happens if a new player joins the room while the result screen is displayed? They should see the result state (correct word, scores, history) alongside existing players.
- What happens if the host restarts while another player is still viewing the result? All players should be transitioned to the lobby simultaneously.
- What happens if the host has left the room by the time the round ends? The game remains in the result state; no restart is possible until the original host rejoins the room.
- What happens if a player submits a guess just as the round ends? The guess should be processed according to Scenario 3 rules; if it arrives after the round ends, it is rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the correct secret word to all players when a round ends.
- **FR-002**: The system MUST display the final scores for all participants when a round ends.
- **FR-003**: The system MUST display the complete guess history from the completed round.
- **FR-004**: Only the host of the room MAY initiate a restart.
- **FR-005**: On restart, the system MUST return all players to the lobby view.
- **FR-006**: On restart, the system MUST preserve the full participant list.
- **FR-007**: On restart, the system MUST clear all round-specific state including secret word, canvas data, guess history, scores, and drawer assignment.
- **FR-008**: The system MUST reject restart requests from non-host players and leave the result state unchanged.
- **FR-009**: The system MUST expose the result state (correct word, scores, guess history) via polling so all players receive the same data.
- **FR-010**: Players who join after a round has ended MUST receive the current result state upon polling.

### Key Entities *(include if feature involves data)*

- **Result State**: Read-only representation of a completed round containing the correct word, final scores, and full guess history.
- **Lobby State**: The participant list and room code, with all round-specific data cleared, ready for a new game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players in the room see the correct secret word within one polling cycle after the round ends.
- **SC-002**: All players see final scores for every participant on the result screen.
- **SC-003**: The full guess history from the completed round is visible to all players on the result screen.
- **SC-004**: After a host-initiated restart, all players land in the lobby within one polling cycle.
- **SC-005**: After restart, the participant list matches the list before restart (no players lost).
- **SC-006**: After restart, no round-specific data (word, canvas, guesses, scores, drawer) remains accessible from the lobby view.
- **SC-007**: Non-host restart attempts are rejected and do not change the visible state.

## Assumptions

- The round ends through a mechanism established in a prior feature (result state after the game-play interaction flow).
- Polling is the only synchronization mechanism; no real-time push is used.
- The room already tracks which player is the host (established in Scenario 1).
- All result data fits within the existing polling payload without performance degradation.
- The clear-on-restart operation covers all mutable round state, not just a subset.
- Players who disconnect and reconnect are treated as still in the room for restart purposes.
