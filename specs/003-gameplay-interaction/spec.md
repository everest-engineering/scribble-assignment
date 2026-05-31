# Feature Specification: Gameplay Interaction

**Feature Branch**: `assignment`

**Created**: 2026-05-31

**Status**: Draft

## Clarifications

### Session 2026-05-31

- Q: Is the drawing canvas synced to guessers in Scenario 3? → A: No. The drawing is only visible on the drawer's own screen. Canvas sync to other players is out of scope (no WebSockets); guessers see a placeholder in Scenario 3.
- Q: Can the drawer submit guesses? → A: No. The GuessForm is only active for guessers. The drawer already knows the secret word and cannot submit a guess.
- Q: Are duplicate correct guesses (same player guessing "rocket" twice) allowed? → A: Yes — no de-duplication logic is required. Each submission is recorded as a separate entry in the guess history. Scoring logic adds 100 points per correct submission.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Guess Submission and Scoring (Priority: P1)

A guesser types a word and submits it. The system trims whitespace, compares it
case-insensitively to the secret word, and immediately records a result.
A correct guess adds 100 points to that guesser's score; an incorrect guess adds 0.
Empty or whitespace-only submissions are rejected before reaching the backend.

**Why this priority**: Guess submission and scoring are the primary interaction
mechanic for guessers. Nothing else in Scenario 3 is meaningful without this.

**Independent Test**: With a running game, submit a correct guess ("Rocket",
"ROCKET", "rocket") and an incorrect guess. Confirm the correct guess is marked
correct and 100 points are added to the guesser's score. Confirm the incorrect
guess is marked wrong with 0 points. Confirm an empty submission is blocked.

**Acceptance Scenarios**:

1. **Given** a guesser is on the Game screen, **When** they submit an empty or
   whitespace-only guess, **Then** an inline error is shown and no network
   request is made.
2. **Given** a guesser submits a guess with leading/trailing spaces, **When**
   the system processes it, **Then** the guess is trimmed before comparison.
3. **Given** a guesser submits a guess that matches the secret word regardless
   of casing (e.g. "ROCKET", "Rocket", "rocket"), **When** the system processes
   it, **Then** the guess is marked correct and 100 points are added to that
   guesser's score.
4. **Given** a guesser submits a guess that does not match the secret word,
   **When** the system processes it, **Then** the guess is marked incorrect and
   0 points are added.
5. **Given** the drawer is on the Game screen, **When** they view the guess
   area, **Then** the GuessForm is not active for them — they cannot submit
   guesses.

---

### User Story 2 — Guess History and Score Sync (Priority: P1)

All players see the same live guess history and current scores, updated
automatically via polling every 2 seconds. No manual refresh is required.
The history shows each guess, who made it, and whether it was correct.
Scores reflect all correct guesses accumulated so far.

**Why this priority**: Without synced history and scores, guessers and the
drawer cannot follow the game state. This is the shared "feed" that makes
the round feel live.

**Independent Test**: Open two tabs (drawer + guesser). Guesser submits a
correct and an incorrect guess. Within 2 seconds, confirm both tabs show the
same guess history entries and the guesser's score updated to 100.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a player views the Game screen,
   **Then** the screen automatically polls for updates every 2 seconds without
   any user action.
2. **Given** a guesser submits any guess, **When** the next poll completes,
   **Then** all players see that guess in the shared history with the guesser's
   name, the guessed text, and a correct/incorrect indicator.
3. **Given** a guesser has submitted at least one correct guess, **When** any
   player views the Scoreboard, **Then** that guesser's score reflects all
   accumulated points from correct guesses.
4. **Given** all scores start at 0, **When** a round begins and no guesses
   have been submitted, **Then** all players show 0 points on the Scoreboard.
5. **Given** the Game screen is open, **When** the polling interval fires,
   **Then** the interval is cleaned up when the player leaves the screen (no
   runaway polling).

---

### User Story 3 — Interactive Drawing Canvas (Priority: P2)

The drawer sees a canvas they can draw on freely using the mouse. They can also
clear the canvas to start over. The drawing exists only on the drawer's screen
in Scenario 3 — guessers see a placeholder instead of a live canvas.

**Why this priority**: The canvas provides the core experience for the drawer.
It is independent of guessing mechanics and can be delivered and tested
separately. Canvas sync to guessers is deferred to a future scenario.

**Independent Test**: On the drawer's tab, draw freely on the canvas using the
mouse. Confirm strokes appear while the mouse button is held. Click "Clear" and
confirm the canvas resets to blank. On the guesser's tab, confirm no canvas is
shown (placeholder only).

**Acceptance Scenarios**:

1. **Given** the drawer is on the Game screen, **When** they press and drag the
   mouse on the canvas, **Then** a continuous stroke is drawn following the
   pointer.
