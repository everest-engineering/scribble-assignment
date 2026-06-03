# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "#### Scenario 3 — Gameplay Interaction
**Given** a round is active with a drawer and guessers (all scores start at 0), **When** the drawer draws/clears the canvas and guessers submit their guesses, **Then** the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Drawer Can Draw and Clear the Canvas (Priority: P1)

The drawer has an interactive canvas on the game screen. They can draw freehand by clicking and dragging, and they can clear the entire canvas to start over. All drawing is visible to the drawer in real time on their screen.

**Why this priority**: The canvas is the core mechanic of the game — without it, guessers have nothing to guess from. All other user stories in this feature depend on the drawing being visible.

**Independent Test**: Start a game as the drawer. Draw a shape on the canvas and verify it appears immediately. Press the clear button and verify the canvas returns to a blank state.

**Acceptance Scenarios**:

1. **Given** an active round and the drawer is viewing the game screen, **When** the drawer clicks and drags on the canvas, **Then** a freehand stroke appears on the canvas.
2. **Given** the drawer has drawn one or more strokes, **When** the drawer activates the clear canvas action, **Then** all strokes are removed and the canvas returns to a blank state.
3. **Given** the drawer has not yet drawn anything, **When** the drawer views the canvas, **Then** the canvas is blank and ready for input.
4. **Given** a participant who is not the drawer views the game screen, **When** they view the canvas area, **Then** they cannot draw on it — the canvas is read-only for non-drawers.

---

### User Story 2 — Guessers Submit Guesses and Receive Immediate Feedback (Priority: P1)

Guessers can type a word and submit it as their guess. The system trims leading and trailing whitespace before evaluating the guess, performs a case-insensitive comparison against the secret word, and rejects empty or whitespace-only submissions with a clear message. The guesser immediately sees whether their guess was correct or incorrect.

**Why this priority**: Guessing is the other half of the core game loop — without it, the game cannot progress or be won.

**Independent Test**: As a guesser, submit the correct word in a different casing (e.g., "ROCKET" when the word is "rocket"). Verify it is accepted as correct. Submit an empty string and verify it is rejected with a message. Submit a wrong word and verify it is recorded as incorrect.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits a word that matches the secret word (case-insensitive, after trimming), **Then** the guess is recorded as correct.
2. **Given** an active round, **When** a guesser submits a word that does not match the secret word, **Then** the guess is recorded as incorrect.
3. **Given** a guesser types only whitespace or submits an empty string, **When** they attempt to submit, **Then** the submission is rejected and a validation message is displayed indicating the guess cannot be empty.
4. **Given** a guesser submits a word with leading or trailing whitespace, **When** the system evaluates the guess, **Then** the whitespace is stripped before comparison (e.g., " rocket " matches "rocket").
5. **Given** an active round, **When** a guesser submits a guess, **Then** the result (correct or incorrect) is immediately visible to that guesser without waiting for the next poll.

---

### User Story 3 — Guess History Is Shared with All Players via Polling (Priority: P1)

All guesses submitted during a round — by any guesser — are collected into a shared guess history stored on the server. This history is returned as part of the room state on every poll, so all participants (drawer and guessers) see the full history within one polling interval without any page reload.

**Why this priority**: Shared visibility of guesses is essential for the game experience — all players need to see what words have been tried. Without it the game is unplayable as a shared activity.

**Independent Test**: Open two browser tabs (drawer and guesser). As the guesser, submit a guess. Within ≤2 seconds, verify the guess appears in the guess history on both the guesser's and the drawer's screen.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** the next poll completes on any participant's screen, **Then** that guess appears in the shared guess history visible to all players.
2. **Given** multiple guesses have been submitted, **When** a participant polls for room state, **Then** the full guess history is returned in chronological order (oldest first).
3. **Given** no guesses have been submitted yet, **When** a participant views the game screen, **Then** the guess history area is empty.
4. **Given** a correct guess exists in the history, **When** any participant views the guess history, **Then** the correct guess is visually distinguished from incorrect ones.

---

### User Story 4 — Scores Update When a Correct Guess Is Made (Priority: P2)

Each participant starts the round with a score of 0. When a guesser submits a correct guess, their score increases by 100 points. Incorrect guesses do not affect any score. Current scores for all participants are included in the poll response so all players see the scoreboard update within one polling interval.

**Why this priority**: Scoring adds a win condition and competitive dimension, but the game is playable without it as a social activity. Scoring depends on guess evaluation (US2) and polling (US3) being in place first.

**Independent Test**: Start a game with two players (scores both 0). As the guesser, submit a correct guess and verify the guesser's score becomes 100. Submit an incorrect guess and verify no scores change.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** any participant views the scoreboard, **Then** every participant's score is 0.
2. **Given** a guesser submits a correct guess, **When** the guess is evaluated, **Then** that guesser's score increases by exactly 100 points.
3. **Given** a guesser submits an incorrect guess, **When** the guess is evaluated, **Then** no participant's score changes.
4. **Given** scores have changed, **When** any participant polls for room state, **Then** the updated scores for all participants are included in the response.
5. **Given** the game screen is visible, **When** a participant views the scoreboard, **Then** the current score for every participant is displayed.

---

### Edge Cases

