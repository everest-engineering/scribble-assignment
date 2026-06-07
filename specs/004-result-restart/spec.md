# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Status**: Pending

## Scenario

### F4.1 Round End
- When a guesser guesses correctly, the round ends.
- The secret word is revealed to all players.

### F4.2 Result State
- All players see:
  - The correct word
  - Final scores
  - Full guess history

### F4.3 Host Restart
- Only the host sees a "Restart" button on the result screen.
- Clicking restart calls `POST /rooms/:code/restart`.
- Restart returns all players to the lobby.
- Player list is preserved; all round state (canvas, guesses, scores) is cleared.

### F4.4 Multi-Room Cleanup
- Empty rooms (0 participants) are removed after restart if all players leave.

## Acceptance Criteria
- [ ] Correct word revealed after a correct guess.
- [ ] Final scores and guess history visible to all.
- [ ] Host can restart; non-host cannot.
- [ ] Restart preserves participants, clears round state, returns to lobby.

## Requirements

### Functional Requirements
- **FR-001**: System MUST reveal the secret word to all players on correct guess.
- **FR-002**: System MUST set room status to `"roundEnd"` on correct guess.
- **FR-003**: System MUST display the correct word, final scores, and guess history to all players.
- **FR-004**: System MUST show a "Restart" button only to the host.
- **FR-005**: System MUST provide `POST /rooms/:code/restart` endpoint (host-only).
- **FR-006**: System MUST clear round state (canvas, guesses, scores) on restart.
- **FR-007**: System MUST preserve participant list on restart.
- **FR-008**: System MUST return room status to `"lobby"` on restart.

### Key Entities
- **Room**: Status transitions through lobby → playing → roundEnd → lobby.

## Edge Cases
- Non-host cannot restart.
- All round state cleared on restart.
- Participants preserved across restart.
