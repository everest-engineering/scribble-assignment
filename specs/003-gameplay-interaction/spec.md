# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing

### User Story 1 - Canvas Drawing (Priority: P1)

The drawer needs a canvas to draw on, and all participants need to see the drawing. The drawer can clear the canvas and start over.

**Why this priority**: Visual drawing is the core gameplay mechanic — without a shared canvas, guessers have nothing to base their guesses on. This is the foundation for all other gameplay interaction.

**Independent Test**: Start a game as host (drawer). Verify a drawing canvas appears on the drawer's screen with drawing and clear tools. Verify the drawing appears on all participants' screens within the polling interval.

**Acceptance Scenarios**:

1. **Given** a round is active with a drawer, **When** the drawer draws on the canvas, **Then** the drawing is visible in real-time on the drawer's screen
2. **Given** a round is active, **When** the drawer draws on the canvas, **Then** the drawing appears on all guessers' screens within 2 seconds
3. **Given** the drawer has made marks on the canvas, **When** they press the clear button, **Then** the canvas is cleared on all participants' screens within 2 seconds

---

### User Story 2 - Guess Submission & Validation (Priority: P1)

Guessers submit text guesses. The system validates them: trims whitespace, compares case-insensitively against the secret word, and rejects empty submissions. Guessers see whether their guess was correct or incorrect.

**Why this priority**: Guessing is the second half of the core gameplay loop. Without guess validation, the game cannot determine when a player wins or scores.

**Independent Test**: As a guesser, submit a correct guess, an incorrect guess, and an empty guess. Verify correct guesses are marked correct, incorrect are marked incorrect, and empty guesses are rejected.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a guesser submits "ROCKET" and the secret word is "rocket", **Then** the guess is accepted as correct
2. **Given** a round is active, **When** a guesser submits "  rocket  " (with surrounding whitespace), **Then** the guess is trimmed and accepted as correct
3. **Given** a round is active, **When** a guesser submits "pizza" and the secret word is "rocket", **Then** the guess is marked as incorrect
4. **Given** a round is active, **When** a guesser submits an empty or whitespace-only guess, **Then** it is rejected and feedback is shown

---

### User Story 3 - Scoring & Guess History (Priority: P2)

Scores are tracked per participant, starting at 0. Correct guesses award 100 points. Incorrect guesses add 0 points. The full guess history (who guessed what, and whether it was correct) is visible to all participants.

**Why this priority**: Scoring and history add competitive structure but the game can function without them. This is enhancement rather than core mechanics.

**Independent Test**: Play a round where multiple guessers submit various guesses. Verify scores accumulate correctly and all participants can see the guess history via polling.

**Acceptance Scenarios**:

1. **Given** all participants start at 0, **When** a guesser submits a correct guess, **Then** their score becomes 100
2. **Given** a guesser has 100 points, **When** another guesser submits a correct guess, **Then** the second guesser's score becomes 100 and the first remains 100
3. **Given** a guesser submits an incorrect guess, **Then** their score remains unchanged
4. **Given** multiple guessers have submitted guesses, **When** any participant views the game page, **Then** they see all submitted guesses, who made them, and whether they were correct

---

### Edge Cases

- What happens when all guessers have guessed the word correctly? (Round continues — multiple guessers can each score 100)
- Can two guessers submit the correct word at the same time? (Yes — both score 100; no winner locking)
- What happens if an already-correct guesser submits again? (They see "Already guessed correctly" feedback; no score change)
- How does the drawer clear the canvas — full clear or undo? (Full clear only; undo is out of scope)
- Can a guesser submit the same incorrect guess multiple times? (Yes — no duplicate detection)
- What happens if a guesser submits a guess that partially matches the word? (Partial matches are treated as incorrect; only exact case-insensitive match counts)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a drawing canvas for the drawer with draw and clear tools
- **FR-002**: System MUST display the drawing canvas to all guessers in read-only mode
- **FR-003**: When the drawer clears the canvas, System MUST clear it for all participants
- **FR-004**: Guessers MUST be able to submit text guesses via the game page
- **FR-005**: System MUST trim leading/trailing whitespace from submitted guesses
- **FR-006**: System MUST compare guesses case-insensitively against the active round's secret word
- **FR-007**: System MUST reject empty or whitespace-only guesses with user-visible feedback
- **FR-008**: System MUST record each submitted guess with its result (correct/incorrect)
- **FR-009**: System MUST make guess history available to all participants via polling
- **FR-010**: System MUST award 100 points to a guesser when they submit a correct guess. Multiple guessers can each score 100 for the same round (no winner locking).
- **FR-011**: System MUST NOT award points for incorrect guesses
- **FR-012**: Scores MUST accumulate across guesses within a session
- **FR-013**: System MUST show "Already guessed correctly" feedback when a previously correct guesser submits again, without changing their score
- **FR-014**: System MUST reject stroke and clear requests from participants who are not the current drawer
- **FR-015**: System MUST reject guess submissions from the current drawer

### Key Entities

- **Guess**: A single text submission by a guesser. Attributes: participant ID, text (trimmed), result (correct/incorrect), timestamp.
- **Score**: Accumulated points for a participant within a round. Starts at 0, increments by 100 per correct guess.
- **Drawing**: The visual content of the canvas representing the drawer's strokes. Stored as vector stroke data (arrays of {x,y} coordinate points per stroke). Shared to all participants via polling.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Drawing updates are visible to all participants within 2 seconds
- **SC-002**: Guessers receive correctness feedback within 2 seconds of submission
- **SC-003**: Scores correctly reflect 100 points per correct guess, 0 for incorrect
- **SC-004**: Empty and whitespace-only guesses are rejected with feedback visible to the guesser within 2 seconds
- **SC-005**: All participants can view the complete guess history during and after a round

## Clarifications

### Session 2026-06-11

- Q1: Drawing data representation → A: Vector strokes (arrays of {x,y} coordinate points per stroke)
- Q2: Already-correct guesser re-submission → A: Show "Already guessed correctly" message
- Q3: Concurrent correct guesses → A: Both guessers score 100 (no "winner" locking)

## Assumptions

- Drawing is shared to all participants and updates propagate to all screens. Drawing sharing is acceptable for lab-scale use (2+ participants).
- Canvas is a simple free-drawing surface with a single color, single brush width, and a clear button. No colors, eraser, undo, or shape tools.
- The drawer does NOT score points when guessers guess correctly. Only guessers score.
- A guesser can submit multiple guesses after being incorrect. No lockout or rate limiting.
- After a correct guess, the guesser is not locked out — they can continue submitting (always rejected as already-correct).
- The round does not automatically end when all guessers have guessed correctly. Game lifecycle transitions (round end, drawer rotation) are separate features.
