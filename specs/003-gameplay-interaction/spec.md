# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Gameplay Interaction"

## User Scenarios & Testing

### User Story 1 - Drawer draws on canvas (Priority: P1)

As a drawer in an active round, I want to draw freehand on a canvas and clear my drawing so that I can visually communicate the secret word to guessers.

**Why this priority**: Drawing is the primary gameplay action for the drawer role; without it, guessers have nothing to work with.

**Independent Test**: Can be tested by loading the game as the drawer and drawing lines on the canvas. The drawing appears immediately on the drawer's screen.

**Acceptance Scenarios**:

1. **Given** a round is active with the current user as the drawer, **When** the user draws a line on the canvas, **Then** the line appears on the drawer's screen.
2. **Given** the drawer has drawn on the canvas, **When** the drawer clicks the clear button, **Then** the canvas returns to a blank state on the drawer's screen.
3. **Given** a round is active, **When** the drawer opens the game page, **Then** the drawer sees a blank canvas and drawing tools.

---

### User Story 2 - Guesser submits a guess (Priority: P1)

As a guesser in an active round, I want to submit text guesses so that I can try to guess the secret word.

**Why this priority**: Guessing is the core interaction for the guesser role; without it the game cannot progress.

**Independent Test**: Can be tested by loading the game as a guesser and submitting a text guess. The guess is accepted or rejected based on validity.

**Acceptance Scenarios**:

1. **Given** a round is active with the current user as a guesser, **When** the guesser submits a non-empty text guess, **Then** the guess is accepted and appears in the guess history.
2. **Given** a guesser submits a guess with leading or trailing whitespace, **When** the system processes the guess, **Then** the whitespace is trimmed before comparison and storage.
3. **Given** a guesser submits a guess, **When** the system compares it to the secret word, **Then** the comparison is case-insensitive.
4. **Given** a guesser submits an empty or whitespace-only guess, **When** the system validates the guess, **Then** the guess is rejected with a notification to the guesser.

---

### User Story 3 - All players see guess history (Priority: P2)

As any player in an active round, I want to see a live-updating list of all guesses submitted so far so that I can track which words have been tried and avoid repeating them.

**Why this priority**: History visibility is essential for gameplay flow but depends on the guess submission system being in place first.

**Independent Test**: Can be tested by submitting multiple guesses from the guesser's tab and confirming all players' screens show the same ordered history.

**Acceptance Scenarios**:

1. **Given** a guesser has submitted a guess, **When** any player views the game page, **Then** the guess appears in their guess history.
2. **Given** multiple guesses have been submitted, **When** the guess history is viewed, **Then** guesses are displayed in the order they were submitted (oldest first).
3. **Given** a guesser submits a new guess, **When** the polling cycle completes, **Then** all players see the updated history including the new guess.

---

### User Story 4 - Scoring on correct guess (Priority: P1)

As a guesser, I want to earn points when I guess the secret word correctly so that I can track my performance and compete with other players.

**Why this priority**: Scoring is essential for game progression and competitive play.

**Independent Test**: Can be tested by submitting the correct secret word as a guess and confirming the guesser's score increases by 100.

**Acceptance Scenarios**:

1. **Given** a round is active with a secret word, **When** a guesser submits a guess that matches the secret word (case-insensitive, trimmed), **Then** the guesser's score increases by 100 points.
2. **Given** a round is active with a secret word, **When** a guesser submits a guess that does not match the secret word, **Then** the guesser's score does not change (adds 0).
3. **Given** multiple guessers submit the correct word, **When** scores are calculated, **Then** each guesser who guessed correctly receives 100 points.
4. **Given** a guesser has already guessed correctly, **When** they attempt to submit another guess, **Then** the guess input is disabled and no further guesses are accepted from that guesser.

### Edge Cases

- What happens when the drawer submits a guess? (Drawer should not be able to submit guesses; the guess input is hidden for the drawer role.)
- How does the system handle a guesser submitting the same incorrect guess multiple times? (The guess is accepted each time and appears in history, but no duplicate detection is required.)
- What happens to the canvas if the drawer disconnects mid-draw? (The last synced canvas state is preserved; polling continues to serve the existing canvas state.)
- How does the system handle a guess with mixed case, unicode, or accented characters? (Comparison follows standard case-insensitive string comparison for the platform; accented characters are compared as-is without normalization.)
- What is the maximum length of a guess? (Guesses longer than 50 characters are rejected.)
- What happens when all players have correctly guessed? (The round continues; guessers who already guessed correctly have their input disabled but can still see the drawing and history.)

