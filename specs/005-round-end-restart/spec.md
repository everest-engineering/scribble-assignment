# Feature Specification: Round End Restart

**Feature Branch**: `[005-round-end-restart]`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Results and Persisted Players (Priority: P1)

A hosted round has just ended and the ResultsPage is displayed to all players.

**Why this priority**: This is the expected end-of-round experience and must be reliable for user satisfaction and scoring correctness.

**Independent Test**: Start a room with multiple players, complete a round so results display, then trigger a host restart. Verify post-restart state.

**Acceptance Scenarios**:

1. **Given** a round has ended and the ResultsPage is visible, **When** the host performs a restart, **Then** all connected players are returned to the lobby and see the preserved player list (same players and order where applicable).
2. **Given** a round has ended and the ResultsPage is visible, **When** the host performs a restart, **Then** the final correct word, each player's final score, and the full guess history for the concluded round remain viewable to players on the ResultsPage prior to returning to the lobby; the ResultsPage data MUST persist until the lobby has rendered or for at least 5 seconds, whichever is longer.
3. **Given** a host restart occurred, **When** players arrive in the lobby, **Then** the prior round state (current drawer, drawing canvas, active guesses, timers) is cleared and the next round starts fresh when the host initiates it.

---

### User Story 2 - Edge Connectivity and Rejoins (Priority: P2)

Players that temporarily disconnected during the ResultsPage should be treated as preserved players when they rejoin before the lobby is fully rebuilt.

**Independent Test**: Disconnect a player during results, restart host, then reconnect; verify player appears in lobby with prior score.

**Acceptance Scenarios**:

1. **Given** a player disconnected during the results screen, **When** the host restarts and the player reconnects within a short window, **Then** the player is placed back into the preserved players list with their score.

---

### Edge Cases

- Host restarts while some players are mid-reconnect — ensure reconnects are reconciled into the preserved player list where possible.
- If a player deliberately leaves (explicit leave action) before the restart, they should not be re-added.
- If the host restart is a full server process crash (not a graceful restart), we rely on in-memory preservation semantics described in Assumptions below.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a built `ResultsPage` that is shown after a round ends; the `ResultsPage` MUST clearly display the correct word, each player's final score, and the full guess history for that round. The `ResultsPage` MUST include review affordances (timestamps on guesses, copyable entries where relevant) and meet basic accessibility requirements.
- **FR-002**: When the host initiates a restart while the ResultsPage is displayed, the system MUST return all players to the lobby and preserve the player roster and their final scores.
- **FR-003**: When the host restarts, the system MUST clear all transient round state (drawing canvas, active guesses, current drawer, timers) so the next round starts in a clean state.
- **FR-004**: If a player disconnected during the ResultsPage and reconnects before the lobby is rebuilt, the player MUST be treated as preserved and retain their score.
- **FR-005**: The system MUST not carry forward any per-round secrets (e.g., who was drawer for next round) after restart.

### Key Entities

- **Player**: identity, display name, score
- **Room**: room code, player list, lobby state
- **Round**: round id, correct word, guess history, final scores for round, drawer id

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of players in test runs see the correct final word on the ResultsPage after a host restart in automated test scenarios.
- **SC-002**: 100% of players' final scores are preserved and visible in the lobby after host restart in automated tests.
- **SC-003**: The full guess history for the concluded round is available on the ResultsPage for manual verification prior to returning to the lobby.
- **SC-004**: After host restart, the room shows cleared round state (drawing canvas empty, no active drawer) and preserved player list within 3 seconds on a local dev environment. The ResultsPage data MUST persist until the lobby has rendered or for at least 5 seconds, whichever is longer.

## Assumptions

- "Host restart" means the host triggers a server-side reset of round state while preserving room and player membership metadata (not a permanent deletion of the room).
- No authentication or long-term persistence beyond in-memory room state is required by this feature.
- The system has a defined reconciliation window for reconnecting players (e.g., a few seconds) during which reconnects are mapped back to preserved player slots.
