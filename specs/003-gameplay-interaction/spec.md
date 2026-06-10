# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Gameplay interaction: replace the canvas placeholder div with a native HTML canvas element that supports freehand drawing via mouse events and a clear button, add POST /rooms/:code/guess endpoint that trims the guess, rejects empty guesses with 400, compares case-insensitively to the secret word, awards 100 points for a correct guess and 0 for incorrect, stores all guesses in room.guesses array, have all clients sync guess history and scores by polling GET /rooms/:code every 2 seconds, drawer sees the canvas and the secret word, guessers see the canvas and the guess input"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws on Canvas (Priority: P1)

The drawer is on the Game screen. They press and drag the mouse across the canvas to
draw a freehand line representing the secret word. The drawing appears in real time as
they move the mouse. When they wish to start over, they click the "Clear" button and the
canvas is wiped clean.

**Why this priority**: The canvas is the central drawing surface — all other gameplay
depends on it being functional. Without a working canvas, no guessing interaction is
meaningful.

**Independent Test**: Open the Game screen as the drawer. Press the mouse button on the
canvas and drag; a visible line appears. Release the mouse and press again elsewhere; a
new line starts. Click "Clear"; all lines disappear.

**Acceptance Scenarios**:

1. **Given** the drawer is on the Game screen, **When** they press and drag the mouse
   across the canvas, **Then** a freehand line is drawn along the mouse path in real
   time.
2. **Given** the drawer is drawing on the canvas, **When** they release the mouse and
   press it again elsewhere, **Then** a new independent stroke begins at the new
   position.
3. **Given** the drawer has drawn lines on the canvas, **When** they click the "Clear"
   button, **Then** all content on the canvas is erased and the canvas is blank.
4. **Given** the drawer is on the Game screen, **When** they view the canvas area,
   **Then** the canvas element is interactive (not a static placeholder div).

---

### User Story 2 - Guesser Submits a Guess (Priority: P2)

A guesser is on the Game screen viewing the canvas. They type their guess into the input
field and submit it. The system compares the guess (case-insensitively, after trimming)
to the secret word. A correct guess awards 100 points to the guesser; an incorrect guess
awards 0. The guess is recorded regardless of correctness.

**Why this priority**: Guessing is the core interaction for non-drawer players. The
scoring and storage rules are the primary game mechanics being introduced in this
feature.

**Independent Test**: In a two-tab session (drawer + guesser), the guesser submits the
correct secret word (e.g., "Rocket" with capital R). The system accepts it, records the
guess, and awards 100 points. The guesser then submits a wrong guess; 0 points are
awarded.

**Acceptance Scenarios**:

1. **Given** the game is in playing state, **When** a guesser submits a non-empty guess
   that matches the secret word case-insensitively, **Then** the system records the
   guess with 100 points and returns a success response.
2. **Given** the game is in playing state, **When** a guesser submits a non-empty guess
   that does not match the secret word, **Then** the system records the guess with 0
   points and returns a response.
3. **Given** a guesser submits a guess with only whitespace, **When** the server
   processes it, **Then** the server rejects it with a 400 error and no guess is stored.
4. **Given** a guesser submits an empty string as a guess, **When** the server processes
   it, **Then** the server rejects it with a 400 error.
5. **Given** the game is in playing state, **When** any player submits a guess, **Then**
   the guess is appended to the room's guess history regardless of correctness.

---

### User Story 3 - All Players See Guess History, Scores, and Canvas via Polling (Priority: P3)

All players (drawer and guessers) poll the room state every 2 seconds. The response
includes the full guess history, current scores, and the accumulated drawing strokes.
Guesser canvases are redrawn from the server-side stroke list on each polling cycle so
that the drawing progressively appears without WebSockets.

**Why this priority**: Polling is the synchronisation mechanism that makes the game
visible to all participants. Without it, guesses, score changes, and the drawer's
drawing are all invisible to other players.

**Independent Test**: In a two-tab session, the drawer draws a line. Within 2 seconds
the guesser's tab automatically shows the drawing on their canvas without any manual
action. The guesser then submits a guess; within 2 seconds the drawer's tab shows the
updated guess list and score.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** either player's polling cycle
   completes, **Then** the latest guess list is displayed including the new entry.
2. **Given** a correct guess awards 100 points, **When** any player's polling cycle
   completes, **Then** the updated score for the guesser is visible to all players.
3. **Given** any player is on the Game screen, **When** the polling interval elapses,
   **Then** the frontend re-fetches room state automatically (no user action required).
4. **Given** multiple guesses have been submitted, **When** any player polls the room
   state, **Then** the full ordered guess history is returned and displayed.
5. **Given** the drawer has drawn strokes on the canvas, **When** a guesser's polling
   cycle completes, **Then** the guesser's canvas is redrawn to reflect all strokes
   accumulated so far.

---

### User Story 4 - Role-Appropriate Game Screen Views (Priority: P4)

The Game screen renders different UI elements depending on the player's role. The drawer
sees the interactive canvas, the clear button, and their secret word. Guessers see the
canvas (read-only or with no drawing capability) and the guess input form. Neither role
sees UI elements intended for the other.

**Why this priority**: Correct role separation is a functional correctness requirement —
the drawer must not be able to submit guesses, and guessers must not see the secret
word.

**Independent Test**: Open two tabs. Verify the drawer tab shows the secret word and the
clear button but no guess input. Verify the guesser tab shows the guess input but no
secret word.

**Acceptance Scenarios**:

1. **Given** the logged-in player is the drawer, **When** they view the Game screen,
   **Then** they see the canvas, the "Clear" button, and the secret word; the guess
   input is not present.
