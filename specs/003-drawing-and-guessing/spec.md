# Feature Specification: Drawing & Guessing

**Feature Branch**: `003-drawing-and-guessing`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "The drawer draws on a canvas. These drawings are visible to guessers. Guessers attempt to guess the secret word by submitting text guesses. The system validates guesses against the secret word and provides feedback. Convas can be cleared if they draw unintensionally."

## User Scenarios & Testing

### User Story 1 - Drawer Draws on Canvas (Priority: P1)

As the assigned drawer, I want to draw freehand on a digital canvas so I can visually represent the secret word for the guessers.

**Why this priority**: Drawing is the core gameplay action — without a canvas, the game cannot proceed past word selection. This is the primary mechanic that drives the entire round.

**Independent Test**: Start a game as the drawer, select a secret word, and verify a blank white drawing canvas appears with mouse/touch drawing capability. Draw several lines and verify each stroke appears immediately on the drawer's screen.

**Acceptance Scenarios**:

1. **Given** the drawer has selected a secret word (phase="drawing"), **When** the drawer views the game screen, **Then** they see a drawing canvas with a white background and drawing tools
2. **Given** the drawer is using the canvas, **When** they click and drag the mouse, **Then** freehand lines follow the cursor path and appear in real-time
3. **Given** the drawer has drawn strokes on the canvas, **When** they release the mouse button, **Then** the stroke is finalized locally and queued for server submission

---

### User Story 2 - Guessers See the Drawing via Polling (Priority: P1)

As a guesser, I want to see the drawer's drawing appear on my screen (updated via HTTP polling) so I can try to identify the secret word.

**Why this priority**: The drawing must reach guessers for them to have any basis for guessing. Without synchronized drawing visibility, guessers cannot participate in the game.

**Independent Test**: Start a game with 2+ players. Have the drawer draw several strokes on the canvas. Poll the room endpoint from the guesser's client and verify the guesser's canvas renders all strokes drawn by the drawer so far.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn strokes, **When** a guesser polls the room endpoint, **Then** the response includes accumulated stroke data and the guesser's canvas renders them
2. **Given** the drawer has not yet drawn anything, **When** a guesser views the game screen, **Then** they see an empty white canvas
3. **Given** the drawer is actively drawing, **When** guessers poll at 500ms intervals, **Then** new strokes appear within 2 seconds of being finalized on the drawer's side (per constitution III)

---

### User Story 3 - Guessers Submit Guesses (Priority: P1)

As a guesser, I want to type and submit my guess for the secret word so I can attempt to guess correctly and contribute to the game's progress.

**Why this priority**: Submitting guesses is the core interaction for guessers. Without this, guessers are passive observers and the game lacks its fundamental challenge mechanic.

**Independent Test**: Start a game with a known secret word (e.g., "cat"). As a guesser, submit "cat" and verify a correct-guess response. Submit "dog" and verify an incorrect-guess response. Verify the drawer can see who guessed what (but not the correctness).

**Acceptance Scenarios**:

1. **Given** a game in the drawing phase, **When** a guesser submits the exact secret word (case-insensitive), **Then** the server responds with `{ correct: true }` and records the guess
2. **Given** a game in the drawing phase, **When** a guesser submits a word that does not match the secret word, **Then** the server responds with `{ correct: false }` and records the guess
3. **Given** guesses have been submitted, **When** any player polls the room, **Then** the response includes the list of recent guesses with guesser names and text (but correctness flags are NOT visible to the drawer)
4. **Given** a game in the drawing phase, **When** the drawer submits a guess, **Then** the server rejects it with a clear error

---

### Edge Cases

- What happens when the drawer draws very rapidly (many strokes per second)? Strokes should be queued and batched to the server at a reasonable cadence (e.g., every 500ms or on mouse-up) to avoid overwhelming the server.
- What if a player disconnects mid-round? The game continues. On reconnection (next poll), they receive the latest canvas state and guess list.
- What if a guesser submits very long text? Guesses must be validated (max 100 chars, trimmed, non-empty). Rejected with error otherwise.
- What if a guesser submits the same wrong word repeatedly? Each submission is accepted and stored (duplicate incorrect guesses are allowed).
- What if the secret word contains mixed case? Guesses must be compared case-insensitively. "CAT" must match "cat".

## Requirements

### Functional Requirements

