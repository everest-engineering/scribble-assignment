# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 3 (Gameplay interaction)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws and Clears the Canvas (Priority: P1)

When a round is active, the assigned drawer can draw on an interactive canvas and clear it
when needed. The drawer sees their strokes on the canvas immediately; all participants see
the same drawing update through automatic refresh.

**Why this priority**: Drawing is the core mechanic that enables guessing. Without an
interactive canvas and shared drawing state, guessers have nothing to interpret.

**Independent Test**: Start a two-player game. On the drawer tab, draw several strokes and
use clear canvas. Confirm strokes appear on the drawer screen, then disappear after clear.
On the guesser tab, confirm the same strokes and clear appear within approximately 2 seconds
without manual refresh.

**Acceptance Scenarios**:

1. **Given** an active round and a participant assigned as drawer, **When** they draw on the
   canvas, **Then** their strokes are visible on their own screen.
2. **Given** an active round and a participant assigned as drawer, **When** they activate
   clear canvas, **Then** all prior strokes are removed from the canvas on their screen.
3. **Given** an active round, **When** the drawer adds or clears strokes, **Then** all other
   participants see the updated drawing within approximately 2 seconds without manual refresh.
4. **Given** an active round, **When** a guesser views the canvas area, **Then** they cannot
   draw or clear the canvas (drawing controls are drawer-only).
5. **Given** an active round, **When** a non-drawer participant views the canvas, **Then** they
   see the current shared drawing (or an empty canvas if nothing has been drawn yet).

---

### User Story 2 - Guessers Submit Valid Guesses (Priority: P2)

Guessers can submit text guesses during an active round. Guesses are trimmed before
validation; empty or whitespace-only guesses are rejected with clear feedback. The drawer
cannot submit guesses.

**Why this priority**: Guess submission is the primary interaction for non-drawers and must
reject invalid input before it affects game state.

**Independent Test**: As a guesser, submit `"  rocket  "` (matching the deterministic secret
word with different casing), an empty guess, and a whitespace-only guess. Verify the trimmed
correct guess is accepted, empty guesses are rejected with a message, and the drawer tab has
no guess submission form.

**Acceptance Scenarios**:

1. **Given** an active round and a participant assigned as guesser, **When** they submit a
   non-empty guess after trimming, **Then** the guess is recorded in the session.
2. **Given** a guesser on the guess form, **When** they submit an empty or whitespace-only
   guess, **Then** the submission is rejected and a clear error message explains that a guess
   is required.
3. **Given** a guesser submits a guess with leading or trailing spaces, **When** the guess is
   processed, **Then** the stored and compared value is the trimmed text.
4. **Given** an active round, **When** the drawer views the game screen, **Then** they do not
   have an active guess submission control.
5. **Given** a guesser submits multiple guesses over time, **When** each is valid, **Then**
   each guess is appended to the session history in submission order.

---

### User Story 3 - Guess History Syncs to All Players (Priority: P3)

Every recorded guess appears in a shared activity history visible to all participants. The
history updates automatically so every client sees the same guess events within the polling
cadence.

**Why this priority**: Shared visibility of guesses keeps all players aligned on round
progress and supports fair, observable gameplay.

**Independent Test**: With two browser tabs (drawer and guesser), submit two guesses from the
guesser tab. Confirm both tabs show both guesses with the guesser's name within approximately
2 seconds without manual refresh.

**Acceptance Scenarios**:

1. **Given** an active round with at least one recorded guess, **When** any participant views
   the activity or guess history area, **Then** they see each guess with the submitting
   participant's name and the guess text (trimmed form).
2. **Given** a guesser submits a new valid guess, **When** other participants remain on the
   game screen, **Then** the new guess appears in their history within approximately 2 seconds
   without manual refresh.
3. **Given** multiple guesses from different participants, **When** any participant views the
   history, **Then** guesses appear in chronological submission order.
4. **Given** an active round with no guesses yet, **When** a participant views the history
   area, **Then** they see an empty or waiting state rather than stale data from a prior
   session.

---

### User Story 4 - Correct Guesses Score Points Deterministically (Priority: P4)

All participants begin the round with a score of zero. When a guesser's trimmed guess matches
the secret word case-insensitively, that participant's score increases by 100. Incorrect
guesses do not change scores. Scores are visible to all participants and stay in sync via
automatic refresh.

**Why this priority**: Scoring rewards correct guesses and must follow the lab's fixed,
deterministic rules without bonuses or randomness.

**Independent Test**: Start a game (secret word is deterministically `rocket`). From the
guesser tab, submit `"PIZZA"` (incorrect) then `"Rocket"` (correct). Verify score remains 0
after the incorrect guess, becomes 100 after the correct guess, and both tabs show the same
scoreboard within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a game has just started, **When** any participant views the scoreboard, **Then**
   every participant's score is 0.
2. **Given** an active round, **When** a guesser's trimmed guess does not match the secret
   word (case-insensitive comparison), **Then** that participant's score does not change.
3. **Given** an active round, **When** a guesser's trimmed guess matches the secret word
   (case-insensitive comparison), **Then** that participant's score increases by 100.
4. **Given** a participant has already scored 100 from a correct guess in the current round,
   **When** they submit another correct guess, **Then** their score does not increase further.
5. **Given** scores change during the round, **When** any participant views the scoreboard,
   **Then** all participants' current scores are shown and match across clients within
   approximately 2 seconds without manual refresh.

---

### Edge Cases

- What happens when the drawer tries to submit a guess? No guess submission is available to
  the drawer; the system does not accept guesses from the drawer role.
- What happens when a guess is only whitespace? Rejected before recording with a clear error
  message, same as an empty guess.
