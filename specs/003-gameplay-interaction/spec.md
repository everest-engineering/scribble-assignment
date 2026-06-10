# Feature Specification: Gameplay Interaction - Drawing, Guessing & Scoring

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Gameplay Interaction — Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-11

- Q: How do guessers retrieve canvas state? → A: Canvas strokes are included in the existing game state polling response — server stores stroke actions; guessers receive and replay them on their local canvas.
- Q: When does the round end? → A: Round ends when all guessers have guessed correctly.
- Q: How does the server identify which player is making a request? → A: Players pass their room-assigned playerId as a query parameter on every API request.
- Q: Is there guess rate limiting? → A: No server-side limit; client-enforced UI cooldown (~500ms button disable after submit).
- Q: What happens to a guesser after they've already scored 100? → A: Server rejects further guess submissions from any participant who already scored 100 this round.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws and Clears Canvas (Priority: P1)

The drawer can draw on the canvas, see their drawing update in real time, and clear the canvas to start over. Clearing resets the drawing but does not affect the guess history or scores.

**Why this priority**: Drawing is the core action of the game — without canvas interaction, no gameplay is possible.

**Independent Test**: Can be fully tested by starting a game as the drawer, drawing on the canvas, verifying strokes appear, then clearing and confirming the canvas is blank.

**Acceptance Scenarios**:

1. **Given** a round is active with a drawer assigned, **When** the drawer draws on the canvas, **Then** the strokes appear on the drawer's screen in real time.
2. **Given** the drawer has drawn on the canvas, **When** the drawer clicks clear, **Then** the canvas is reset to blank.
3. **Given** the drawer has cleared the canvas, **When** they draw again, **Then** new strokes appear as expected.
4. **Given** the drawer clears the canvas, **When** a guesser polls for game state, **Then** the guess history and scores remain unchanged.

---

### User Story 2 - Guesser Submits a Guess (Priority: P1)

A guesser submits a text guess. The system trims whitespace, compares case-insensitively against the secret word, rejects empty/whitespace-only guesses, and returns the result.

**Why this priority**: Guessing is the core interaction for non-drawer players — without it, there is no game.

**Independent Test**: Can be fully tested by submitting various guess strings (correct, incorrect, empty, padded) from a guesser account and verifying the response.

**Acceptance Scenarios**:

1. **Given** a round is active with a secret word and a guesser, **When** the guesser submits an exact correct guess, **Then** the guess is accepted and scores 100 points.
2. **Given** a round is active with a secret word, **When** the guesser submits a correct guess with leading/trailing whitespace, **Then** the whitespace is trimmed and the guess scores 100 points.
3. **Given** a round is active with a secret word of "Apple", **When** the guesser submits "apple" (lowercase) or "APPLE" (uppercase), **Then** the guess scores 100 points.
4. **Given** a round is active, **When** the guesser submits an empty string or whitespace-only text, **Then** the system rejects the submission and returns an error message.
5. **Given** a round is active with a secret word, **When** the guesser submits an incorrect guess, **Then** the system accepts the guess, records it in history, and awards 0 points.

---

### User Story 3 - Scores Update on Correct Guess (Priority: P1)

When any guesser submits a correct guess, their score increases by 100 points. Incorrect guesses add 0 points. Scores are visible to all players via polling.

**Why this priority**: Scoring provides the game's progression feedback and competitive motivation.

**Independent Test**: Can be fully tested by starting a game with two guessers, one guessing correctly and one guessing incorrectly, then verifying their respective scores.

**Acceptance Scenarios**:

1. **Given** a guesser's score is 0, **When** they submit a correct guess, **Then** their score becomes 100.
2. **Given** a guesser's score is 100 after a correct guess, **When** no further correct guesses occur, **Then** their score stays at 100.
3. **Given** a guesser submits an incorrect guess, **When** their score is checked, **Then** it remains unchanged (0 added).
4. **Given** two guessers submit correct guesses, **When** both scores are checked, **Then** each has 100 points.

---

### User Story 4 - Guess History Syncs via Polling (Priority: P2)

All players (drawer and guessers) can see the full guess history — each entry shows who guessed and what they guessed — via periodic polling of the game state.

**Why this priority**: Guess history is essential for the drawer to see progress and for guessers to avoid repeated incorrect guesses.

**Independent Test**: Can be fully tested by submitting guesses from one player and having another player's poll response include those guesses.

**Acceptance Scenarios**:

1. **Given** a guesser has submitted a guess, **When** any player polls the game state, **Then** the response includes that guess in the guess history.
2. **Given** multiple guesses have been submitted, **When** a player polls the game state, **Then** the guess history contains all guesses in submission order.
3. **Given** no guesses have been submitted, **When** a player polls the game state, **Then** the guess history is empty.

---

### Edge Cases

