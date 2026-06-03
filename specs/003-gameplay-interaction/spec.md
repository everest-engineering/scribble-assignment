# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Gameplay Interaction — canvas drawing, canvas clearing, real-time drawing visibility for guessers, guess submission with deterministic scoring, guess history synced via polling."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Interacts with Canvas (Priority: P1)

The drawer can draw on the canvas with a pointing device and clear the entire canvas at any time during their turn. Their drawing is the core input of the game round.

**Why this priority**: The drawing canvas is the central mechanic of the game. Without it, no round can proceed.

**Independent Test**: A designated drawer can open the game screen, draw strokes on the canvas, and press a clear button to wipe the canvas. Deliverable value: a functional drawing surface that can be reset.

**Acceptance Scenarios**:

1. **Given** a round is active and the current player is the drawer, **When** the drawer moves their pointer across the canvas, **Then** a continuous stroke is drawn in real time on the drawer's screen.
2. **Given** the drawer has drawn at least one stroke, **When** the drawer clicks/taps the "Clear" button, **Then** the entire canvas is wiped and a blank canvas is shown.
3. **Given** the current player is NOT the drawer, **When** they view the canvas, **Then** the clear button is not accessible to them.

---

### User Story 2 - Guesser Views Live Drawing (Priority: P2)

Guessers can see the drawer's evolving drawing on their own screens, updated via polling, so they can form and submit guesses based on what is being drawn.

**Why this priority**: Without visibility into the drawing, guessers cannot participate meaningfully. This is the core feedback loop of the game.

**Independent Test**: A non-drawer player joins an active round and can see strokes appearing on their canvas view as the drawer draws, with updates appearing within a few seconds.

**Acceptance Scenarios**:

1. **Given** a round is active and a guesser is viewing the canvas, **When** the drawer adds new strokes, **Then** those strokes appear on the guesser's canvas within the polling interval.
2. **Given** the drawer clears the canvas, **When** the next polling cycle completes, **Then** the guesser's canvas also clears.
3. **Given** a guesser joins mid-round, **When** the page loads, **Then** the current canvas state is shown immediately.

---

### User Story 3 - Guesser Submits a Guess (Priority: P2)

A guesser can type a word into a guess input field and submit it during an active round. The system validates and processes the guess against the secret word.

**Why this priority**: Guess submission is the primary interaction for non-drawer players and the mechanism by which points are earned.

**Independent Test**: A guesser can type a word, submit the form, and see the guess appear in the guess history with the correct outcome (correct/incorrect).

**Acceptance Scenarios**:

1. **Given** a round is active and the current player is a guesser, **When** the guesser submits a non-empty guess, **Then** the guess is trimmed of leading/trailing whitespace and recorded in the guess history.
2. **Given** a guesser submits a guess that matches the secret word (case-insensitively, after trimming), **Then** 100 points are added to that guesser's score.
3. **Given** a guesser submits a guess that does not match the secret word, **Then** 0 points are added and the incorrect guess is recorded in history.
4. **Given** a guesser submits an empty string or whitespace-only input, **Then** the system rejects the submission and no guess is recorded.
5. **Given** the current player is the drawer, **When** they view the guess input, **Then** the input field is not accessible to them.

---

### User Story 4 - Guess History Synced to All Players (Priority: P3)

All players in the room see an up-to-date guess history log showing who guessed what, refreshed via polling.

**Why this priority**: Shared visibility of guesses builds game tension and lets all players follow progress. It is supplementary to the core draw/guess loop.

**Independent Test**: Two guesser players in the same room submit guesses and within one polling cycle both players see each other's guesses in the history list.

**Acceptance Scenarios**:

1. **Given** any player is in an active round, **When** a new guess is submitted by any participant, **Then** the guess appears in the guess history for all players within the polling interval.
2. **Given** the guess history is displayed, **Then** each entry shows the guesser's name and their submitted guess text.
3. **Given** the round ends, **Then** the final guess history remains visible to all players.

---

### Edge Cases

- What happens when two guessers submit the correct word nearly simultaneously? Both guesses are recorded; each correct guesser individually receives 100 points.
- What happens if a player submits the same incorrect guess multiple times? Each submission is recorded as a separate entry; no deduplication.
- What happens if the polling request fails (network error)? The display retains the last known state; no error message interrupts gameplay.
- What happens when the round has not started yet and a player tries to submit a guess? The guess input is disabled until the round is active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display an interactive drawing canvas to the designated drawer during an active round.
- **FR-002**: The drawer MUST be able to draw freehand strokes on the canvas using a pointer device.
- **FR-003**: The drawer MUST be able to clear the entire canvas at any time during their turn via a dedicated control.
- **FR-004**: The canvas MUST be read-only (no drawing or clearing) for all non-drawer players.
- **FR-005**: Guessers MUST be able to see the drawer's current canvas state, with updates delivered via polling.
- **FR-006**: The system MUST provide a text input field for guessers to type and submit their guesses during an active round.
- **FR-007**: The system MUST trim whitespace from submitted guesses before processing.
- **FR-008**: The system MUST reject and discard empty or whitespace-only guess submissions without recording them.
- **FR-009**: The system MUST compare submitted guesses to the secret word in a case-insensitive manner.
- **FR-010**: The system MUST award 100 points to a guesser whose trimmed, case-insensitive guess matches the secret word exactly.
- **FR-011**: The system MUST award 0 points for an incorrect guess.
- **FR-012**: The system MUST maintain a guess history log for each round containing all valid (non-empty) guesses.
- **FR-013**: The guess history MUST be synced to all players in the room via polling.
- **FR-014**: Each entry in the guess history MUST include the guesser's display name and the submitted guess text.
- **FR-015**: The guess input field MUST be inaccessible to the drawer during their turn.
- **FR-016**: Scoring MUST be deterministic: identical inputs always produce identical point outcomes.

### Key Entities

- **Round**: An active game period with one designated drawer, a secret word, and a set of participating guessers. Tracks active status.
- **Guess**: A single submission by a guesser. Contains: guesser identity, submitted text (post-trim), timestamp, and outcome (correct/incorrect).
- **Score**: A running total of points per player within a round. Starts at 0; incremented by correct guesses.
- **Canvas State**: The current visual state of the drawing surface, shared from drawer to guessers via polling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guessers see new strokes appear on their canvas within 3 seconds of the drawer completing them.
- **SC-002**: 100% of correct guesses (matching secret word after trimming and case normalisation) result in exactly 100 points being awarded.
- **SC-003**: 100% of empty or whitespace-only submissions are rejected and produce no guess history entry.
- **SC-004**: All players in a room see the same guess history within one polling cycle of a new guess being submitted.
- **SC-005**: A player completing a full guess submission (type word → submit) can do so in under 10 seconds under normal conditions.
- **SC-006**: Scoring is deterministic: the same guess text against the same secret word always yields the same score outcome across all sessions.

## Assumptions

- A "round" with an assigned drawer and secret word already exists before this feature is exercised (set up by the Game Start & Drawer Flow feature).
- All players have already joined the room and their roles (drawer vs. guesser) are established before the round begins.
- The polling interval for canvas state and guess history is short enough (assumed ≤ 3 seconds) to provide a real-time-like experience, but the exact interval is an implementation detail.
- Only one player per room is the drawer at any given time; all others are guessers.
- Scores are scoped to a single round; cross-round aggregation is out of scope for this feature.
- The secret word is a single word (no multi-word phrases requiring special matching logic).
- Players cannot submit guesses after the round ends; the input is disabled at round conclusion.
- Mobile/touch drawing support is in scope (pointer events cover both mouse and touch).
