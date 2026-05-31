# Feature Specification: Gameplay Interaction

**Feature Branch**: `assignment-Anusha`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Uses the Canvas (Priority: P1)

During an active round, the designated drawer can freely draw strokes on a canvas
and clear it at any time. Whatever the drawer draws is immediately visible on their
own screen. The canvas is interactive only for the drawer; guessers cannot draw.

**Why this priority**: The canvas is the core game mechanic. Without a working
drawing surface the game cannot function, and all other gameplay stories depend on
there being a round in progress with a visible canvas.

**Independent Test**: With a round started, open the game screen as the drawer,
draw lines on the canvas, then clear it. Verify strokes appear immediately and the
clear button removes all strokes. Testable in a single browser tab as the drawer.

**Acceptance Scenarios**:

1. **Given** an active round and the current user is the drawer,
   **When** the drawer interacts with the canvas (draws strokes),
   **Then** the strokes appear on the drawer's screen in real time.

2. **Given** an active round and the current user is the drawer,
   **When** the drawer presses the clear button,
   **Then** all strokes are removed from the canvas immediately.

3. **Given** an active round and the current user is a guesser (not the drawer),
   **When** the guesser's game screen is displayed,
   **Then** no drawing controls are accessible to the guesser.

---

### User Story 2 — Guesser Submits a Guess (Priority: P1)

During an active round, any player who is not the drawer can type and submit a
guess. The guess is trimmed of surrounding whitespace before processing. Empty or
whitespace-only submissions are rejected immediately with an inline message; no
guess is recorded. Valid guesses are compared case-insensitively against the secret
word and added to the shared guess history.

**Why this priority**: Guessing is the other half of the core game loop. Without
validated guesses that get stored and shared, the game has no mechanism for players
to win points or for the round to progress.

**Independent Test**: With a round in progress, submit an empty guess, a whitespace
guess, an incorrect guess, and a correct guess from a guesser's browser tab. Verify
each case behaves as expected before checking the guess history.

**Acceptance Scenarios**:

1. **Given** an active round and the current user is a guesser,
   **When** the guesser submits an empty string or a whitespace-only string,
   **Then** the submission is rejected with a clear inline message and nothing is
   added to the guess history.

2. **Given** an active round and the current user is a guesser,
   **When** the guesser submits a non-empty guess (after trimming) that does not
   match the secret word (case-insensitive),
   **Then** the guess is recorded in the guess history as incorrect and the
   guesser's score remains unchanged.

3. **Given** an active round and the current user is a guesser,
   **When** the guesser submits a guess that matches the secret word after trimming
   and case-insensitive comparison (e.g., secret word is "Apple", guess is "  apple  "),
   **Then** the guess is recorded as correct and 100 points are added to that
   guesser's score.

---

### User Story 3 — Guess History Visible to All Players (Priority: P2)

All players — the drawer and all guessers — can see a running list of submitted
guesses. The list is kept up to date via client-side polling, so every player sees
new guesses within the polling interval without reloading the page. Each entry in
the history shows at minimum the guesser's name and their guess text.

**Why this priority**: Shared visibility of the guess history is what makes the
game social and legible. Without it, players cannot tell whether anyone has
guessed correctly, and the game feels broken. It is lower priority than drawing
and guessing themselves because the history is a display concern that layers on
top of the core mechanics.

**Independent Test**: With two browser tabs open (one drawer, one guesser), submit
a guess from the guesser tab and verify the guess appears in the history on both
tabs within the polling interval.

**Acceptance Scenarios**:

1. **Given** an active round with multiple players,
   **When** a guesser submits a valid guess,
   **Then** the guess appears in the guess history visible on all players' screens
   within the polling interval (no manual reload required).

2. **Given** an active round where several guesses have been submitted,
   **When** a new player's game screen loads (or any player polls for updates),
   **Then** the full guess history up to that point is displayed, including all
   prior guesses in submission order.

3. **Given** an active round,
   **When** the guess history is displayed,
   **Then** each entry shows at minimum the guesser's name and their guess text;
   correct guesses are visually distinguishable from incorrect ones.

---

### Edge Cases

- What happens if a guesser submits a guess that, after trimming, reduces to an
  empty string? It must be treated as empty and rejected (same as US2 scenario 1).
