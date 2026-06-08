# Feature Specification: Round Result & Host Restart

**Feature Branch**: `004-round-result-restart`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-08

- Q: Who can end the active round to enter the result state? → A: Host only — only the host can end the round, consistent with the host controlling start and restart (no timer-based or all-correct automatic termination; feature 003 deferred that).
- Q: On restart, what happens to player scores? → A: Reset all to 0 — restart returns the room to a fresh lobby and every player's score is reset to 0 (scores are per-round and do not carry across restarts).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - All players see the round result (Priority: P1)

When the active round ends, every player in the room — drawer and guessers alike — is shown the round result: the correct (secret) word is revealed, each player's final score is listed, and the complete guess history for the round is displayed. This lets the whole room learn the answer, compare scores, and review how the round played out, together.

**Why this priority**: Revealing the result is the payoff of a round — it is the moment players learn the word and see who scored. Without a shared result state there is no closure to the round and no visible outcome. It is the smallest slice that delivers the "see the result" value and is a prerequisite for restarting.

**Independent Test**: Can be fully tested by ending a round with a known secret word and recorded guesses, then confirming that on every player's screen the result state shows the exact secret word, each player's final score, and the full ordered guess history of that round.

**Acceptance Scenarios**:

1. **Given** an active round whose secret word is "apple" has ended, **When** the result state is displayed, **Then** every player in the room sees the word "apple" revealed.
2. **Given** a round in which players accumulated scores, **When** the result state is displayed, **Then** every player sees the final score for each player.
3. **Given** a round with several recorded guesses, **When** the result state is displayed, **Then** every player sees the full guess history for the round in chronological order.
4. **Given** a player who never guessed the word during the round, **When** the result state is displayed, **Then** that player now sees the correct word in the result.

---

### User Story 2 - Host restarts to a fresh lobby (Priority: P1)

From the result state, the host restarts the game. All players are returned to the room's lobby with the same set of players preserved (membership and host role intact), and all round-specific state — the secret word, the drawer assignment, the guess history, the result, and every player's score — is cleared so the room is ready to start a brand-new game.

**Why this priority**: Restart is the explicit action that closes one round and reopens the room for play. Without it, a finished round is a dead end. Together with the result state (US1) it completes the end-of-round loop and lets the same group play again.

**Independent Test**: Can be tested by reaching the result state, having the host restart, and confirming the room is back in the lobby with exactly the same players, while the secret word, drawer assignment, guess history, result, and all scores have been cleared/reset.

**Acceptance Scenarios**:

1. **Given** the result state is displayed, **When** the host restarts, **Then** the room returns to the lobby.
2. **Given** a room with multiple players in the result state, **When** the host restarts, **Then** all of those players are still present in the lobby (no player is removed).
3. **Given** a finished round with a secret word, a drawer, a guess history, and non-zero scores, **When** the host restarts, **Then** the secret word, drawer assignment, guess history, and result are cleared and all player scores are reset to 0.
4. **Given** the room has returned to the lobby after restart, **When** the host chooses to start again, **Then** a new game can be started as if from a fresh pre-game lobby.

---

### User Story 3 - Everyone is synchronized through result and restart (Priority: P2)

The result state and the return-to-lobby on restart are kept in sync for the whole room via periodic polling. When the round ends, every player's screen moves into the result state on its own; when the host restarts, every non-host player's screen returns to the lobby on its own — no manual refresh needed. Only the host can restart; non-host players view the result and wait for the host.

**Why this priority**: Shared, automatic synchronization is what makes the result and restart feel like a single multiplayer moment rather than each player acting alone. The core result and restart behavior (US1, US2) can be demonstrated for the acting player first; this story guarantees every other player follows along consistently.

**Independent Test**: Can be tested with two or more players: end the round and confirm all players enter the result state within the sync interval without refreshing; have the host restart and confirm all non-host players return to the lobby within the sync interval; confirm a non-host player has no ability to restart.

**Acceptance Scenarios**:

1. **Given** two or more players in an active round, **When** the round ends, **Then** within the sync interval every player's view shows the result state.
2. **Given** all players in the result state, **When** the host restarts, **Then** within the sync interval every non-host player's view returns to the lobby without a manual refresh.
3. **Given** a non-host player in the result state, **When** that player looks for a way to restart, **Then** no restart action is available to them; only the host can restart.

---

### Edge Cases

