# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing

### User Story 1 — Drawing on Canvas (Priority: P1)

The drawer can draw on a canvas and clear it. The drawing state is visible on the drawer's screen.

**Why this priority**: Drawing is the core interaction — without it, there's nothing to guess.

**Independent Test**: Start a game as the drawer, draw on the canvas, verify the canvas updates visually on the drawer's screen.

**Acceptance Scenarios**:

1. **Given** a player is the drawer in an active round, **When** they draw on the canvas, **Then** lines appear on their screen in real-time.
2. **Given** a player is the drawer, **When** they click "Clear Canvas", **Then** the canvas is wiped clean.
3. **Given** a player is a guesser, **When** the round is active, **Then** the drawing is visible on their screen (synced via polling).

---

### User Story 2 — Submitting Guesses (Priority: P1)

Guessers can submit guesses. Empty or whitespace-only guesses are rejected. Guesses are compared case-insensitively against the secret word.

**Why this priority**: Guessing is the other half of the core gameplay loop.

**Independent Test**: Start a game as a guesser, submit a guess, verify the guess appears in the guess history.

**Acceptance Scenarios**:

1. **Given** a player is a guesser, **When** they submit a non-empty guess, **Then** the guess is sent to the server and added to the round's guess history.
2. **Given** a guesser submits "PIZZA" when the secret word is "pizza", **Then** it's marked as correct and scores 100 points.
3. **Given** a guesser submits "burger" when the secret word is "pizza", **Then** it's marked as incorrect and scores 0 points.
4. **Given** any player submits an empty or whitespace-only guess, **Then** the guess is rejected with an error message.

---

### User Story 3 — Guess History Synced via Polling (Priority: P2)

The guess history is visible to all players and updates automatically via polling.

**Why this priority**: Players need to see what guesses have been made to avoid repeating them, but the game functions without live history.

**Independent Test**: Open two browser windows, submit a guess in one, verify it appears in the other's guess history within the polling cycle.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** any guesser submits a guess, **Then** all players see the updated guess history within one polling cycle (~2s).
2. **Given** a round is active, **When** a correct guess is made, **Then** all players see the correct guess marked as correct.

---

### User Story 4 — Score Tracking (Priority: P2)

Correct guesses award 100 points. The scoreboard reflects current scores.

**Why this priority**: Scoring is essential for competition but doesn't block the core draw/guess loop.

**Independent Test**: Guesser submits correct guess → their score becomes 100, visible to all via polling.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a guesser submits a correct guess, **Then** their score increases by 100.
2. **Given** a round is active, **When** a guesser submits an incorrect guess, **Then** their score stays the same.
3. **Given** a round is active, **When** a guesser submits a correct guess, **Then** the drawer's score does not change.

### Edge Cases

- What happens if the drawer submits a guess? (Drawer's guess submission should be disabled)
- What happens if a guesser submits multiple correct guesses? (Only the first correct guess should count; subsequent guesses for the same round add no points)
- What happens if the canvas data becomes very large? (Canvas stored as lightweight stroke data)
- What happens if no canvas data exists yet (drawer hasn't drawn)? (Canvas shows empty/blank state)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a canvas for the drawer to draw on with mouse/touch input.
- **FR-002**: System MUST provide a "Clear Canvas" button for the drawer.
- **FR-003**: System MUST store drawing data as an array of strokes (each stroke: array of points with x, y coordinates).
- **FR-004**: System MUST submit guesses via `POST /rooms/:code/guess` with `{ participantId, text }`.
- **FR-005**: Guesses MUST be trimmed of whitespace and compared case-insensitively against the secret word.
- **FR-006**: Empty or whitespace-only guesses MUST be rejected with an error message.
- **FR-007**: Each guess MUST be stored in the round's guess history with: participant ID, text, isCorrect, timestamp.
- **FR-008**: A correct guess MUST award 100 points to the guesser (only the first correct guess per round per player).
- **FR-009**: The round snapshot MUST include the guess history (all guesses) and drawing data (strokes).
- **FR-010**: The guess history and drawing MUST be visible to all players via polling `GET /rooms/:code`.

### Key Entities

- **Guess**: A guess submission within a round (participantId, text, isCorrect, timestamp).
- **Drawing**: An array of strokes representing the canvas state (stored on the round).

## Success Criteria

- **SC-001**: The drawer can draw on the canvas and see strokes appear immediately.
- **SC-002**: A guesser can submit a guess and see it appear in the history within ~2s.
- **SC-003**: Correct guesses are accurately identified and award 100 points.
- **SC-004**: Case-insensitive matching works (e.g., "PIZZA", "Pizza", "pizza" all match "pizza").
- **SC-005**: Empty/whitespace guesses are rejected.

## Assumptions

- Canvas uses HTML5 Canvas API with mouse events (touch support deferred).
- Drawing data is stored as lightweight stroke arrays, not images.
- The drawer sees drawing changes immediately (client-side rendering).
- Guessers see drawing changes via polling (may have ~2s delay).
- The drawer's guess form is hidden (they draw instead).
