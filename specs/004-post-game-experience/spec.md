# Feature Specification: Post Game Experience

**Feature Branch**: `004-post-game-experience`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "The feature goal is after game experience, such as Result, Restart & Final Validation. Once player guesses the correct word, the game transitions to a shared result state. This screen must show the correct secret word, final player standings, and the guess log. The host must then be able to restart the game, sending all players back to the lobby while resetting round state but keeping the participant list intact."

## User Scenarios & Testing

### User Story 1 - Correct Guess Ends the Round (Priority: P1)

As a guesser, when I guess the secret word correctly, I want the round to end immediately and all players to see the result screen so we know the round is over and can see the outcome.

**Why this priority**: This is the core mechanism that transitions the game from active play to results. Without this, the game has no natural end state and cannot proceed to a new round.

**Independent Test**: Start a game with 2+ players, have a guesser submit the correct secret word, and verify that all players' screens transition to a shared result state showing the correct word, standings, and guess log.

**Acceptance Scenarios**:

1. **Given** a game in the drawing/guessing phase, **When** a guesser submits the correct secret word, **Then** the round phase transitions to "finished" and all players see the result screen
2. **Given** a game in the drawing/guessing phase, **When** a guesser submits an incorrect word, **Then** the round continues normally and the result screen is NOT shown
3. **Given** a game in the drawing/guessing phase, **When** multiple guessers have submitted guesses (some correct, some incorrect), **Then** the round only ends when the first correct guess is submitted

---

### User Story 2 - Result Screen Shows Round Summary (Priority: P1)

As a player when the round ends, I want to see a result screen that shows the correct secret word, final player standings (who guessed correctly), and the complete guess log so I can see how the round played out.

**Why this priority**: The result screen is the main deliverable of this feature — without it, players have no visibility into the round outcome.

**Independent Test**: Play a round to completion by having a guesser guess correctly, and verify the result screen displays: the correct secret word, each player's name with their status (correct/incorrect/no guess), and all guesses made during the round in chronological order.

**Acceptance Scenarios**:

1. **Given** the round has ended, **When** any player views the result screen, **Then** the correct secret word is displayed and visible to all players (no longer hidden)
2. **Given** the round has ended, **When** any player views the result screen, **Then** player standings are shown — the drawer is listed with the number of correct guesses they received, and each guesser is listed with whether they guessed correctly
3. **Given** the round has ended, **When** any player views the result screen, **Then** the complete chronological guess log is displayed, showing who guessed what and whether each guess was correct
4. **Given** the round has ended, **When** any player views the result screen, **Then** the drawing canvas is still visible so players can see the final drawing

---

### User Story 3 - Host Restarts the Game (Priority: P2)

As the host when viewing the result screen, I want to restart the game so we can play another round without having to create a new room.

**Why this priority**: Restarting enables continuous play, which is essential for a party game. Without restart, players would need to create a new room each round.

**Independent Test**: On the result screen as host, click "Play Again" and verify: all players are sent back to the lobby, the participant list is intact, and the host can start a new game from the lobby.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** the host clicks "Play Again", **Then** all players are returned to the lobby with the same participant list retained
2. **Given** the result screen is displayed, **When** a non-host player looks at their screen, **Then** they see the result screen (not the restart button) and do NOT see a restart option
3. **Given** the host has restarted the game, **When** all players arrive in the lobby, **Then** the room code remains the same, the participant list is unchanged, and the host can start a new game
4. **Given** the host has restarted the game, **Then** the round state (secret word, strokes, guesses) is fully reset and the previous round data is no longer accessible

---

### Edge Cases

- What happens if a guesser correctly guesses at the exact same moment as another guesser? Only the first correct guess (as determined by server timestamp) triggers the round end.
- What if the host disconnects before restarting? The result screen remains viewable, but no restart is possible until the host returns or a new host is designated.
- What happens to the drawing after the round ends? The canvas remains visible on the result screen as a record of the round.
- What if a player joins during the result screen? They see the result screen and are included in the participant list for the next round.

## Requirements

### Functional Requirements

- **FR-001**: When a guesser submits a correct guess, the server MUST immediately transition the round phase from "drawing" to "finished".
- **FR-002**: All players polling the room MUST see the phase transition to "finished" on their next poll cycle after a correct guess.
- **FR-003**: The result screen MUST display the correct secret word to ALL players (no longer hidden).
- **FR-004**: The result screen MUST display player standings: for each guesser, whether they guessed correctly; for the drawer, how many guessers guessed correctly.
- **FR-005**: The result screen MUST display the complete chronological guess log showing guesser name, guess text, and whether it was correct.
- **FR-006**: The result screen MUST display the final drawing canvas alongside the summary information.
- **FR-007**: The host MUST see a "Play Again" button on the result screen.
- **FR-008**: Non-host players MUST NOT see a restart option on the result screen.
- **FR-009**: When the host clicks "Play Again", the server MUST reset the room to "lobby" status, clear all round state (secret word, strokes, guesses), and retain the full participant list.
- **FR-010**: When the host clicks "Play Again", all players polling MUST receive the updated lobby state with the same room code.
- **FR-011**: Incorrect guesses MUST NOT trigger the round end — only correct guesses transition to "finished".
- **FR-012**: Once the phase is "finished", no further guesses or strokes MUST be accepted by the server.

### Key Entities

- **Round Result**: The outcome of a completed round. Includes the secret word, the complete guess log, and each player's standing (correct/incorrect/no guess for guessers; correct guess count for drawer). Computed from the existing RoundState when the phase becomes "finished".
- **Player Standing**: A per-player summary showing whether they guessed correctly (guesser) or how many of their guesses were correct (drawer).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Within 2 seconds of a correct guess being submitted, all players see the result screen (one polling cycle at 500ms interval).
- **SC-002**: The correct secret word is visible to 100% of players on the result screen.
- **SC-003**: The guess log on the result screen matches the server's stored guesses exactly, with correct chronology.
- **SC-004**: When the host clicks "Play Again", the lobby reflects the reset state within 2 seconds for all players.
- **SC-005**: The participant list is identical before and after a restart (no participants added or removed).

## Assumptions

- "Final player standings" refers to who guessed correctly/incorrectly, not a numerical score. Scoring is handled by a future feature.
- A new round phase "finished" will be added to the existing `RoundPhase` type alongside "word-selection" and "drawing".
- The result screen is a shared state — all players see the same information (no per-player filtering).
- The drawing strokes remain visible on the result screen for reference.
- After restart, the next game will assign a new random drawer and new word options (as part of the existing game-start flow).
- The host is determined by the existing `hostId` field on the room and is unchanged by the round lifecycle.