- What if two guessers submit the correct answer? Both receive 100 points; there is
  no cap on the number of correct guesses per round.
- What if the same guesser submits the correct answer more than once? Each
  submission is processed independently — repeat correct guesses each add 100
  points unless the spec is amended to restrict this.
- What if polling returns no new guesses? The guess history display is unchanged;
  no error or spinner is shown.
- What if the word list produces a secret word with mixed case? The comparison
  ignores case on both sides, so "APPLE", "apple", and "Apple" all match a guess
  of "apple".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an interactive drawing canvas that is
  accessible only to the current round's drawer.
- **FR-002**: The drawer MUST be able to draw freehand strokes on the canvas;
  strokes MUST appear on the drawer's screen immediately.
- **FR-003**: The drawer MUST be able to clear all strokes from the canvas with
  a single action (e.g., a "Clear" button).
- **FR-004**: Guesser screens MUST NOT expose drawing controls; only the drawer
  interacts with the canvas.
- **FR-005**: Guess submissions MUST be trimmed of leading and trailing whitespace
  before any validation or comparison.
- **FR-006**: Empty or whitespace-only guess submissions (after trimming) MUST be
  rejected with a clear inline error message; no guess record is created.
- **FR-007**: Valid guess submissions MUST be compared against the secret word
  using a case-insensitive exact match.
- **FR-008**: A guess that matches the secret word (after trim and case
  normalization) MUST award exactly 100 points to the submitting guesser's score.
- **FR-009**: A guess that does not match the secret word MUST award 0 points;
  the guesser's score MUST remain unchanged.
- **FR-010**: Every valid (non-empty) guess — correct or incorrect — MUST be
  appended to the round's guess history.
- **FR-011**: All players' scores MUST be initialized to 0 at the start of each
  round.
- **FR-012**: The guess history MUST be retrievable by all players via a polling
  mechanism; the client MUST periodically request the latest history without
  requiring a page reload.
- **FR-013**: The guess history response MUST include all guesses submitted up
  to the time of the request, in submission order.
- **FR-014**: Each guess history entry MUST include at minimum: the guesser's
  display name, the guess text, and whether the guess was correct.

### Key Entities

- **Round**: The active game context; holds the secret word, the designated drawer,
  a list of all players with their current scores, and the full guess history.
- **Player**: A participant identified by their display name; has a mutable score
  initialized to 0 at round start.
- **Guess**: A single submission record containing the guesser's name, the
  submitted text (trimmed), the correctness result (boolean), and the time it
  was submitted.
- **Canvas**: The drawing surface for the current round; owned by the drawer and
  cleared or modified only by them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of empty or whitespace-only guess submissions are rejected
  before reaching the guess history; no invalid guesses appear in any player's
  history view.
- **SC-002**: Correct guesses always award exactly 100 points to the guesser's
  score; incorrect guesses always award 0 points, with no exceptions.
- **SC-003**: All players see the same guess history within the configured polling
  interval (assumed ≤ 3 seconds); no player is more than one poll cycle out of date.
- **SC-004**: The drawer can draw and clear the canvas without any page reload or
  navigation, with strokes appearing immediately on their screen.
- **SC-005**: Case-insensitive guess matching works correctly for all standard
  Latin-character inputs — "APPLE", "apple", and "Apple" all match a secret word
  of "apple".

## Assumptions

- Drawing broadcast to guessers' screens (real-time canvas sync) is out of scope
  for this scenario; the spec covers only the drawer seeing their own canvas. If
  guessers need to see the drawing, that is a separate feature.
- Each guesser may submit multiple guesses per round; there is no per-player
  guess limit.
- Scores accumulate additively within a round; a player who guesses correctly
  multiple times receives 100 points per correct guess.
- The polling interval for guess history is short enough that the game feels
  responsive (assumed ≤ 3 seconds), but the exact interval is an implementation
  detail.
- The round remains active indefinitely until explicitly ended; automatic round
  termination (e.g., when all guessers are correct, or a timer expires) is out
  of scope.
- The secret word is already set and available when the round starts (provided
  by the Game Start & Drawer Flow, Scenario 2).
- The drawer's identity is already established before this scenario begins
  (provided by Scenario 2).
- No authentication beyond the player's display name is required to submit a guess.
