# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-09

**Status**: Draft

**Input**: README Scenario 3 — "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-09

- Q: How is the canvas drawing synced to guessers when there are no WebSockets? → A: The canvas is rendered on all clients. The drawer draws on an interactive HTML5 canvas. Drawing strokes are serialised as an array of stroke objects (e.g., `{ x, y, color, width }` or similar) and periodically saved via `POST /rooms/:code/canvas`. All clients fetch the current canvas state via the room snapshot poll. This keeps the drawing synced within the 2-second polling window.
- Q: What is the canvas data format? → A: An array of stroke path objects. Each stroke is an array of points. A point is `{ x: number, y: number }`. The canvas state is stored as `{ strokes: Stroke[][] }` on the backend. This avoids base64 image transfer and keeps the payload small.
- Q: When does a round end? → A: A round ends (transitions to `"result"`) when ALL guessers have submitted a correct guess. If there is only one guesser, the round ends immediately when they guess correctly. The drawer cannot end the round manually.
- Q: Is the drawing cleared when a new round starts? → A: Yes. On restart, the canvas state is reset to empty.
- Q: Where does guess history appear? → A: In the `ResultPanel` component, which shows a list of all guesses with correct/incorrect indicators. The `Scoreboard` component shows live scores for all participants.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Drawer draws on the canvas (Priority: P1)

The drawer needs to draw the secret word so guessers can see the drawing and make guesses.

**Why this priority**: Drawing is the core interaction of the game. Without it, guessers have nothing to work from.

**Independent Test**: The drawer sees an interactive canvas where they can draw with mouse/touch strokes. The canvas is read-only for guessers, but they see the drawing update within 2 seconds via polling.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is the drawer, **when** they draw on the canvas, **then** strokes appear immediately on their canvas and are synced to the backend via `POST /rooms/:code/canvas`.
2. **Given** a round is active and the viewer is a guesser, **when** they view the game screen, **then** they see a read-only canvas that displays the drawing from the backend, updated within 2 seconds via polling.
3. **Given** the drawer has drawn on the canvas, **when** they click the clear button, **then** all strokes are removed from their canvas and the backend canvas state is cleared.

---

### User Story 2 - Guesser submits a guess (Priority: P1)

Guessers need to submit their guesses for the secret word.

**Why this priority**: Guessing is the core interaction for non-drawer participants. Without it, the game has no win condition.

**Independent Test**: A guesser types a word, submits it, and sees their guess appear in the activity log with correct/incorrect feedback.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is a guesser, **when** they submit a non-empty guess via the guess form, **then** the backend records the guess, trims whitespace, compares case-insensitively against the secret word, and returns the result. The guess appears in the room snapshot's guesses array on the next poll.
2. **Given** a guesser submits an empty or whitespace-only guess, **when** they submit the form, **then** the frontend rejects it with "Guess cannot be empty" without making an API call.
3. **Given** a guesser submits a correct guess (case-insensitive match), **when** the backend processes it, **then** the guess is marked as correct, the guesser's score increases by 100, and the guesser may no longer submit guesses for this round.
4. **Given** a guesser submits an incorrect guess, **when** the backend processes it, **then** the guess is marked as incorrect, the guesser's score stays unchanged, and the guesser may continue submitting guesses.

---

### User Story 3 - All players see synced game state (Priority: P2)

All participants need to see live score updates, guess history, and the drawing so the game progresses together.

**Why this priority**: Without synced state, players cannot coordinate — the drawer doesn't know who guessed correctly and guessers don't see each other's progress.

**Independent Test**: After a guesser submits a guess, all participants see the guess in the activity log and the scoreboard updates within 2 seconds.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **when** all participants poll the room, **then** the guess appears in the `currentRound.guesses[]` array with its `text`, `isCorrect` flag, and `timestamp`.
2. **Given** a guesser scores points, **when** all participants poll the room, **then** the `currentRound.scores` map reflects the updated score.
3. **Given** the drawer draws on the canvas, **when** guessers poll the room, **then** the `canvasState` includes the latest strokes.

---

### Edge Cases

