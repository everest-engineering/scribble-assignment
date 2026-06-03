# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Draws on Canvas (Priority: P1)

The assigned drawer can draw on the shared canvas. Their strokes are visible on their own screen. The drawer can also clear the canvas to start over. Drawing actions are persisted to the backend and become visible to guessers through polling.

**Why this priority**: Without drawing capability, the game has no visual content to guess. This is the core mechanic of the drawer's role.

**Independent Test**: Can be fully tested by opening the game as the drawer, making strokes on the canvas, and verifying they appear and persist.

**Acceptance Scenarios**:

1. **Given** a round is active and the player is the drawer, **When** they draw strokes on the canvas, **Then** the strokes are immediately visible on their own screen.
2. **Given** a round is active and the player is the drawer, **When** they clear the canvas, **Then** the canvas is emptied and all previous strokes are removed.
3. **Given** the drawer has drawn on the canvas, **When** guessers poll for the room state, **Then** the drawing strokes are visible to guessers as well.

---

### User Story 2 — Guessers Submit Guesses (Priority: P1)

Guessers can submit text guesses for the secret word. Guesses are trimmed of leading/trailing whitespace and compared case-insensitively to the secret word. Empty or whitespace-only guesses are rejected with a validation message. The guess is recorded in a shared history visible to all players.

**Why this priority**: Without the ability to guess, guessers have no interaction in the game. This is the core mechanic for non-drawer players.

**Independent Test**: Can be fully tested by submitting various guesses (correct, incorrect, empty, whitespace-padded, mixed-case) and verifying acceptance, rejection, and scoring behavior.

**Acceptance Scenarios**:

1. **Given** a round is active and the player is a guesser, **When** they submit a correct guess (case-insensitive match to the secret word), **Then** their guess is recorded and their score increases by 100.
2. **Given** a round is active and the player is a guesser, **When** they submit an incorrect guess, **Then** their guess is recorded in the guess history and their score remains unchanged (0 added).
3. **Given** a round is active and the player is a guesser, **When** they submit an empty or whitespace-only guess, **Then** the guess is rejected and a validation message is shown.
4. **Given** a guesser submits a guess with leading/trailing whitespace (e.g., "  rocket  "), **When** the guess is processed, **Then** it is trimmed to "rocket" before comparison.
5. **Given** a guesser submits a mixed-case guess (e.g., "ROCKET" or "RocKeT"), **When** the guess is compared to the secret word "rocket", **Then** it matches case-insensitively.

---

### User Story 3 — Guess History Synced to All Players (Priority: P2)

All submitted guesses (correct and incorrect) are stored in a shared guess history that is synced to all players via HTTP polling. Players can see the list of previous guesses.

**Why this priority**: Completes the social feedback loop of the game but is secondary to the core draw-and-guess mechanics.

**Independent Test**: Can be fully tested by having multiple guessers submit guesses and verifying the history is visible to all players (drawer and guessers) within one polling cycle.

**Acceptance Scenarios**:

1. **Given** guessers have submitted guesses, **When** any player views the game page, **Then** they can see the list of all previous guesses.
2. **Given** a new guess is submitted, **When** other players poll for updates, **Then** the new guess appears in the shared history within approximately 2 seconds.

---

### User Story 4 — Score Tracking (Priority: P3)

All player scores start at 0 at the beginning of a round. Correct guesses award 100 points. Incorrect guesses award 0 points. Scores are visible to all players.

**Why this priority**: Provides the competitive element but is not required for the core drawing/guessing loop.

**Independent Test**: Can be fully tested by verifying all scores are 0 at round start, then confirming correct guesses increase to 100 and incorrect guesses remain at 0.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** the game state is displayed, **Then** all player scores are 0.
2. **Given** a guesser submits a correct guess, **When** the game state updates, **Then** that player's score is 100.
3. **Given** a guesser submits an incorrect guess, **When** the game state updates, **Then** that player's score remains unchanged.

---

### Edge Cases

- What happens when a guesser submits the same guess multiple times? Each guess is recorded separately in the history; only the first correct guess should award points.
- How does the system handle the drawer submitting a guess? The drawer should not be allowed to submit guesses (they already know the word).
- What happens when the canvas has many strokes and a guesser polls? The full drawing state (all strokes) is returned in the room snapshot.
- Can a guesser continue guessing after a correct answer? The round should end or mark the guesser as "done" after a correct guess to prevent repeated scoring.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store drawing strokes as a collection of stroke data (points, color, line width) associated with the active room.
- **FR-002**: System MUST allow the drawer to add strokes to the canvas.
- **FR-003**: System MUST allow the drawer to clear all strokes from the canvas.
- **FR-004**: System MUST make the drawer's strokes visible to all players via the room snapshot.
- **FR-005**: System MUST allow guessers to submit text guesses during an active round.
- **FR-006**: System MUST trim leading and trailing whitespace from guess submissions before processing.
- **FR-007**: System MUST compare guesses to the secret word case-insensitively.
- **FR-008**: System MUST reject empty or whitespace-only guesses and return a validation error.
- **FR-009**: System MUST record all valid guesses in a shared guess history accessible to all players.
- **FR-010**: System MUST award 100 points to a guesser who submits a correct guess.
- **FR-011**: System MUST award 0 points for incorrect guesses (score remains unchanged).
- **FR-012**: System MUST initialize all player scores to 0 when a round starts.
- **FR-013**: System MUST prevent the drawer from submitting guesses.
- **FR-014**: System MUST prevent a guesser from scoring more than once per round (only the first correct guess awards points).
- **FR-015**: System MUST sync drawing strokes and guess history to all players via HTTP polling.

### Key Entities

- **Stroke**: A single drawing action on the canvas. Contains a sequence of points (x, y coordinates), a color, and a line width.
- **Guess**: A guess submission by a guesser. Contains the player ID, the submitted text (trimmed), whether it was correct, and a timestamp.
- **Player Score**: A numeric score associated with a player in the current round. Starts at 0, increments by 100 on first correct guess.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw strokes and see them on their canvas in under 100ms.
- **SC-002**: Guessers can see the drawer's strokes within one polling cycle (~2 seconds) of the drawer drawing them.
- **SC-003**: 100% of empty or whitespace-only guesses are rejected with a visible error message.
- **SC-004**: Correct guesses are identified with 100% accuracy via case-insensitive comparison.
- **SC-005**: All players see new guesses in the shared history within one polling cycle (~2 seconds) of submission.
- **SC-006**: Scores are correctly initialized to 0 for all players at round start and updated accurately (100 for correct, 0 for incorrect).

## Assumptions

- The canvas uses a simple 2D coordinate system (no layers, transforms, or complex drawing tools).
- Strokes are drawn as freehand paths (no shapes, text, or fill tools).
- Guess submission rate is limited to prevent spam (reasonable default: 1 guess per second per player).
- The round does not automatically end when a guesser guesses correctly (round end is handled by a separate feature).
- A single color and line width are used for all strokes (no tool selection).
- Players access the game through a web browser with canvas support (HTML5 `<canvas>` or equivalent).
- HTTP polling interval is approximately 2 seconds (per project constraints).
- Only one round is active at a time (no round rotation or multiple rounds in scope).
