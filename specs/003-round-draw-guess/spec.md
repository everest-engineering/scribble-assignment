# Feature Specification: Active Round Drawing, Guessing, and Scoring

**Feature Branch**: `003-round-draw-guess`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Creates and Clears the Drawing (Priority: P1)

During an active round, the designated drawer can sketch on a canvas and clear it to start over while seeing their marks immediately.

**Why this priority**: Without drawable canvas behavior, guessers have nothing to interpret; the drawer must trust what they see while drawing.

**Independent Test**: In a two-player round, the drawer draws strokes and clears the canvas; the drawer’s screen always reflects the current canvas state after each action.

**Acceptance Scenarios**:

1. **Given** an active round where the participant is the drawer, **When** they draw on the canvas, **Then** those strokes are visible on their screen.
2. **Given** the drawer has marks on the canvas, **When** they clear the canvas, **Then** their screen shows an empty canvas.
3. **Given** an active round where the participant is a guesser, **When** they attempt to draw or clear, **Then** they cannot modify the canvas (read-only or disabled controls).

---

### User Story 2 - Guessers Submit Valid Guesses (Priority: P1)

Guessers type answers compared to the secret word; invalid submissions are rejected; valid submissions are recorded and checked for correctness.

**Why this priority**: Guessing is the core interaction that drives scoring and shared history.

**Independent Test**: A guesser submits trimmed, case-variant, empty, and correct/incorrect guesses; only valid non-empty guesses are accepted and scored appropriately.

**Acceptance Scenarios**:

1. **Given** a guesser enters a guess with leading or trailing spaces, **When** they submit, **Then** the guess is evaluated using the trimmed text.
2. **Given** a guesser submits an empty or whitespace-only guess, **When** they submit, **Then** the guess is rejected with a clear message and is not added to history.
3. **Given** the secret word is `Rocket`, **When** a guesser submits `rocket` or `ROCKET`, **Then** the guess is treated as correct.
4. **Given** the secret word is `Rocket`, **When** a guesser submits a non-matching word, **Then** the guess is recorded as incorrect.
5. **Given** a participant is the drawer, **When** they attempt to submit a guess, **Then** guessing is not available to them for that round.

---

### User Story 3 - Everyone Stays in Sync (Priority: P1)

All participants see the same evolving drawing and the same ordered guess history without manually refreshing, while scores reflect guess outcomes.

**Why this priority**: Multiplayer fairness requires a shared view of play state and points.

**Independent Test**: With drawer and guesser in separate sessions, drawing updates and new guesses appear on both sides within the polling interval; scores update after correct guesses.

**Acceptance Scenarios**:

1. **Given** the drawer adds or clears strokes, **When** guessers wait without manual refresh, **Then** their view of the canvas updates to match within approximately 2 seconds.
2. **Given** a guesser submits a valid guess, **When** other participants wait without manual refresh, **Then** the new guess appears in the shared guess history for all within approximately 2 seconds.
3. **Given** a round has just begun, **When** participants view scores, **Then** every player’s score is 0.
4. **Given** a guesser submits a correct guess, **When** scores are shown, **Then** that guesser’s score increases by exactly 100 points.
5. **Given** a guesser submits an incorrect guess, **When** scores are shown, **Then** that guesser’s score does not increase (adds 0).
6. **Given** multiple guesses in a round, **When** participants view guess history, **Then** entries appear in a consistent order visible to all (e.g., submission order with guesser identity and outcome).

---

### Edge Cases

- What happens when the drawer clears after guessers have been watching? All participants see the cleared canvas on the next sync.
- What happens when two guessers submit at nearly the same time? Both valid guesses appear in history in a consistent order for all viewers.
- What happens when the same guesser submits multiple incorrect guesses? Each valid guess is recorded; only correct submissions add 100 points.
- What happens when a guesser submits the correct word multiple times? Each correct submission adds 100 per product rules (no duplicate suppression unless added later).
- What happens under slow connectivity? Participants see loading or stale state indicators where appropriate; no silent loss of accepted guesses once the system acknowledges submission.
- What happens if a guesser refreshes mid-round? They rejoin with current canvas, history, and scores for that round without seeing the secret word.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an interactive drawing canvas for the drawer during an active round.
- **FR-002**: The system MUST display on the drawer’s screen all strokes they place and reflect canvas clear actions immediately for the drawer.
- **FR-003**: The system MUST prevent guessers from drawing or clearing the canvas during an active round.
- **FR-004**: The system MUST synchronize canvas state to all participants so guessers see the drawer’s current drawing within approximately 2 seconds without manual refresh.
- **FR-005**: The system MUST allow guessers to submit text guesses during an active round.
- **FR-006**: The system MUST trim leading and trailing whitespace from guesses before validation and comparison.
- **FR-007**: The system MUST reject empty or whitespace-only guesses with a clear message and MUST NOT add them to guess history.
- **FR-008**: The system MUST compare guesses to the secret word case-insensitively after trimming.
- **FR-009**: The system MUST prevent the drawer from submitting guesses for the round where they are drawing.
- **FR-010**: The system MUST initialize every participant’s score to 0 at the start of the round (or game, if scores are game-wide and this is the first round).
- **FR-011**: The system MUST add exactly 100 points to a guesser’s score for each correct guess and 0 points for each incorrect guess.
- **FR-012**: The system MUST maintain a guess history for the active round including enough information for all participants to see who guessed and whether each guess was correct or incorrect (without revealing the secret word to guessers prematurely).
- **FR-013**: The system MUST synchronize guess history to all participants within approximately 2 seconds of a new valid guess without requiring manual refresh.
- **FR-014**: The system MUST NOT expose the secret word to guessers through guess history or scoring displays during the active round.

### Key Entities

- **Canvas state**: The current drawing marks (or empty) associated with the active round, owned by the drawer’s actions and replicated to viewers.
- **Guess**: A submitted answer from a guesser, with trimmed text, submitter identity, timestamp or sequence, and correct/incorrect outcome.
- **Guess history**: The ordered collection of guesses for the current round, shared across participants.
- **Score**: A non-negative point total per participant; starts at 0 and increases only by 100 per correct guess in this feature’s rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-client tests, 100% of drawer stroke and clear actions appear on the drawer’s screen immediately.
- **SC-002**: In two-client tests, at least 95% of canvas updates reach guessers within 3 seconds under normal network conditions.
- **SC-003**: 100% of empty or whitespace-only guess submissions are rejected with an explicit message.
- **SC-004**: In test matrices covering case variants, 100% of guesses matching the secret word after trim are scored as correct; non-matches as incorrect.
- **SC-005**: 100% of correct guesses increase the guesser’s score by exactly 100; 100% of incorrect guesses change the score by 0.
- **SC-006**: At round start, 100% of participants show a score of 0.
- **SC-007**: In two-client tests, at least 95% of new valid guesses appear in all participants’ history within 3 seconds.

## Assumptions

- An active round with assigned drawer, guessers, and a hidden secret word is already established (prior features).
- Round end, revealing the word to everyone, and transition to a result screen are out of scope for this feature.
- Automatic sync uses periodic refresh about every 2 seconds, consistent with lobby behavior; manual refresh may exist but must not be required.
- Scores are cumulative for the current game session across rounds unless a later feature resets them on restart.
- Guess history during the round may show correctness (e.g., “correct”) without displaying the secret word itself to guessers.
- Only the drawer’s input changes the canvas; there is no eraser partial-stroke tool requirement beyond full clear unless specified later.
