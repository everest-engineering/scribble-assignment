# Feature Specification: Gameplay interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-31

**Status**: Draft

**Input**: Scenario 3 from the Scribble lab: drawing canvas, clear canvas, guess submission, guess history sync, and deterministic scoring.

## Scenario Statement

**Given** a round is active with a drawer and guessers and all scores start at 0, **When** the drawer draws or clears the canvas and guessers submit guesses, **Then** the drawing is visible on the drawer's screen; guesses are trimmed, compared case-insensitively, and empty guesses are rejected; the guess history is synced to all players via polling; correct guesses score 100 and incorrect guesses add 0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw and clear canvas (Priority: P1)

The drawer uses an interactive canvas to draw for the guessers and can clear the drawing when needed.

**Why this priority**: Drawing is the central action in the game.

**Independent Test**: Start a game as the drawer, draw on the canvas, clear it, and verify drawing state changes are reflected in the room snapshot.

**Acceptance Scenarios**:

1. **Given** the viewer is the drawer, **When** they draw on the canvas, **Then** the drawing is visible on the drawer's screen and the drawing state updates.
2. **Given** the viewer is the drawer, **When** they clear the canvas, **Then** the drawing state becomes empty.
3. **Given** the viewer is not the drawer, **When** they attempt to draw or clear, **Then** the action is blocked.

---

### User Story 2 - Submit and sync guesses (Priority: P2)

Guessers submit trimmed guesses and see a shared guess history through polling.

**Why this priority**: Guessing completes the drawing-and-guessing loop.

**Independent Test**: Submit guesses from a guesser and verify all players receive the updated history on refresh or polling.

**Acceptance Scenarios**:

1. **Given** the viewer is a guesser, **When** they submit a non-empty guess, **Then** it appears in the guess history.
2. **Given** the viewer submits an empty or whitespace-only guess, **When** the form is submitted, **Then** a validation message appears.
3. **Given** another player has submitted a guess, **When** the room is polled, **Then** the latest guess history is visible.

---

### User Story 3 - Score correct guesses (Priority: P3)

A correct guess is detected deterministically and awards a fixed score.

**Why this priority**: Scoring provides an objective end condition for the single round.

**Independent Test**: Submit an incorrect guess, then the correct word, and verify only the correct guess awards points and moves the room to results.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** scores are displayed, **Then** all scores start at 0.
2. **Given** a guess does not match the secret word, **When** it is submitted, **Then** 0 points are added.
3. **Given** a guess matches the secret word case-insensitively, **When** it is submitted, **Then** the guesser receives 100 points.
4. **Given** a correct guess is submitted, **When** scoring completes, **Then** the room moves to results.

### Edge Cases

- The drawer cannot submit guesses.
- Guess submission is blocked when the room is not actively playing.
- Drawing updates are scoped to one room and do not affect other rooms.
- All scores start at 0 for a new active round.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive drawing canvas.
- **FR-002**: System MUST allow only the drawer to update or clear drawing state.
- **FR-003**: System MUST trim guesses and reject empty guesses.
- **FR-004**: System MUST prevent the drawer from submitting guesses.
- **FR-005**: System MUST compare guesses to the secret word case-insensitively.
- **FR-006**: System MUST initialize all scores to 0 when the active round starts.
- **FR-007**: System MUST award 100 points for a correct guess and add 0 points for incorrect guesses.
- **FR-008**: System MUST sync guess history to all players by HTTP polling.
- **FR-009**: System MUST sync drawing and scores by HTTP polling.

### Key Entities

- **Drawing Data**: The shared canvas paths for the current round.
- **Guess**: A submitted guess with player identity, text, correctness, and timestamp.
- **Score Entry**: A participant score shown to all players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawer can draw and clear the canvas.
- **SC-002**: Guessers can submit valid guesses and see validation for empty guesses.
- **SC-003**: Guess history is visible to all players after polling.
- **SC-004**: Correct guesses deterministically award 100 points and end the round.

## Clarifications

- Sync uses HTTP polling only.
- No timers, speed bonuses, or drawer bonuses are included.
