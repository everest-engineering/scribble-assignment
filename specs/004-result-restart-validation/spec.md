# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `assignment-Anusha`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Scenario 4 — Result, Restart & Final Validation
Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Ends the Round and All Players See the Result (Priority: P1)

During an active round, the host can end the round at any time. When the round
ends, the game transitions to a result state. Every player — the drawer and all
guessers — immediately sees the correct (secret) word revealed, the final scores
for all participants, and the complete guess history for the round. Guessers who
did not know the word now learn it.

**Why this priority**: Revealing the result is the natural conclusion of every
round. Without it, guessers never learn the answer, the score totals are never
confirmed, and the game loop has no closure. Everything in Scenarios 1–3 leads
to this moment.

**Independent Test**: With a round in progress (host in one tab, at least one
guesser in another), click "End Round" as the host. Verify that both tabs
immediately display the result state showing the revealed word, each player's
final score, and the full list of submitted guesses.

**Acceptance Scenarios**:

1. **Given** a round is active and the current user is the host,
   **When** the host clicks "End Round",
   **Then** the room transitions to a finished state and the host's view updates
   to show the result screen.

2. **Given** the room is in the finished state,
   **When** any player's client polls for the room status,
   **Then** their view updates to the result screen showing the correct word
   (revealed to all), each player's final score, and the full guess history in
   submission order.

3. **Given** the room is in the finished state,
   **When** a guesser (who never saw the secret word during the round) views the
   result screen,
   **Then** the correct word is now visibly displayed to them.

4. **Given** the room is in the finished state,
   **When** a player who submitted no guesses views the result screen,
   **Then** they still see the correct word and all other players' scores and
   guesses; their own score is shown as 0.

---

### User Story 2 — Host Restarts and All Players Return to the Lobby (Priority: P1)

From the result screen, the host can restart the game. When restart is triggered,
the room returns to lobby status: all players remain in the room with their names
preserved, and all round data (secret word, guesses, scores, drawer assignment)
is cleared. Non-host players are not required to re-join.

**Why this priority**: Restart is essential for a playable multi-round experience.
Without it, players must create or join a new room after every single round, which
breaks the social flow of the game.

**Independent Test**: From the result screen (host tab and at least one guesser
tab), click "Restart" as the host. Verify both tabs return to the lobby view
showing the same players as before, with no residual round data visible.

**Acceptance Scenarios**:

1. **Given** the room is in the finished state and the current user is the host,
   **When** the host clicks "Restart",
   **Then** the room transitions back to lobby status.

2. **Given** the host has clicked "Restart",
   **When** any player's client polls for the room status,
   **Then** their view updates to the lobby screen.

3. **Given** the host has clicked "Restart",
   **When** the lobby is displayed,
   **Then** all players who were in the room before the round remain listed
   without needing to re-join.

4. **Given** the host has clicked "Restart",
   **When** the lobby is displayed,
   **Then** no round-specific data is visible: no scores, no guess history,
   no secret word, and no drawer assignment.

5. **Given** a non-host player is on the result screen,
   **When** the host clicks "Restart",
   **Then** the non-host player's view transitions to the lobby automatically
   (via the existing polling mechanism) without any action required from them.

---

### User Story 3 — Restart Button is Visible Only to the Host (Priority: P2)

On the result screen, the "Restart" button is presented only to the host. Non-host
players see the result data (correct word, scores, guess history) but do not have
access to any restart or navigation control that would change the room state.

**Why this priority**: Host-only restart is a game-governance concern. It prevents
a guesser from prematurely ending the result phase before the host is ready to
proceed. It is P2 because the core result visibility and restart function (P1
stories) are independently testable without enforcing the access restriction.

**Independent Test**: Open the result screen as both the host and a non-host
player. Verify the "Restart" button appears in the host view and does not appear
in the non-host view.

**Acceptance Scenarios**:

1. **Given** the room is in the finished state and the current user is the host,
   **When** the result screen is displayed,
   **Then** a "Restart" button is visible and interactive for the host.

2. **Given** the room is in the finished state and the current user is a
   non-host player,
   **When** the result screen is displayed,
   **Then** no "Restart" button or equivalent room-state-changing control is
   visible or accessible.

---

### Edge Cases

- What if the host refreshes or rejoins during the finished state? The room
  remains in the finished state; the host's result screen should still show when
  they reload.
- What if a non-host player tries to call the restart endpoint directly (e.g.,
  via API)? The request MUST be rejected with an authorization error; only the
  host is permitted to restart.
