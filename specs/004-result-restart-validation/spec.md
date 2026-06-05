# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-05

**Status**: Draft

**Input**: Scenario 4 — Result, Restart & Final Validation: Given a round has ended, When the
result state is displayed and the host restarts, Then all players see the correct word, final
scores, and full guess history; on restart, everyone returns to the lobby with players preserved
and all round state cleared.

**Depends on**: Scenario 1 (room setup, players, host identity), Scenario 2 (drawer identity,
secret word, game start), Scenario 3 (guesses, scores, canvas sync via polling).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Ends the Round (Priority: P1)

While gameplay is active, the host sees an "End Round" button on the game screen. Clicking it
transitions the room into the "result" phase. All players polling the game screen are
automatically moved to the results view on their next poll cycle.

**Why this priority**: Ending the round is the trigger for the entire result-and-restart flow.
Without it, the results screen cannot be reached and Scenario 4 has no entry point.

**Independent Test**: Two tabs — Alice (host/drawer) and Bob (guesser). Bob submits one correct
and one incorrect guess. Alice clicks "End Round". Alice's screen immediately transitions to the
results view. Within approximately 2 seconds and without any manual action, Bob's tab also
shows the results view.

**Acceptance Scenarios**:

1. **Given** a round is active (room is in "playing" phase), **When** Alice (host) clicks
   "End Round", **Then** the room transitions to "result" phase and Alice's screen shows the
   results view.
2. **Given** a round is active, **When** Alice (host) clicks "End Round", **Then** the room's
   phase becomes "result" on the server; all subsequent polls return phase "result".
3. **Given** a round is in "result" phase, **When** Bob's next poll fires (within ~2 seconds),
   **Then** Bob's game screen transitions to the results view automatically without any manual
   action.
4. **Given** Alice is the host, **When** the game screen is in "playing" phase, **Then** the
   "End Round" button is visible only to Alice (non-host players do not see it).
5. **Given** Bob is a non-host player, **When** he views the game screen, **Then** no "End
   Round" button is present.

---

### User Story 2 — All Players View Round Results (Priority: P1)

When the round ends, all players — drawer and guessers — see the result screen. It reveals the
secret word (previously hidden from guessers), shows the final scores for every participant, and
displays the complete guess history in submission order. Non-host players see a message indicating
they are waiting for the host to restart.

**Why this priority**: Displaying the correct word, scores, and guess history is the core
deliverable of Scenario 4. It is the "result" that players play toward and validates the
entire game round.

**Independent Test**: Two tabs — Alice (host/drawer) and Bob (guesser). Bob submits "rocket"
(correct) and "pizza" (incorrect) during gameplay. Alice clicks "End Round". Both tabs show
the results view. Confirm: (1) the secret word "rocket" is visible on both tabs, (2) Bob's
score is 100 and Alice's is 0, (3) the guess history lists both of Bob's guesses with correct/
incorrect indicators in submission order, (4) Alice sees a "Restart" button and Bob sees
"Waiting for host to restart…".

**Acceptance Scenarios**:

1. **Given** the round has ended, **When** any player views the results screen, **Then** the
   secret word for the completed round is displayed clearly (visible to all players, including
   those who did not guess it correctly).
2. **Given** the round has ended, **When** any player views the results screen, **Then** final
   scores for all participants are shown (e.g., Bob: 100, Alice: 0).
3. **Given** the round has ended, **When** any player views the results screen, **Then** the
   full guess history is shown in submission order, each entry showing the guesser's name, the
   guess text, and correct/incorrect status.
4. **Given** the round has ended and Alice is the host, **When** she views the results screen,
   **Then** a "Restart" button is visible.
5. **Given** the round has ended and Bob is a non-host player, **When** he views the results
   screen, **Then** a "Waiting for host to restart…" message is shown (no "Restart" button).
6. **Given** the round has ended with no guesses submitted, **When** any player views the
   results screen, **Then** the guess history section shows an appropriate empty-state message
   (e.g., "No guesses were submitted.").

---

### User Story 3 — Host Restarts and All Players Return to Lobby (Priority: P1)

