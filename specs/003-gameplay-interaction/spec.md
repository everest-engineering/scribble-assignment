# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction
**Given** a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer can draw and clear the canvas (Priority: P1)

A drawer should be able to make drawing changes and immediately see the updated canvas state.

**Why this priority**: The drawer controls the current round's visual content, so canvas interaction must be reliable before guess collection begins.

**Independent Test**: Start a round as the drawer, draw or clear the canvas, and verify the drawer's own view reflects the change immediately.

**Acceptance Scenarios**:

1. **Given** a round is active and the current player is the drawer, **When** they draw on the canvas, **Then** the drawer sees the new strokes appear on their screen.
2. **Given** a round is active and the current player is the drawer, **When** they clear the canvas, **Then** the drawer sees the canvas reset to empty immediately.

---

### User Story 2 - Guess submission validates input and compares correctly (Priority: P1)

Guessers must be able to submit guesses that are normalized and validated before comparison.

**Why this priority**: Accurate guess handling is core to scoring and ensures players are not penalized for formatting differences.

**Independent Test**: Submit guesses with leading/trailing spaces, different casing, and empty input; validate accept/reject behavior and comparison against the round answer.

**Acceptance Scenarios**:

1. **Given** a guesser enters a guess with surrounding whitespace, **When** they submit, **Then** the guess is trimmed before comparison.
2. **Given** a guesser enters the correct word in a different letter case, **When** they submit, **Then** the guess is treated as correct.
3. **Given** a guesser submits an empty or whitespace-only guess, **When** they submit, **Then** the system rejects it with a validation message and does not record it.

---

### User Story 3 - Guess history and scores sync for all players (Priority: P2)

All players should see the current guess history and score updates as the round progresses.

**Why this priority**: Polling synchronization ensures players have a consistent view of round progress without real-time push protocols.

**Independent Test**: Submit guesses from one player, poll from another, and verify the guess history and score changes appear consistently.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** another player polls the round state, **Then** the submitted guess appears in the shared guess history.
2. **Given** a guess is correct, **When** the round state updates, **Then** the correct guesser’s score increases by 100 and other players see the updated score.
3. **Given** a guess is incorrect, **When** the round state updates, **Then** the scorer remains unchanged and the incorrect guess is still visible in the shared history.

---

### Edge Cases

- What happens if two guessers submit the same correct answer at nearly the same time? The first correct submit should earn the score and subsequent identical guesses should follow the same scoring rules without breaking sync.
- What happens if the drawer clears the canvas while guesses are still pending? The drawer should see the cleared canvas immediately and guess history should continue to update independently.
- What happens if a guess arrives while the round is no longer active? The guess should be rejected and the player should receive a message that the round is over.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show drawing and canvas-clear actions immediately on the drawer’s screen during an active round.
- **FR-002**: The system MUST trim leading and trailing whitespace from every guess before validation or comparison.
- **FR-003**: The system MUST reject empty or whitespace-only guesses and return a visible validation message.
- **FR-004**: The system MUST compare submitted guesses to the target word in a case-insensitive manner.
- **FR-005**: The system MUST persist submitted guesses in a shared guess history that can be retrieved by all players.
- **FR-006**: The system MUST refresh round state and guess history via polling so all players see the same history and scores.
- **FR-007**: The system MUST award 100 points for a correct guess and 0 points for an incorrect guess.
- **FR-008**: The system MUST initialize all player scores to 0 at the start of the round.
- **FR-009**: The system MUST continue round play even after the drawer clears the canvas, without losing guess history.
- **FR-010**: The system MUST reject guesses submitted after the round has ended.

### Key Entities *(include if feature involves data)*

- **Round**: Active game session state containing drawer identity, target word, canvas state, guess history, and scores.
- **Drawer**: The player who creates and clears the drawing during the current round.
- **Guesser**: A player who submits guesses against the current target word.
- **Guess**: A normalized text submission with metadata for player, timestamp, correctness, and score impact.
- **Scoreboard**: The current score values for each player, starting at 0 and updated when correct guesses occur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer sees canvas drawing and clear actions immediately in the active round view.
- **SC-002**: Empty or whitespace-only guesses are rejected and do not appear in guess history.
- **SC-003**: Correct guesses match the target word regardless of capitalization.
- **SC-004**: Guess history refreshes for all players via polling within approximately 2 seconds.
- **SC-005**: Correct guesses increase the guesser’s score by 100; incorrect guesses do not change score.
- **SC-006**: All player scores are 0 at round start.
- **SC-007**: Players cannot submit guesses after the round is no longer active.

## Assumptions

- The active round state already exists and is represented by a drawer, target word, and player list.
- Polling is the only synchronization mechanism; no real-time push or WebSockets are used.
- Drawings are visible locally to the drawer and may be represented as canvas state data in the round model.
- The system only needs to validate guesses once per submission; duplicate guess suppression is not required in this feature.
- Score updates are additive per correct guess and do not require negative penalties for incorrect guesses.
