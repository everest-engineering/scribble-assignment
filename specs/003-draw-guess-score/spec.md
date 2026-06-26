# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-draw-guess-score`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Gameplay Interaction — Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Canvas Drawing (Priority: P1)

The drawer uses basic drawing tools (pen, color, clear) to illustrate the secret word. The drawing is rendered on all players' screens. This is the core interaction of the game — without drawing, guessers cannot participate.

**Why this priority**: Drawing is the primary mechanic. No game can proceed without it.

**Independent Test**: Start a game, confirm the drawer can draw strokes on the canvas, change color, and clear the canvas. In a second tab as a guesser, confirm the drawing appears within one polling cycle (2 seconds).

**Acceptance Scenarios**:

1. **Given** a round is active with a drawer and guessers, **When** the drawer draws a stroke on the canvas, **Then** the stroke appears on the drawer's screen immediately and on guessers' screens within one polling cycle.
2. **Given** the drawer is actively drawing a stroke (pen held down), **When** a polling cycle updates committed strokes, **Then** the in-progress stroke remains visible without interruption or flicker.
3. **Given** the drawer has drawn on the canvas, **When** they click "Clear Canvas", **Then** all strokes are removed from all players' screens.

---

### User Story 2 — Guess Submission (Priority: P2)

Guessers can submit guesses through an input field. Guesses are trimmed, compared case-insensitively against the secret word, and empty/whitespace-only guesses are rejected. Correct and incorrect feedback is returned to the guesser.

**Why this priority**: Guessing is the mechanism for guessers to participate and advance the game.

**Independent Test**: Start a game with 2+ players. As a guesser, submit a correct guess and verify "Correct!" feedback. Submit an incorrect guess and verify "Wrong" feedback. Submit an empty/whitespace guess and verify it is rejected with an error message.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess that matches the secret word (case-insensitive, trimmed), **When** the guess is processed, **Then** the guesser receives "Correct!" feedback and 100 points are awarded.
2. **Given** a guesser submits a guess that does not match the secret word, **When** the guess is processed, **Then** the guesser receives "Wrong" feedback and 0 points are added.
3. **Given** a guesser submits an empty or whitespace-only guess, **When** the guess is validated, **Then** it is rejected with an appropriate error message.
4. **Given** a guesser submits a guess with surrounding whitespace, **When** the guess is validated, **Then** the whitespace is trimmed before comparison.

---

### User Story 3 — Score & History Sync (Priority: P3)

All players see the guess history (who guessed what, whether correct, and running scores) via polling. The round ends when the secret word is correctly guessed. The drawer is prevented from guessing.

**Why this priority**: Score visibility and round-end logic complete the gameplay loop.

**Independent Test**: Start a game with 2+ players. Have a guesser submit both correct and incorrect guesses. Verify the drawer's screen shows the guess history. Verify scores update correctly (correct = 100, incorrect = 0). Verify the drawer's guess input is disabled or hidden.

**Acceptance Scenarios**:

1. **Given** a guesser submits a correct guess, **When** the guess history is polled, **Then** the guess entry shows the guesser's name, the guess text, "correct" status, and the updated score.
2. **Given** a guesser submits an incorrect guess, **When** the guess history is polled, **Then** the guess entry shows the guesser's name, the guess text, "incorrect" status, and the score unchanged.
3. **Given** any player polls the room state, **When** the room is in "playing" status, **Then** they receive the guess history and current scores for all participants.
4. **Given** the drawer attempts to submit a guess, **When** the request is validated, **Then** it is rejected (drawers know the secret word and cannot guess).

---

### Edge Cases

- What happens if a guesser submits the same guess multiple times? — Each submission is processed independently. The guess history records each attempt.
- What happens if a guesser enters the secret word with different casing? — The case-insensitive comparison correctly identifies it as a match.
- What happens if the drawer clears the canvas while guessers are viewing it? — The cleared state is synced via polling; guessers see the blank canvas.
- What happens if all guessers disconnect mid-round? — The round remains active. The drawer can continue drawing. When guessers reconnect (via page refresh), they see the current drawing and guess history.
- What happens if a correct guess is submitted by a second guesser after the first already guessed correctly? — The first correct guess ends the round. Subsequent guesses are rejected with "Round already ended".
- What happens if the backend is restarted mid-round? — Drawing data and guess history are lost (in-memory storage). Reconnecting players see a fresh lobby/room state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-021**: System MUST provide a drawing canvas for the drawer with at minimum: pen tool, color selection, and clear canvas functionality.
- **FR-021a**: System MUST render the in-progress stroke (while pen is held down) in redraw cycles triggered by polling updates, preventing visual disappearance of the current stroke.
- **FR-022**: System MUST persist drawing strokes server-side and make them available via polling so all players see the current drawing state.
- **FR-023**: System MUST provide a guess input field for non-drawer participants.
- **FR-024**: System MUST trim whitespace from guesses before processing.
- **FR-025**: System MUST compare guesses against the secret word case-insensitively.
- **FR-026**: System MUST reject empty or whitespace-only guesses with an error message.
- **FR-027**: System MUST award 100 points to a guesser whose guess correctly matches the secret word.
- **FR-028**: System MUST award 0 points for incorrect guesses (no penalty).
- **FR-029**: System MUST maintain a guess history that includes: guesser name, guess text, correct/incorrect status, and timestamp.
- **FR-030**: System MUST sync the guess history to all participants via polling.
- **FR-031**: System MUST end the current round when a correct guess is submitted; subsequent guesses are rejected.
- **FR-032**: System MUST reject guess submissions from the drawer participant.
- **FR-033**: System MUST sync participant scores via polling so all players see current scores.

### Key Entities *(include if feature involves data)*

- **Drawing Stroke**: A continuous line drawn without lifting the pen. Has an array of coordinate points (x, y), color, and line width. Strokes are ordered by creation time.
- **Guess Entry**: A submission by a guesser. Contains guesser ID, guesser name, guess text, correct/incorrect status, timestamp, and score after the guess.
- **Score**: A numeric value associated with each participant. Starts at 0 for each round. 100 points awarded per correct guess.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-011**: The drawer can draw a visible stroke on the canvas immediately after performing the draw action, and the stroke remains visible without interruption while the pen is held down.
- **SC-012**: Guessers see drawing updates within 2 seconds of the drawer drawing (via polling cycle).
- **SC-013**: Guessers receive guess validation feedback (correct/incorrect/rejected) within 2 seconds of submitting.
- **SC-014**: The guess history and all player scores are consistent across all participants within one polling cycle.
- **SC-015**: The round ends immediately when the first correct guess is processed; no further guesses are accepted.

## Assumptions

- Drawing data is sent from the client to the server and stored for retrieval by all participants. Each stroke records the drawing position, color, and width.
- The canvas surface remains a fixed size. Canvas dimensions and scaling are implementation details.
- Polling interval for drawing and guess history sync is consistent with the existing lobby polling interval (~2 seconds).
- The drawer's drawing tools are basic (pen, color, clear). Advanced tools (shapes, undo, line thickness) are out of scope for this scenario.
- Turn-based play: the round ends when the secret word is correctly guessed. There are no timers.
- Guess history is ordered by submission time (oldest first).
- Scores are per-participant and persist across rounds within the same game session.
