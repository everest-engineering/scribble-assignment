# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers
(all scores start at 0), When the drawer draws/clears the canvas and guessers submit their
guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed,
case-insensitively compared, and empty ones rejected; the guess history is synced to all
players via polling; correct guesses score 100 (incorrect add 0).

**Depends on**: Scenario 1 (room setup, polling pattern) and Scenario 2 (drawer identity,
secret word, game screen structure).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1)

The drawer uses the game screen canvas to draw freehand. They can also clear the canvas to
start over. The drawing is visible on the drawer's own screen.

**Why this priority**: Without drawing, there is nothing for guessers to guess from. The canvas
is the core interaction for the drawer role.

**Independent Test**: One tab as Alice (drawer). After game start, Alice can draw on the canvas
by clicking and dragging. The drawing appears in real time on Alice's screen. Alice can click
"Clear Canvas" and the drawing disappears.

**Acceptance Scenarios**:

1. **Given** Alice is the drawer on the game screen, **When** she clicks and drags on the
   canvas area, **Then** a freehand line is drawn following her pointer.
2. **Given** Alice has drawn on the canvas, **When** she clicks "Clear Canvas", **Then** the
   canvas is wiped clean and the drawing area is blank.
3. **Given** Alice is the drawer, **When** she views the canvas, **Then** the canvas is
   interactive (pointer events enabled) and clearly distinct from the guesser's view.
4. **Given** Bob is a guesser, **When** he views the canvas area, **Then** it remains a
   non-interactive placeholder (drawing by guessers is not supported).

---

### User Story 2 — Guesser Submits a Guess (Priority: P1)

A guesser types a word into the guess form and submits it. The guess is trimmed and compared
case-insensitively against the secret word. Empty guesses are rejected with an error message.
The submitted guess appears in the shared guess history visible to all players.

**Why this priority**: Guessing is the primary action for non-drawer players. Without it,
the game has no interaction for the majority of participants.

**Independent Test**: Two tabs — Alice (drawer) and Bob (guesser). Bob types " ROCKET " and
submits. The guess is trimmed to "ROCKET", matched case-insensitively to "rocket", and recorded
as correct. Bob's score becomes 100. The guess appears in the history on both tabs. Bob then
submits an empty guess — an error message appears and no guess is recorded.

**Acceptance Scenarios**:

1. **Given** Bob is a guesser and types " Rocket " in the guess form, **When** he submits,
   **Then** the guess is trimmed and compared case-insensitively; it is recorded as correct.
2. **Given** Bob submits a correct guess, **When** the result is processed, **Then** Bob's
   score increases by 100.
3. **Given** Bob submits an incorrect guess (e.g., "pizza"), **When** the result is processed,
   **Then** the guess is recorded as incorrect and Bob's score does not change.
4. **Given** Bob submits an empty or whitespace-only guess, **When** he attempts to submit,
   **Then** an error message is shown and no guess is recorded or sent.
5. **Given** Alice is the drawer, **When** she views the guess form, **Then** it is disabled
   and she cannot submit guesses.

---

### User Story 3 — Guess History Synced to All Players (Priority: P1)

The guess history — all guesses submitted so far, each showing the player's name, their guess
text, and whether it was correct — is visible to all players. It updates automatically via
polling so that both the drawer and guessers see new guesses within approximately 2 seconds.

**Why this priority**: Synchronised guess history is the shared state that makes the game
feel multiplayer. Without it, players have no visibility into progress.

**Independent Test**: Two tabs — Alice (drawer) and Bob (guesser). Bob submits a guess on Tab 2.
Within 3 seconds and without any manual action on Tab 1, Alice's game screen shows Bob's guess
in the history list.

**Acceptance Scenarios**:

1. **Given** Bob submits a guess, **When** Alice's next poll fires, **Then** Bob's guess
   appears in Alice's guess history within approximately 2 seconds.
2. **Given** multiple guesses have been submitted, **When** any player views the game screen,
   **Then** the full guess history is shown in submission order.
3. **Given** a player is on the game screen, **When** the polling interval fires, **Then** the
   guess history updates without the page flashing or losing other state.
4. **Given** a player navigates away from the game screen, **When** they leave, **Then** the
   game screen polling stops.

---

### User Story 4 — Scoreboard Reflects Live Scores (Priority: P2)

All players can see the current scores of all participants at all times. Scores start at 0 and
increase by 100 for each correct guess. The scoreboard updates via the same polling mechanism
as the guess history.

**Why this priority**: Scores are derived from guesses; once guess sync is working, scores
follow naturally. They are visible to all players as part of the shared game state.

**Independent Test**: Two tabs — Alice (drawer) and Bob (guesser). Initially both show 0.
Bob submits the correct word. Alice's scoreboard (on her next poll) shows Bob at 100 and
Alice at 0.

**Acceptance Scenarios**:

1. **Given** a round has started, **When** any player views the scoreboard, **Then** all
   participants are listed with their current scores (starting at 0).
2. **Given** Bob submits a correct guess, **When** the round state updates, **Then** Bob's
   score increases by 100 and Alice's remains at 0.
3. **Given** Bob submits an incorrect guess, **When** the round state updates, **Then** no
   score changes.
4. **Given** Alice is the drawer, **When** she views the scoreboard, **Then** her score is
   shown as 0 (drawers cannot guess and score no points in this round).

---

### Edge Cases

- What happens if a guesser submits the correct word after it has already been guessed
  correctly by someone else? The system records the guess as correct and awards 100 points
  regardless — there is no "already solved" blocking in this lab scope.
- What happens if a guesser submits the same word twice? Both submissions are recorded
  separately; the second correct submission also scores 100 points (no duplicate prevention).
