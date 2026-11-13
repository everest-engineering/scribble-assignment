# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-02

**Status**: Draft

**Input**: Group 3 features (F10-F13) from document.md

## Clarifications

### Session 2026-06-02
- Q: How is drawing data synchronized? → A: The drawer client serializes the canvas state as a base64 PNG data URL and uploads it to the backend room session; guessers poll the snapshot and render the data URL inside an image element.
- Q: Where is player score stored? → A: A `score` integer field is added to the `Participant` model, initialized to `0` when joining the lobby and incremented by `100` on a correct guess.
- Q: Guess comparison criteria → A: Trimming leading/trailing whitespace, converting to lowercase, and comparing against the lowercase `secretWord`.
- Q: Empty guess handling → A: Rejected at the client and server levels with an error message, preventing empty or whitespace-only submissions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Synced Canvas (Priority: P1)

As the drawer, I want to be able to draw freehand on the canvas and have it automatically synchronize to the guessers' screens within 2.5 seconds, so they can see my drawing in real-time.

**Why this priority**: Core game loop component. Without a synced canvas, guessers cannot guess the secret word.

**Independent Test**: Host starts game (becomes drawer) and draws a line on the canvas. Verify guest tab automatically displays the line within 2.5 seconds.

**Acceptance Scenarios**:
1. **Given** I am the drawer on the Game Page, **When** I click and drag my mouse on the canvas area, **Then** a line is rendered on my canvas.
2. **Given** I am drawing on the canvas, **When** I release the mouse, **Then** the canvas image data URL is uploaded to the backend.
3. **Given** I am a guesser on the Game Page, **When** the page polls the room snapshot, **Then** the drawer's canvas state is loaded and displayed.

---

### User Story 2 - Clear Canvas (Priority: P1)

As the drawer, I want to be able to clear my canvas to start a new drawing, instantly clearing the drawing on all guessers' screens as well.

**Why this priority**: Essential UX capability for correcting mistakes or starting over.

**Independent Test**: As the drawer, draw a line, click "Clear Canvas", and confirm both drawer and guesser canvases become blank.

**Acceptance Scenarios**:
1. **Given** I am the drawer and have drawing elements on the canvas, **When** I click the "Clear Canvas" button, **Then** my local canvas is cleared.
2. **Given** the drawer clears the canvas, **When** the next poll occurs, **Then** the canvas is cleared on all guessers' screens.

---

### User Story 3 - Guess Validation & Comparison (Priority: P1)

As a guesser, I want to submit guesses and have the system reject empty/spaces guesses, and case-insensitively match valid guesses against the secret word.

**Why this priority**: Core guessing flow. Handles error states and guarantees validation rules.

**Independent Test**: Enter empty guess or spaces, verify validation error. Enter correct word in uppercase/lowercase (e.g. `ROCKET` or `rocket`), and confirm it matches.

**Acceptance Scenarios**:
1. **Given** I am a guesser, **When** I submit an empty or whitespace-only guess, **Then** the input displays a validation error and is not submitted.
2. **Given** the secret word is `"rocket"`, **When** I submit `"   RoCkeT  "`, **Then** the guess is trimmed, normalized, matched successfully, and marked as correct.
3. **Given** the secret word is `"rocket"`, **When** I submit `"pizza"`, **Then** the guess is matched unsuccessfully and marked as incorrect.

---

### User Story 4 - Synced Guess History & Scoreboard (Priority: P1)

As a player, I want to see a running log of all guesses and updated scores for each participant, reflecting a 100-point increase for a correct guess.

**Why this priority**: Scores track game progression and the log builds player interaction.

**Independent Test**: Guess correctly as guest Bob. Confirm guest Bob's score increases to 100, and both host and guest see "Bob guessed correctly!" in the guess history log.

**Acceptance Scenarios**:
1. **Given** a guess is submitted, **When** the room snapshot updates, **Then** the guess log displays the player name, guess content, and correct/incorrect status.
2. **Given** a guesser submits a correct guess, **When** the score is calculated, **Then** the guesser's score increases by 100 points on the scoreboard.

---

### Edge Cases

- **Drawer Attempting to Guess**: The drawer does not see a guess input form and cannot submit guesses.
- **Multiple Correct Guesses**: A guesser can only score 100 points once per round. Subsequent correct guesses by the same player are ignored or scored as 0.
- **Empty Canvas sync**: If the drawer clears the canvas, the drawing data resets to `""` or `null`, resetting the image displayed to guessers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive canvas component on the Game Page for the drawer, recording drawing coordinate paths.
- **FR-002**: Frontend MUST serialize the drawer's canvas state as a base64 PNG data URL and upload it to `POST /api/rooms/:code/canvas` on stroke completions (mouse-up) or at a throttle of 500ms.
- **FR-003**: System MUST provide a "Clear Canvas" button for the drawer which clears local canvas and sends a request to reset canvas data on the backend.
- **FR-004**: System MUST allow guessers to submit guesses via `POST /api/rooms/:code/guesses` with parameter `{ participantId, guessText }`.
- **FR-005**: System MUST reject empty or whitespace-only guesses on the client side (preventing form submission) and on the backend (returning 400 Bad Request).
- **FR-006**: System MUST trim guess text and compare case-insensitively against the secret word.
- **FR-007**: System MUST record all guess attempts in a `guesses` list on the Room, containing `{ id, playerName, text, isCorrect, scoreAwarded, timestamp }`.
- **FR-008**: System MUST increment the participant's score by `100` points on their first correct guess. Score is stored in a `score` integer field on the Participant object.
- **FR-009**: Frontend MUST render the guess log list on the Game Page, updating automatically via the 2-second polling interval.
- **FR-010**: Frontend MUST render the scoreboard list displaying player names and current scores on the Game Page.

### Key Entities

- **Participant**: Extended with `score: number` field, initialized to `0`.
- **Guess**: New entity representing a guess attempt. Contains `id` (string), `playerName` (string), `text` (string), `isCorrect` (boolean), `scoreAwarded` (number), `timestamp` (string).
- **GameRound**: Extended with `drawingData` (string/data URL) and `guesses` (Guess[]).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Canvas drawings sync to guesser screen within 2.5 seconds of stroke completion (bounded by polling).
- **SC-002**: Incorrect guesses appear in the guess log within 2.5 seconds of submission.
- **SC-003**: Correct guess immediately updates the player's score on the scoreboard across all clients within 2.5 seconds.
- **SC-004**: Empty guesses show error messages in UI within 200ms.

## Assumptions

- Freehand canvas draws simple colored lines (black, default thickness) using basic mouse events.
- Base64 data URLs fit within the in-memory memory footprint limits of the Node server room store.
- Canvas dimensions are standardized or responsive so that coordinates scale cleanly if rendered directly.