- What happens when two guessers submit at nearly the same time? Both guesses are recorded in
  submission order; history and scores reflect both after the next refresh cycle.
- What happens when polling fails during gameplay? Show a non-blocking error or status; retry
  on the next interval without clearing the last known drawing, history, or scores.
- What happens when the backend restarts mid-round? Room is lost; refresh fails with a clear
  not-found message (inherent to in-memory scope).
- What happens when a guess differs only by case from the secret word? Treated as correct
  (case-insensitive match).
- What happens when a guess differs by internal spacing from the secret word? Treated as
  incorrect unless the trimmed full string matches the secret word exactly (case-insensitive).
- What happens when clear canvas is used after guessers have submitted? Drawing is cleared;
  guess history and scores are unaffected.
- What happens when a participant navigates away from the game screen? Polling stops; returning
  to the game screen resumes refresh and shows current drawing, history, and scores.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive drawing canvas to the drawer during an
  active round.
- **FR-002**: System MUST allow only the drawer to add strokes to the canvas during an active
  round.
- **FR-003**: System MUST allow only the drawer to clear the canvas during an active round.
- **FR-004**: System MUST persist the current canvas drawing as part of room session state so
  it can be shared across participants.
- **FR-005**: System MUST synchronize canvas drawing state to all participants via automatic
  refresh at approximately 2-second intervals while they remain on the game screen.
- **FR-006**: System MUST initialize every participant's score to 0 when the game starts.
- **FR-007**: System MUST allow guessers (non-drawer participants) to submit text guesses
  during an active round.
- **FR-008**: System MUST NOT allow the drawer to submit guesses.
- **FR-009**: System MUST trim leading and trailing whitespace from guess text before
  validation and storage.
- **FR-010**: System MUST reject guess submissions when the trimmed guess is empty and show a
  clear, user-facing error message.
- **FR-011**: System MUST compare guesses to the secret word case-insensitively after trimming.
- **FR-012**: System MUST add 100 points to a guesser's score when their trimmed guess matches
  the secret word case-insensitively.
- **FR-013**: System MUST NOT change a participant's score when their guess does not match the
  secret word.
- **FR-014**: System MUST NOT award more than 100 points from correct guesses to a single
  participant within the same round.
- **FR-015**: System MUST record each accepted guess with the submitting participant's
  identity, trimmed guess text, and timestamp or sequence order.
- **FR-016**: System MUST expose the full guess history for the current round to all
  participants through shared session state.
- **FR-017**: System MUST synchronize guess history and scores to all participants via
  automatic refresh at approximately 2-second intervals while they remain on the game screen.
- **FR-018**: System MUST display current scores for all participants on the scoreboard.
- **FR-019**: System MUST display guess activity in a dedicated history or activity area on
  the game screen.
- **FR-020**: System MUST continue automatic game-screen refresh established in Scenario 2
  (approximately 2-second intervals) so drawing, guesses, and scores stay aligned across
  clients.

### Key Entities

- **Canvas Drawing**: The current set of strokes representing the drawer's artwork for the
  active round; cleared and redrawn during gameplay; shared to all participants.
- **Stroke**: A single drawable segment added by the drawer (e.g., path with coordinates);
  composes the canvas drawing.
- **Guess**: A text submission from a guesser during the active round; stored in trimmed form
  with submitter identity and order.
- **Guess History**: The ordered list of all accepted guesses for the current round, visible
  to every participant.
- **Score**: A non-negative point total per participant for the current round; starts at 0;
  increases by 100 on first correct guess per participant per round.
- **Scoreboard**: The presentation of each participant's name and current score, synchronized
  across clients.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-browser testing, 100% of drawer stroke additions and canvas clears appear
  on the guesser screen within 3 seconds without manual refresh.
- **SC-002**: 100% of empty or whitespace-only guess submissions are rejected with a clear
  error message before appearing in history.
- **SC-003**: In two-browser testing, 100% of valid guess submissions appear in both clients'
  history within 3 seconds without manual refresh.
- **SC-004**: Case-variant matches (e.g., `"Rocket"` vs secret word `rocket`) award 100 points
  in 100% of test cases.
- **SC-005**: Incorrect guesses leave the submitter's score unchanged in 100% of test cases.
- **SC-006**: At game start, every participant's scoreboard entry shows 0 in 100% of sessions.
- **SC-007**: After a correct guess, both clients display the same updated score within 3
  seconds without manual refresh.
- **SC-008**: The drawer cannot submit a guess through the game interface in 100% of test
  sessions.

## Assumptions

- Scenarios 1 and 2 are complete: room lobby, game start, host-as-drawer, deterministic secret
  word (`rocket` from the starter list), drawer-only word visibility, and game-screen polling
  are already in place.
- Canvas drawing is synchronized to all participants so guessers can watch the drawing and
  submit meaningful guesses; the README acceptance phrase "visible on the drawer's screen"
  is the minimum bar, extended by the lab's expectation that guessers observe the drawing
  before guessing.
- Round end, revealing the correct word to all players, final result display, and host restart
  are deferred to Scenario 4; gameplay continues in the `playing` state after a correct guess.
- Each participant can earn at most 100 points from correct guesses in a single round; repeat
  correct submissions from the same participant do not stack.
- The drawer does not receive points for drawing; only guessers can increase their score via
  guesses.
- Synchronization uses periodic refresh (polling), not push notifications.
- No authentication; participant identity remains session-local via the identifier from
  create/join.
- Room state is in-memory only; sessions do not survive a server restart.
- Timers, speed bonuses, drawer bonuses, and multiple rounds are out of scope.
