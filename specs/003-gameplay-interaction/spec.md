# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-05

**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — Drawing Canvas (Priority: P1)

The drawer uses a mouse to draw on a shared canvas. Their strokes are visible to all
players via polling. The drawing updates on other screens within approximately 2 seconds.

**Why this priority**: Without a visible canvas, the game has nothing for guessers to
guess from. This is the central mechanic of the Scribble game.

**Independent Test**: Start a game. In the drawer's tab, draw several strokes on the
canvas. Within 2 seconds, the guesser's tab shows the same drawing.

**Acceptance Scenarios**:

1. **Given** the game is active and the player is the drawer, **When** they click and
   drag on the canvas, **Then** strokes appear on their canvas immediately.

2. **Given** the drawer has drawn strokes, **When** the guesser's view polls the game
   state, **Then** the guesser's canvas displays the same drawing within approximately
   2 seconds.

3. **Given** the game is active and the player is a guesser, **When** they view the
   canvas, **Then** they cannot draw on it (the canvas is view-only for guessers).

---

### User Story 2 — Clear Canvas (Priority: P1)

The drawer can clear the canvas at any time during a round. The cleared state propagates
to all players on the next poll.

**Why this priority**: Clear is a basic drawing tool that pairs with US1. Without it,
the drawer has no way to correct mistakes.

**Independent Test**: Drawer draws something, then clicks Clear Canvas. Within 2 seconds,
the guesser's tab shows a blank canvas.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn strokes on the canvas, **When** they click Clear
   Canvas, **Then** the canvas becomes blank on their screen immediately.

2. **Given** the drawer has cleared the canvas, **When** the guesser's view polls,
   **Then** the guesser also sees a blank canvas within approximately 2 seconds.

3. **Given** the player is a guesser, **When** they view the game screen, **Then** they
   do not see a Clear Canvas button.

---

### User Story 3 — Guess Submission and Validation (Priority: P1)

Guessers type and submit guesses via the guess form. Guesses are trimmed and
case-insensitively matched against the secret word. Empty or whitespace-only guesses are
rejected with a visible message and never stored.

**Why this priority**: Guess submission is the core action for guessers. Without it,
there is nothing to score or sync.

**Independent Test**: As a guesser, submit "  ROCKET  " — confirm it is accepted and
matched as correct. Submit a blank guess — confirm it is rejected with an error message
and does not appear in the history.

**Acceptance Scenarios**:

1. **Given** the game is active and the player is a guesser, **When** they submit a
   non-empty guess, **Then** the guess is trimmed, recorded, and appears in the guess
   history.

2. **Given** a guesser submits a guess matching the secret word in any case (e.g.
   "ROCKET", "rocket", "Rocket"), **When** the guess is evaluated, **Then** it is
   recorded as correct.

3. **Given** a guesser submits a guess that does not match the secret word, **When** the
   guess is evaluated, **Then** it is recorded as incorrect.

4. **Given** a guesser submits an empty or whitespace-only guess, **When** they click
   Submit, **Then** the system rejects the guess with a visible error message and does
   not add it to the history.

5. **Given** the player is the drawer, **When** they view the game screen, **Then** the
   guess input is not shown or is non-interactive (drawers do not guess).

---

### User Story 4 — Guess History Sync (Priority: P1)

All players see the same guess history in submission order. The history updates via
polling at the same ~2-second cadence already used for the canvas.

**Why this priority**: Players need to see each other's guesses to understand the game
state and avoid re-submitting already-tried words.

**Independent Test**: Guesser submits three guesses in quick succession. Within 2 seconds,
both the drawer's tab and the guesser's tab show all three guesses in the same order.

**Acceptance Scenarios**:

1. **Given** multiple guesses have been submitted, **When** any player polls the game
   state, **Then** they see all guesses in submission order (oldest first).

2. **Given** a guesser submits a guess, **When** the drawer's view next polls, **Then**
   the drawer also sees the new guess in the history.

3. **Given** a guess was marked correct, **When** it appears in the history, **Then** it
   is visually distinguished from incorrect guesses (e.g. a label or colour).

---

### User Story 5 — Scoring (Priority: P1)

All scores start at 0 when the game begins. A correct guess awards the guesser 100
points. An incorrect guess awards 0 points. Scores accumulate and are visible to all
players on the scoreboard.

**Why this priority**: Scoring is the feedback mechanism that makes guesses meaningful.
It must be in place before Scenario 4's result screen can display final scores.

**Independent Test**: Start a game with both scores at 0. Guesser submits an incorrect
guess — score stays 0. Guesser submits "rocket" — score becomes 100. Both tabs show the
updated score.

**Acceptance Scenarios**:

1. **Given** the game has just started, **When** any player views the scoreboard, **Then**
   all player scores are 0.

