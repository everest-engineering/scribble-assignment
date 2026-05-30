# Feature Specification: Gameplay Interaction

**Feature Branch**: `004-gameplay-interaction`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-05-30

- Q: Should there be a limit on how often a guesser can submit guesses? → A: No limits — guessers can submit as fast as they want.
- Q: What visual feedback does a guesser receive after submitting an incorrect guess? → A: The guess is added to the public history (marked as incorrect) with no additional indicator.
- Q: Should the guess history show which player made each guess? → A: Yes — the guesser's name is shown alongside each guess.
- Q: Should the system reject or accept duplicate guess text from the same guesser? → A: Accept duplicates — each submission is processed independently.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Drawing and Guessing Cycle (Priority: P1)

In an active round, the drawer uses the canvas to illustrate the secret word while guessers view the drawing and submit text guesses. The canvas updates in real-time for all players, and each submitted guess is processed to determine correctness.

**Why this priority**: This is the fundamental gameplay loop — without drawing and guessing working together, the game cannot function.

**Independent Test**: Can be fully tested by having a drawer draw on canvas and a guesser submit a guess, verifying the canvas displays correctly and the guess is received and evaluated.

**Acceptance Scenarios**:

1. **Given** a round is active with a designated drawer, **When** the drawer draws on the canvas, **Then** all players in the room see the updated drawing on their screens.
2. **Given** a round is active, **When** the drawer clears the canvas, **Then** all players see a blank canvas.
3. **Given** a round is active with a guesser viewing the canvas, **When** the guesser submits a text guess, **Then** the system receives the guess for processing.

---

### User Story 2 - Guess Processing and Scoring (Priority: P1)

When a guesser submits a guess, the system evaluates it against the secret word and updates the score accordingly. This drives the competitive aspect of the game.

**Why this priority**: Scoring feedback is essential for player engagement and determining round outcomes.

**Independent Test**: Can be fully tested by submitting various guesses (correct, incorrect, empty, case-varied) and verifying score changes and rejection behavior.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess that exactly matches the secret word (case-insensitive, after trimming whitespace), **Then** the guesser's score increases by 100 points.
2. **Given** a guesser submits a guess that does not match the secret word, **Then** the guesser's score remains unchanged.
3. **Given** a guesser submits an empty guess (whitespace only or blank), **Then** the guess is rejected and does not affect the score.
4. **Given** a guesser submits a guess with leading or trailing whitespace that matches the secret word after trimming, **Then** the guess is treated as correct and the score increases by 100 points.
5. **Given** a guesser submits the secret word in mixed case (e.g., "WoRd" vs "word"), **Then** the guess is treated as correct and the score increases by 100 points.
6. **Given** a guesser submits an incorrect guess, **Then** the guess appears in the public history marked as incorrect and the score remains unchanged.

---

### User Story 3 - Guess History Visibility (Priority: P2)

All players in the round can see the history of guesses submitted, enabling them to track progress and avoid redundant guesses.

**Why this priority**: Provides situational awareness for guessers and allows the drawer to see who is close to guessing correctly.

**Independent Test**: Can be fully tested by submitting multiple guesses and verifying all players (including late-joining observers or refreshed sessions) see the complete guess history.

**Acceptance Scenarios**:

1. **Given** multiple guesses have been submitted in a round, **When** any player polls for updates, **Then** they receive the full history of guesses in chronological order.
2. **Given** a guesser submits a new guess, **When** all players poll after the submission, **Then** the new guess appears in the history for all players.
3. **Given** a guesser submits a guess that is rejected (empty), **When** players poll for updates, **Then** the rejected guess does not appear in the guess history.

---

### Edge Cases

- **Drawer guessing**: The drawer should not be able to submit guesses (they already know the word). Submissions from the drawer are silently rejected.
- **Multiple correct guessers**: When multiple guessers independently guess correctly, each receives 100 points.
- **Duplicate prevention**: A guesser who has already guessed correctly in the round may still submit guesses, but subsequent guesses do not award additional points.
- **Canvas state race condition**: If a guesser submits a guess at the same time the drawer clears the canvas, both operations complete independently without blocking each other.
- **Duplicate text**: A guesser may submit the same guess text multiple times; each submission is processed independently and appears in the history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current canvas state (drawings and cleared state) to all players in the active round.
- **FR-002**: System MUST accept guess submissions from guessers (not the drawer) during an active round without restricting submission frequency.
- **FR-003**: System MUST trim leading and trailing whitespace from all submitted guess text before processing.
- **FR-004**: System MUST compare processed guesses against the secret word in a case-insensitive manner.
- **FR-005**: System MUST reject guess submissions that are empty after trimming (consist only of whitespace or are blank) without recording them in history or affecting scores.
- **FR-006**: System MUST add 100 points to a guesser's score when they submit a correct guess.
- **FR-007**: System MUST add 0 points to a guesser's score when they submit an incorrect guess.
- **FR-008**: System MUST maintain a guess history for the round that includes all processed (non-rejected) guesses, with each guess showing the guesser's name, the guess text, and whether it was correct or incorrect.
- **FR-009**: System MUST make the guess history available to all players in the round via polling.
- **FR-010**: Once a guesser has submitted a correct guess, subsequent submissions from that guesser in the same round do not award additional points.
- **FR-011**: System MUST reject guess submissions from the drawer.

### Key Entities *(include if feature involves data)*

- **Round**: Represents a single gameplay round with one drawer, multiple guessers, a secret word, and a canvas state. Contains the guess history and active scores.
- **Player**: A participant in a round, designated either as drawer or guesser. Has a score that accumulates across guesses.
- **Guess**: A text submission made by a guesser during a round. Contains the raw text, the trimmed/canonical text, the submitting player's name, a timestamp, and a correctness flag.
- **Canvas**: The drawing surface state created by the drawer. Its state is visible to all players and changes when the drawer draws or clears.
- **Score**: A numeric value associated with each player in a round, starting at 0 and incremented by 100 for each correct guess.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players see canvas drawing updates within 2 seconds of the drawer drawing or clearing.
- **SC-002**: Guess processing (comparison, scoring, history update) completes within 1 second of submission.
- **SC-003**: All players receive the updated guess history within 2 seconds of a new guess being submitted.
- **SC-004**: Correct guesses are detected with 100% accuracy regardless of letter casing or minor whitespace differences.
- **SC-005**: Empty and whitespace-only guesses are rejected 100% of the time without side effects.
- **SC-006**: A correct guess always results in exactly 100 points added to the guesser's score.

## Assumptions

- A correctly guessing guesser is prevented from receiving additional points from subsequent guesses in the same round (subsequent submissions are accepted but do not score).
- The drawer role does not change mid-round — one player remains drawer until the round ends.
- The secret word is determined before the round starts (handled by the round setup feature).
- Round lifecycle (start, end) is managed by a separate feature.
- Players have stable network connectivity during a round.
- The polling interval for guess history sync is defined at the implementation level (defaulting to 1-2 seconds).
