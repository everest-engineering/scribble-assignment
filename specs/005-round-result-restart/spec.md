# Feature Specification: Round Result, Restart & Final Validation

**Feature Branch**: `005-round-result-restart`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation: Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-05-30

- Q: Does the result screen auto-dismiss after a timer, or persist until the host restarts? → A: Persist indefinitely until the host manually clicks restart.
- Q: After restart returns everyone to the lobby, does the next round auto-start or require manual action? → A: Manual start — the host must click "Start Game" again from the lobby to begin a new round.
- Q: What happens if the host disconnects while the result screen is displayed? → A: Host role transfers to the next eligible player in the room; the result screen remains displayed for all players.
- Q: What does a player who joins while the result screen is displayed see? → A: They see the same result data (secret word, scores, guess history) as existing players.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round result display (Priority: P1)

When a round ends (by timer or all guessers guessing correctly), all players see the round's outcome including the secret word, final scores, and complete guess history so that they can understand how the round played out.

**Why this priority**: Players cannot evaluate their performance or prepare for the next round without seeing the results. This is the essential feedback loop that closes each round.

**Independent Test**: Can be tested by playing a round to completion and verifying all players see the correct word, their scores, and the complete guess history on the result screen.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** any player views the result screen, **Then** they see the secret word that was assigned for that round.
2. **Given** a round has ended with multiple guessers having different scores, **When** any player views the result screen, **Then** they see the final scores for all players ranked in descending order.
3. **Given** a round has ended after multiple guesses were submitted, **When** any player views the result screen, **Then** they see the full guess history for that round including each guesser's name, their guess text, and whether it was correct or incorrect, in chronological order.
4. **Given** a round ended because a guesser guessed correctly, **When** the result screen is displayed, **Then** the correct guess is highlighted as the winning guess.

---

### User Story 2 - Host restart to lobby (Priority: P1)

After viewing the round results (which persist indefinitely until the host acts), the host can restart the game, returning all players to the lobby with their player identities preserved and all round-specific state cleared, so that the host can manually start a new game from the lobby without re-inviting anyone.

**Why this priority**: The ability to play multiple rounds without re-forming the group is essential for a smooth multiplayer experience. Without restart, players would need to create a new room and re-invite everyone.

**Independent Test**: Can be tested by completing a round, having the host click restart, and verifying all players land in the lobby with the same player list and no round data visible.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed and the current user is the host, **When** the host clicks a "Restart" or "Play Again" button, **Then** all players are redirected to the lobby screen.
2. **Given** all players have been redirected to the lobby after a restart, **When** any player views the lobby, **Then** the same set of players from the previous game are present (no one was removed or disconnected).
3. **Given** the lobby is shown after a restart, **When** any player views the lobby, **Then** no round-specific data is visible (no scores, no secret word, no guess history, no canvas).
4. **Given** the result screen is displayed and the current user is NOT the host, **When** that non-host player views the screen, **Then** they do not see a "Restart" button — only the host can trigger a restart.
5. **Given** the host triggers a restart, **When** a non-host player polls for state updates, **Then** they receive the lobby state (not round or result state).

---

### User Story 3 - Simultaneous result viewing for all players (Priority: P2)

When a round ends, all players transition to the result screen at approximately the same time, ensuring no player is left in the drawing or guessing state while others see results.

**Why this priority**: Ensures all players share the same game phase, preventing confusion about the current state of the game.

**Independent Test**: Can be tested by having multiple players in a round and verifying all transition to the result screen within a short time window after the round ends.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the round ends (timer expires or all guessers guess correctly), **Then** all players transition from the active round to the result state within 2 seconds.
2. **Given** a player has a slow or intermittent connection, **When** the round ends, **Then** that player still transitions to the result screen (eventually) and sees the same result data as all other players.

---

### Edge Cases

- What happens if the host disconnects during the result screen? (Host role is transferred to the next eligible player in the room; the result screen remains displayed for all players, and the new host can now trigger restart.)
- What happens if a player joins the room while the result screen is displayed? (They see the same result data as existing players — the secret word, scores, and guess history for the completed round.)
- What happens if the host clicks restart while some players have not yet seen the result screen (e.g., slow polling)? (All players eventually receive the lobby state — late arrivals skip the result screen and go directly to lobby.)
- What happens if all guessers guessed correctly before the timer expires? (The round ends immediately — the result screen shows the winning guesses and final scores.)
- What happens if no guesses were submitted during the round? (The result screen still shows the secret word, scores remain at 0, and the guess history is empty.)
- What happens if the host refreshes the page during the result screen? (The host sees the same result data upon reconnection, since the result screen persists indefinitely. If restart was already triggered by another client, they see the lobby.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round ends, the system MUST transition all players to a "result" state and display the round's result screen to every player.
- **FR-002**: The result screen MUST display the secret word that was used in the just-completed round.
- **FR-003**: The result screen MUST display the final scores for all players, ranked from highest to lowest.
- **FR-004**: The result screen MUST display the full guess history for the just-completed round, showing each guesser's name, their guess text, whether it was correct, and the chronological order.
- **FR-005**: The result screen MUST highlight the first correct guess (the winning guess).
- **FR-006**: Only the host MUST have the ability to trigger a restart from the result screen — non-host players MUST NOT see or have access to a restart control.
- **FR-007**: When the host triggers a restart, the system MUST return all players to the lobby state.
- **FR-008**: The lobby after restart MUST contain the same set of players who were in the game before the restart (no player removal due to restart).
- **FR-009**: When returning to lobby after restart, ALL round-specific state MUST be cleared (scores reset to 0, secret word removed, guess history cleared, canvas cleared).
- **FR-010**: When a round ends and no guesses were submitted, the system MUST still display the result screen with the secret word, zero scores, and an empty guess history.

### Key Entities *(include if feature involves data)*

- **Round Result**: The snapshot of round data displayed after a round ends. Contains the secret word, final scores for all players, and the complete guess history. Immutable once generated.
- **Game Session**: Tracks the overall game lifecycle — transitions through states: in-progress → result → lobby (on restart). The restart action moves the game back to lobby state.
- **Player (game context)**: Persists across rounds within a game session. Scores are reset on restart but player identity remains.
- **Guess History**: An ordered list of all guesses submitted during the round, with each entry containing the guesser's name, the guess text, a correctness flag, and a timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the result screen within 2 seconds of the round ending.
- **SC-002**: The result screen displays the correct secret word, accurate final scores, and complete guess history for 100% of completed rounds.
- **SC-003**: All players return to the lobby within 3 seconds of the host clicking restart.
- **SC-004**: After restart, 100% of players from the previous game are present in the lobby.
- **SC-005**: After restart, no round-specific data (scores, word, guesses, canvas) is visible in the lobby — all values are at initial/empty state.
- **SC-006**: A host can successfully restart and begin a new game at least 10 consecutive times without any data contamination between rounds.
- **SC-007**: Players with a temporarily interrupted connection who reconnect after restart see the lobby state (not old round data).

## Assumptions

- The host is identified by the room creator flag, which persists across rounds within a single game session.
- The restart flow returns players to the same lobby/room — no new room creation is needed.
- The timer for round duration is managed by a separate feature (round lifecycle).
- Players who disconnect during the result screen and reconnect before restart will still see the result data. Players who reconnect after restart will see the lobby.
- The lobby preserves player identities and room settings (e.g., round timer, max players) from the previous game.
- The minimum player count rule (2+ players) is checked again when the host starts a new game from the lobby after restart.
