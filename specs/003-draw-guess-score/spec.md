# Feature Specification: Round Drawing, Guessing, and Scoring

**Feature Branch**: `003-draw-guess-score`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws and Clears the Canvas (Priority: P1)

During an active round, the drawer can draw freehand strokes on a canvas and clear the entire canvas when desired. The current drawing state is preserved and visible to the drawer.

**Why this priority**: Drawing is the core mechanic of the game; without it, guessers have nothing to base their guesses on.

**Independent Test**: Can be tested by starting a game, confirming the drawer sees an interactive canvas, drawing a stroke, and verifying the stroke remains visible.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is the drawer, **When** they draw a freehand stroke on the canvas, **Then** the stroke is rendered and remains visible on the canvas.
2. **Given** a round is active and the viewer is the drawer, **When** they trigger the clear action, **Then** all existing strokes are removed and the canvas is blank.
3. **Given** a round is active and the viewer is a guesser, **When** they look at the canvas area, **Then** they see the current drawing strokes synced from the server (via polling).

---

### User Story 2 - Guessers Submit Guesses with Validation (Priority: P1)

Guessers can type and submit a guess. The system trims whitespace, rejects empty guesses, and compares the guess to the secret word case-insensitively.

**Why this priority**: Guess submission is the primary interaction for non-drawer players and must be robust against malformed input.

**Independent Test**: Can be tested by having a guesser submit various inputs (valid guess, whitespace-only, mixed case) and observing the system's responses.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is a guesser, **When** they submit a guess that exactly matches the secret word, **Then** the guess is recorded and the player receives 100 points.
2. **Given** a round is active and the viewer is a guesser, **When** they submit a guess that differs only in case from the secret word, **Then** the guess is treated as correct and the player receives 100 points.
3. **Given** a round is active and the viewer is a guesser, **When** they submit a guess containing only whitespace, **Then** the submission is rejected with a clear error message and no points are awarded.
4. **Given** a round is active and the viewer is a guesser, **When** they submit a guess with leading or trailing whitespace, **Then** the whitespace is trimmed before comparison.
5. **Given** a round is active and the viewer is a guesser, **When** they submit an incorrect guess, **Then** the guess is recorded in history and 0 points are awarded.

---

### User Story 3 - Guess History Synced to All Players via Polling (Priority: P1)

All players see a live-updating guess history that includes every guess submitted, who submitted it, and whether it was correct or incorrect. Updates arrive via automatic polling.

**Why this priority**: Shared visibility of guesses keeps all players engaged and informed about the round's progress.

**Independent Test**: Can be tested by having two guessers submit guesses in separate tabs and verifying both tabs display the full, ordered guess history within a few seconds.

**Acceptance Scenarios**:

1. **Given** multiple players are in an active round, **When** a guesser submits a correct guess, **Then** the guess appears in the history panel of all participants within approximately 2 seconds.
2. **Given** multiple players are in an active round, **When** a guesser submits an incorrect guess, **Then** the guess appears in the history panel of all participants within approximately 2 seconds.
3. **Given** a player is viewing the game screen, **When** they remain idle, **Then** the guess history continues to refresh automatically without requiring a page reload.

---

### User Story 4 - Scoreboard Reflects Correct and Incorrect Guesses (Priority: P2)

A scoreboard displays each player's current score. Correct guesses add 100 points; incorrect guesses add 0 points. All players start at 0.

**Why this priority**: Scoring provides feedback and a sense of progress, but the game remains playable without a visible scoreboard.

**Independent Test**: Can be tested by submitting a mix of correct and incorrect guesses and verifying the scoreboard totals update accordingly for all players.

**Acceptance Scenarios**:

1. **Given** a round is active and all players have a score of 0, **When** a guesser submits a correct guess, **Then** their score increases by 100 and the scoreboard reflects the new total.
2. **Given** a round is active, **When** a guesser submits an incorrect guess, **Then** their score remains unchanged (0 points added).
3. **Given** a player views the game screen, **When** they observe the scoreboard, **Then** they see the current score for every participant in the room.

---

### Edge Cases

