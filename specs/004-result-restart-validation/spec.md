# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation - Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

When a round ends (either the word is guessed or time runs out), all players — including the drawer and guessers — immediately see a results screen that reveals the correct word, shows final scores for the round, and displays the complete guess history from that round.

**Why this priority**: This is the core payoff moment of the game. Without visible results, players have no feedback on how they performed or what the correct word was. It is the minimum viable end-of-round experience.

**Independent Test**: Can be fully tested by ending a round (correct guess or timeout) and verifying that the results screen appears for every connected player simultaneously, showing the correct word, updated scores, and all guesses made during the round.

**Acceptance Scenarios**:

1. **Given** a round is in progress and a player guesses the correct word, **When** the round ends, **Then** all connected players see the results screen with the revealed correct word, the full ordered list of guesses made during the round, and each player's score for the round.
2. **Given** a round is in progress and the timer expires without a correct guess, **When** time runs out, **Then** all connected players see the results screen with the correct word revealed, all guesses displayed, and scores updated to reflect no one guessed correctly.
3. **Given** multiple players are connected, **When** results are displayed, **Then** every player (including the drawer) sees identical results content at the same time.
4. **Given** a player joins mid-round or reconnects just as the round ends, **When** results are displayed, **Then** that player also sees the correct results screen (no blank or missing state).

---

### User Story 2 - Host Restarts the Game (Priority: P2)

After results are displayed, the host can initiate a restart that sends all players back to the lobby. The player roster is preserved (no one is removed), but all round-specific state — scores, guesses, drawer assignment, secret word, and timer — is cleared so a fresh round can begin.

**Why this priority**: Without a restart mechanism, the game has no replay loop. The host needs to be able to drive the game forward; and players need confidence that a restart cleanly resets the game without kicking anyone out.

**Independent Test**: Can be tested by having a host click Restart after round results, then verifying all players land on the lobby screen with the same player list as before the round and no residual round data visible.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed, **When** the host clicks the Restart button, **Then** all connected players are navigated to the lobby screen.
2. **Given** a restart occurs, **When** players arrive at the lobby, **Then** the player list matches the players who were in the game before the round (no one is removed or duplicated).
3. **Given** a restart occurs, **When** players arrive at the lobby, **Then** no round data is visible: scores are reset, guess history is cleared, drawer role is unassigned, and the secret word is no longer accessible to any player.
4. **Given** a restart occurs, **When** a non-host player views the lobby, **Then** they see the standard pre-game lobby (not a results screen or game screen) and the Start button is only available to the host.
5. **Given** the host is not present (disconnected), **When** results are showing, **Then** non-host players see the results screen but the Restart button is either absent or disabled until a host is available.

---

### User Story 3 - Score Visibility and Persistence Within Session (Priority: P3)

Players can see cumulative scores across rounds during the session. When results are displayed, scores reflect all rounds played so far, not just the current round.

**Why this priority**: Cumulative scoring adds strategic depth and replay motivation. It is secondary to basic results display and restart, but makes the results screen substantially more meaningful.

**Independent Test**: Can be tested by playing two consecutive rounds and verifying that the results screen after round two shows the sum of both rounds' scores, not just round two's score.

**Acceptance Scenarios**:

1. **Given** at least two rounds have been played, **When** the results screen is shown after the second round, **Then** each player's displayed score is the sum of all rounds played in the current session.
2. **Given** a restart occurs and a new round is played, **When** results are displayed, **Then** scores from the previous round(s) are included in the cumulative total unless scores are explicitly reset on restart.

---

### Edge Cases

- What happens when a player disconnects just as the round ends — do they receive the results screen on reconnect?
- How does the system handle the host disconnecting while results are being shown — who can trigger restart?
- What happens if a restart is triggered before all players have loaded the results screen?
- What if zero guesses were made during the round — does the guess history show an empty state cleanly?
- What if the game has only one player (drawer and no guessers) — are results still shown correctly?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a results screen to all connected players simultaneously when a round ends (by correct guess or timer expiry).
- **FR-002**: Results screen MUST show the correct word that was being drawn.
- **FR-003**: Results screen MUST display the complete, ordered guess history for the round (all guesses, not only correct ones).
- **FR-004**: Results screen MUST display each player's score for the current round and their cumulative session score.
- **FR-005**: Results screen MUST be visible to the drawer as well as all guessers.
- **FR-006**: Host MUST be able to trigger a restart from the results screen via a clearly labeled Restart (or "Play Again") action.
- **FR-007**: On restart, all connected players MUST be navigated to the lobby screen.
- **FR-008**: On restart, the player roster MUST be preserved — no players are removed from the session.
- **FR-009**: On restart, all round state MUST be cleared: secret word, drawer assignment, guess history, per-round scores, and timer state.
- **FR-010**: On restart, cumulative session scores MUST be retained (not reset) so running totals persist across rounds.
- **FR-011**: Only the host MUST be able to trigger a restart; the Restart button MUST be hidden or disabled for non-host players.
- **FR-012**: System MUST handle the case where the host is absent (disconnected) by disabling or hiding the Restart button until a host is present.

### Key Entities

- **Round Result**: Snapshot of a completed round — correct word, ordered guess list, per-player scores, and round outcome (guessed / timed out).
- **Game Session**: Persistent container for connected players and cumulative scores across multiple rounds; survives individual round resets.
- **Player**: Participant in the session with a display name, role (host / drawer / guesser), and cumulative score.
- **Guess**: A single guess attempt — player name, guess text, timestamp, and whether it was correct.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All connected players see the results screen within 1 second of a round ending.
- **SC-002**: Results screen displays the correct word, full guess history, and scores with 100% accuracy (no data missing or mismatched across players).
- **SC-003**: After a host-triggered restart, 100% of connected players land on the lobby screen within 2 seconds.
- **SC-004**: Zero round-state leakage after restart — no secret word, drawer role, or guess history is accessible to any player from the lobby.
- **SC-005**: Player roster is fully preserved across restarts — no players are dropped from the session.
- **SC-006**: 100% of tested reconnection scenarios show the results screen (or lobby if restart already occurred) rather than a blank or broken state.

## Assumptions

- The game already has a working round lifecycle (game screen, timer, guess submission) from earlier features; this feature adds the post-round results and restart phase only.
- Cumulative scores reset only when the entire session ends (all players leave), not on per-round restarts.
- The drawer does not earn points in the standard scoring model; only guessers who guess correctly score points (consistent with the existing game design).
- A "host" role is already established in the session model; the same host who started the round can trigger a restart.
- If the host disconnects and no host-promotion logic exists, the Restart button is simply disabled — host promotion is out of scope for this feature.
- All players are assumed to have a stable enough connection that simultaneous state transitions (results display, lobby navigation) are achievable via the existing real-time messaging layer.
- Mobile support and accessibility (WCAG 2.1 AA keyboard navigation) apply per the project constitution and are not separately scoped here.
