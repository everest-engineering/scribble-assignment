# Feature Specification: Round Result & Restart

**Feature Branch**: `004-round-result-restart`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation - Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-11

- Q: How should mid-round joiners (0 guesses, 0 score) appear on results? → A: Include in score list with 0, include in guess history with empty list.
- Q: Does a new round auto-start after restart or wait for host? → A: Host must manually start a new round from lobby.
- Q: Can non-host players leave results screen before restart? → A: Yes, players can navigate back to lobby freely while waiting for host action.
- Q: What is the numeric target for "within one normal poll interval" in SC-001? → A: 3 seconds (matching the ~2s assumption with headroom).
- Q: How should the client handle a restart request failure? → A: Show an inline error message on the restart button; host can retry manually. No auto-retry.
- Q: What should the results page display while initially loading data? → A: Show a "Loading results…" placeholder/spinner until the first poll response with results data arrives.
- Q: How should the client handle poll failures during the results phase? → A: Show a "Connection lost" error toast at the top of the page; keep showing the last known results view. The toast auto-dismisses when polling resumes successfully.
- Q: How should the score list on the results screen be ordered? → A: Ranked by score descending (highest score first).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

When a round ends (either by time expiry or all players guessing correctly), every player in the room sees a results screen showing the correct word, their final score for that round, and every guess made during the round.

**Why this priority**: This is the core visible outcome of the feature — without results display, players have no feedback on how the round ended, who guessed correctly, and what the correct word was.

**Independent Test**: Can be fully tested by playing a single round to completion and verifying that every participant sees the correct word, a final score per player, and the full chronological guess log.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the results screen, **Then** they see the correct word for that round displayed prominently.
2. **Given** a round has ended, **When** any player views the results screen, **Then** they see each player's final score for the round.
3. **Given** a round has ended, **When** any player views the results screen, **Then** they see the full guess history showing every guess submitted during the round, in chronological order, alongside the player who made it.
4. **Given** a player joins the room after a round has ended, **When** they poll for room state, **Then** they see the same results screen as existing players (including the correct word and guess history from before they joined).

---

### User Story 2 - Host Restarts from Results (Priority: P2)

The player who created the room (the host) can trigger a restart from the results screen, returning all players to the lobby with their membership intact but all round-specific data cleared.

**Why this priority**: Restarting enables repeated play without re-creating the room. Players remain in the room; only round state is discarded.

**Independent Test**: Can be fully tested by having the host press the restart control on the results screen and verifying that every player lands back in the lobby with the same player roster and a clean slate.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed, **When** the host triggers a restart, **Then** all players transition to the lobby screen within one poll cycle.
2. **Given** the results screen is displayed, **When** the host triggers a restart, **Then** the player list in the lobby is identical to the player list during the round (same players, no additions or removals).
3. **Given** the results screen is displayed, **When** the host triggers a restart, **Then** all round-specific state is cleared: the correct word, per-player scores, guess history, and any active drawer assignment are reset to their pre-round defaults.
4. **Given** the results screen is displayed and a non-host player attempts to trigger a restart, **Then** the action is rejected; only the host can restart.

---

### User Story 3 - Restart Reflects for Late Joiners (Priority: P3)

A player who was disconnected or joined during the results screen sees the correct state after a restart — they return to the lobby alongside everyone else.

**Why this priority**: Ensures consistency for players who may have a slightly delayed or out-of-sync view.

**Independent Test**: Can be tested by having a player poll the room state just after a restart and confirming they receive lobby data (not round result data).

**Acceptance Scenarios**:

1. **Given** a player is viewing the results screen but has not yet seen the restart, **When** they poll the room state after the restart occurred, **Then** they receive the lobby state rather than stale round results.
2. **Given** a player joins the room for the first time immediately after a restart, **When** they poll for room state, **Then** they see the lobby with the current player list and no residual round data.

---

### Edge Cases

