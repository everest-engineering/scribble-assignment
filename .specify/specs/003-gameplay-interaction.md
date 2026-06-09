# Feature Specification: Gameplay Interaction

**Feature Group**: 003 — Gameplay Interaction
**Created**: 2026-06-09
**Status**: Draft
**Input**: Business Scenario 3 — Gameplay Interaction

---

## Problem Statement

Feature Group 2 (Game Start & Drawer Flow) established drawer assignment, secret
word selection, and conditional word hiding. When a round is active, the drawer
sees a secret word and guessers know who is drawing. However, the drawer has no
functional canvas to draw on, guessers cannot submit guesses, the backend has no
guess-validation or scoring logic, and there is no mechanism to synchronize guess
history or scores across participants.

This feature group implements the core gameplay loop: the drawer draws and clears
a canvas, guessers submit guesses that are validated and compared against the
secret word, correct guesses award 100 points, and all participants see the
guess history and scores via polling.

---

## User Story

### User Story — Gameplay Interaction (Priority: P1)

A round is in progress. The drawer draws on a canvas and can clear it to redraw.
Each guesser submits guesses. Empty guesses are rejected. Each guess is trimmed
and compared case-insensitively to the secret word. Correct guesses award 100
points; incorrect guesses award 0. The guess history and updated scores are
visible to all participants through automatic polling.

**Why this priority**: P1 — The core gameplay loop (drawing, guessing, scoring)
is the central interaction of the application. Without it, the game has no
functional play. Every participant's primary activity happens in this feature
group.

**Independent Test**: Two browser tabs: host (drawer) starts a game. The drawer
can draw visible marks on the canvas and clear them. The guesser submits a
guess matching the secret word and receives 100 points. Both tabs show the
guess in the guess history within approximately 2 seconds.

---

## Functional Requirements

### FR-001: Canvas Drawing
The system MUST provide a canvas input surface. When the drawer interacts with
the canvas (e.g., by clicking and dragging), marks MUST appear on the drawer's
screen in real time.

### FR-002: Canvas Clearing
The system MUST provide a clear action. When the drawer triggers the clear
action, all marks on the canvas MUST be removed from the drawer's screen.

### FR-003: Guess Submission
The system MUST allow guessers to submit text guesses during the playing state.
The drawer MUST NOT be able to submit guesses.

### FR-004: Guess Validation
The system MUST reject empty guesses and whitespace-only guesses with a clear
error message. Non-empty guesses MUST be accepted for scoring.

### FR-005: Guess Trimming
The system MUST trim leading and trailing whitespace from every submitted guess
before comparison and storage.

### FR-006: Case-Insensitive Comparison
The system MUST compare each guess against the secret word using a
case-insensitive equality check after trimming.

### FR-007: Guess History
The system MUST maintain an ordered history of all guesses submitted during the
playing state. The guess history MUST be available in the room snapshot returned
by all room-scoped API calls.

### FR-008: Scoring
The system MUST award 100 points to a guesser for each correct guess. The system
MUST award 0 points for each incorrect guess. Scores MUST be tracked per
participant and included in the room snapshot.

### FR-009: Score Initialization
When the game transitions to the playing state, all participants MUST have a
score of 0.

---

## Acceptance Criteria

The following criteria use the EARS (Easy Approach to Requirements Syntax)
notation where applicable.

### Canvas Drawing and Clearing

- **AC-001 (Response)**: When the drawer clicks and drags on the canvas during
  the playing state, visible marks shall appear on the drawer's display in
  response to the input.
- **AC-002 (Response)**: When the drawer triggers a clear action during the
  playing state, all marks on the canvas shall be removed from the drawer's
  display.

### Guess Submission

- **AC-003 (Response)**: When a guesser submits a non-empty guess during the
  playing state, the system shall accept the guess, compare it against the
  secret word, record the result, and return the updated guess history.
- **AC-004 (Response)**: When a guesser submits an empty guess (empty string
  or whitespace only) during the playing state, the system shall reject the
  guess with a clear error message and shall not record or score it.
- **AC-005 (Response)**: When the drawer attempts to submit a guess during the
  playing state, the system shall reject the submission with a clear error
  message stating that only guessers can submit guesses.

### Guess Validation and Comparison

- **AC-006 (Universal)**: Every guess shall be trimmed of leading and trailing
  whitespace before it is compared or stored.
- **AC-007 (Universal)**: The comparison between a guess and the secret word
  shall be case-insensitive. A guess matching the secret word in any casing
  after trimming shall be considered correct.

### Scoring

- **AC-008 (Response)**: When a guesser submits a correct guess, the guesser's
  score shall increase by exactly 100 points.
- **AC-009 (Response)**: When a guesser submits an incorrect guess, the
  guesser's score shall remain unchanged (0 points awarded for that guess).
- **AC-010 (State)**: At the start of the playing state, every participant
  shall have a score of 0.

### Guess History Synchronization

- **AC-011 (State)**: While the game is in the playing state, the room snapshot
  returned by all room-scoped API calls shall include the full ordered history
  of guesses submitted so far.
- **AC-012 (State)**: Each entry in the guess history shall include the guess
  text, the guesser's participant ID, whether the guess was correct, and a
  timestamp.
