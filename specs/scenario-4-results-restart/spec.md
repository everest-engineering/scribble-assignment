# Feature Specification: Scenario 4 — Result, Restart & Final Validation

**Created**: 2026-06-04
**Status**: Draft

## User Scenarios & Testing

### User Story 1 — View Results (Priority: P1)

When the round ends (drawer ends it or all guessers guessed correctly), all players see the correct word, final scores, and full guess history.

**Why this priority**: The culmination of each round — players need closure on what the word was and how everyone scored.

**Independent Test**: A round ends. All players see a results view showing the secret word, sorted scores, and every guess submitted.

**Acceptance Scenarios**:

1. **Given** a game in "playing" status, **When** the drawer clicks "End Round" or all guessers guess correctly, **Then** the room status changes to "finished".
2. **Given** a finished game, **When** any player views the room, **Then** they see the correct word, all participants' scores, and the full guess history.
3. **Given** a finished game, **When** the non-host views results, **Then** they see the same data as the host.

### User Story 2 — Restart Game (Priority: P1)

The host restarts the game from the results view. All players return to the lobby with their participants preserved and round state cleared.

**Why this priority**: Enables multiple rounds without recreating the room.

**Independent Test**: Host clicks "Restart Game" on the results page. All players see the lobby with the same participants but no round data.

**Acceptance Scenarios**:

1. **Given** a finished game, **When** the host clicks "Restart Game", **Then** room status changes to "lobby", round/guesses/drawing/scores reset, participants preserved.
2. **Given** a finished game, **When** a non-host views the page, **Then** they see results but no restart button.
3. **Given** a restarted game, **When** the host starts again, **Then** a new round begins with fresh state.

---

### Edge Cases

- What happens if a non-host tries to restart via API? — 403 "Only the host can restart the game".
- What happens if someone tries to submit a guess after the game is finished? — 400 "Game is not in progress".
- What happens when restart is called? — All round data is cleared but participants stay.

## Requirements

### Functional Requirements

- **FR-001**: Finished game MUST display the correct word, all scores, and all guesses.
- **FR-002**: Only the host MAY restart the game.
- **FR-003**: Restart MUST preserve the participant list.
- **FR-004**: Restart MUST reset `drawerId`, `secretWord`, `round`, `guesses`, `drawing`, and `scores`.
- **FR-005**: Non-host viewers MUST NOT see a restart button.

### Key Entities

- **Room.status**: `"lobby"` → `"playing"` → `"finished"` → `"lobby"` (cycle).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Results display within 500ms of round ending.
- **SC-002**: Restart completes in under 500ms and all players see the lobby within 2 seconds.
