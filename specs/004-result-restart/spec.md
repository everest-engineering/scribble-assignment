# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation. Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-03

- Q: What ends the round? → A: The host presses an "End Round" control on the game view. The round ends only when the host triggers it. Auto-end variants (first-correct, all-correct, timer) are explicitly excluded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round ends and every participant sees the result view (Priority: P1)

The host triggers the end of the current round. All connected participants'
screens transition from the in-play game view to a result view. On the result
view, every participant sees the round's secret word, every participant's
final score, and the full guess history with the literal text of every entry
visible — including correct ones that were redacted during play.

**Why this priority**: This is the entire deliverable's core: the round must
have an observable, agreed-on end state. Without it, scores and history have
no closure and Scenario 4 is not satisfied. US2 (restart) only makes sense
once the round has actually ended.

**Independent Test**: With two or three browser tabs already on the game view
from Scenario 3 (Alice drawer in Tab A; Bob guesser in Tab B who has
submitted a correct guess for `rocket`; Carol guesser in Tab C with no
correct guess), have Alice press the End Round control. Within ~3 seconds
all three tabs leave the game view for a result view. Tab A, Tab B, and Tab
C all show the literal word `rocket`, the scoreboard with Alice = 0, Bob =
100, Carol = 0, and the full guess history including the literal text of
Bob's correct entry (no `<correct guess>` placeholder anywhere).

**Acceptance Scenarios**:

1. **Given** the room is in the active in-play state with one correct guess
   from Bob and one incorrect guess from Carol, **When** the host presses
   End Round, **Then** within ~3 seconds every participant's screen shows
   the result view.
2. **Given** the result view is shown, **When** any participant looks at the
   word area, **Then** they see the round's secret word as a literal string.
3. **Given** the result view is shown, **When** any participant looks at the
   scoreboard, **Then** they see each participant's final score (the same
   values the in-play scoreboard last displayed).
4. **Given** the result view is shown, **When** any participant — including
   the previously-non-privileged third parties — looks at the guess history,
   **Then** every entry is rendered with its literal text, regardless of
   whether the entry was correct or who submitted it.
5. **Given** the result view is shown, **When** a non-host participant
   attempts to trigger End Round again (via UI manipulation or a direct
   request), **Then** the room remains in the result state with the same
   word, scores, and history; no second transition occurs.
6. **Given** the in-play state is shown with one player present (i.e., the
   drawer alone — Scenario 2 prevents this, but defensively), **When** any
   non-host participant attempts to trigger End Round, **Then** the request
   is rejected with a visible message and the room remains in its current
   state.
7. **Given** a participant's browser tab is refreshed during the result
   view, **When** the tab finishes reloading, **Then** the same result view
   reappears with the same word, scores, and history.

---

### User Story 2 - Host restarts and everyone returns to the lobby (Priority: P2)

From the result view, the host presses Restart. The room returns to the
lobby state on every connected client. The participants list is preserved
(same people, same host). Every participant's score is reset to 0. The guess
history is empty. The current round is cleared. The lobby's host-only Start
control behaves as it did originally — i.e., the host can press Start to
begin a new round.

**Why this priority**: This is the "loop closure" of the lab — without
restart, a single game is one-shot. It builds on US1 (you can only restart
from a result view) and on Scenarios 1–3 (the lobby and the start flow
already work).

**Independent Test**: From the result view at the end of US1, have Alice
press Restart. Within ~3 seconds all tabs leave the result view and land on
the lobby view for the same room. The lobby shows the same participants
(`Alice`, `Bob`, `Carol`) in the same order with the same host designation.
The scoreboard is no longer shown (lobby, not game). If anyone opens the
network response for `GET /rooms/<code>`, `currentRound` is `null`,
`guesses` is `[]`, every participant has `score: 0`, and `status` is
`"lobby"`. Pressing Start in Alice's tab kicks off a fresh round per the
Scenario 2 / Scenario 3 flows.

**Acceptance Scenarios**:

1. **Given** all three tabs are on the result view, **When** the host
   presses Restart, **Then** within ~3 seconds all three tabs show the
   lobby view for the same room.
2. **Given** the room has just been restarted, **When** any participant
   looks at the participant list in the lobby, **Then** they see the same
   participants (same identities, same order) that were present before the
   restart.
3. **Given** the room has just been restarted, **When** any participant
   inspects the room state via the snapshot endpoint, **Then**
   `room.status === "lobby"`, `room.currentRound === null`, `room.guesses
   === []`, and every `participant.score === 0`.