2. **Given** the logged-in player is a guesser, **When** they view the Game screen,
   **Then** they see the canvas and the guess input form; the secret word is not
   displayed.

---

### Edge Cases

- What happens when a guesser submits a guess with only whitespace? → Server trims the
  guess; the trimmed result is empty, so the request is rejected with 400.
- What happens if the guess POST endpoint is called when the room is not in playing
  state? → The request is rejected with an appropriate error (room not in playing state).
- What happens if the room code does not exist in the guess endpoint? → Rejected with a
  "room not found" error.
- What happens if the drawer submits a guess? → Assumption: the drawer has no guess
  input visible, so this should not occur via the UI; server-side behaviour for this
  edge case is not specified (out of scope).
- Can a guesser submit multiple guesses? → Yes; all guesses are stored and each is
  scored independently.
- Does clicking "Clear" also clear the server-side stroke list? → Yes; the "Clear"
  action MUST also reset the server-side strokes for the room so that guessers'
  canvases are cleared on their next polling cycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The canvas placeholder div on the Game screen MUST be replaced with a
  native HTML canvas element.
- **FR-002**: The canvas MUST support freehand drawing via mouse press-and-drag; a new
  stroke begins on each mousedown event.
- **FR-003**: A "Clear" button MUST be present on the Game screen for the drawer; when
  clicked, it MUST erase all content on the drawer's canvas AND reset the server-side
  stroke list for the room so guessers' canvases clear on their next polling cycle.
- **FR-004**: The system MUST expose a POST `/rooms/:code/guess` endpoint.
- **FR-005**: The guess endpoint MUST trim the submitted guess before any further
  processing.
- **FR-006**: The guess endpoint MUST reject a trimmed empty guess with a 400 HTTP
  status and a descriptive error message.
- **FR-007**: The guess endpoint MUST compare the trimmed guess to the secret word in a
  case-insensitive manner.
- **FR-008**: A correct guess (case-insensitive match) MUST award 100 points to the
  submitting player.
- **FR-009**: An incorrect guess MUST award 0 points to the submitting player.
- **FR-010**: Every accepted guess MUST be appended to the room's `guesses` array,
  regardless of correctness.
- **FR-011**: The existing GET `/rooms/:code` endpoint MUST return the `guesses` array,
  player scores, and the accumulated drawing strokes as part of the room snapshot.
- **FR-012**: All clients MUST poll GET `/rooms/:code` every 2 seconds to synchronise
  guess history, scores, and canvas drawing state.
- **FR-015**: The server MUST store all drawing strokes produced by the drawer in the
  room object so they can be returned via GET `/rooms/:code`.
- **FR-016**: On each polling cycle, guesser clients MUST clear and redraw the canvas
  from the full stroke list returned by the server.
- **FR-013**: The Game screen for the drawer MUST display the secret word and the canvas
  with the clear button; the guess input MUST NOT be shown to the drawer.
- **FR-014**: The Game screen for guessers MUST display the canvas and the guess input
  form; the secret word MUST NOT be shown to guessers.

### Key Entities

- **Room**: Existing entity extended with a `guesses` array (ordered list of all
  submitted guesses) and a scores map (player name → cumulative points).
- **Guess**: A single guess submission. Has the guesser's player name, the submitted
  text (trimmed), a boolean indicating correctness, and the points awarded (100 or 0).
- **Drawing Stroke**: A single continuous mouse-drag path recorded by the drawer.
  Stored server-side as an ordered list of point coordinates (x, y pairs) per stroke.
  Returned by GET `/rooms/:code` so all clients can reproduce the drawing.
- **Canvas State**: The visual rendering of all accumulated strokes on the HTML canvas
  element. Persisted server-side as a stroke list; re-rendered client-side on each
  polling cycle for guessers and immediately for the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of non-empty, trimmed guesses are stored in the room's guess history
  and scored correctly (100 for match, 0 for no match).
- **SC-002**: 100% of empty or whitespace-only guess submissions are rejected with a 400
  error; no such guess is stored.
- **SC-003**: Guess history, scores, and canvas drawing are visible to all players
  within one 2-second polling cycle after the respective action occurs.
- **SC-004**: Freehand drawing on the canvas produces a visible stroke along the full
  mouse path with no missing segments.
- **SC-005**: The "Clear" button erases the canvas completely in a single action with no
  residual content.
- **SC-006**: The drawer view always shows the secret word; the guesser view never does —
  verified across all two-player and three-player test scenarios with zero exceptions.

## Assumptions

- Player identity for guess attribution is determined by the player name stored
  client-side (consistent with prior features); no session tokens or authentication are
  required.
- The `scores` map is stored server-side in the in-memory room object; cumulative points
  are the sum of all correct guesses by a player in the current game session.
- The drawer cannot submit guesses; the UI enforces this by not rendering a guess input
  for the drawer. No server-side guard against drawer guessing is required unless the
  plan phase identifies it as necessary.
- Canvas drawing is synchronised to guessers via the 2-second polling cycle; the
  server stores all strokes and returns them in GET `/rooms/:code`. Guessers see the
  accumulated drawing updated every 2 seconds. Real-time sub-second sync via WebSockets
  is out of scope.
- The polling interval of 2 seconds is consistent with prior features (lobby polling)
  and does not change.
- No new top-level npm dependencies are introduced for canvas drawing; the native HTML
  Canvas API is sufficient.
- A room must be in "playing" state for guesses to be accepted; the guess endpoint
  enforces this.

## Clarifications

### Session 2026-06-10

- Q: Should guessers see the drawer's canvas updating, and if so how? → A: Canvas drawing is synchronised to guessers via the existing 2-second polling cycle; server stores all strokes, GET `/rooms/:code` returns them, guesser clients clear and redraw the canvas on each poll.