- **Round ends with no correct guesses**: The result still reveals the correct word; final scores may be all 0; the guess history shows whatever incorrect guesses were made (or an empty history if none).
- **Round ends with no guesses at all**: The result reveals the word and shows an empty guess history; all final scores are 0.
- **Correct guesses in the result history**: Because the correct word is revealed in the result state, correct guesses no longer need to be masked; the full history is shown and the word can no longer leak (it is already public).
- **Tied final scores**: When two or more players have the same final score, all are shown with their (equal) scores; tie-breaking/ranking is not required.
- **Non-host attempts to restart**: The restart action is unavailable to non-host players; only the host can restart the game.
- **Host leaves during the result state**: Existing host-transfer rules apply; the player who becomes host can then restart the game.
- **Restart triggered repeatedly**: Restarting is idempotent — the room ends in a single fresh lobby regardless of repeated restart attempts.
- **Player joins while a round is over**: New joins follow existing room-join rules; after restart they are part of the preserved lobby.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the host to end the active round, transitioning the room into a result (round-over) state.
- **FR-002**: When a round has ended, the system MUST place every player in the room into the result state.
- **FR-003**: In the result state, the system MUST reveal the round's correct (secret) word to all players, including those who did not guess it.
- **FR-004**: In the result state, the system MUST display the final score of every player in the room.
- **FR-005**: In the result state, the system MUST display the full, chronologically ordered guess history of the round to all players.
- **FR-006**: In the result state, the system MUST present the full guess history in its entirety; because the correct word is revealed, correct guesses no longer need to be masked in the result view.
- **FR-007**: The result state (revealed word, final scores, and full guess history) MUST be synchronized to all players via the existing periodic polling mechanism, so every player enters the result state without a manual refresh.
- **FR-008**: System MUST allow only the host to restart the game from the result state; non-host players MUST NOT be able to trigger a restart.
- **FR-009**: On restart, the system MUST return all players in the room to the lobby.
- **FR-010**: On restart, the system MUST preserve every player currently in the room, including their identity and the host role (no player is removed by the restart).
- **FR-011**: On restart, the system MUST clear all round state — including the secret word, the drawer assignment, the guess history, and the result state — and MUST reset every player's score to 0.
- **FR-012**: The return to the lobby on restart MUST be synchronized to all players via the existing polling mechanism, so non-host players are moved to the lobby without a manual refresh.
- **FR-013**: After restart, the room MUST be in the same lobby state as a fresh pre-game room (same players, host preserved, no active round), ready for a new game to be started.
- **FR-014**: Restarting MUST be idempotent — repeated restart actions MUST leave the room in a single, consistent fresh lobby state.

### Key Entities *(include if data involved)*

- **Round result (round-over state)**: The terminal state of a finished round, shown to the whole room. Key attributes: the revealed correct word, the final scores of all players, the full ordered guess history, and a round status of "ended". Relationship: belongs to one room; derived from the round that just ended.
- **Lobby state**: The pre-game state of a room with players present and no active round. Key attributes: the set of players, the host, and the absence of round-specific data. Relationship: the state the room returns to after restart (consistent with feature 001).
- **Player**: A participant in the room, preserved across restart. Key attributes: identity, host role (for the host), and a numeric score that is reset to 0 on restart. Relationship: belongs to one room.
- **Room**: The container that has a current state (lobby, active round, or result), a host, and a set of players. Relationship: holds at most one active round or result at a time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a round ends, 100% of players in the room see the correct word revealed in the result state.
- **SC-002**: In the result state, all players see identical final scores and the same full guess history, in 100% of cases.
- **SC-003**: When a round ends, every player's view enters the result state within the polling interval (≈2 seconds) without a manual refresh, in 100% of cases.
- **SC-004**: After the host restarts, every player is returned to the lobby within the polling interval (≈2 seconds) without a manual refresh, in 100% of cases.
- **SC-005**: After restart, 100% of the players who were in the room remain in the room (no player is lost), with the host role preserved.
- **SC-006**: After restart, all round state is cleared in 100% of cases — verified by the absence of a secret word, no drawer assignment, an empty guess history, no result, and all player scores reset to 0.
- **SC-007**: Only the host can restart; 100% of non-host restart attempts are prevented.
- **SC-008**: After restart, the lobby is functionally identical to a fresh pre-game lobby and a new game can be started, in 100% of cases.

## Assumptions

- This feature builds on feature 001 (room/lobby, players, and host) and features 002–003 (active round with a designated drawer, a deterministically selected secret word, per-round scoring starting at 0, and a shared guess history). Those mechanics are reused, not redefined here.
- The host is the player who controls the game (the room owner per features 001/002). For this slice the host both ends the active round (the trigger that produces the result state) and restarts the game; there is no automatic timer-based or all-correct round termination (consistent with feature 003 deferring automatic round termination).
- "Final scores" are the per-game scores accumulated during the round (per feature 003, each starting at 0 at round start). Restart resets every score back to 0.
- Because the correct word is revealed in the result state, the masking of correct guesses used during the live round (feature 003) is no longer needed in the result view; the full guess history is shown.
- "All round state cleared" includes the secret word, the drawer assignment, the guess history, the result/round-over state, and all player scores; player membership and the host role are explicitly preserved.
- Synchronization of the result state and the return-to-lobby uses the existing ~2-second REST polling mechanism (no WebSockets, no new dependencies), consistent with prior features.
- If the host leaves during the result state, the existing host-transfer rules from feature 001 apply, and the new host can restart.
- Out of scope: multi-round games and drawer rotation across rounds, automatic round timers or all-players-guessed round termination, persistent or cross-game leaderboards beyond the per-round final scores, and any history beyond the round that just ended.
