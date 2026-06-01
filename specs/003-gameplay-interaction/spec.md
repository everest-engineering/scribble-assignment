# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Gameplay interaction: Interactive drawing canvas, clear canvas, guess submission with validation, synced guess history via polling, deterministic scoring"

## Clarifications

### Session 2026-06-01

- Q: When does the drawing round end? → A: Both — round ends when all guessers are correct OR drawer manually reveals (whichever comes first)
- Q: Can the drawer see other players' guesses? → A: Yes — drawer sees all guesses (correct and incorrect) in real time
- Q: What drawing tools should the canvas provide? → A: Freehand drawing with a color picker (8-12 color palette) and width picker (3-4 sizes), no eraser or undo

## User Scenarios & Testing

### User Story 1 - Drawing and Viewing the Canvas (Priority: P1)

As the active drawer, I want an interactive canvas where I can draw freely, and all other players in the room can see my drawing update via polling, so that the game can proceed with a shared visual.

**Why this priority**: Drawing is the core mechanic of the game. Without it, no gameplay can occur. Both drawer and guesser experiences depend on this.

**Independent Test**: Can be fully tested by having one browser session draw on the canvas and confirming that a second browser session in the same room sees the strokes appear after a poll cycle.

**Acceptance Scenarios**:

1. **Given** the user is the current drawer, **When** they move the mouse on the canvas, **Then** strokes appear on their screen in real time
2. **Given** a drawing has been made, **When** a guesser polls for canvas state, **Then** they receive the accumulated strokes as a serialized representation
3. **Given** a guesser opens the room mid-drawing, **When** they poll, **Then** they receive the full current drawing state, not just strokes drawn after they joined
4. **Given** no player is drawing, **When** any player polls for canvas state, **Then** they receive an empty/blank canvas

---

### User Story 2 - Clear Canvas (Priority: P2)

As the drawer, I want to clear the canvas with a single action so that I can correct mistakes or start over.

**Why this priority**: Enables the drawer to recover from errors without leaving the room and re-joining. Improves quality of life significantly.

**Independent Test**: Can be tested by drawing some strokes, clicking clear, and verifying the canvas is blank for all players after the next poll.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn strokes on the canvas, **When** they click the clear button, **Then** the canvas is cleared locally and a clear-canvas action is synced to the server
2. **Given** a clear action has been synced, **When** any player polls, **Then** they receive an empty canvas state
3. **Given** the drawer clears the canvas, **When** they draw new strokes, **Then** only the new strokes appear (old strokes are not restored)
4. **Given** a guesser (non-drawer) views the room, **When** they attempt to clear the canvas, **Then** the action is rejected

---

### User Story 3 - Guess Submission with Validation (Priority: P2)

As a guesser in a room, I want to submit a text guess and see it validated (correct/incorrect) so that I can participate in the game.

**Why this priority**: Guess submission is the other core game mechanic alongside drawing. Players must be able to guess to win points.

**Independent Test**: Can be tested by submitting a guess and confirming the server responds with a validation result (correct/incorrect), and the guess appears in the room's guess history.

**Acceptance Scenarios**:

1. **Given** a guesser submits a text guess, **When** the guess matches the current word (case-insensitive), **Then** the server marks it as correct and notifies the guesser
2. **Given** a guesser submits a text guess, **When** the guess does not match the current word, **Then** the server marks it as incorrect
3. **Given** the drawer submits a guess, **When** they attempt to guess their own word, **Then** the submission is rejected with an error
4. **Given** a guesser submits an empty or whitespace-only guess, **When** the server receives it, **Then** it is rejected with an appropriate error
5. **Given** a guesser submits a guess longer than 200 characters, **When** the server receives it, **Then** it is rejected with an appropriate error

---

### User Story 4 - Synced Guess History via Polling (Priority: P3)

As a player in a room, I want to see the full guess history (who guessed what, and whether it was correct) update via polling, so that I can track the game's progress.

**Why this priority**: Provides visibility into game activity and creates a shared game state. Lower priority because the core loop (draw + guess) works without it, but it significantly improves the experience.

**Independent Test**: Can be tested by submitting two guesses from different sessions and confirming both sessions see all guesses appear after polling.

**Acceptance Scenarios**:

1. **Given** two guesses have been submitted in a room, **When** any player polls the room state, **Then** they receive both guesses in chronological order
2. **Given** a guesser makes a correct guess, **When** the history is polled, **Then** that guess is marked as correct and subsequent guesses from that player stop appearing (player stops guessing once correct)
3. **Given** a new player joins a room mid-game, **When** they poll, **Then** they receive the complete guess history from the current round
4. **Given** there are multiple rooms active, **When** a player polls their room's guess history, **Then** they only see guesses from their own room (room isolation)
5. **Given** the drawer polls the room state, **When** guessers have submitted guesses, **Then** the drawer sees all guesses (both correct and incorrect)

