# Feature Specification: Guessing, Scoring & Game End

**Feature Branch**: `004-guessing-scoring-game-end`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Implement guess submission with validation, guess history syncing, scoring, result display, and restart flow"

## Clarifications

### Session 2026-06-12

- Q: How should simultaneous correct guesses be handled? → A: Only the first correct guesser receives points; the round ends immediately upon first correct guess
- Q: How should the frontend discover state changes? → A: Single polling endpoint returns full room state (guess history, room status, scores, secret word when revealed)
- Q: What should the UI show during guess submission and on network failures? → A: Loading spinner on submit button while request is in flight; inline error message near the input on failure; guess input stays intact for retry
- Q: How does the restart flow work? → A: Host clicks "Back to Lobby" → POST to restart endpoint → server resets state → all players (including host) discover lobby state via next poll
- Q: How are correct vs incorrect guesses visually distinguished? → A: Green checkmark icon next to correct guesses, red X icon next to incorrect guesses

## User Scenarios & Testing

### User Story 1 - Guesser Submits a Guess (Priority: P1)

A guesser can type a guess and submit it. The guess is validated (trimmed, not empty, case-insensitive matching). All players see the guess appear in a shared guess history.

**Why this priority**: Guessing is the core interaction for non-drawers. The guess flow must be smooth and validated to prevent empty or duplicate spam.

**Independent Test**: Can be tested by opening the game as a guesser, submitting a guess, and verifying it appears in the guess history for all players.

**Acceptance Scenarios**:

1. **Given** a guesser is in an active game round, **When** they type a guess and submit it, **Then** the guess appears in the shared guess history visible to all participants
2. **Given** a guesser submits an empty or whitespace-only guess, **When** the form is submitted, **Then** an inline error message is shown and the guess is not recorded
3. **Given** a guesser submits a guess with leading/trailing spaces, **When** the guess is processed, **Then** the spaces are trimmed before recording and comparing
4. **Given** the drawer is in an active round, **When** they view the guess history, **Then** they can see all guesses submitted by guessers

---

### User Story 2 - Correct Guess is Recognised (Priority: P1)

When a guesser submits a guess that matches the secret word (case-insensitive), the game recognises it as correct and records the outcome.

**Why this priority**: Correct guess detection is the trigger for scoring and round end. Without it, the game cannot determine when a round is over.

**Independent Test**: Can be tested by submitting the exact secret word (in any case) and verifying it is marked as correct.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** the guess matches the secret word (case-insensitive), **Then** the guess is marked as correct in the history
2. **Given** a guesser submits a guess, **When** the guess does not match the secret word, **Then** the guess is marked as incorrect in the history
3. **Given** a correct guess is submitted, **When** the guess history is viewed, **Then** the correct guess is visually distinguished from incorrect guesses

---

### User Story 3 - Scores are Calculated and Displayed (Priority: P2)

When the round ends, scores are calculated. Correct guessers receive points. The scoreboard updates and all players can see the final scores.

**Why this priority**: Scores provide the game's objective feedback and sense of progress. They motivate participation and give meaning to correct guesses.

**Independent Test**: Can be tested by completing a round and verifying scores are calculated correctly and displayed to all participants.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** a guesser submitted the correct guess, **Then** that guesser receives points for the correct guess
2. **Given** a round has ended, **When** a guesser did not submit the correct guess, **Then** that guesser receives no points for that round
3. **Given** a round has ended, **When** any player views the scoreboard, **Then** they see each participant's total score

---

### User Story 4 - All Players See Round Results (Priority: P2)

When the round ends, all players see a result screen showing the secret word, final scores, and the full guess history.

**Why this priority**: Revealing the secret word and showing what happened during the round creates closure and a satisfying end to the round.

**Independent Test**: Can be tested by completing a round and verifying that all players see the result screen with the secret word revealed.

**Acceptance Scenarios**:

1. **Given** a round has ended (correct guess or other end condition), **When** any player views their screen, **Then** they see the result screen
2. **Given** the result screen is displayed, **When** any player views it, **Then** the secret word is revealed to all participants
3. **Given** the result screen is displayed, **When** any player views it, **Then** they see the full guess history from the round
4. **Given** the result screen is displayed, **When** any player views it, **Then** they see the final scores

---

### User Story 5 - Players Can Restart the Game (Priority: P2)

After the result screen, players can return to the lobby to play again. Players are preserved, but game state (drawing, guesses, scores) is cleared.

**Why this priority**: Restarting allows players to play multiple rounds without re-creating the room. Player retention between rounds enables continued play.

