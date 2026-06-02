# Feature Specification: Drawing, Guessing, and Scoring

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-02

**Status**: Implemented

**Input**: User description: "Enhance the Scribble starter to support interactive drawing, canvas clearing, guess submission with validation, synchronized guess history, and deterministic scoring."

## User Scenarios & Testing

### User Story 3 - Drawing, guessing, and scoring (Priority: P3)

As a drawer or guesser, the system must support drawing, clearing, guess submission, synchronized history, and deterministic scoring so that one full round can be played.

**Why this priority**: This is the core gameplay slice and creates the round outcome that later enables result and restart behavior.

**Independent Test**: Can be fully tested by having the drawer draw and clear the canvas, having a guesser submit blank, incorrect, and correct guesses, and validating history sync plus score updates.

**Acceptance Scenarios**:

1. **Given** a round is active and the current player is the drawer, **When** the drawer draws on the canvas, **Then** drawing data is captured and rendered on the drawer's screen.
2. **Given** a round is active and the current player is the drawer, **When** the drawer clears the canvas, **Then** the drawing state resets.
3. **Given** a guesser submits an empty or whitespace-only guess, **When** the request is processed, **Then** the guess is rejected with clear feedback.
4. **Given** a guesser submits an incorrect guess, **When** the request is processed, **Then** the guess is added to history and the score remains unchanged.
5. **Given** a guesser submits a correct guess with different letter casing, **When** the request is processed, **Then** it is treated as correct, 100 points are awarded, and the round ends.
6. **Given** guesses are submitted during a round, **When** polling runs, **Then** all players see synchronized guess history within about 2 seconds.

---

### Edge Cases

- What happens when the drawer attempts to submit guesses?
- What happens when a guesser attempts to modify the canvas?
- What happens when a stale client submits a guess or drawing update after the round already ended?
- How does the system handle polling cleanup when leaving the game screen?

## Requirements

### Functional Requirements

- **FR-015**: System MUST provide an interactive drawing surface for the drawer.
- **FR-016**: System MUST allow the drawer to clear the canvas.
- **FR-017**: System MUST prevent non-drawers from changing drawing state.
- **FR-018**: System MUST trim and validate guesses before evaluation.
- **FR-019**: System MUST reject empty guesses with clear feedback.
- **FR-020**: System MUST compare guesses case-insensitively.
- **FR-021**: System MUST append guesses to shared guess history.
- **FR-022**: System MUST award 100 points for the first correct guess and 0 points for incorrect guesses.
- **FR-023**: System MUST transition the room to result state after the first correct guess.

### Key Entities

- **GuessEntry**: Represents a submitted guess including who guessed, the submitted text, normalized value, correctness, and timestamp.
- **DrawingStroke**: Represents one or more canvas points needed to reconstruct the current drawing.
- **RoundState**: Holds the current drawing array, guesses array, and winner identity.

## Success Criteria

### Measurable Outcomes

- **SC-003**: A two-player room can complete one full round from lobby to result and return to lobby again without server restart.
- **SC-004**: Correct guesses award exactly 100 points and incorrect guesses award 0 during manual validation.

## Assumptions

- Drawing data is stored as an array of strokes (each stroke is an array of points with optional color and size).
- The canvas uses plain HTML Canvas API (no external drawing library).
- The drawing endpoint accepts a full stroke array replacement (snapshot model, not incremental).
- Points for a correct guess go to the guesser who submitted it.
