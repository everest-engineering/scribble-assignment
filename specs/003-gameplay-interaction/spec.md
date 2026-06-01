# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Scenario 3 from README — Gameplay Interaction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw and Clear the Active Canvas (Priority: P1)

The drawer must be able to draw on an active canvas and clear it when they need to restart a visual idea. The interface should keep the drawer focused on the current round and the current drawing state.

**Why this priority**: Without an interactive canvas, the drawer cannot convey the secret word and the round cannot proceed.

**Independent Test**: A drawer uses the canvas controls to draw then clear the canvas. The canvas returns to a blank state and the drawer can continue drawing in the same round.

**Acceptance Scenarios**:

1. **Given** the round is active and the current player is the drawer, **When** they draw on the canvas, **Then** the canvas visually updates with the new strokes.
2. **Given** the drawer has drawn on the canvas, **When** they press clear, **Then** the canvas resets to blank for the current round.
3. **Given** the drawer clears the canvas, **When** they continue drawing, **Then** new strokes appear normally and the previous strokes remain cleared.

---

### User Story 2 - Submit Validated Guesses (Priority: P1)

Guessers must submit guesses that are trimmed, non-empty, and evaluated consistently. Correct guesses should score 100 points; incorrect guesses should score 0.

**Why this priority**: Guess validation and deterministic scoring prevent guesser confusion and make gameplay outcomes reliable.

**Independent Test**: A guesser submits an empty guess and receives a validation message. Then they submit a valid guess and see the score outcome clearly reflected.

**Acceptance Scenarios**:

1. **Given** a guesser enters a guess with only spaces, **When** they submit, **Then** the guess is rejected with a message that non-empty text is required.
2. **Given** a guesser enters a guess with extra whitespace and mixed case, **When** they submit, **Then** the guess is trimmed and evaluated case-insensitively.
3. **Given** a guess matches the secret word exactly after trimming and normalizing case, **When** it is submitted, **Then** the guess is scored as correct with 100 points.
4. **Given** a guess does not match the secret word, **When** it is submitted, **Then** it is scored as incorrect with 0 points.

---

### User Story 3 - Sync Guess History via Polling (Priority: P2)

All players must see the evolving guess history within the active round, with updates arriving through the existing polling mechanism.

**Why this priority**: Guess history is the shared proof of game progress and ensures all players stay synchronized.

**Independent Test**: A second browser window sees a newly submitted guess appear in the guess history within one polling refresh cycle.

**Acceptance Scenarios**:

1. **Given** a player submits a guess, **When** the next polling update runs, **Then** every active player sees that guess in the round history.
2. **Given** the drawer submits a guess as part of their own attempt or the guess is a spectator input, **When** the history updates, **Then** the round history reflects the guess and whether it was correct.
3. **Given** the room has multiple players, **When** any player views the active round, **Then** they see the same recently submitted guesses within the polling window.

---

### Edge Cases

- A guess containing only whitespace is rejected before it is added to the history.
- A guess with leading or trailing spaces is normalized before comparison and scoring.
- A guess submitted by the drawer is treated like any other guess for validation and scoring.
- A clear action resets only the current round's visible canvas, not the current secret word or guess history.
- If the polling update is delayed, the next available update must still surface the latest guess history without losing any recent submissions.
- A correct guess scores 100 points and should not be treated as partially correct or scored differently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the assigned drawer to draw on an active round canvas.
- **FR-002**: The system MUST allow the assigned drawer to clear the canvas during an active round.
- **FR-003**: The system MUST trim leading and trailing whitespace from submitted guesses before validation.
- **FR-004**: The system MUST reject guesses that are empty after trimming with a clear validation message.
- **FR-005**: The system MUST compare submitted guesses to the secret word case-insensitively.
- **FR-006**: The system MUST score a correct guess as 100 points and an incorrect guess as 0 points.
- **FR-007**: The system MUST synchronize guess history to all active players via polling while the round is active.
- **FR-008**: The system MUST preserve the current secret word and round score state after canvas clears and guess submissions.
- **FR-009**: The system MUST display the updated guess history in all active round views within one polling cycle.
- **FR-010**: The system MUST show the current canvas state to the drawer while the round is active.

### Key Entities

- **Round**: The active gameplay session where one drawer draws, guessers submit guesses, and round state is tracked.
- **Drawer**: The player who can interact with the active canvas and sees the current drawing state.
- **Guess**: A player-submitted text entry that is normalized, validated, evaluated against the secret word, and recorded in round history.
- **Score**: The numeric tally of points earned during the round; correct guesses add 100, incorrect guesses add 0.
- **Guess History**: The ordered list of guesses submitted during the active round, including validation and correctness outcomes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of guesses containing only whitespace are rejected with a clear validation message.
- **SC-002**: 100% of valid guesses are compared to the secret word after trimming and case normalization.
- **SC-003**: 100% of correct guess submissions award exactly 100 points, and 100% of incorrect submissions award exactly 0 points.
- **SC-004**: 100% of active players see new guesses appear in the shared round history within one polling refresh cycle.
- **SC-005**: 100% of active drawers can clear the canvas and continue drawing in the same round without losing round state.
- **SC-006**: At least 90% of manual validation checks confirm guess history sync and scoring accuracy in under 2 minutes.

## Assumptions

- Scenario 2’s game-start state, drawer assignment, and secret word visibility already exist when Scenario 3 begins.
- Scores are initialized to 0 at the start of the active round and only change when guesses are evaluated.
- The polling interval is the same shared mechanism used by the lobby and game screen, and it is sufficient to keep guess history in sync.
- Canvas updates are only required while a round is active; round restart or next-round behavior is out of scope.
- The drawer is the only player who can modify the drawing canvas; guessers can submit guesses but cannot clear or draw.