- **Multiple correct guesses by the same player**: If a guesser who already scored 100 points submits another guess, the submission is rejected with an error message. A player can score at most once per round.
- **Drawer attempts to guess**: The drawer is not a guesser; guess submission endpoints reject requests from the drawer.
- **Canvas cleared during guess submission**: Clearing the canvas is independent of the guessing flow — ongoing guess submissions are unaffected.
- **Excessive polling on guess submission**: The guess submission response includes the updated score and guess result immediately; the history sync is a separate read operation. Clients implement a ~500ms button cooldown to prevent rapid submissions, but no server-side rate limiting is enforced.
- **Very long guess text**: Guesses longer than a reasonable maximum (e.g., 100 characters) may be rejected to prevent abuse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an endpoint (`POST /api/rooms/:id/canvas?playerId=<id>`) for the drawer to submit drawing actions (strokes and clear operations) to the current canvas. The drawer is identified by their `playerId` query parameter.
- **FR-002**: The canvas state MUST be reset when the drawer performs a clear operation.
- **FR-003**: The system MUST provide an endpoint for guessers to submit a text guess for the current round.
- **FR-004**: When a guess is submitted, the system MUST trim leading and trailing whitespace from the guess text.
- **FR-005**: If the trimmed guess text is empty or consists only of whitespace, the system MUST reject the submission with an error message.
- **FR-006**: The system MUST compare the trimmed guess text against the secret word using a case-insensitive comparison.
- **FR-007**: If the trimmed guess text matches the secret word (case-insensitively), the system MUST award 100 points to the guessing participant.
- **FR-008**: If the trimmed guess text does not match the secret word, the system MUST award 0 points to the guessing participant.
- **FR-009**: The system MUST record every submitted guess (including incorrect ones and excluding rejected empty ones) in a guess history for the round.
- **FR-010**: Each guess history entry MUST include the participant identifier, the guess text, and whether it was correct.
- **FR-011**: The guess history MUST be included in the game state response when any participant polls the game state.
- **FR-012**: If a guesser who has already been awarded 100 points submits another guess, the system MUST reject the submission with an error message. No additional guesses are accepted from a player who has already scored this round.
- **FR-013**: The guess submission endpoint MUST reject requests from the drawer (participant designated as the drawer in the current round).
- **FR-014**: The system MUST include each participant's current score in the game state response.
- **FR-015**: All scores MUST start at 0 when the round begins.
- **FR-016**: The system MUST include the current canvas state (serialized drawing actions) in the game state response when any participant polls `GET /api/rooms/:id?playerId=<id>`.
- **FR-017**: The round MUST continue until all non-drawer participants have submitted a correct guess. When the last remaining guesser submits a correct guess, the round ends.
- **FR-018**: Every participant MUST identify themselves on every API request by including their room-assigned `playerId` as a query parameter (e.g., `?playerId=abc123`). The server uses this to determine the requester's role (drawer vs guesser) and scoring eligibility.

### Key Entities *(include if feature involves data)*

- **Canvas State**: The current drawing state of the round — a sequence of drawing actions (strokes, clears). Resets on clear; persisted in memory for the duration of the round. Returned as part of the game state polling response so guessers can replay strokes on their local canvas.
- **Guess**: A submission from a guesser containing the text guess, the submitter's identifier, a timestamp, and a correctness flag. Recorded in the round's guess history.
- **Guess History**: An ordered list of all guesses submitted during the current round, available to all players via state polling.
- **Score**: A numeric value (non-negative integer) associated with each non-drawer participant, starting at 0, incremented by 100 on a correct guess.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the drawer draws a stroke, the stroke appears on their screen immediately without perceptible delay.
- **SC-002**: When a guesser submits a correct guess, their score updates to 100 and is reflected in the game state within the next polling cycle (~2s).
- **SC-003**: Empty or whitespace-only guesses are rejected with an error message visible to the user within 1 second of submission.
- **SC-004**: Case-insensitive matching is verified — "Apple", "apple", "APPLE", and "ApPlE" all match the secret word "Apple" and award 100 points.
- **SC-005**: The guess history returned to any player contains all guesses submitted so far (in order), within the next polling cycle (~2s) of submission.
- **SC-006**: A drawer attempting to submit a guess receives an error within 1 second.
- **SC-007**: A player who already scored 100 points does not accumulate additional points for repeated correct guesses.
- **SC-008**: All non-drawer participants have a score of 0 at the start of the round.

## Assumptions

- The canvas drawing is visible to all players (drawer and guessers) through a shared canvas state exposed via polling, consistent with standard drawing game behavior.
- The drawer draws on their own local canvas immediately (no server round-trip per stroke for rendering); strokes are sent to the server for persistence and distribution to guessers.
- The system uses the same in-memory room state and polling mechanism established in prior features.
- Guess history persists for the duration of the round. It is cleared when a new round begins (round rotation is out of scope for this feature).
- The maximum guess length is 100 characters; guesses exceeding this are rejected.
- A guesser who guessed correctly can still see the guess history but cannot submit further guesses (server rejects with an error).
- Canvas clear does not affect scores, guess history, or the secret word.
- The polling interval for game state (including canvas state, guess history, and scores) is approximately 2 seconds, consistent with the existing lobby refresh rate.
- Guess rate limiting is enforced client-side only — the guess/submit button is disabled for ~500ms after each submission. No server-side rate limiting is implemented.
- The round progresses independently per guesser: each guesser must submit a correct guess for the round to end. A guesser who has not yet guessed correctly continues guessing until they do.
