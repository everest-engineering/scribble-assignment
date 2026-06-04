# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Drawer Draws on the Canvas (Priority: P1)

A game is active and the drawer has been assigned. The drawer interacts with a canvas element—drawing strokes and optionally clearing the canvas. The drawing data is persisted on the drawer's side and transmitted to the server so that guessers can retrieve it via polling.

**Why this priority**: Without drawing, there is nothing for guessers to see or guess. This is the foundational interaction of the game.

**Independent Test**: Can be fully tested by starting a game, drawing on the canvas as the drawer, and verifying the drawing data is stored and retrievable by polling.

**Acceptance Scenarios**:

1. **Given** a game is active and the user is the drawer, **When** the drawer draws a stroke on the canvas, **Then** the stroke data is sent to the server and persisted in the room's game state.
2. **Given** a game is active and the user is the drawer, **When** the drawer clicks the "Clear" button, **Then** all drawing data for the room is cleared on the server.
3. **Given** a game is active, **When** a guesser polls for room state, **Then** the response includes the current drawing data so the guesser's canvas renders the drawer's artwork.
4. **Given** a game is active and the user is a guesser, **When** the guesser attempts to draw on the canvas, **Then** the canvas does not respond (drawing is disabled for guessers).

---

### User Story 2 – Guesser Submits a Guess (Priority: P1)

A guesser types a word into a guess input field and submits it. The system trims the guess, rejects empty submissions, and compares the trimmed guess case-insensitively against the secret word. A correct guess awards 100 points; an incorrect guess awards 0.

**Why this priority**: Guessing is the core interaction for all non-drawer players. Without it, there is no game loop.

**Independent Test**: Can be tested by submitting guesses as a guesser and verifying correct/incorrect responses and score changes.

**Acceptance Scenarios**:

1. **Given** a game is active and the user is a guesser, **When** the guesser submits the guess `"  CAT  "` and the secret word is `"cat"`, **Then** the system trims the guess to `"CAT"`, compares case-insensitively, identifies it as correct, and awards the guesser 100 points.
2. **Given** a game is active and the user is a guesser, **When** the guesser submits `"dog"` and the secret word is `"cat"`, **Then** the guess is recorded as incorrect and the guesser's score does not change.
3. **Given** a game is active and the user is a guesser, **When** the guesser submits `"   "` (whitespace only), **Then** the system rejects the guess with an error message (e.g., "Guess cannot be empty").
4. **Given** a game is active and the user is a guesser, **When** the guesser submits `""` (empty string), **Then** the system rejects the guess with an error message.
5. **Given** a guesser has already guessed correctly, **When** they try to submit another guess, **Then** the system rejects the submission (a player who has already guessed correctly cannot guess again).

---

### User Story 3 – Guess History Synced to All Players (Priority: P1)

All guesses (correct and incorrect) are recorded in a guess history list. Every player—drawer and guessers—receives the guess history when polling for room state. Correct guesses are flagged so the UI can highlight them.

**Why this priority**: The guess history provides essential feedback to all players. Without it, no one knows what has been guessed, and the game feels unresponsive.

**Independent Test**: Can be tested by submitting guesses from one guesser and polling from a different player (or the drawer) to verify the guess history appears.

**Acceptance Scenarios**:

1. **Given** a game is active, **When** a guesser submits a guess, **Then** the guess (with the guesser's name, the guessed word, and whether it was correct) is appended to the room's guess history.
2. **Given** guesses have been submitted, **When** any participant polls for room state, **Then** the response includes the full ordered guess history.
3. **Given** a correct guess was submitted, **When** viewing the guess history, **Then** the correct guess entry is flagged as correct so the UI can differentiate it visually.

---

### User Story 4 – Scoring (Priority: P1)

All participants start the game with a score of 0. A correct guess awards the guesser exactly 100 points. Incorrect guesses do not change the score. Scores are visible to all players via polling.

**Why this priority**: Scoring is the incentive mechanism. Without it, correct guesses have no tangible value.

**Independent Test**: Can be tested by verifying scores are 0 at game start, submitting a correct guess, and confirming the score becomes 100 for that guesser.

**Acceptance Scenarios**:

1. **Given** a game has just started, **When** any player polls for room state, **Then** every participant's score is 0.
2. **Given** a guesser correctly guesses the word, **When** their score is checked, **Then** it has increased by exactly 100 points.
3. **Given** a guesser submits an incorrect guess, **When** their score is checked, **Then** it remains unchanged.
4. **Given** multiple guessers guess correctly, **When** any player polls the room, **Then** each correct guesser's score reflects their 100-point award independently.

---

### Edge Cases

- What happens when the drawer tries to submit a guess? → The request is rejected (drawers cannot guess).
- What happens when a player who is not in the room tries to submit a guess? → The request is rejected ("not a member").
- What happens when a guess is submitted for a room that does not exist? → The request is rejected ("not found").
- What happens when a guess is submitted while the room is still in lobby status? → The request is rejected ("game not active").
- What happens when the drawing data payload is empty? → An empty drawing is valid (e.g., after a clear); the server stores it.
- What happens when a non-drawer tries to submit drawing data? → The request is rejected ("forbidden" — only the drawer can draw).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept drawing data from the drawer and persist it in the room's game state.
- **FR-002**: System MUST accept a "clear canvas" action from the drawer that resets the drawing data to empty.
- **FR-003**: System MUST reject drawing data submissions from guessers with a "forbidden" error.
- **FR-004**: System MUST include the current drawing data in the room state polling response for all participants.
- **FR-005**: System MUST trim leading and trailing whitespace from submitted guesses before processing.
- **FR-006**: System MUST reject guesses that are empty after trimming, returning a descriptive error message.
- **FR-007**: System MUST compare trimmed guesses against the secret word case-insensitively.
- **FR-008**: System MUST award exactly 100 points to a guesser who submits a correct guess.
- **FR-009**: System MUST NOT change a guesser's score for an incorrect guess (0 points added).
- **FR-010**: System MUST reject guess submissions from the drawer with a "forbidden" error.
- **FR-011**: System MUST reject guess submissions when the room is not in "game" status.
- **FR-012**: System MUST reject guess submissions from a participant who has already guessed correctly.
- **FR-013**: System MUST record every valid guess (correct and incorrect) in an ordered guess history for the room.
- **FR-014**: System MUST include the full guess history in the room state polling response for all participants.
- **FR-015**: Each guess history entry MUST include the guesser's participant ID, guesser's name, the guessed word, and a boolean flag indicating whether it was correct.
- **FR-016**: All participants MUST start the game with a score of 0.
- **FR-017**: Participant scores MUST be included in the room state polling response.

### Key Entities

- **Drawing Data**: An ordered list of strokes (or a serialized canvas representation) stored on the room. Reset when the drawer clears the canvas.
- **Guess**: A single guess attempt. Contains the guesser's participant ID, guesser's name, the guessed word (trimmed), and a correctness flag.
- **Guess History**: An ordered list of Guess entries for the current game, appended to as guesses are submitted.
- **Score**: A numeric value on each Participant, starting at 0, incremented by 100 on a correct guess.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawer's strokes are visible to all guessers within one polling cycle after submission.
- **SC-002**: 100% of whitespace-only or empty guesses are rejected with a clear error message.
- **SC-003**: Correct guesses are identified regardless of case differences between the guess and the secret word.
- **SC-004**: A correct guess always awards exactly 100 points; incorrect guesses never change the score.
- **SC-005**: Guess history is fully consistent across all participants' polling responses.
- **SC-006**: The drawer cannot submit guesses and guessers cannot submit drawing data.
- **SC-007**: A guesser who has already guessed correctly cannot submit another guess.

## Assumptions

- The game has already been started via the flow defined in feature 002 (host started, drawer assigned, secret word selected).
- Drawing data is represented as a JSON-serializable structure (e.g., an array of stroke objects) and transmitted via HTTP POST/PUT; specifics are a plan-phase decision.
- Polling is the existing HTTP-based mechanism from features 001/002; no new transport is added.
- Scores are flat (100 per correct guess); no speed bonuses, drawer bonuses, or partial scoring.
- The guess history includes the guessed word in plaintext for all players. Hiding incorrect guess text is not required.
- Only one round exists (per Constitution VI) — there is no round reset or score carry-over logic.

> **Out-of-scope reminder (Constitution VI)**: WebSockets, databases, auth,
> deployment, Docker, new state/routing libs, multiple rounds, drawer rotation,
> timers, bonuses, custom word packs, spectator mode, room moderation, room
> passwords, and starter rewrites are permanently excluded. Do not include them
> here or in any downstream plan or task list.