**Independent Test**: Can be tested by completing a round, clicking restart, and verifying all players are back in the lobby with their names preserved.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** the host clicks "Play Again" or "Back to Lobby", **Then** all players are returned to the lobby
2. **Given** players return to the lobby after a round, **When** they view the participant list, **Then** all players from the previous round are present
3. **Given** players return to the lobby after a round, **When** they view the game state, **Then** the drawing canvas is cleared and guess history is empty

---

### Edge Cases

- What happens if a guesser submits the same guess multiple times? Duplicate guesses from the same player should be allowed (they might guess the same wrong word), but only the first correct guess counts
- What happens if multiple guessers guess correctly at the same time? The first correct guess processed by the server ends the round immediately; only that guesser receives points. If two correct guesses arrive in the same request cycle, the server orders them by processing timestamp
- What happens if the drawer stops drawing and no one guesses? The round ends when a correct guess is made. If no correct guess is made, the round persists indefinitely (host-forced round end is out of scope for v1)
- What happens if a player disconnects during the result screen and reconnects? They should see the result state when they rejoin
- What happens if some players want to leave while others want to restart? The restart should be host-initiated (consistent with lobby management)

## Requirements

### Functional Requirements

- **FR-001**: System MUST accept guess submissions from guessers during an active round
- **FR-002**: System MUST validate guesses by trimming whitespace and rejecting empty/whitespace-only submissions
- **FR-003**: System MUST compare guesses to the secret word case-insensitively
- **FR-004**: System MUST add every valid guess to a shared guess history visible to all participants
- **FR-005**: System MUST mark guesses as correct or incorrect in the guess history
- **FR-006**: System MUST visually distinguish correct guesses from incorrect guesses in the history using a green checkmark icon for correct and a red X icon for incorrect
- **FR-007**: System MUST award points to a guesser when they submit the correct guess
- **FR-008**: System MUST NOT award points for incorrect guesses
- **FR-009**: System MUST display scores for all participants on the scoreboard
- **FR-010**: System MUST transition room to a finished/result state when the round ends
- **FR-011**: System MUST reveal the secret word to all participants on the result screen
- **FR-012**: System MUST display the full guess history on the result screen
- **FR-013**: System MUST provide a restart endpoint (POST /api/rooms/:code/restart) for the host to return all players to the lobby after the result screen; all players discover the lobby transition via polling
- **FR-014**: System MUST preserve the participant list when returning to the lobby after a round
- **FR-015**: System MUST clear round-specific state (drawing, guesses, scores) when returning to the lobby
- **FR-016**: System MUST provide a single polling endpoint (GET /api/rooms/:code) that returns the full room state including guess history, room status, scores, and the secret word (when the round has ended)

- **FR-017**: System MUST set a maximum guess length of 100 characters to prevent excessively long submissions
- **FR-018**: System MUST show a loading spinner on the submit button while a guess submission request is in flight
- **FR-019**: System MUST display an inline error message near the guess input on submission failure and keep the guess text intact for retry

### Key Entities

- **Guess**: Represents a single guess submission. Contains the guess text (trimmed), the participant who submitted it, a timestamp, and whether it was correct.
- **GuessHistory**: An ordered list of all guesses made during the round, with their correctness status.
- **Score**: Represents a participant's accumulated score. Contains the participant ID and total points.
- **RoundResult**: Represents the outcome of a round. Contains the secret word (revealed), the guess history, the final scores, and the winner (the first correct guesser, if any).
- **GameState**: An aggregate of the current round state. Contains the room status, guess history, scores, drawing state, and round result (when applicable).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Guess submissions appear in the shared history within 2 seconds for all participants
- **SC-002**: Correct guesses are identified and marked within 1 second of submission
- **SC-003**: Scores are calculated and displayed correctly for all participants with no errors
- **SC-004**: The result screen is displayed to all players within 2 seconds of the round ending
- **SC-005**: The restart flow returns all players to the lobby with their names preserved within 3 seconds
- **SC-006**: Empty or invalid guesses are rejected 100% of the time with clear feedback

## Assumptions

- Scoring is simple: correct guess = 100 points, incorrect = 0 points. No partial credit or speed bonuses.
- The round ends upon the first correct guess, so only the first correct guesser receives points
- The round ends immediately when a correct guess is submitted
- The restart action is available to the host only (consistent with lobby management spec)
- Multiple rounds and score accumulation across rounds are out of scope for v1 (single round per game session)
- The drawer does not receive points in v1 (their reward is the act of drawing)