- **AC-013 (Response)**: When a new guess is submitted, subsequent polling
  requests by any participant shall return the updated guess history within
  approximately 2 seconds.

### Polling Continuity

- **AC-014 (State)**: While the game page is displayed, the system shall
  continue to poll the room state at approximately 2-second intervals to
  reflect new guesses and updated scores.

---

## Edge Cases

- **Multiple correct guesses by the same guesser**: A guesser who submits the
  correct word multiple times receives 100 points each time. The scenario
  awards 100 per correct guess without limiting repetition.
- **Case-insensitive matching**: Guesses in any casing ("ROCKET", "Rocket",
  "rocket") are accepted as correct. Mixed casing, uppercase, and lowercase
  are treated identically.
- **Whitespace in guesses**: Leading and trailing whitespace is trimmed. A
  guess consisting only of whitespace after trimming is rejected as empty.
  Internal whitespace (e.g., "pizza pie" when the word is "pizza") is not
  trimmed — the guess is compared as-is after outer trimming.
- **Drawer attempting to guess**: The system rejects the submission with a
  clear message. The drawer's role is to draw, not to guess their own word.
- **Guesser submits after game transitions to lobby (e.g., via exit)**: The
  guess endpoint returns an error since the room is no longer in the playing
  state. The guess is not recorded.
- **Network error during guess submission**: The guesser sees an error message.
  The failed guess is not recorded. The guesser can retry.
- **Participant joins mid-round**: The participant sees the full guess history
  and current scores on the first poll response. Their own score starts at 0.
- **Canvas cleared and redrawn**: The drawer may clear and redraw multiple
  times during a round. Each clear removes all marks. Canvas state is local to
  the drawer's browser.

---

## Non-Goals

The following are explicitly NOT in scope for this feature group:

- Real-time canvas synchronization between drawer and guessers (no WebSockets;
  canvas state is local to the drawer)
- Drawing tools beyond basic marks (colors, brush sizes, eraser, shapes, text)
- Winner determination or game-over detection
- Round end, round transition, or round results
- Multiple rounds or drawer rotation
- Round timers or countdowns
- Speed bonuses or partial scoring
- Drawer bonuses
- Custom word packs or word list editing
- Chat or messaging beyond structured guess submission
- Spectator mode
- Disconnect detection or reconnection logic
- Canvas persistence across page reloads

---

## Success Criteria

| ID | Criterion | Verification Method |
|---|---|---|
| SC-001 | The drawer draws visible marks on the canvas and clears them successfully | Manual test: drawer can draw and clear |
| SC-002 | A guesser submits the correct secret word and receives 100 points; the score is visible to both tabs within ~3s | Manual test with two browser tabs |
| SC-003 | A guesser submits an incorrect guess, receives 0 points, and the guess appears in the history as incorrect | Manual test with two browser tabs |
| SC-004 | An empty or whitespace-only guess is rejected with a clear error message | Manual test: submit empty string |
| SC-005 | The drawer cannot submit a guess and receives a clear error message | Manual test: drawer submits guess |
| SC-006 | Guess history is consistent across both tabs; new guesses appear within ~3s via polling | Manual test with two browser tabs |
| SC-007 | Existing FG1 and FG2 unit tests continue to pass | Run `npm test` in backend and frontend directories |
| SC-008 | Room isolation is maintained: guesses and scores from one room are not visible in another room | Manual test with two separate rooms |

---

## Key Entities

- **Canvas**: A drawable surface visible to the drawer. Supports freehand
  drawing and clearing. Canvas state is local to the drawer's browser and is
  not synchronized to other participants.
- **Guess**: A text submission from a guesser, compared against the secret
  word. Contains the guess text, guesser participant ID, correctness flag, and
  timestamp.
- **Score**: A per-participant integer point total. Initialized to 0 at game
  start. Incremented by 100 for each correct guess.
- **Guess History**: An ordered list of all guesses submitted during the
  current playing state. Synchronized to all participants via polling.
  Included in every room snapshot.

---

## Assumptions

1. **Canvas is local to the drawer.** Canvas state is maintained in the
   browser and is not stored or transmitted by the backend. Only the drawer
   sees drawing marks in real time.
2. **Drawing tool is minimal.** The canvas supports freehand drawing via click
   and drag. No color picker, brush size selector, or shape tools are
   required. A single dark stroke color on a white background is sufficient.
3. **Guess comparison is exact after trimming and case folding.** The
   trimmed guess is lowercased and compared with `===` to the lowercased
   secret word. No fuzzy matching, partial matching, or synonym matching.
4. **Scores are cumulative.** A guesser's score is the sum of all points
   earned from correct guesses. Scores persist for the duration of the
   playing state.
5. **Polling continues from FG1/FG2.** The same polling mechanism (2-second
   interval, in-flight guard, error resilience) is used to synchronize guess
   history and scores.
6. **`Participant` gains a `score` field.** The existing `Participant`
   interface is extended with `score: number`, initialized to 0 at game start
   and incremented on correct guesses.
7. **A new `Guess` type is introduced** to represent each submission. The
   `Room` gains a `guesses` array, and the `RoomSnapshot` includes a
   `guesses` array of guess entries.
8. **Only the backend validates correctness.** The frontend submits the raw
   guess text; the backend trims, lowercases, compares, scores, and stores
   the result. The frontend displays the result returned by the backend.