- What if no guesses were submitted before the host ended the round? The result
  screen shows the correct word, all players with 0 points, and an empty guess
  history. No error is shown.
- What if the host clicks "End Round" immediately after the game starts (no
  guesses yet)? Behavior is the same as above — a valid but uneventful result
  state.
- What if the host clicks "Restart" multiple times (e.g., double-click)? The
  second request is a no-op; the room is already in lobby status and subsequent
  restart calls should not cause errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST introduce a "finished" room status (distinct from
  "lobby" and "in-progress") that represents the post-round result state.
- **FR-002**: The host MUST be able to end an active round via an explicit action
  that transitions the room from "in-progress" to "finished".
- **FR-003**: Only the host MUST be permitted to trigger the end-round transition;
  non-host attempts MUST be rejected.
- **FR-004**: When the room is in the "finished" state, the correct (secret) word
  for the completed round MUST be visible to all participants, including guessers
  who could not see it during the round.
- **FR-005**: When the room is in the "finished" state, the final scores for all
  participants MUST be visible to all players.
- **FR-006**: When the room is in the "finished" state, the full guess history
  for the completed round MUST be visible to all players in submission order.
- **FR-007**: The result state data (correct word, scores, guess history) MUST be
  retrievable by all players via the existing polling mechanism without requiring
  a page reload.
- **FR-008**: The host MUST be able to restart the game from the result screen,
  transitioning the room from "finished" back to "lobby".
- **FR-009**: Only the host MUST be permitted to trigger the restart; non-host
  attempts MUST be rejected.
- **FR-010**: On restart, all participants who were present in the room MUST
  remain as participants; no player is removed and no player needs to re-join.
- **FR-011**: On restart, all round-specific state MUST be cleared: the current
  round record (guesses, scores, secret word, drawer assignment) MUST be removed
  from the room.
- **FR-012**: On restart, the room status MUST be "lobby"; no residual round
  data MUST be accessible via any API endpoint.
- **FR-013**: The "Restart" control on the result screen MUST be visible and
  interactive only for the host; non-host players' result screens MUST NOT
  display this control.
- **FR-014**: Non-host players MUST transition to the lobby view automatically
  after the host restarts (via the existing polling mechanism).

### Key Entities

- **Room**: Gains a third status value "finished" in addition to the existing
  "lobby" and "in-progress". When finished, the snapshot exposes the secret word
  to all participants (not just the drawer).
- **Round Result**: The snapshot data surfaced when a room is "finished" — includes
  the revealed secret word, per-player final scores, and the complete ordered
  guess history. This data is derived from the existing `currentRound` field and
  is not a new persistent entity; it is cleared on restart.
- **Participant**: Unchanged in structure; participants are preserved across a
  restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of players in a finished room see the correct word, all final
  scores, and the full guess history within one polling cycle of the host ending
  the round (assumed ≤ 3 seconds based on spec 003 assumptions).
- **SC-002**: After a restart, 100% of players see the lobby view within one
  polling cycle without taking any manual action.
- **SC-003**: After a restart, the participant list is identical to the
  pre-restart list — no players are lost and no players need to re-join.
- **SC-004**: After a restart, zero round-specific fields (scores, guesses, secret
  word, drawer) are accessible via any API endpoint; the room is in a clean lobby
  state.
- **SC-005**: Non-host restart attempts are rejected 100% of the time; no state
  change occurs as a result of an unauthorized restart call.

## Assumptions

- The round is ended by an explicit host action ("End Round" button); automatic
  round termination on correct guess or timer is out of scope, consistent with
  spec 003.
- The existing polling interval (≤ 3 seconds, per spec 003) is sufficient to
  propagate both the "finished" state and the post-restart "lobby" state to all
  clients; no new real-time push mechanism is required.
- The restart resets to a fresh lobby for a new round but does NOT automatically
  start a new round; the host must click "Start Game" again (per spec 002
  flows).
- Score persistence across multiple rounds (cumulative leaderboard) is out of
  scope; each restart clears all scores.
- Player authentication beyond a display name is not required; the host is
  identified by `hostId` on the room, consistent with existing specs.
- The "finished" room state does not prevent new players from viewing the results,
  but new players cannot join a finished room (joining a non-lobby room was
  already rejected per spec 001 logic).
- The result screen is a separate view from the active game screen; the UI
  transitions to this new view when the room status changes to "finished".