2. **Given** the drawer has drawn strokes on the canvas, **When** they click
   the Clear button, **Then** all strokes are removed and the canvas is blank.
3. **Given** a guesser is on the Game screen, **When** they view the canvas
   area, **Then** they see a placeholder (e.g. "Waiting for drawer…") — not
   a drawing canvas.
4. **Given** the drawer is drawing, **When** they release the mouse button,
   **Then** the stroke ends and a new stroke begins only on the next press.

---

### Edge Cases

- An empty or whitespace-only guess submitted directly to the backend MUST
  return a `400` error with a clear message — the server is the final guard.
- Case-insensitive comparison applies to the full trimmed string; partial
  matches do not count as correct.
- Scores can only increase (correct guesses add 100); there is no penalty for
  incorrect guesses and no mechanism to remove points.
- All participants start every round with 0 points; scores are scoped to the
  current room and are reset when a restart occurs (Scenario 4).
- The guess history is append-only within a round — no entries are removed or
  edited.
- The drawer cannot submit guesses; the GuessForm must be inactive for them.
- Canvas state is not persisted or synced; refreshing the drawer's page resets
  the canvas.
- Polling on the Game screen must stop when the player navigates away to
  prevent runaway intervals.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST expose an endpoint to accept a guess submission
  containing the participant's ID and their guessed text.
- **FR-002**: The backend MUST trim the submitted guess before comparison.
- **FR-003**: The backend MUST compare the trimmed guess to the secret word
  case-insensitively.
- **FR-004**: The backend MUST reject empty or whitespace-only guesses with a
  `400` error.
- **FR-005**: A correct guess MUST add exactly 100 points to the submitting
  participant's score. An incorrect guess MUST add 0 points.
- **FR-006**: Each guess MUST be recorded in the room's guess history with the
  participant's ID, name, guessed text, correctness result, and timestamp.
- **FR-007**: The room snapshot MUST include the full guess history and current
  scores for all participants so that any polling client can display them.
- **FR-008**: All participant scores MUST be initialised to 0 when the game
  starts.
- **FR-009**: The Game screen MUST poll for the room snapshot every 2 seconds
  and update the displayed history and scores automatically.
- **FR-010**: The polling interval on the Game screen MUST be cleared when the
  player navigates away.
- **FR-011**: The client MUST reject empty or whitespace-only guesses before
  making any network request, showing an inline error message.
- **FR-012**: The GuessForm MUST be inactive (not submittable) when the viewer
  is the drawer.
- **FR-013**: The drawer's Game screen MUST display an interactive canvas
  that responds to mouse press-and-drag to produce freehand strokes.
- **FR-014**: The drawer MUST be able to clear all strokes from the canvas
  via a dedicated Clear button.
- **FR-015**: Guessers' Game screens MUST NOT display a drawable canvas;
  they see a placeholder instead.

### Key Entities

- **Guess**: A single guess submission — participant identity, guessed text,
  correctness flag, and the time it was submitted.
- **Score**: The accumulated point total for a participant within the current
  round. Starts at 0; increases by 100 per correct guess.
- **Room** (extended): Now includes a list of all guesses for the current
  round and a score entry for every participant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A correct or incorrect guess appears in the shared guess history
  within one poll cycle (≤ 2 seconds) for all connected players.
- **SC-002**: The Scoreboard reflects updated points within one poll cycle
  after a correct guess is submitted.
- **SC-003**: Submitting an empty guess produces an inline error with no
  network request — verifiable via browser DevTools showing zero outgoing
  calls on empty submission.
- **SC-004**: The drawer can complete a freehand stroke and clear it without
  any page reload or error.
- **SC-005**: Both the drawer's tab and the guesser's tab show an identical
  guess history and identical scores after the next poll cycle following a
  guess submission.

## Assumptions

- The drawing canvas is local to the drawer's browser only. No canvas data
  is sent to the backend or synced to other clients in Scenario 3.
- Canvas drawing uses mouse input only (mousedown, mousemove, mouseup).
  Touch events are out of scope.
- The drawer cannot submit guesses. The GuessForm is disabled or hidden for
  the drawer role.
- Duplicate correct guesses from the same player are permitted — each is a
  separate history entry and awards another 100 points.
- Scores are room-scoped and in-memory; they are not persisted across server
  restarts.
- The existing `GuessForm`, `Scoreboard`, and `ResultPanel` component stubs
  in the codebase will be activated and wired up — not replaced.
- No new top-level npm dependencies are introduced. Canvas drawing is
  implemented with the native HTML Canvas API.
- Game screen polling is independent of lobby polling; the lobby interval is
  removed when the game starts and a new game-screen interval is started.
