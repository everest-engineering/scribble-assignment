# Feature Specification: Results & Restart

## User Story

As a player, I want to view results and restart the game so that another round can be prepared.

**Priority**: P4

**Why this priority**: Results and restart complete the gameplay cycle.

**Independent Test**: Finish a round, verify results, restart, and return all players to the lobby.

## Acceptance Scenarios

1. **Given** a round ends, **When** results are displayed, **Then** all players see final scores.
2. **Given** a round ends, **When** results are displayed, **Then** all players see the correct word.
3. **Given** a round ends, **When** results are displayed, **Then** all players see complete guess history.
4. **Given** the host restarts the game, **When** restart completes, **Then** players return to the lobby.
5. **Given** restart completes, **When** players return to the lobby, **Then** participants are preserved and round state is cleared.

## Functional Requirements

* FR-013: System MUST display results after round completion.
* FR-014: System MUST support restart while preserving participants.

## Success Criteria

* SC-004: Results display scores, word, and guess history.
* SC-005: Restart returns all players to the lobby without losing participants.
