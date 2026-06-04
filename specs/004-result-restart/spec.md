# Feature Specification: Result, Restart & Final Validation

**Feature Group**: 4 — Result, Restart & Final Validation
**Date**: 2026-06-04
**Status**: Draft

## User Stories

### User Story 1 — Result Display (P1)
When a round ends, all players see the result.

**Acceptance Scenarios**:
1. Given a round has ended (correct guess), When any player views the game, Then they see the correct word, final scores, and full guess history
2. Given the result is displayed, When the drawer views it, Then they see "The word was: [word]" and their drawing

### User Story 2 — Host Restarts (P1)
The host can restart the game, returning everyone to the lobby with players preserved.

**Acceptance Scenarios**:
1. Given the result screen is shown, When the host clicks "Play Again", Then all players return to the lobby
2. Given the game restarts, When players view the lobby, Then all participants are still present
3. Given the game restarts, When players view the lobby, Then all round state (strokes, guesses, scores, secret word) is cleared

### User Story 3 — Non-Host Cannot Restart (P2)
Only the host sees the restart button.

**Acceptance Scenarios**:
1. Given the result screen is shown to a non-host, When they look for a restart button, Then it is not visible

## Edge Cases
- Restart sets status back to "lobby"
- All scores reset to 0
- Only original host can restart
- If host leaves before restarting, game is stuck (out of scope)

## Functional Requirements
- **FR-001**: System MUST display "The word was: [word]" on result screen
- **FR-002**: System MUST show final scores for all participants
- **FR-003**: System MUST show full guess history with correct/incorrect markers
- **FR-004**: System MUST provide POST /rooms/:code/restart endpoint
- **FR-005**: System MUST only allow host to restart
- **FR-006**: System MUST preserve participants on restart
- **FR-007**: System MUST clear strokes, guesses, scores, secret word on restart
- **FR-008**: System MUST set status="lobby" on restart