---

### User Story 5 - Deterministic Scoring (Priority: P3)

As a player, I want correct guesses to award deterministic points to the guesser so that scoring is fair and predictable.

**Why this priority**: Scoring provides the win condition. Deterministic scoring without randomness ensures fairness and consistent behavior across all clients.

**Independent Test**: Can be tested by having two guessers guess correctly in sequence and confirming they receive predictable, documented point values.

**Acceptance Scenarios**:

1. **Given** a guesser submits a correct guess, **When** the server validates it, **Then** the guesser receives a deterministic point value
2. **Given** two guessers guess correctly in a round, **When** both scores are tallied, **Then** each guesser receives the same point value for a correct guess (first-correct is not penalized or rewarded differently)
3. **Given** a guesser guesses incorrectly multiple times, **When** they finally guess correctly, **Then** their score still increases by the same deterministic amount
4. **Given** the same game scenario replayed identically (same word, same guesses), **When** scores are computed, **Then** the result is identical every time

---

### Edge Cases

- When all guessers have guessed correctly, the round ends automatically. The drawer may also manually end the round (reveal the word) at any time before that. Whichever happens first ends the round.
- How does the server handle a guess submitted after the round has ended? It should be rejected with an appropriate error.
- What happens if the polling request fails (network error)? The client should gracefully handle the error, retry, and display stale state until refreshed.
- How does the system handle rapid guess submission from multiple players simultaneously? All guesses should be processed and recorded in submission order.
- What happens when a guess contains HTML or special characters? Guesses should be sanitized for display.
- What happens if the canvas drawing data is very large? The server should cap the stroke data at a reasonable limit (e.g., 1 MB after serialization).

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide an interactive drawing canvas for the current drawer
- **FR-002**: The system MUST serialize drawing strokes and expose them via an HTTP endpoint for polling
- **FR-003**: The system MUST provide a clear-canvas action that only the current drawer can invoke
- **FR-004**: The system MUST reject guess submissions from the current drawer
- **FR-005**: The system MUST validate guesses against the current word using case-insensitive comparison
- **FR-006**: The system MUST reject empty, whitespace-only, and excessively long guesses
- **FR-007**: The system MUST expose the full guess history for a room via an HTTP polling endpoint
- **FR-008**: The system MUST isolate guess history and canvas state per-room (no cross-room leakage)
- **FR-009**: The system MUST award a deterministic point value to any guesser who submits a correct guess
- **FR-010**: The system MUST stop showing guesses from a guesser who has already guessed correctly
- **FR-011**: The system MUST cap serialized canvas stroke data at a reasonable maximum size
- **FR-012**: The system MUST sanitize guess text for display (prevent XSS via guess content)
- **FR-013**: The system MUST end the round automatically when all guessers have submitted a correct guess
- **FR-014**: The system MUST allow the drawer to manually end the round (reveal the word) at any time

### Key Entities

- **Drawing**: The accumulated state of strokes on the canvas for a room's current round. Contains an ordered list of stroke objects (each with points, color, width) and a clear flag.
- **Guess**: A single submitted text guess in a room, associated with a specific player. Contains the guesser ID, guess text, timestamp, and correctness status. Once a guesser is correct, their subsequent guesses are not published.
- **Score**: The cumulative point total for a player in a room. Updated deterministically when a correct guess is recorded.
- **Room Game State**: The composite state for an active game room, including current word, drawer identity, canvas state, guess history, and scores.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A guesser can see the drawer's strokes in under 3 seconds from initial drawing (within one poll cycle at a 2-second interval plus network latency)
- **SC-002**: Guesses are validated and appear in the history within 2 seconds of submission (next poll cycle)
- **SC-003**: Multiple guessers can submit guesses simultaneously without losing any submission
- **SC-004**: Room isolation is maintained: actions in one room never affect another room's state
- **SC-005**: Scoring produces identical results given identical inputs across any number of replay attempts
- **SC-006**: A player who joins mid-round receives the complete current state (drawing + guess history) within one poll cycle

## Assumptions

- The polling interval will be set at approximately 2 seconds.
- Canvas stroke data is serialized as a lightweight format (e.g., array of stroke objects with point coordinates).
- The canvas provides a fixed color palette (8-12 colors) and 3-4 brush widths. No eraser or undo is provided.
- The current word is stored server-side and compared against guesses using case-insensitive matching.
- The drawer is determined before the drawing phase begins (determined by a prior round-start mechanism).
- Each room has exactly one active round at a time.
- Guesses are text-only (no image guessing, no emoji-only guesses).
- Point values are simple and deterministic (e.g., 1 point per correct guess).
- This feature builds on the existing room setup and round-start infrastructure from prior specs.