From the results screen, the host clicks "Restart". The room transitions back to the "lobby"
phase. All existing participants are preserved. All round state — guesses, scores, canvas
data, the secret word, and the drawer assignment — is cleared. Non-host players polling the
results screen detect the phase change and transition to the lobby view automatically.

**Why this priority**: Restarting the room to the lobby closes the round loop and lets players
play again. Without it, the game is single-use only.

**Independent Test**: Two tabs — Alice (host) and Bob (guesser) on the results screen. Alice
clicks "Restart". Alice's screen transitions to the lobby immediately, showing both Alice and
Bob in the participant list. Bob's tab transitions to the lobby within approximately 2 seconds.
Confirm: the secret word is no longer visible, scores show as 0 on a subsequent game start,
and the canvas is blank.

**Acceptance Scenarios**:

1. **Given** Alice (host) clicks "Restart" on the results screen, **Then** the room transitions
   to "lobby" phase and Alice sees the lobby view.
2. **Given** Alice clicks "Restart", **When** the restart is processed, **Then** all
   participants from the completed round remain in the lobby — no player is dropped.
3. **Given** Alice clicks "Restart", **When** the restart is processed, **Then** all round
   state is cleared on the server: guesses reset to empty list, scores reset to 0 for all
   participants, canvas data reset to null, secret word cleared, and drawer assignment cleared.
4. **Given** the room is back in "lobby" phase, **When** Bob's next poll fires (within ~2
   seconds), **Then** Bob's results screen transitions to the lobby view automatically.
5. **Given** the room has been restarted to lobby, **When** Alice (host) starts a new game,
   **Then** scores begin at 0 for all players and the canvas is blank.

---

### Edge Cases

- What happens if the host navigates away (closes the tab) while the room is in "result"
  phase? The room remains in "result" phase; other players continue to see the results screen
  indefinitely. There is no automatic timeout or host-transfer in this lab scope.
- What happens if a non-host player attempts to send the restart request directly (e.g., via
  developer tools)? The server rejects the request with a 403 Forbidden response.
- What happens if a player joins a room that is already in "result" phase? They see the results
  screen (same state as other players). They do not see the lobby or game screen.
- What happens if the polling call encounters a transient error during the "result" phase?
  The error is shown inline and polling continues — same pattern as Scenarios 1 and 3.
- What happens if the backend restarts during the "result" phase? The room is lost; the next
  poll returns 404 and the player is redirected to the Start screen (same as Scenario 3
  behaviour).
- What happens if "End Round" is clicked again after the round has already ended? The action
  is a no-op (button not rendered when phase is already "result").

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While the room is in "playing" phase, the host MUST see an "End Round" button
  on the game screen. Non-host players MUST NOT see this button.
- **FR-002**: When the host clicks "End Round", the server MUST transition the room to "result"
  phase. The response MUST include the updated room snapshot (phase = "result").
- **FR-003**: The game screen MUST detect a phase value of "result" in the poll response and
  render the results view in place of the gameplay view.
- **FR-004**: The results view MUST display the secret word for the completed round, visible
  to all players (including those who did not guess it correctly during gameplay).
- **FR-005**: The results view MUST display the final score for every participant.
- **FR-006**: The results view MUST display the complete guess history in submission order.
  Each entry MUST show the guesser's name, the guess text, and a correct/incorrect indicator
  (consistent with the colour-coding from Scenario 3: green for correct, red for incorrect).
- **FR-007**: If no guesses were submitted during the round, the results view MUST show an
  appropriate empty-state message in the guess history section.
- **FR-008**: On the results screen, the host MUST see a "Restart" button. Non-host players
  MUST see a "Waiting for host to restart…" message instead.
- **FR-009**: When the host clicks "Restart", the server MUST transition the room back to
  "lobby" phase and clear all round state: guesses list reset to empty, scores reset to 0
  for all participants, canvas data reset to null, secret word cleared, and drawer assignment
  cleared. All participants MUST be preserved.
- **FR-010**: Non-host players polling while the room is in "result" phase MUST transition
  automatically to the lobby view when the phase changes to "lobby" (within the next poll
  cycle, approximately 2 seconds).
- **FR-011**: The server MUST reject "End Round" and "Restart" requests from non-host
  participants with a 403 Forbidden response.