- **Host disconnection**: If the host disconnects during the results screen, no restart can be triggered. Players remain viewing results. A new host is not automatically assigned.
- **Empty guess history**: If no guesses were made during the round, the guess history section displays an empty list rather than an error or missing element.
- **Rapid restart**: If the host restarts while some players have not yet loaded the results screen, those players transition directly from their in-round state to the lobby without seeing results.
- **All-correct round**: If all players guessed the word correctly, the results screen still shows the full guess history (including each correct guess) and final scores.
- **Single-player room**: If only one player is in the room, the results screen still shows the correct word, that player's score, and their guesses (if any); the host restart behavior is unchanged.
- **Mid-round joiner on results**: A player who joined after the round started but before it ended appears in the score list with a score of 0 and in the guess history with an empty list. They are not hidden from either section.
- **Navigate to lobby during results**: A non-host player may navigate their client to the lobby view while the server-side room state is still "results". The lobby during this time shows the player list and indicates a round is in results awaiting host restart. This navigation does not remove the player from the room.
- **Restart request failure**: If the host triggers a restart and the API request fails (network error or server error), the restart button shows an inline error message. The host can retry manually. The room state remains "results" and is unaffected by the failed request.
- **Results page loading state**: While the results page is waiting for its first poll response, it displays a "Loading results…" placeholder/spinner rather than stale data or a blank screen.
- **Poll failure during results**: If a client's poll request fails during the results phase, a "Connection lost" error toast is shown at the top of the page. The last known results view remains visible. The toast auto-dismisses when polling resumes successfully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round ends, the system MUST present a results state that includes the correct word for that round.
- **FR-002**: The results state MUST include the final score of each player for the round, ranked in descending order (highest score first).
- **FR-003**: The results state MUST include the full chronological guess log for the round, associating each guess with the player who made it.
- **FR-004**: The host MUST have a visible and operable restart control on the results screen.
- **FR-005**: Non-host players MUST NOT be able to trigger a restart; their restart controls MUST be absent or disabled.
- **FR-006**: When the host triggers a restart, the system MUST transition all players to the lobby state.
- **FR-007**: After a restart, the player roster in the lobby MUST be identical to the roster during the round.
- **FR-008**: After a restart, all round-specific data (correct word, per-player scores, guess history, drawer assignment, round timer) MUST be cleared.
- **FR-009**: Players who were in the room at any point during the round MUST NOT be removed from the room on restart.
- **FR-010**: The results state MUST be available to any player who polls for room state while the round has ended but before a restart occurs.
- **FR-011**: After a restart, the lobby state MUST be the same as the initial lobby (with players preserved); the host MUST start a new round manually — no round auto-starts on restart.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a game session containing a group of players. Has a lifecycle of lobby → round → results → lobby. Carries a player list that persists across restarts. While the server room state is "results", individual players may navigate their client to view the lobby; the server-side room state only advances to "lobby" when the host triggers a restart.
- **RoundState**: Encapsulates all data specific to a single round: the correct word, per-player scores, the full chronological guess log, the active drawer identity, and the round status (in-progress, ended). Cleared on restart.
- **Player**: An individual participant in a room. Identified by a unique ID and display name. Has a cumulative score tracked only within a single round (not persisted across restarts). Default score is 0 for players who did not participate.
- **Guess**: A single guess submitted by a player during a round. Contains the player's identity, the guessed text, and a timestamp/sequence indicator to preserve chronological ordering.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every player in the room sees identical results data (correct word, scores, guess history) within 3 seconds of the round ending.
- **SC-002**: The host can trigger a restart with at most one intentional action (e.g., a single button press).
- **SC-003**: All players who were in the room during the round are present in the lobby after restart with no phantom additions or unexpected removals.
- **SC-004**: After restart, no round-specific data is visible or accessible via the room state — only lobby-level data is returned.
- **SC-005**: A player who joins during the results screen sees the same result information as existing players, with no access to any prior round data.

## Assumptions

- The game already has a working single-round lifecycle (lobby setup, drawer selection, word assignment, guessing).
- A "host" concept already exists: the player who created the room has host privileges (ability to start the round, and now to restart).
- Players poll for room state at a regular interval (~2 seconds); state transitions are reflected on the next poll.
- The round ends either when the correct word is guessed by all players or by the other existing round-end trigger (e.g., timer expiry).
- The lobby state already supports a player list display and a "start new round" or equivalent action.
- No new player-specific permissions or roles are introduced beyond the existing host/non-host distinction.
