# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-03
- Q: What happens when multiple guessers submit the correct answer in the exact same polling interval? → A: Both players get 100 points
- Q: What should the polling interval be for synchronizing the game state to balance responsiveness and server load? → A: 1000ms (1 second)
- Q: What should be the maximum allowed length for a text guess? → A: 50 characters
- Q: What happens to the round if the drawer disconnects or stops polling while they are supposed to be drawing? → A: End the round after a timeout (e.g., 10 seconds without polling)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer creates drawing (Priority: P1)

As a drawer, I want to draw on the canvas and have my drawing visible to me and all players, so that guessers can guess the word.

**Why this priority**: Without drawing, the game cannot be played.

**Independent Test**: Can be tested by having a drawer make marks on the canvas and verifying they appear locally and are synced to others.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer draws on the canvas, **Then** the drawing is visible on the drawer's screen.
2. **Given** a round is active, **When** the drawer clears the canvas, **Then** the canvas is cleared for the drawer.
3. **Given** the drawer has updated the canvas, **When** players poll for updates, **Then** they receive the updated drawing state.

---

### User Story 2 - Guessers submit guesses (Priority: P1)

As a guesser, I want to submit text guesses and have them evaluated, so I can score points if I am correct.

**Why this priority**: Guessing is the core interaction for non-drawer players.

**Independent Test**: Can be tested by submitting text inputs and verifying they appear in the history and trigger scoring logic.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a guesser submits a valid text guess, **Then** the guess is added to the guess history.
2. **Given** a guesser enters an empty string or just spaces, **When** they submit, **Then** the guess is rejected.
3. **Given** a guesser submits a guess, **When** it is compared to the target word, **Then** leading/trailing spaces are ignored and the comparison is case-insensitive.
4. **Given** a guess is evaluated as correct, **When** scoring is applied, **Then** the guesser's score increases by 100.
5. **Given** a guess is evaluated as incorrect, **When** scoring is applied, **Then** the guesser's score increases by 0.

---

### User Story 3 - Players view guess history (Priority: P2)

As a player (drawer or guesser), I want to see the history of all guesses from all players, so I know what has already been guessed.

**Why this priority**: Provides essential feedback and context to all players during the round.

**Independent Test**: Can be tested by simulating multiple guesses and verifying they appear in order for all polling clients.

**Acceptance Scenarios**:

1. **Given** new guesses are submitted, **When** a player's client polls for updates, **Then** their local guess history is updated with the new guesses.

### Edge Cases

- When multiple guessers submit the correct answer in the same polling interval, both players receive the full 100 points.
- If the drawer stops polling for more than 10 seconds (timeout), the round is ended automatically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the Drawer to draw on and clear the canvas, with changes immediately visible on their screen.
- **FR-002**: The system MUST allow Guessers to submit text guesses.
- **FR-003**: The system MUST reject empty guesses or guesses containing only whitespace.
- **FR-004**: The system MUST trim leading and trailing whitespace from guesses before evaluation.
- **FR-005**: The system MUST perform a case-insensitive comparison between the guess and the target word.
- **FR-006**: The system MUST award exactly 100 points to a player for a correct guess.
- **FR-007**: The system MUST award 0 points for an incorrect guess.
- **FR-008**: The system MUST synchronize the guess history to all players in the room via HTTP polling.
- **FR-009**: The system MUST synchronize the drawing state to all players in the room via HTTP polling.
- **FR-010**: The system MUST poll for game state updates (drawing and guess history) at an interval of 1000ms (1 second).
- **FR-011**: The system MUST limit guesses to a maximum of 50 characters and reject any longer guesses.

### Key Entities *(include if feature involves data)*

- **Guess**: Represents a single guess attempt, including the text, the player who submitted it, and whether it was correct.
- **Drawing State**: Represents the current state of the canvas (lines, clears, colors).
- **Player Score**: Tracks the accumulated points for a player.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Empty guesses are successfully rejected 100% of the time.
- **SC-002**: Guesses matching the target word (ignoring case and whitespace) correctly result in a 100-point score increase.
- **SC-003**: Guess history is successfully synchronized to all players within one polling interval (1000ms) of the server processing the guess.
- **SC-004**: Canvas drawing updates are correctly propagated to all players via polling.
- **SC-005**: The system maintains an HTTP polling interval of 1000ms without degrading performance for up to typical room sizes.

## Assumptions

- We assume players have stable internet connectivity to support HTTP polling.
- We assume that the drawing state data structure is small enough to be synced efficiently via polling.