4. **Given** the room has just been restarted, **When** the host presses
   Start again (with at least 2 players, as required by Scenario 1), **Then**
   a new round begins with a freshly selected secret word per Scenario 2;
   each participant's score is 0 at the start of this new round.
5. **Given** the room is in any state other than result (lobby or playing),
   **When** any participant attempts to trigger Restart, **Then** the
   request is rejected with a visible message and the room state is
   unchanged.
6. **Given** the room is in the result state, **When** a non-host
   participant attempts to trigger Restart, **Then** the request is
   rejected with a visible message; the room remains in the result state.

---

### Edge Cases

- Host presses End Round with an empty guess history (no participants
  guessed at all) → result view shows the word + all-zero scoreboard + an
  empty history list with explanatory copy (e.g., "No guesses were
  submitted this round").
- Host presses End Round twice rapidly → the second press is a no-op; the
  result view shows the same word, scores, and history as after the first.
- Host presses Restart twice rapidly → the second press is a no-op; the
  room is in the lobby state with the same participants and zeroed scores
  as after the first.
- Non-host attempts End Round via UI manipulation or a direct request →
  rejected with a visible message; the room remains in its current state.
- Non-host attempts Restart via the same path → rejected with a visible
  message; the room remains in the result state.
- A participant tries to join while the room is in `result` state → rejected
  with the existing "Room is no longer open to new players" message
  (inherited from Scenario 1's non-lobby join guard).
- A participant tries to join immediately after a restart while the room is
  back in `lobby` state → accepted; the existing Scenario 1 join flow
  applies. (Restart effectively reopens the room to new joiners.)
- A guess is submitted to the server during the brief race between the
  host pressing End Round and the server transitioning the room state →
  accepted if the server still sees `status === "playing"`; rejected with
  `"Round has not started"` if the server has already transitioned. Either
  outcome is acceptable and both are caught by the existing
  `submitGuess` guards.
- Drawer's canvas content during End Round → the drawer's tab transitions
  away from the game view; the canvas component is unmounted and its
  in-memory strokes are lost (Scenario 3 acknowledged this as drawer-
  local). On a fresh round after Restart, the canvas begins empty.
- The host's browser tab refreshes during the result view → identity is
  reclaimed from `localStorage` (Scenario 1 Q1); the host lands back on the
  result view with all data intact.
- Backend process restarts during the result view → the room is wiped
  (existing in-memory behavior); clients see a "Room not found" style
  message on their next poll. There is no recovery path; this is consistent
  with the lab's no-persistence scope.
- A participant leaves the result view (closes the tab or navigates away)
  → no further game-view polling requests are issued by that viewer's
  session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a host-only mechanism to end the
  current round when the room is in the in-play state.
- **FR-002**: An attempt to end the round by any participant other than the
  current host MUST be rejected with a user-visible message; the room state
  MUST remain unchanged.
- **FR-003**: An attempt to end the round while the room is NOT in the
  in-play state (i.e., still in lobby or already in result) MUST be
  rejected with a user-visible message; the room state MUST remain
  unchanged.
- **FR-004**: When the host ends the round, the room MUST transition to a
  "result" state observable on every connected client within approximately
  3 seconds (one polling tick + render).
- **FR-005**: In the result state, every participant — drawer included —
  MUST see the round's secret word rendered as a literal string in their
  result view.
- **FR-006**: In the result state, every participant MUST see each
  participant's final score for the round. The displayed score for each
  participant MUST equal the score that was visible on the in-play
  scoreboard at the moment the round ended.
- **FR-007**: In the result state, every participant MUST see the full
  guess history with the literal text of every entry. The Scenario 3
  redaction rule (FR-016 of `003-gameplay-interaction/spec.md`) MUST NOT
  apply during the result state — correct-guess entries MUST carry their
  real text to every viewer.
- **FR-008**: The system MUST provide a host-only mechanism to restart the
  room from the result state.
- **FR-009**: An attempt to restart by any participant other than the
  current host MUST be rejected with a user-visible message; the room
  state MUST remain unchanged.
- **FR-010**: An attempt to restart while the room is NOT in the result
  state (i.e., still in lobby or still in-play) MUST be rejected with a
  user-visible message; the room state MUST remain unchanged.
- **FR-011**: A successful restart MUST transition the room back to the
  lobby state with: (a) the participants list preserved exactly as it was,
  including order and the host designation; (b) every participant's score
  reset to 0; (c) the guess history cleared to empty; (d) the current
  round cleared to null.
- **FR-012**: On a successful restart, every connected client MUST navigate
  back to the lobby view within approximately 3 seconds.
- **FR-013**: After restart, the existing Scenario 1 → 3 flows MUST work
  unchanged: new players may join (the room is once again in lobby state
  and accepts joins), the host may press Start to begin a fresh round
  (with all scores starting at 0 and an empty guess history), and the new
  round selects a secret word deterministically from the room code per
  Scenario 2.
- **FR-014**: Polling cadence carried forward from earlier scenarios
  (~2 seconds) MUST continue to apply on the result view so non-host
  participants observe the transition out of the result state when the
  host restarts.
- **FR-015**: All user-visible error messages introduced by this feature
  MUST be plain-language strings (e.g., "Only the host can end the round",
  "Only the host can restart", "Cannot end a round that is not in
  progress", "Cannot restart from this state"); raw error codes or stack-
  style messages MUST NOT surface to the user.

### Key Entities

- **Result state**: A new value in the room's lifecycle, sitting between
  the in-play state and a return to the lobby. While the room is in the
  result state, the secret word, the final scores, and the full guess
  history are all visible to every participant. No new guesses are
  accepted (the in-play guess endpoint already rejects non-`playing` room
  states).
- **End-round action**: A host-only transition from in-play to result. No
  data is added or removed; only the room's state value changes.
- **Restart action**: A host-only transition from result back to lobby
  that clears the round-scoped state: the current round designation, the
  guess history, and every participant's score. The participants list and
  the host designation are preserved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the host ends the round, every connected participant's
  screen reflects the result state within 3 seconds in 100% of observed
  runs.
- **SC-002**: 100% of result views show the round's secret word as a
  literal string to every participant, regardless of their role during the
  round.
- **SC-003**: Each participant's displayed final score on the result view
  matches the value visible on the in-play scoreboard at the moment the
  round ended in 100% of observed runs.
- **SC-004**: 100% of guess history entries on the result view display
  their literal text to every participant — including correct entries that
  were redacted to non-privileged viewers during play.
- **SC-005**: 0% of non-host participants succeed in ending the round.
- **SC-006**: 0% of non-host participants succeed in restarting the room.
- **SC-007**: 0% of end-round attempts against a non-in-play room (lobby
  or already in result) succeed.
- **SC-008**: 0% of restart attempts against a non-result room (lobby or
  in-play) succeed.
- **SC-009**: After a successful restart, every participant in the
  pre-restart room is still present in the lobby view in 100% of observed
  runs, with the same order and the same host designation.
- **SC-010**: After a successful restart, every participant's score is 0
  and the guess history is empty in 100% of observed snapshots.
- **SC-011**: After a successful restart, the host can press Start with at
  least 2 players present and a fresh round begins with all scores at 0
  and an empty history in 100% of observed runs.
- **SC-012**: When a participant leaves the result view, no further
  game-view polling requests are issued by that viewer's session.

## Assumptions

- The round-end trigger is a host-pressed "End Round" control on the game
  view (confirmed via Clarification Q1). Auto-end variants (round ends on
  first correct guess, round ends when all guessers have guessed correctly,
  round ends on a timer) are explicitly excluded from this scenario. The
  host has explicit control over when closure happens; this keeps the lab
  simple, lets the host accommodate slower guessers, and is consistent
  with the host-controlled Start from Scenario 1.
- The Scenario 3 redaction rule that hides correct-guess text from
  non-privileged viewers DOES NOT apply during the result state. The
  intent of the redaction was to prevent in-play cheating; once the round
  is over, the secrecy is gone and the full history is part of the
  closure. The snapshot delivered to every viewer in the result state
  carries the real text for every entry.
- The drawer's canvas content is not part of the result state. The
  Scenario 3 canvas is drawer-local; it does not survive the transition
  out of the game view, and no archived drawing appears on the result
  view. This matches the lab's no-persistence scope.
- Restart from any non-result state (lobby or still in-play) is rejected
  rather than coerced. If the host wants to abort an in-play round
  without seeing the result view, they must first end the round; there is
  no shortcut path. This keeps the state machine narrow and predictable.
- Player names and host identity remain stable across restart. The host
  before restart is the host after restart. The participants array
  ordering is preserved.
- After restart the room is once again open to new joiners. The Scenario 1
  no-late-join rule applies only during non-lobby states; a fresh lobby
  reopens. The lab does not prohibit this and it matches the literal
  "restart returns to lobby" requirement.
- The result view is reached via the existing in-app navigation pattern:
  when a connected client observes a room snapshot with `status ==
  "result"`, that client navigates to a result view. This mirrors how
  Scenario 2's "playing" status drives navigation from lobby to game.
- Backend process restarts wipe the room entirely (existing in-memory
  behavior); clients on either the result view or the lobby see a "Room
  not found" style message on their next poll. There is no recovery path.