- What happens if a guesser submits the correct word more than once? The second and subsequent correct submissions are treated as incorrect guesses — the 100-point award is granted only once per guesser per round.
- What happens if the drawer submits a guess? The guess input form is hidden from the drawer — only participants whose role is "Guesser" can see and use the form.
- What happens if two guessers submit the correct word at nearly the same time? Each submission is evaluated independently in submission order; each receives 100 points if their guess is their first correct guess.
- What happens if a participant navigates away and returns mid-round? They receive the current canvas state and full guess history from the next poll — no state is lost.
- What happens when no guesser guesses correctly — is there a round timer or end condition? Round timers and automatic round progression are out of scope for this feature; the round continues until the host ends the game.
- What happens to the canvas when it is cleared — can the action be undone? The clear action is irreversible; there is no undo within this feature.

## Requirements _(mandatory)_

### Functional Requirements

#### Canvas (US1)

- **FR-001**: The game screen MUST display an interactive drawing canvas to the drawer during an active round.
- **FR-002**: The canvas MUST support freehand drawing via click-and-drag input.
- **FR-003**: The canvas MUST include a "Clear" action that removes all strokes and resets the canvas to blank.
- **FR-004**: The canvas MUST be read-only (non-interactive for drawing) for participants who are not the current drawer.
- **FR-005**: The current canvas state (all strokes for the round) MUST be included in the room state returned by polling so that all participants see the same drawing.

#### Guess Submission (US2)

- **FR-006**: The game screen MUST display a guess input form exclusively to participants who are not the current drawer.
- **FR-007**: The system MUST reject guess submissions that are empty or contain only whitespace, and MUST display a validation message to the user.
- **FR-008**: The system MUST trim leading and trailing whitespace from a submitted guess before evaluating it.
- **FR-009**: Guess evaluation MUST be case-insensitive (e.g., "ROCKET", "rocket", and "Rocket" all match "rocket").
- **FR-010**: The result of a guess evaluation (correct or incorrect) MUST be immediately visible to the guesser who submitted it — without waiting for the next polling interval.

#### Guess History (US3)

- **FR-011**: All submitted guesses (correct and incorrect) MUST be appended to a persistent guess history stored as part of the room state.
- **FR-012**: The guess history MUST be returned in the room state on every poll, in chronological order (oldest submission first).
- **FR-013**: The guess history MUST be visible to all participants — both the drawer and all guessers.
- **FR-014**: Correct guesses MUST be visually distinguished from incorrect guesses in the guess history display.

#### Scoring (US4)

- **FR-015**: Every participant's score MUST be initialised to 0 at the start of a round.
- **FR-016**: A correct guess MUST increase the submitting guesser's score by exactly 100 points.
- **FR-017**: An incorrect guess MUST NOT change any participant's score.
- **FR-018**: The score for each participant MUST be included in the room state returned by polling.
- **FR-019**: A guesser who has already received 100 points for a correct guess in the current round MUST NOT receive additional points for further correct submissions.

### Key Entities

- **Stroke**: A single freehand drawing action, represented as an ordered list of coordinate points. Multiple strokes together form the canvas state for the round.
- **CanvasState**: The collection of all `Stroke` objects drawn during the current round, stored on the room. Reset to empty when the drawer clears the canvas.
- **Guess**: A single submission by a guesser — contains the submitted text (after trimming), the submitting participant's identity, a timestamp, and a correct/incorrect flag.
- **GuessHistory**: The ordered list of all `Guess` entries for the current round, appended to on each submission and stored on the room.
- **Score**: An integer value (≥ 0) associated with each participant, updated when a correct guess is made, included in the poll response.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The drawer can begin drawing within one interaction (click/touch) of loading the game screen — no additional navigation or setup steps required.
- **SC-002**: A submitted guess is evaluated and the result (correct or incorrect) is visible to the submitting guesser within one screen refresh of submission — not deferred to the next poll.
- **SC-003**: A submitted guess appears in the guess history on all other participants' screens within ≤2 seconds (one polling interval) of submission.
- **SC-004**: 100% of empty or whitespace-only guess submissions are rejected with a user-visible message before any server evaluation occurs.
- **SC-005**: A correct guess reliably increments the guesser's score by exactly 100 points; repeated correct submissions by the same guesser in the same round do not award additional points.
- **SC-006**: The canvas drawing (all strokes since last clear) is visible to all participants within ≤2 seconds (one polling interval) of being drawn.

## Assumptions

- Canvas strokes are stored as structured data (ordered list of point arrays) in the room's in-memory state — no image encoding, binary serialisation, or file storage is used.
- The guess form is hidden from the drawer; only participants whose `participantId !== currentDrawerId` see it.
- Empty-guess validation is performed on the client before submission to avoid unnecessary server round trips; the server also enforces it.
- A round has no automatic end condition in this feature — round timers and drawer rotation are out of scope.
- Scores persist only in memory for the duration of the session; no historical leaderboard or cross-session persistence is required.
- Mouse-based drawing is the primary input method; touch support is a best-effort consideration, not a hard requirement.
- The existing 2-second polling interval (established in feature 002) is sufficient for canvas and guess history sync — sub-second refresh is not required.
- Canvas state is replaced wholesale on each poll (server state is authoritative); no delta or diff protocol is needed.
- The "correct guess awards points once per guesser per round" rule is enforced server-side.
