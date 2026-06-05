# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation (README business scenarios, fourth one)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared result when the round ends (Priority: P1)

When the round ends, the room enters a result state that every player sees: the correct word
(now revealed to everyone), each player's final score, and the full guess history. Non-host
players are carried into the result view automatically.

**Why this priority**: The result is the payoff of the round and the thing the rubric checks
("two browsers… see synced result"). Without it, a played round has no conclusion. This is the
MVP slice of Scenario 4.

**Independent Test**: With a round in progress, end the round; confirm both the host's and a
guesser's screen show the same correct word, the same final scores, and the same full guess
history within ~2 seconds.

**Acceptance Scenarios**:

1. **Given** an active round, **When** the round ends, **Then** the room enters a result state
   and the host sees the result view.
2. **Given** the round has ended, **When** any player views the result, **Then** they see the
   correct word, every participant's final score, and the full guess history.
3. **Given** a guesser is on the game screen when the round ends, **When** their screen refreshes,
   **Then** they are moved to the result view within ~2 seconds.
4. **Given** the round has ended, **When** a former guesser views the result, **Then** the correct
   word is now revealed to them (it is no longer hidden once the round is over).

---

### User Story 2 - Restart returns everyone to the lobby (Priority: P1)

From the result state, the host restarts the game. Every player returns to the lobby with the
same participants preserved, and all round state (drawer, secret word, guesses, scores, drawing)
is cleared so a fresh game can begin.