- What happens when a guesser submits the correct word? → The round ends immediately, the room transitions to `results` status, and the guesser receives 100 points.
- What happens if the drawer attempts to submit a guess? → The submission is rejected with a clear message that the drawer cannot guess.
- What happens if a guesser submits the correct word multiple times? → Only the first correct guess awards 100 points; subsequent submissions are rejected because the room has transitioned to `results` status.
- What happens if the canvas is cleared while guessers are viewing it? → All strokes are removed and the canvas appears blank to all players on the next poll.
- What happens if a guess is submitted while the secret word is null (e.g., room not in playing state)? → Rejected with a clear error.
- What happens if a player refreshes their browser mid-round? → Treated as a new session; they must re-join (but joining a playing room is rejected per spec 001).
- How does the system handle polling failure for guess history or canvas state? → Silently retries at the same ~2-second interval with no visible error UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: During an active round, the drawer MUST be able to draw freehand strokes on an interactive canvas.
- **FR-002**: During an active round, the drawer MUST be able to clear the entire canvas, removing all strokes.
- **FR-003**: The current canvas drawing state MUST be visible to all players in the room.
- **FR-004**: Guessers MUST be able to submit a text guess during an active round.
- **FR-005**: The system MUST trim leading and trailing whitespace from submitted guesses before processing.
- **FR-006**: The system MUST reject empty or whitespace-only guess submissions with a clear, user-facing error message.
- **FR-007**: The system MUST compare guesses to the secret word case-insensitively.
- **FR-008**: A guesser who submits a correct guess MUST receive exactly 100 points added to their score.
- **FR-009**: A guesser who submits an incorrect guess MUST receive 0 points.
- **FR-010**: All players MUST start each round with a score of 0.
- **FR-011**: The system MUST maintain an ordered guess history containing the guess text, the submitter's identity, and whether the guess was correct.
- **FR-012**: The guess history MUST be synchronized to all players in the room via automatic polling approximately every 2 seconds.
- **FR-013**: The scoreboard MUST display the current score of every participant in the room and update in sync with guess history.
- **FR-014**: The system MUST reject guess submissions from the current drawer.
- **FR-015**: The system MUST reject guess submissions when the room is not in an active `playing` state.

### Key Entities *(include if feature involves data)*

- **Room**: Updated attributes: `scores` (map of participant ID to integer score), `guessHistory` (ordered list of guess entries), `canvasStrokes` (ordered list of stroke data representing the current drawing).
- **Participant**: Updated attributes: `score` (integer, starting at 0 for each round).
- **GuessEntry**: Represents a single guess. Key attributes: `participantId` (who submitted it), `guess` (the trimmed text), `isCorrect` (boolean), `submittedAt` (timestamp).
- **RoomSnapshot**: Updated attributes: `scores` (map visible to all), `guessHistory` (visible to all), `canvasStrokes` (visible to all).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A drawer can draw a stroke on the canvas and see it rendered within 500 milliseconds.
- **SC-002**: A guesser's submitted guess appears in the history panel of all players within 3 seconds.
- **SC-003**: 100% of empty or whitespace-only guess submissions receive a clear error message with no points awarded.
- **SC-004**: 100% of case-variant correct guesses (e.g., "Rocket" vs "rocket") are scored as correct (100 points).
- **SC-005**: The scoreboard accurately reflects each player's total within 3 seconds of a guess submission.
- **SC-006**: 0% of drawer guess submissions are accepted or awarded points.
- **SC-007**: Canvas clear action removes all strokes and the blank state is visible to all players within 3 seconds.

## Assumptions

- Canvas drawing uses freehand strokes (lines); no shapes, text, or images are supported.
- The canvas state is synchronized via the same ~2-second polling mechanism used for room state.
- There is no round timer; the round ends immediately when any guesser submits the correct word, transitioning the room to `results` status.
- Only one round is implemented per game, with no drawer rotation, subsequent rounds, or game-over screen.
- A player may guess correctly multiple times, but only the first correct guess awards points.
- The canvas is a shared, single-layer drawing surface; there is no undo, redo, or per-stroke deletion beyond the global clear action.
- Player names do not need to be globally unique; uniqueness within a room is not enforced.
- There is no reconnection or session persistence across browser refreshes; a refresh is treated as a new session.

## Out of Scope

- Real-time stroke streaming (WebSockets or SSE).
- Multiple drawing tools (colors, brush sizes, eraser).
- Timer or countdown for the round.
- Drawer rotation for subsequent rounds.
- Game restart or multiple rounds.
- Chat or messaging beyond guess submissions.

## Clarification Q&A

| # | Category | Question | Answer |
|---|----------|----------|--------|
| 1 | Domain & Data Model | What is the canonical representation of a "stroke" stored server-side and returned via polling? | Array of strokes: `{ points: [{x: number, y: number}], color: string, width: number }`. |
| 2 | Functional Scope & Behavior | What happens when the first player guesses the word correctly? | The round ends immediately; the room transitions to `results` status and the correct guesser receives 100 points. Only one correct guess is possible per round. |
| 3 | Integration & External Dependencies | Should canvas drawing state, guess history, and scoreboard data be delivered through the existing room snapshot polling endpoint, or through separate dedicated endpoints? | Extend the existing room snapshot endpoint with the new fields. |
| 4 | Interaction & UX Flow | Should canvas stroke coordinates be normalized to a fixed logical size or kept as raw pixels from the drawer's viewport? | Normalize to a fixed logical canvas (e.g., `0–1000` units) and scale on render. |
| 5 | Edge Cases & Failure Handling | What happens if the drawer leaves mid-round? | End the round immediately, clear all round state, and return the room to lobby. |