- What happens if the guess form input contains only whitespace? The guess is rejected with
  an error message before submission; no API call is made.
- What happens if the game screen poll encounters a transient error? The error is shown inline
  and polling continues (same pattern as lobby polling in Scenario 1).
- What happens if the backend restarts during a game? The room is gone; the next poll returns
  a 404 and the player is redirected to the Start screen.

---

## Clarifications

### Session 2026-06-04

- Q: How should guess text be rendered in the history list — as plain text (HTML-escaped) or can it contain markup? → A: Plain text only — always HTML-escape guess text before display (use `textContent`).
- Q: What does the non-interactive canvas placeholder for guessers visually look like? → A: Styled container with a short text label, e.g. "Watch the drawer!".
- Q: After a rejected empty/whitespace guess, should the input field be cleared or retain the user's input? → A: Retain input value and display error message inline; do not clear the field.
- Q: When / how does the gameplay round end — is end-of-round in scope for Scenario 3? → A: Out of scope; gameplay continues indefinitely until the player navigates away.
- Q: How should correct vs. incorrect guesses be visually distinguished in the history list? → A: Colour-coded rows — green background/text for correct, red for incorrect.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The canvas MUST be interactive for the drawer — pointer events enabled for
  freehand drawing.
- **FR-002**: The canvas MUST have a "Clear Canvas" button visible only to the drawer; clicking
  it MUST wipe the canvas blank.
- **FR-003**: The canvas MUST remain a non-interactive placeholder for guessers, displayed
  as a styled container with the label "Watch the drawer!" (pointer events disabled).
- **FR-004**: The guess form MUST trim whitespace from submitted guesses before processing.
- **FR-005**: Trimmed empty guesses MUST be rejected with a user-visible error message; no
  submission is made. The input field MUST retain its value so the player can correct it.
- **FR-006**: Guess comparison MUST be case-insensitive (e.g., "ROCKET", "rocket", "Rocket"
  all match the secret word "rocket").
- **FR-007**: A correct guess MUST award 100 points to the guessing player.
- **FR-008**: An incorrect guess MUST award 0 points (score unchanged).
- **FR-009**: Every submitted guess MUST be stored on the room with the player's name, the
  guess text, and a correct/incorrect flag. In the UI, correct guesses MUST be displayed with
  a green background/text and incorrect guesses with a red background/text.
- **FR-009a**: Guess text MUST be rendered as plain text only — never interpreted as HTML
  markup — to prevent injection attacks from player-submitted content.
- **FR-010**: The guess history and scores MUST be included in the room snapshot returned
  by the existing fetch-room endpoint.
- **FR-011**: The game screen MUST poll the room snapshot at approximately 2-second intervals
  to keep guess history and scores current.
- **FR-012**: Game screen polling MUST stop when the player navigates away.
- **FR-013**: Transient poll errors on the game screen MUST be shown inline; polling MUST
  continue.
- **FR-014**: A 404 poll response on the game screen MUST redirect the player to the Start
  screen.
- **FR-015**: The drawer MUST NOT be able to submit guesses (guess form remains disabled).

### Key Entities

- **Guess**: A single guess submission. Contains the guesser's participant ID, the guesser's
  display name, the submitted text (trimmed), and a boolean indicating whether it was correct.
- **Room** (extended): Gains a `guesses: Guess[]` array and a `scores: Record<string, number>`
  map (keyed by participant ID, value is the current score). Both are initialised at game start.
- **RoomSnapshot** (extended): Includes the full `guesses` array and `scores` map so all
  players receive live state on every poll.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw freehand on the canvas and clear it, all within the
  same browser session without any page reload.
- **SC-002**: A correct guess submitted by a guesser results in a score of 100 for that
  player, visible on both tabs within 3 seconds.
- **SC-003**: An empty or whitespace-only guess is rejected with a visible error message
  before any network call is made.
- **SC-004**: A guess of "ROCKET", "rocket", or "Rocket" against the secret word "rocket"
  is all treated as correct (case-insensitive matching confirmed).
- **SC-005**: A new guess submitted by any player appears in the guess history of all
  connected game screens within 3 seconds without manual interaction.
- **SC-006**: The scoreboard reflects correct scores for all players within 3 seconds of
  a correct guess being submitted.

---

## Out of Scope

- **Round termination**: No end-of-round state or transition is implemented in Scenario 3.
  Gameplay continues indefinitely; the only exit is the player navigating away from the game
  screen (which stops polling per FR-012).

## Assumptions

- Drawing is local to the drawer's screen only. Canvas state is NOT synchronised to guessers
  (WebSockets are out of scope; polling canvas pixel data is not required by the spec).
- The `<canvas>` HTML element is introduced in this scenario to replace the placeholder div
  from Scenario 2. The drawer draws using mouse pointer events (mousedown, mousemove, mouseup).
  Touch support is out of scope.
- Guesses are appended to a `guesses` array on the `Room` object in the backend store and
  returned in every snapshot thereafter. No separate guess endpoint is needed — a single
  `POST /rooms/:code/guess` endpoint stores the guess and returns the updated snapshot.
- Scores are computed at submission time and stored in a `scores` map on `Room`, keyed by
  participant ID. The map is initialised with all participants at 0 when the game starts.
- A participant can submit multiple correct guesses; each awards 100 points independently.
  There is no cap or "already guessed" prevention in this lab scope.
- The game screen poll uses the existing `GET /rooms/:code?participantId=` endpoint. No
  new polling endpoint is needed.
- The guess form's submit button is cleared/reset after each successful submission so the
  player can submit another guess.
- The drawer identity from Scenario 2 is used to enforce FR-015 (drawer cannot guess).