- The drawer submits a guess; the system MUST reject because drawers cannot guess their own word.
- A guesser submits the same incorrect word multiple times; each submission is recorded as a separate guess entry (no deduplication).
- A guesser submits a guess with leading/trailing whitespace; the backend MUST trim the guess before comparison. " PIZZA " → "pizza" after trim + lowercasing.
- A guesser submits a guess for a round they already guessed correctly; the system MUST reject with a message that they have already guessed correctly.
- The canvas is empty (no strokes drawn); guessers see a blank canvas.
- A participant who is not in the room tries to submit a guess or canvas update; the backend MUST reject.
- All guessers guess correctly — the round ends and status transitions to `"result"` automatically. The next poll returns `status: "result"`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-020**: System MUST provide an interactive HTML5 drawing canvas for the drawer. The drawer can draw free-form strokes with their mouse or touch input.
- **FR-021**: System MUST provide a "Clear Canvas" button visible only to the drawer that removes all strokes from both the local canvas and the backend canvas state.
- **FR-022**: System MUST provide a `POST /rooms/:code/canvas` endpoint that accepts a serialised array of strokes. Only the drawer may call this endpoint. The backend stores the latest canvas state on the room.
- **FR-023**: System MUST include the current `canvasState` (array of strokes) in the room snapshot returned by `GET /rooms/:code` so all participants receive the drawing via polling.
- **FR-024**: System MUST provide a `POST /rooms/:code/guess` endpoint that accepts a guess string. Only guessers who have not already guessed correctly may call this endpoint.
- **FR-025**: System MUST trim the guess string (remove leading/trailing whitespace) and reject empty guesses with HTTP 400 before comparing to the secret word.
- **FR-026**: System MUST compare the trimmed guess against the secret word case-insensitively (e.g., "PIZZA", "Pizza", "pizza" all match "pizza").
- **FR-027**: System MUST reject a drawer's guess submission with HTTP 403 and message "Drawers cannot guess".
- **FR-028**: System MUST reject a guess from a guesser who has already guessed correctly with HTTP 400 and message "You already guessed correctly".
- **FR-029**: System MUST record each guess in the `currentRound.guesses[]` array with the participant ID, trimmed text, correct/incorrect flag, and timestamp.
- **FR-030**: System MUST add 100 points to a guesser's score when they submit a correct guess. Incorrect guesses add 0 points.
- **FR-031**: System MUST transition the room to `"result"` status when all guessers have submitted a correct guess.
- **FR-032**: System MUST display the guess history in the `ResultPanel` component, showing each guess with participant name, text, and correct/incorrect indicator.
- **FR-033**: System MUST display live scores for all participants in the `Scoreboard` component, updated via polling.

### Key Entities

- **Stroke**: A single continuous line drawn on the canvas. Represented as an array of `Point` objects.
- **Point**: A 2D coordinate `{ x: number, y: number }` on the canvas.
- **Canvas State**: The complete set of strokes currently on the canvas. Represented as `strokes: Point[][]`.
- **Guess**: A submission from a guesser containing the guess text and the result (correct/incorrect).
- **Guess History**: The ordered list of all guesses made during the current round, visible to all participants.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-011**: The drawer can draw visible strokes on the canvas and clear them. Guessers see the same canvas state within 2 seconds.
- **SC-012**: A guesser can submit a guess and immediately see the result (correct/incorrect). All participants see the guess in the history within 2 seconds.
- **SC-013**: The scoreboard updates within 2 seconds of any score change.
- **SC-014**: The room transitions to `"result"` status automatically when all guessers have guessed correctly.
- **SC-015**: Empty guesses, drawer guesses, duplicate correct guessers, and non-participant requests are all rejected with appropriate error codes.

## Assumptions

- Canvas strokes are serialised as lightweight JSON point arrays — no base64 images. The canvas implementation uses the HTML5 Canvas API with mouse event handlers.
- The `Room` model is extended with a `canvasState` field of type `{ strokes: Point[][] }`.
- The `Round` model includes `guesses: Guess[]` and `scores: Record<string, number>`.
- The polling interval remains 2 seconds (same as the lobby). The `GamePage` already polls the room.
- The `GuessForm` component is updated to make real API calls instead of the current no-op.
- The `ResultPanel` and `Scoreboard` components receive room data via props or useRoomState and render actual data.