- **FR-001**: The drawer MUST see a drawing canvas (HTML5 Canvas 2D API) when the round phase transitions to "drawing".
- **FR-002**: The drawer MUST be able to draw freehand lines via mouse click-and-drag (pointer down → move → pointer up).
- **FR-003**: Stroke data MUST be submitted to the server and stored in-memory in the RoundState. Submit frequency: on mouse-up finalization AND periodic flush (every 1s) for long strokes.
- **FR-004**: The GET room endpoint MUST include accumulated stroke data in its response so guessers can render the full drawing.
- **FR-005**: Guessers MUST see a canvas on their screen that renders all strokes from the server data. Pending new strokes appear on next poll cycle.
- **FR-006**: Polling interval for drawing updates SHOULD be 500ms (drawing is time-sensitive; 2s constitution max is the ceiling, not the target).
- **FR-007**: Guessers MUST have a text input and submit button to send their guess.
- **FR-008**: The server MUST validate guesses against the secret word using case-insensitive exact match.
- **FR-009**: The guess endpoint MUST return `{ correct: boolean }` to the submitter.
- **FR-010**: All submitted guesses (text + guesser name) MUST be returned in the room polling response for all participants to see.
- **FR-011**: The drawer MUST NOT see which guesses are correct/incorrect — correctness flags MUST be filtered out for the drawer in the polling response.
- **FR-012**: The drawer MUST NOT be able to submit guesses — a non-drawer check MUST reject drawer submissions with a 403.
- **FR-013**: Guess text MUST be validated: trimmed, non-empty, max 100 characters. Invalid guesses rejected with 400 + error message.
- **FR-014**: Stroke data submitted to the server MUST be validated: must be an array of strokes; each stroke must have a non-empty points array; each point must have numeric x and y (0-1 normalized). Invalid strokes rejected with 400.
- **FR-015**: A guesser who has already guessed correctly MUST NOT submit further guesses — the server rejects with a 400.
- **FR-016**: All drawing and guessing business logic MUST reside in the services layer (`src/services/`), not in route handlers.

### Key Entities

- **Stroke**: A single continuous drawing action. Contains `points: Point[]`, `color: string`, `width: number`. Immutable once finalized.
- **Point**: A normalized coordinate. `{ x: number, y: number }`, each in range [0, 1] relative to canvas dimensions. Enables resolution-independent rendering.
- **Guess**: A text submission from a guesser. Contains `participantId`, `participantName`, `text`, `isCorrect`, `guessedAt`. Stored in RoundState.
- **Canvas State**: The ordered array of all strokes accumulated in the current round. Stored in RoundState. Served to all polling clients.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The drawer can draw a stroke and see it appear on their canvas in under 100ms (local rendering, no network dependency).
- **SC-002**: A guesser sees new strokes appear on their canvas within 2 seconds of the drawer completing them (server round-trip via polling).
- **SC-003**: Correct guesses are identified with 100% accuracy using case-insensitive comparison.
- **SC-004**: Incorrect guesses return `{ correct: false }` and are recorded; submitting the same wrong answer again is permitted.
- **SC-005**: The drawer sees all guesses but never sees which ones are correct. Verified manually by comparing drawer vs guesser polling responses.
- **SC-006**: Both `npm run build` (backend) and `npm run build` (frontend) pass without errors.

## Assumptions

- The canvas uses the HTML5 Canvas 2D API with pointer events (mouse only for v1; touch is out of scope).
- The initial drawing tool is a single black pen with a fixed width (3px normalized). Color/brush/eraser selection is out of scope for this feature.
- Stroke points are normalized to 0-1 range so the drawing renders correctly regardless of canvas display size.
- The canvas has a fixed aspect ratio (e.g., 4:3) enforced consistently across drawer and guesser views.
- Polling for drawing data uses a 500ms interval (below the 2s constitution cap), to ensure acceptable drawing responsiveness.
- The drawer must not be able to guess. This is enforced server-side.
- A guesser who has already guessed correctly is prevented from submitting further guesses (server-enforced).
- Round-end conditions (timer, all-correct, manual host action) and scoring are out of scope — handled by a subsequent feature.
- Multi-round gameplay is out of scope — this feature handles a single round only.
- The stroke history grows unboundedly in memory for the duration of a round. This is acceptable since games are short-lived and rooms are cleaned up.