## Requirements

### Functional Requirements

- **FR-001**: Drawer MUST be able to draw freehand lines on a canvas using mouse or touch input.
- **FR-002**: Drawer MUST be able to clear the entire canvas to a blank state with a single action.
- **FR-003**: Drawer's canvas state MUST be visible on the drawer's screen in real-time (within each polling cycle).
- **FR-004**: Canvas state MUST be synced to all players through polling so guessers can see the drawing.
- **FR-005**: Guessers MUST be able to submit a text guess via an input field and submit button.
- **FR-006**: System MUST trim leading and trailing whitespace from all submitted guesses.
- **FR-007**: System MUST compare guesses to the secret word case-insensitively.
- **FR-008**: System MUST reject empty guesses (including whitespace-only after trimming) and notify the guesser.
- **FR-009**: System MUST reject guesses longer than 50 characters and notify the guesser.
- **FR-010**: System MUST evaluate each guess against the secret word immediately upon submission.
- **FR-011**: A correct guess MUST award 100 points to the guesser.
- **FR-012**: An incorrect guess MUST award 0 points to the guesser (score unchanged).
- **FR-013**: A guesser who has already guessed correctly MUST have their guess input disabled for the remainder of the round.
- **FR-014**: A correct guess MUST be visually highlighted in the guess history for all players to distinguish it from incorrect guesses.
- **FR-015**: System MUST maintain an ordered guess history for the round, accessible to all players.
- **FR-016**: Guess history MUST be synced to all players through polling.
- **FR-017**: Drawer role MUST NOT see the guess input field and MUST NOT be able to submit guesses.
- **FR-018**: Scores MUST be synced to all players through polling.

### Key Entities

- **Canvas**: Represents the current drawing state for a round. Contains the pixel/vector data of everything the drawer has drawn. Is initialized to blank at round start and can be cleared.
- **Guess**: A single text submission by a guesser. Contains the guessed text, the guesser's identity, and the submission timestamp. Evaluated against the secret word at submission time.
- **Guess History**: An ordered, append-only list of all guesses submitted during a round. Each entry always includes the guess text, the guesser's name, and whether it was correct (without revealing the secret word on incorrect guesses).
- **Score**: The cumulative points earned by a player. Starts at 0, incremented by 100 for each round in which the player correctly guesses the secret word.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Drawer can draw on the canvas and see their drawing appear within the same polling cycle.
- **SC-002**: Guesser can submit a guess and see it reflected in their own guess history within the same polling cycle.
- **SC-003**: All players see the same guess history and scores after each polling cycle completes.
- **SC-004**: A correct guess results in a 100-point score increase visible to the guesser within the next polling cycle.
- **SC-005**: An empty or whitespace-only guess is rejected with a clear in-page notification to the guesser without any server state change.
- **SC-006**: A guess that matches the secret word ignoring case and whitespace is accepted as correct.

## Clarifications

### Session 2026-05-20

- Q: Should guess history show submitter names? → A: All guesses (correct and incorrect) show the guesser's name
- Q: How should correct guesses be reflected in UI, and should the correct guesser's input change? → A: Correct guesses are highlighted in the guess history for all players; the correct guesser's input is disabled

## Assumptions

- Drawing is implemented as freehand line drawing on a single-color canvas. No shape tools, color picker, or variable stroke width in this scope.
- Canvas state is represented as a serializable data structure that can be transferred via API polling responses.
- The round duration and termination are handled by a separate mechanism (e.g., round timer, manual drawer end). This spec covers what happens within an active round, not when a round ends.
- Only guessers can submit guesses; the drawer role is prevented from seeing or using the guess input.
- A guesser who has already guessed correctly has their guess input disabled for the remainder of the round.
- No deduplication of incorrect guesses; the same guess can be submitted multiple times by the same guesser.
- Drawing and guess data for a round is stored in memory and lost when the room is destroyed.
- Players have a reasonably modern browser with canvas API support.
