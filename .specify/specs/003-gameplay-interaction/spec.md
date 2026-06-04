# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Gameplay Interaction Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Visual Expression (Priority: P1)

The drawer interacts with the shared canvas to visually express the secret word.

**Why this priority**: Core mechanism for communicating clues during a round.

**Independent Test**: Can be tested by initiating an active round and verifying that drawing actions are rendered on the drawer's canvas.

**Acceptance Scenarios**:

1. **Given** an active round, **When** the drawer performs drawing actions, **Then** the drawing is rendered on the canvas.
2. **Given** an active round, **When** the drawer clears the canvas, **Then** the canvas is reset to blank.

---

### User Story 2 - Guesser Participation and Validation (Priority: P1)

Guessers submit text-based guesses to identify the secret word, which are validated by the system.

**Why this priority**: Essential gameplay mechanic for participants to engage and score points.

**Independent Test**: Can be tested by submitting valid, invalid, correct, and incorrect guesses and verifying score updates and history logging.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits a guess, **Then** the system normalizes the input, and rejects empty or whitespace-only submissions.
2. **Given** an active round, **When** a guesser submits a guess matching the secret word, **Then** the system logs the guess and awards 100 points.
3. **Given** an active round, **When** a guesser submits a guess not matching the secret word, **Then** the system logs the guess and awards 0 points.

---

### User Story 3 - Role-Based Canvas and UI Interaction (Priority: P1)

The UI adapts based on the player's role (drawer vs. guesser).

**Why this priority**: Ensures correct game mechanics and prevents unauthorized interaction.

**Independent Test**: Can be tested by verifying canvas is view-only for guessers, and drawer name, secret word, or guess forms are correctly displayed based on role.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a non-drawer views the canvas, **Then** it is view-only.
2. **Given** an active round, **When** any player views the canvas heading, **Then** the current drawer's name is displayed beside 'Canvas' (e.g., 'Canvas - Player 1 is drawing').
3. **Given** an active round, **When** the drawer views the UI, **Then** the 'Your Guess' section is replaced by the 'Secret Word' section.
4. **Given** an active round, **When** the round ends, **Then** the Guess form is disabled.

---

### User Story 4 - Scoreboard and Activity Synchronization (Priority: P2)

Scoreboard and guess history are initialized and synchronized for all players.

**Why this priority**: Provides clear game progress and status for all participants.

**Independent Test**: Can be tested by verifying scoreboard initialization (0 points) and updates (polling), and ensuring guess history is displayed in Activity section.

**Acceptance Scenarios**:

1. **Given** a game start, **When** the round begins, **Then** the scoreboard is initialized with 0 points for all players.
2. **Given** an active round, **When** a player scores, **Then** the scoreboard updates via polling.
3. **Given** an active round, **When** a guess is submitted, **Then** it appears in the Activity section.

### Edge Cases

- What happens when a guess is submitted after a round is complete?
- How does the system handle rapid, near-simultaneous guess submissions from multiple players?
- What happens if the canvas clearing action is triggered concurrently with a drawing action?

## Clarifications

### Session 2026-06-03
- Q: Are recovery requirements defined for round state upon potential client-server synchronization failures? → A: Out of scope. Will handle failures specifically in a future spec.
- Q: Are edge cases like concurrent guess submissions addressed? → A: Out of scope.
- Q: Does the spec define behavior for canvas clearing during concurrent drawing? → A: Latest wins.
- Q: Are accessibility requirements (a11y) specified for the drawing interface? → A: Out of scope.
- Q: Are performance requirements defined under high-polling frequency? → A: Out of scope.

## Out of Scope
- Recovery requirements for synchronization failures.
- Concurrency handling for guess submissions.
- Accessibility (a11y) requirements.
- Performance tuning for high-polling frequency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render drawing actions performed by the drawer on the canvas.
- **FR-002**: System MUST support clearing the canvas by the drawer. In case of concurrent canvas actions, 'Latest wins' strategy applies.
- **FR-003**: System MUST trim whitespace from all submitted guesses.
- **FR-004**: System MUST reject empty or whitespace-only guesses.
- **FR-005**: System MUST compare submitted guesses against the secret word using case-insensitive matching.
- **FR-006**: System MUST award 100 points for a correct guess.
- **FR-007**: System MUST award 0 points for an incorrect guess.
- **FR-008**: System MUST synchronize the updated guess history and scoreboard to all active players.
- **FR-009**: System MUST restrict canvas interaction to the designated drawer (view-only for others).
- **FR-010**: System MUST display the current drawer's name beside the 'Canvas' heading in the format 'Canvas - [Player Name] is drawing'.
- **FR-011**: System MUST initialize the scoreboard with 0 points for all players when the game starts.
- **FR-012**: System MUST hide the 'Your Guess' form from the drawer and show the 'Secret Word' in its place.
- **FR-013**: System MUST display guess history in the 'Activity' section.
- **FR-014**: System MUST disable the Guess form once the game round is complete.

### Key Entities

- **Round**: Represents the active session context, including secret word and canvas state.
- **Guess**: Contains submitted text, player identification, and evaluation status (correct/incorrect).
- **Scoreboard**: Tracks accumulated points per player for the active round.
- **Canvas**: Maintains the visual drawing state shared during the round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawing actions are consistently rendered on the canvas for the drawer.
- **SC-002**: 100% of empty or whitespace-only guesses are rejected upon submission.
- **SC-003**: 100% of correct guesses (case-insensitive) are scored as 100 points.
- **SC-004**: Guess history and scoreboard updates are synchronized across all clients within 2 seconds of the submission event.
- **SC-005**: Drawer name is correctly displayed beside the 'Canvas' heading as 'Canvas - [Player Name] is drawing'.
- **SC-006**: Guess form is disabled immediately upon round completion.

## Assumptions

- Player scores are initialized to 0 at the start of each round.
- The secret word for the round is predefined before gameplay interaction.
- Existing communication infrastructure supports the required state synchronization.