2. **Given** a guesser submits a correct guess, **When** the round state is polled, **Then**
   that guesser's score increases by exactly 100.

3. **Given** a guesser submits an incorrect guess, **When** the round state is polled,
   **Then** that guesser's score does not change.

4. **Given** scores have changed, **When** any player polls the game state, **Then** the
   scoreboard shows the same current scores for all players.

---

### Edge Cases

- A guesser submits a guess after another guesser has already submitted the correct word —
  the second correct guess is still recorded as correct and still scores 100; there is no
  "already guessed correctly" protection in scope.
- Guesses are case-insensitive and trimmed: "  ROCKET  " equals "rocket".
- The drawer submits a guess (e.g., via direct API call) — the backend must only accept
  guesses from participants who are not the drawer.
- Canvas clear immediately after drawing: all strokes are replaced with an empty canvas;
  no individual stroke undo is required.
- A guesser submits a guess that is just whitespace after trimming — treated as empty;
  rejected with a message.
- The scoreboard reflects the latest polled state; there may be up to ~2 seconds of
  latency before an updated score appears.

---

## Requirements

### Functional Requirements

- **FR-001**: The canvas MUST accept mouse click-and-drag input from the drawer and
  render strokes in real time on the drawer's screen.
- **FR-002**: The canvas state MUST be stored on the server and returned in the room
  snapshot so all players see the same drawing via polling.
- **FR-003**: The canvas MUST be view-only for guessers; only the drawer can draw.
- **FR-004**: The drawer MUST be able to clear the canvas; the cleared state MUST
  propagate to all players via polling.
- **FR-005**: The Clear Canvas button MUST be visible only to the drawer.
- **FR-006**: Guess submissions MUST be trimmed of leading/trailing whitespace before
  evaluation and storage.
- **FR-007**: Guess comparison against the secret word MUST be case-insensitive.
- **FR-008**: Empty or whitespace-only guesses MUST be rejected with a visible error
  message and MUST NOT be stored.
- **FR-009**: The drawer MUST NOT be able to submit guesses.
- **FR-010**: Correct guesses MUST add exactly 100 points to the guesser's score.
- **FR-011**: Incorrect guesses MUST add 0 points to the guesser's score.
- **FR-012**: All player scores MUST be 0 at the start of a game.
- **FR-013**: The guess history MUST be stored on the server in submission order and
  returned to all players in the room snapshot.
- **FR-014**: Correct guesses in the guess history MUST be visually distinguished from
  incorrect ones.
- **FR-015**: The game screen MUST poll the server at approximately 2-second intervals
  to keep the canvas, guess history, and scores in sync for all players.

### Key Entities

- **Room** (extended): Adds `canvasStrokes: Stroke[]` (the serialised drawing),
  `guesses: Guess[]` (ordered submission history), and `scores: Record<participantId, number>`.
- **Stroke**: A single drawn line — series of `{x, y}` points from mouse-down to mouse-up.
- **Guess**: The submitting participant's id, trimmed text, whether it was correct,
  and a submission timestamp.
- **Scores**: A map of participant id → integer score, initialised to 0 for all
  participants on game start.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The drawer's strokes appear on all other players' screens within 3 seconds
  of being drawn, without any manual action.
- **SC-002**: 100% of blank/whitespace guess submissions are rejected with a visible
  error message and do not appear in the history.
- **SC-003**: A correct guess always adds exactly 100 points to the guesser's score;
  an incorrect guess always adds 0.
- **SC-004**: All players see the same guess history in the same order within 3 seconds
  of a guess being submitted.
- **SC-005**: 100% of the acceptance scenarios in this spec pass when tested manually
  with two browser tabs.

---

## Assumptions

- Scenarios 1 and 2 are fully implemented: room creation, lobby, start game, drawer
  assignment, and word visibility are all working.
- Canvas state is serialised as an array of strokes (each stroke is an ordered array of
  `{x, y}` points). The entire stroke array is stored on the server and sent to clients
  in each poll response.
- The polling interval for the game screen is the same ~2 seconds used in the lobby.
- A new `POST /rooms/:code/stroke` endpoint (or equivalent mutation) is used to persist
  canvas strokes to the server; a `POST /rooms/:code/clear` endpoint clears all strokes.
  Alternatively, strokes may be submitted inline with guesses via a single update endpoint
  — the exact API shape is a planning decision.
- Scores are stored as a plain map of participantId → number on the Room, initialised
  during `startRoom()`.
- The drawer cannot submit guesses — this is enforced on the backend.
- There is no timer, no round end trigger, and no "all guessers have guessed" detection
  in scope for Scenario 3; end-of-round handling belongs to Scenario 4.
- Multiple rounds and drawer rotation are out of scope.