- **FR-012**: Transient polling errors during the "result" phase MUST be shown inline; polling
  MUST continue.
- **FR-013**: A 404 poll response during the "result" phase MUST redirect the player to the
  Start screen.
- **FR-014**: The "End Round" button MUST only be rendered when the room is in "playing"
  phase. It MUST NOT be rendered in "lobby" or "result" phase.

### Key Entities

- **Room** (extended): Gains a `phase` field with three possible values — `"lobby"`,
  `"playing"`, or `"result"`. Phase `"lobby"` and `"playing"` exist from prior scenarios;
  `"result"` is introduced here. On restart, all round-specific fields (`guesses`,
  `scores`, `canvasData`, `word`, `drawerId`) are reset to their initial (empty/null/zero)
  values and phase returns to `"lobby"`.
- **RoundResult** (derived): Not a stored entity — derived at read time from the Room in
  "result" phase. Contains the secret word, final scores map, and complete guess history.
  Returned as part of the room snapshot so all players receive it via the existing poll.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host clicks "End Round", the host's screen transitions to the results
  view immediately (within the same interaction), and all other players' screens transition
  to the results view within approximately 2 seconds — without any manual action from those
  players.
- **SC-002**: The results view displays the correct secret word for the completed round on
  every player's screen, including players who never guessed it correctly.
- **SC-003**: The results view shows accurate final scores for all participants. A player who
  submitted two correct guesses (200 points) and a player who submitted one incorrect guess
  (0 points) are reflected correctly.
- **SC-004**: The complete guess history is visible on the results view in submission order,
  with correct and incorrect guesses visually distinguished, covering all guesses submitted
  during the round.
- **SC-005**: After the host clicks "Restart", the host's screen transitions to the lobby
  immediately. All other players' screens transition to the lobby within approximately 2
  seconds — without any manual action.
- **SC-006**: After a restart, the lobby shows the same set of participants as before the
  round. No player is dropped.
- **SC-007**: After a restart and a new game start, all player scores begin at 0 and the
  canvas is blank — confirming full round state clearance.
- **SC-008**: A non-host player's attempt to trigger "End Round" or "Restart" via any
  mechanism results in a 403 response and no state change on the server.

---

## Out of Scope

- **Multiple rounds with cumulative scoring**: Each restart fully resets scores to 0. Carrying
  scores across rounds is not implemented in this lab scope.
- **Host transfer**: If the host leaves the room during the "result" phase, no automatic
  transfer of host rights occurs. Other players remain on the results screen.
- **Automatic round timeout**: The round does not end automatically after a time limit.
  The host must manually trigger "End Round".
- **New players joining during "result" phase**: Joining during "result" phase is handled
  by displaying the current room snapshot (results view) to the newly joined player, but no
  special onboarding flow is added.

---

## Assumptions

- The room `status` field used in Scenarios 1–3 is renamed or extended to a `phase` field
  supporting three values: `"lobby"`, `"playing"`, and `"result"`. If the existing field is
  already named `status`, the same field is extended to accept `"result"` as a third value.
- The existing 2-second polling mechanism on the game screen is reused for the "result" phase.
  No new polling endpoint is required — the existing `GET /rooms/:code?participantId=`
  endpoint returns the updated phase, and the frontend transitions screens based on the phase
  value.
- The "End Round" action is implemented as a dedicated API endpoint (e.g.,
  `POST /rooms/:code/end`) that is only callable by the host. The "Restart" action is a
  separate endpoint (e.g., `POST /rooms/:code/restart`). Both validate host identity before
  making any state change.
- The host is always Alice (the first player / room creator) as established in Scenarios 1
  and 2. Host identity does not change across a restart.
- The word shown on the results screen is the same `word` field stored on the Room during
  gameplay. It is included in the room snapshot when phase is `"result"`, unlike during
  "playing" phase (where it is redacted from non-drawer players).
- Round results display on the results screen uses the same visual components as the gameplay
  screen for guess history (colour-coded rows) and scoreboard (participant list with scores),
  re-rendered in a non-interactive, read-only context.
- After restart, the host must click "Start Game" again to begin a new round — the restart
  returns to the lobby state identical to after initial room creation, and the existing
  "Start Game" flow from Scenario 2 applies.