**Why this priority**: Restart closes the loop and is explicitly required ("everyone returns to
the lobby with players preserved and all round state cleared"). It depends on a result state
existing (US1).

**Independent Test**: From a result state with two players, the host restarts; confirm both
players land back in the lobby, the participant list is unchanged (same players, same host), and
all round state is cleared (no word, no drawer, scores reset, empty history, blank canvas).

**Acceptance Scenarios**:

1. **Given** the result state, **When** the host restarts, **Then** the room returns to the
   lobby state.
2. **Given** the host restarts, **When** the lobby loads, **Then** all participants from the
   previous round are still present and the host is unchanged.
3. **Given** the host restarts, **When** the lobby loads, **Then** the previous round's drawer,
   secret word, guesses, scores, and drawing are all cleared.
4. **Given** a non-host player is on the result screen, **When** the host restarts, **Then** the
   non-host is returned to the lobby within ~2 seconds without any manual action.
5. **Given** the room is back in the lobby after a restart, **When** the host has at least two
   players, **Then** they can start a new round (the lobby behaves as a fresh game).

---

### User Story 3 - Host-only end and restart (Priority: P2)

Only the host can end the round and restart the game. Non-host players never have end-round or
restart controls.

**Why this priority**: This protects the round lifecycle from non-host interference and mirrors
the host-only start rule from Scenario 1. It builds on the end/restart actions (US1/US2).

**Independent Test**: As a guesser, confirm there is no control to end the round or to restart;
as the host, confirm both controls are available at the appropriate state.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a non-host player views the game, **Then** no end-round
   control is available to them.
2. **Given** the result state, **When** a non-host player views the result, **Then** no restart
   control is available to them.
3. **Given** an active round, **When** the host views the game, **Then** an end-round control is
   available; in the result state, a restart control is available.

---

### Edge Cases

- **Non-host attempts to end or restart**: no control is presented; any such request is rejected.
- **End round when not active**: ending is only valid while the round is active (`playing`);
  otherwise it is rejected.
- **Restart when not in result**: restart is only valid from the result state; otherwise rejected.
- **Word becomes public at result**: the previously drawer-only secret word is revealed to all
  players once the round ends, and correct guesses' text is shown in the result history.
- **Scores preserved into result, cleared on restart**: final scores are visible in the result;
  after restart every preserved player's score is reset to 0.
- **Players preserved, identity stable**: restart keeps the same participants and the same host;
  no one is dropped or re-ordered.
- **Late refresh**: a player whose screen refreshes after the round ends lands on the result; a
  player whose screen refreshes after a restart lands in the lobby.
- **Transient sync failure**: a failed refresh keeps the last known state and recovers on the
  next poll (no crash).

## Requirements *(mandatory)*

### Functional Requirements

**End round & result**

- **FR-001**: System MUST let the host end the active round, moving the room into a result state.
- **FR-002**: System MUST only allow ending the round while the room is in the active-round state.
- **FR-003**: System MUST reveal the correct word to all players in the result state.
- **FR-004**: System MUST present every participant's final score to all players in the result
  state.
- **FR-005**: System MUST present the full guess history to all players in the result state, with
  correct guesses' text shown (the word is public once the round is over).
- **FR-006**: System MUST expose the result state so any refreshing client detects it and shows
  the result view; non-host players MUST be carried to the result view within ~2 seconds.

**Restart**

- **FR-007**: System MUST let the host restart from the result state, returning the room to the
  lobby state.
- **FR-008**: System MUST preserve all participants and the host across a restart (same players,
  same host, no reordering).
- **FR-009**: System MUST clear all round state on restart: drawer, secret word, guesses, drawing,
  and reset every preserved participant's score to 0.
- **FR-010**: System MUST expose the restart so any refreshing client detects it; non-host players
  MUST be returned to the lobby within ~2 seconds without manual action.
- **FR-011**: System MUST allow a new round to be started after a restart under the same lobby
  rules (host-only, at least two players).

**Permissions**

- **FR-012**: System MUST make the end-round control available only to the host.
- **FR-013**: System MUST make the restart control available only to the host.
- **FR-014**: System MUST reject an end-round or restart request from a non-host.

**State**

- **FR-015**: System MUST keep all result and restart state in memory only, consistent with the
  project constitution.

### Key Entities *(include if data involved)*

- **Room (extended)**: Gains a result state distinct from lobby and active-round. In the result
  state it retains the round's word, scores, and guess history for display; on restart it returns
  to the lobby with round fields cleared and participants preserved. Still in memory only.
- **Result view**: The shared end-of-round summary — correct word, every participant's final
  score, and the full guess history — visible to all players.
- **Round state (cleared on restart)**: drawer assignment, secret word, guess history, drawing,
  and scores; all reset so the next round starts clean.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the round ends, 100% of players see the same correct word, the same final
  scores, and the same full guess history in the result state.
- **SC-002**: Non-host players reach the result view within ~2 seconds of the round ending, with
  no manual action.
- **SC-003**: After a restart, 100% of the previous round's participants are still present and the
  host is unchanged.
- **SC-004**: After a restart, all round state is cleared — no secret word, no drawer, empty guess
  history, blank drawing, and every score reset to 0 — in 100% of trials.
- **SC-005**: Non-host players are returned to the lobby within ~2 seconds of a restart, with no
  manual action.
- **SC-006**: Only the host can end the round and restart; non-hosts can do neither, 100% of the
  time.
- **SC-007**: After a restart, the host can start a new round whenever at least two players are
  present, exactly as in a fresh lobby.
- **SC-008**: Two browsers can complete a full loop — join, play a round, see the synced result,
  and restart back to the lobby — end to end.

## Assumptions

- **Round-end trigger is host-controlled**: The round ends when the host chooses to end it (an
  end-round action); there is no timer or automatic end (timers/countdowns are out of scope, and
  Scenario 3 allows multiple guessers to score, so a first-correct auto-end would be inconsistent).
- **Restart originates from the result state**: The host restarts after the result is shown; the
  spec does not require restarting directly from an in-progress round.
- **Scores reset on restart**: "All round state cleared" includes resetting every preserved
  player's score to 0; participants themselves are kept.
- **Word visibility flips at result**: The drawer-only secret word from Scenario 2 becomes public
  to all players in the result state (and correct-guess text is shown there); this does not change
  the during-round secrecy.
- **Single round, no rotation**: This scenario covers one round's result and a restart to a fresh
  lobby; multiple rounds, drawer rotation, and round numbering remain out of scope.
- **Sync mechanism**: Result and restart transitions reuse the ~2s polling from Scenario 1; no new
  real-time mechanism is introduced.
- **Builds on prior scenarios**: Lobby/host (Scenario 1), start/drawer/word (Scenario 2), and
  guessing/scoring/history/drawing (Scenario 3) are assumed in place.
