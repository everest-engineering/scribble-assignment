# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction. Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## Clarifications

### Session 2026-06-02

- Q: When a single participant submits the correct word multiple times in the same round, how should their score behave? → A: Capped — the first correct guess from a given participant adds 100; subsequent correct guesses from that same participant are recorded in the history but add 0 to the score.
- Q: How should the synced guess history present correct guesses to viewers who are not the original guesser? → A: Server-side redact the text of correct guesses to a placeholder (e.g., `"<correct guess>"`) for everyone except the original guesser and the drawer; the original guesser and the drawer still see the actual text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guessers submit guesses; scoring is server-authoritative (Priority: P1)

A non-drawer participant types a guess and submits it. The system trims it,
compares it case-insensitively against the round's secret word, rejects
empty/whitespace-only inputs, accepts everything else into a round-scoped
history, and adjusts the submitting participant's score: +100 if correct, +0
if not. The drawer cannot submit guesses.

**Why this priority**: This is the core game-logic deliverable for Scenario 3.
Without it, no scoring happens, history is empty, and the round has no
meaningful interaction. US2 (synced display) and US3 (drawer canvas) only add
value on top of US1.

**Independent Test**: With two browser tabs already on the game view from
Scenario 2 (host Alice as drawer in Tab A; Bob as guesser in Tab B), use Tab B
to: (a) submit `""` → rejected with a visible message; no history entry
created; (b) submit `"   "` → rejected; (c) submit the correct word in mixed
case (e.g., `"RoCkEt"` if the room's secret word is `rocket`) → accepted; the
history records Bob's guess as correct; Bob's score becomes 100; (d) submit
`"pizza"` → accepted; the history records it as incorrect; Bob's score is
still 100. From Tab A (the drawer), confirm that submitting any guess is
either prevented in the UI or rejected by the server with a visible message —
no history entry is created from the drawer's submission.

**Acceptance Scenarios**:

1. **Given** the round is active with `secretWord: "rocket"`, **When** Bob
   submits `"rocket"`, **Then** the history records a correct entry from Bob
   and Bob's score becomes 100.
2. **Given** the same state, **When** Bob submits `"  ROCKET  "`, **Then** the
   guess is accepted, the recorded text is `"ROCKET"` (trimmed; original
   casing preserved in the record), the verdict is correct, and Bob's score
   gains another 100.
3. **Given** the same state, **When** Bob submits `"pizza"`, **Then** the
   guess is accepted, recorded as incorrect, and Bob's score is unchanged.
4. **Given** the same state, **When** Bob submits `""`, **Then** the form
   shows a visible "Enter a guess" style message, no history entry is added,
   and Bob's score is unchanged.
5. **Given** the same state, **When** Bob submits `"   "`, **Then** the result
   is identical to scenario 4 (the guess becomes empty after trim).
6. **Given** the same state, **When** Alice (the drawer) attempts to submit a
   guess, **Then** the submission is blocked (either no submit control is
   presented, or the server returns a visible rejection); no history entry is
   added.
7. **Given** the room has not yet transitioned to `playing` (no active round),
   **When** any participant submits a guess, **Then** the submission is
   rejected with a visible message; no history entry is added.

---

### User Story 2 - Guess history and scoreboard sync to all participants via polling (Priority: P2)

Every participant — drawer included — sees the same guess history and the
same current scoreboard, updated automatically within roughly two seconds of
any change, without anyone clicking refresh.

**Why this priority**: Without sync, the gameplay loop is invisible to
players other than the submitter. US1 establishes the data; US2 makes it
observable.

**Independent Test**: With three browser tabs on the game view (Alice drawer
in Tab A; Bob guesser in Tab B; Carol guesser in Tab C), have Bob submit a
correct guess in Tab B. Within ~3 seconds, **both** Tab A and Tab C show
Bob's guess in the history (with a "correct" marker) and Bob's score updated
to 100 in the scoreboard. None of the other tabs were touched. Repeat with an
incorrect guess from Carol and confirm the same behavior.

**Acceptance Scenarios**:

1. **Given** Tabs A, B, C are on the game view of the same room with
   `secretWord: "rocket"`, **When** Bob submits `"rocket"` in Tab B, **Then**
   within ~3 seconds Tabs A, B, and C all show Bob's correct guess in their
   history list and Bob's score = 100 in their scoreboard.
2. **Given** the same setup, **When** Carol then submits `"banana"` in Tab C,
   **Then** within ~3 seconds all three tabs show Bob's correct guess AND
   Carol's incorrect guess in submission order, and the scoreboard shows
   Bob = 100, Carol = 0.
3. **Given** a participant leaves the game view (navigates away, exits, or
   closes the tab), **When** time passes, **Then** no further game-view
   polling requests are issued by that viewer.

---

### User Story 3 - Drawer draws on a local canvas with a clear control (Priority: P3)

The drawer can make freehand marks inside a canvas region of their game view
and can clear the entire canvas with a single visible control. The drawn
content lives only in the drawer's own client; it is not shared with
guessers.

**Why this priority**: This is the most isolated piece of the scenario.
Drawing produces no server state, so it cannot affect the data path that US1
and US2 rely on. It can be added or polished last without blocking the rest.

**Independent Test**: With the host as drawer in Tab A, click and drag inside
the canvas region — visible strokes appear on Tab A. Click the Clear button —
the canvas becomes blank on Tab A. From Tab B (guesser), confirm at no point
do strokes or clear actions appear in Tab B; the guesser-side game view shows
no canvas content from the drawer.

**Acceptance Scenarios**:

1. **Given** the drawer's game view is showing, **When** the drawer presses
   the mouse button down inside the canvas region, drags across, and
   releases, **Then** a visible freehand stroke appears on the drawer's
   canvas in the path of the drag.
2. **Given** the drawer has drawn one or more strokes, **When** the drawer
   clicks the Clear control, **Then** within 1 second the canvas is empty
   again on the drawer's view.
3. **Given** a non-drawer is on the same room's game view, **When** the
   drawer draws or clears strokes, **Then** the non-drawer's view shows no
   strokes from the drawer at any point (the drawing is not synchronized).

---

### Edge Cases

- Correct guess submitted by Bob → all viewers see Bob's entry with a
  "correct" marker, but only Bob and the drawer see the literal text;
  every other viewer sees a fixed placeholder in place of the guess text.
- Empty guess (`""`) submitted → rejected with a visible message; no history
  entry.
- Whitespace-only guess (`"   "`) submitted → rejected (trim → empty); no
  history entry.
- Guess with surrounding whitespace (`"  rocket  "`) → trimmed; recorded as
  `"rocket"` (or the user's original casing minus the outer whitespace);
  comparison against the secret word is case-insensitive.
- Guess with internal whitespace (`"rock et"`) → preserved as `"rock et"`;
  does NOT match `"rocket"`; recorded as incorrect.
- Drawer attempts to submit a guess via UI or via a direct request → rejected
  with a visible message; no history entry.
- Guess submitted while `room.status === "lobby"` (round not started) →
  rejected; no history entry.
- Same participant submits the correct word twice → both entries land in the
  history; the participant's score gains 100 on the first correct entry and
  0 on the second (capped at one-correct-per-participant per round).
- Two participants submit simultaneously → both entries land in the history
  in the server's arrival order; both scores are updated independently.
- Polling fails transiently (network drop) → UI does not crash; next
  successful poll re-syncs the history and scoreboard.
- Backend process restarts during the round → room is wiped (existing
  behavior); clients see a "Room not found" style message on their next poll.
- Drawer's tab refreshes mid-round → identity is reclaimed from
  `localStorage` (Scenario 1 Q1); canvas content is reset (drawer-local; no
  persistence). Server-side guess history and scoreboard are unaffected.
- A correct guess does NOT end the round in this scenario; the round
  continues to accept guesses indefinitely until Scenario 4 introduces an end
  trigger.
- A guess submitted during a brief race between Start and the first poll
  (room is `playing` but the client still thinks it's `lobby`) → accepted by
  the server because the server's authoritative state is `playing`; the
  client's UI reconciles on its next poll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept guess submissions only when the room is in
  the `playing` state AND the submitter is NOT the current round's drawer.
- **FR-002**: System MUST trim leading and trailing whitespace from every
  submitted guess before processing.
- **FR-003**: System MUST reject empty or whitespace-only guesses (after
  trim) with a visible user-facing message; no history entry MUST be added.
- **FR-004**: System MUST compare the trimmed guess against the round's
  secret word case-insensitively. Equality (regardless of letter casing)
  MUST be recorded as correct; any other value MUST be recorded as incorrect.
- **FR-005**: Each accepted guess MUST adjust the submitting participant's
  score as follows: a correct guess adds 100 ONLY if this is the first
  correct guess from that participant in the current round; subsequent
  correct guesses from the same participant in the same round MUST be
  recorded in the history but MUST add 0. An incorrect guess MUST add 0.
- **FR-006**: System MUST maintain a round-scoped, ordered history of every
  accepted guess. The history MUST be visible to every participant
  (drawer included).
- **FR-007**: Each history entry MUST identify the guesser, the correctness
  verdict, and the submission order. The guess text included in the entry
  is the trimmed text the participant submitted, but the value delivered to
  any given viewer MAY be redacted per FR-016 before it reaches that
  viewer's client.
- **FR-008**: All connected participants MUST observe new history entries
  and updated scores within approximately 2 seconds of submission, via the
  existing polling cadence carried from prior scenarios.
- **FR-009**: Polling on the game view MUST stop cleanly when a viewer
  leaves the view (navigation away, close, unmount).
- **FR-010**: All participants' scores MUST be 0 at the moment the room
  transitions from `lobby` to `playing`. No prior carry-over of score is
  permitted.
- **FR-011**: The drawer MUST be able to draw freehand strokes on a canvas
  region in their own client view.
- **FR-012**: The drawer MUST be able to clear the entire canvas with a
  single visible control. The cleared state MUST be visible to the drawer
  within 1 second of the click.
- **FR-013**: Non-drawer participants MUST NOT receive or render the
  drawer's canvas content. The drawing is drawer-local and MUST NOT be
  synchronized across clients.
- **FR-014**: User-visible error messages introduced by this feature MUST be
  plain-language strings (e.g., `"Enter a guess"`, `"Only guessers can submit
  guesses"`, `"Round has not started"`); raw error codes or stack-style
  messages MUST NOT surface.
- **FR-015**: The recorded guess text in history entries MUST be the
  post-trim string. The original casing of the trimmed guess MUST be
  preserved (so `"RoCkEt"` is shown as `"RoCkEt"`, not as `"rocket"`).
- **FR-016**: The text of correct guess entries MUST be redacted on a
  per-viewer basis before being delivered to clients. Specifically:
  - If the viewer's participant id equals the entry's guesser id, the real
    trimmed guess text MUST be delivered.
  - If the viewer is the current round's drawer, the real trimmed guess
    text MUST be delivered.
  - Otherwise, the entry's guess text MUST be replaced with a fixed
    placeholder string (e.g., `"<correct guess>"`) that does NOT encode the
    word's content or length.
  Entries marked incorrect MUST always carry the real trimmed text to
  every viewer.

### Key Entities

- **Guess**: An accepted guess submission. Carries the guesser's identity,
  the trimmed guess text (original casing), the correctness verdict, and an
  ordering signal (submission order). Belongs to exactly one round.
- **Guess history**: An append-only, ordered list of `Guess` records for the
  current round. Created empty at round start; grows as guesses are
  submitted. Visible to every participant.
- **Score (per participant)**: A non-negative integer representing the
  participant's accumulated score for the current round. Initialized to 0 at
  round start. Incremented by 100 for every correct guess by that
  participant; unchanged for incorrect guesses.
- **Canvas (drawer-local)**: A drawing surface present only on the drawer's
  client. Contains freehand strokes the drawer makes; can be cleared in one
  step. Not represented on the server; not visible to other participants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every accepted guess appears in every connected participant's
  history list within 3 seconds of submission, in 100% of observed runs.
- **SC-002**: Each participant's first correct guess in a round adds
  exactly 100 to their score in 100% of observed runs. Every subsequent
  correct guess by the same participant in the same round adds 0 in 100%
  of observed runs. Every incorrect guess adds 0 in 100% of observed runs.
- **SC-003**: 0% of empty or whitespace-only guess submissions are accepted
  into the history.
- **SC-004**: 0% of guess submissions from the current drawer are accepted
  into the history.
- **SC-005**: 0% of guess submissions made while the room is not in
  `playing` state are accepted into the history.
- **SC-006**: Each participant's displayed score equals 100 if the history
  contains at least one correct guess by that participant, and 0 otherwise,
  in 100% of observed game-view snapshots.
- **SC-007**: 0% of non-drawer participants observe the drawer's canvas
  content (no strokes, no clears, no canvas-derived signal) at any point
  during the round.
- **SC-008**: The drawer can clear the canvas with a single click, with the
  cleared state visible on the drawer's screen within 1 second, in 100% of
  observed runs.
- **SC-009**: When a participant leaves the game view, no further game-view
  polling requests are issued by that viewer's session.
- **SC-010**: 0% of non-drawer, non-original-guesser participants receive
  the literal text of a correct guess in any UI region, network payload, or
  browser developer-tools panel.

## Assumptions

- A correct guess does NOT end the round in this scenario. The round
  continues to accept guesses indefinitely. Round termination (whether by
  first correct guess, by a host-triggered end, or by some other trigger) is
  owned by Scenario 4 and intentionally deferred.
- Scoring is capped at one correct guess per participant per round. The
  first correct guess from a given participant adds 100; further correct
  guesses from the same participant in the same round are still recorded in
  the history (so the timeline of play is preserved) but add 0 to the
  score. This keeps "final scores" in Scenario 4 a clean comparison and
  prevents score spam.
- The guess history is visible to every participant, but the text of any
  correct guess is server-side redacted to a fixed placeholder for any
  viewer who is neither the original guesser nor the current round's
  drawer. This prevents the trivial degenerate strategy of reading the
  first correct guess and copying it. The history's structure (who guessed,
  when, and whether it was correct) is still visible to everyone, so the
  game-play timeline remains observable.
- The drawer's canvas is fully local. No server-side persistence means a
  drawer-tab refresh resets the canvas to blank. This is acceptable; the
  lab's "no databases" constraint forbids the alternative.
- No rate limiting on guess submission, and no upper bound on guess length.
  A guesser may submit at any cadence; the system processes each
  submission. Anti-spam is out of scope.
- No further normalization of guess text beyond `String.prototype.trim()`.
  Internal whitespace, mixed casing, punctuation, emoji all pass through
  unchanged (only the comparison against the secret word is
  case-insensitive).
- Backend restarts wipe the room (existing in-memory behavior). Clients on
  the game view see a "Room not found" style message on their next poll
  rather than a silent crash.
- Network failures during a guess submission are handled by the client as a
  user-visible error; the next successful poll resyncs whatever state did
  land on the server.
- Correct-guess text redaction is enforced at the data boundary (the
  snapshot the server builds for each viewer). The placeholder string
  delivered to non-privileged viewers does not depend on the word's length
  or content, so a viewer cannot reverse-engineer the word from the
  placeholder.
