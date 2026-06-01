# Feature Specification: Drawing Canvas and Guess Scoring

**Feature Branch**: `003-drawing-canvas`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "When a round is active, the drawer can draw on the canvas and clear it when needed. Guessers can submit guesses, where guesses are trimmed, compared case-insensitively with the secret word, and empty guesses are rejected. Guess history is synchronized to all players through polling, and correct guesses award 100 points while incorrect guesses award 0 points."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Can Draw and Clear the Canvas (Priority: P1)

When a round is active, the drawer should be able to draw on the canvas and clear it when needed so the round can proceed visually.

**Why this priority**: Drawing is the main activity of the round and the game cannot function without it.

**Independent Test**: Start an active round as the drawer, make a drawing, clear the canvas, and confirm both actions are reflected for players in the room.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer draws on the canvas, **Then** the drawing is visible to other players in the room.
2. **Given** a round is active, **When** the drawer clears the canvas, **Then** the canvas becomes empty for everyone in the room.
3. **Given** a round is active and the player is the drawer, **When** they view the round screen, **Then** the guess input is hidden from them.
4. **Given** a round is not active, **When** a player views the round screen, **Then** drawing controls are not available.

---

### User Story 2 - Guessers Submit Valid Guesses (Priority: P1)

Guessers should be able to submit guesses that are cleaned up before evaluation, with empty guesses rejected and matching performed without regard to letter casing.

**Why this priority**: Guessing is the core interaction for non-drawers during the round.

**Independent Test**: Submit blank, padded, and mixed-case guesses and confirm invalid guesses are rejected while valid guesses are evaluated correctly.

**Acceptance Scenarios**:

1. **Given** a guesser submits an empty guess, **When** the guess is evaluated, **Then** it is rejected with a clear message.
2. **Given** a guesser submits a guess with surrounding spaces, **When** the guess is evaluated, **Then** the trimmed value is used.
3. **Given** a guesser submits a guess with different letter casing than the secret word, **When** it is evaluated, **Then** the guess is matched case-insensitively.

---

### User Story 3 - Share Guess History and Points (Priority: P2)

All players should see a synchronized history of guesses during the round, and each guess should award points based on whether it is correct.

**Why this priority**: Shared feedback and scoring make the round understandable and competitive for everyone.

**Independent Test**: Make several guesses from different players and confirm the guess history and points stay consistent for all players.

**Acceptance Scenarios**:

1. **Given** a guess has been submitted, **When** players view the round state, **Then** they can see the updated guess history.
2. **Given** a correct guess is submitted, **When** the round updates, **Then** the guessing player receives 100 points.
3. **Given** an incorrect guess is submitted, **When** the round updates, **Then** the guessing player receives 0 points.

### Edge Cases

- What happens when a player submits the same guess more than once?
- What happens when multiple players guess at nearly the same time?
- What happens when the drawer clears the canvas while guesses are being submitted?
- What happens when the secret word contains mixed casing and the guess uses a different casing?
- What happens when there is no active round and a guess is submitted?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the active drawer to draw on the canvas during an active round.
- **FR-002**: The system MUST allow the active drawer to clear the canvas during an active round.
- **FR-003**: The system MUST prevent non-drawers from using drawing or clear-canvas controls.
- **FR-004**: The system MUST hide the guess input from the drawer during an active round.
- **FR-005**: The system MUST reject empty or whitespace-only guesses with a clear message.
- **FR-006**: The system MUST trim guesses before evaluating them.
- **FR-007**: The system MUST compare guesses to the secret word without regard to letter casing.
- **FR-008**: The system MUST synchronize guess history to all players in the room.
- **FR-009**: The system MUST award 100 points for a correct guess.
- **FR-010**: The system MUST award 0 points for an incorrect guess.
- **FR-011**: The system MUST keep guess history and scoring consistent for all players in the same round.

### Key Entities *(include if feature involves data)*

- **Round**: The active gameplay state that contains drawing, guessing, and scoring activity.
- **Drawer**: The player who can draw and clear the canvas during the round.
- **Guesser**: A player who can submit guesses and view guess history.
- **Guess**: A submitted attempt to match the secret word.
- **Guess History**: The ordered record of guesses made during the round.
- **Score**: The points tracked for each player during the round.
- **Canvas State**: The visible drawing state shared with players in the room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of active rounds, the drawer can draw and clear the canvas while non-drawers cannot.
- **SC-002**: In 100% of active rounds, the drawer does not see the guess input.
- **SC-003**: In 100% of guess submissions, blank or whitespace-only guesses are rejected before evaluation.
- **SC-004**: In 100% of case-variation checks, guesses match the secret word regardless of letter casing.
- **SC-005**: In repeated room views, guess history and scores remain synchronized for all players viewing the same round.
- **SC-006**: In 100% of scoring checks, correct guesses award 100 points and incorrect guesses award 0 points.

## Assumptions

- A round must already be active before drawing or guessing can begin.
- Guess history is visible to all players in the room during the round.
- Scores are tracked per player for the active round and are visible to the room.
- The shared room state stays current enough for players to see recent guesses without manually refreshing.
- The secret word is already known to the system for the active round.
