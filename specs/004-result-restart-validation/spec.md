# Feature Specification: Result State and Restart

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-02

**Status**: Implemented

**Input**: User description: "Enhance the Scribble starter to show round results (correct word, final scores, guess history) and allow the host to restart the room back to lobby with players preserved."

## User Scenarios & Testing

### User Story 4 - Result state and restart (Priority: P4)

As a player, the system must show a final result and allow the host to restart to the lobby so that the round closes cleanly and the same room can be reused.

**Why this priority**: This completes the required game loop but depends on the round lifecycle from the higher-priority stories.

**Independent Test**: Can be fully tested by finishing a round with a correct guess, checking result details in both tabs, restarting from the host tab, and verifying a clean return to the lobby with players preserved.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** players view the result state, **Then** all players see the correct word, final scores, and full guess history.
2. **Given** a non-host player is on the result screen, **When** they attempt to restart, **Then** the restart action is unavailable or rejected.
3. **Given** the host restarts the room, **When** the restart succeeds, **Then** all players return to the lobby with participants preserved and round-specific state cleared.
4. **Given** the room returns to the lobby after restart, **When** players inspect the room, **Then** old drawing data, old guesses, and old round winner state are gone.

---

### Edge Cases

- How does the system handle rapid repeated clicks on restart?
- What happens when a non-host client refreshes during result state?
- What happens when the host restarts while a guesser is mid-poll?

## Requirements

### Functional Requirements

- **FR-024**: System MUST display the correct word, final scores, and full guess history in result state.
- **FR-025**: System MUST allow only the host to restart the room.
- **FR-026**: System MUST preserve players and host identity on restart.
- **FR-027**: System MUST clear round-specific state on restart and return the room to lobby phase.

### Key Entities

- **Room**: Status transitions from `"result"` to `"lobby"` on restart. Round is set to null.
- **RoundState**: Cleared entirely on restart (drawing, guesses, winner, secret word, phase).
- **Player**: Scores are preserved across restart to enable future multi-round gameplay.

## Success Criteria

### Measurable Outcomes

- **SC-003**: A two-player room can complete one full round from lobby to result and return to lobby again without server restart.
- **SC-005**: After restart, all players remain in the room and all round-specific state is cleared.

## Assumptions

- Scores are preserved on restart (not reset to 0) to support future multi-round cumulative scoring.
- The correct word is revealed to ALL players in result state (unlike playing state where only the drawer sees it).
- Restart is only available from the "result" phase; it cannot be triggered during "playing" or "lobby".
