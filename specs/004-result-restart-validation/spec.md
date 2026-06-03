# Feature Specification: Scribble Game Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scribble game Result, Restart & Final Validation — As a user I should be able to see the correct word and final score once a round ends. Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

When a round ends (either the timer expires or the word is guessed), every player in the room immediately sees the results screen. This screen shows the correct word that was being drawn, each player's final score for the round, and the full history of guesses made during the round.

**Why this priority**: This is the core outcome of each round — without it, players have no feedback on how they performed and whether they guessed correctly. It is the minimum viable closure for any round.

**Independent Test**: Can be fully tested by ending a round and verifying that all connected players see the results screen with the correct word, scores, and guess history.

**Acceptance Scenarios**:

1. **Given** a round is in progress, **When** the timer expires, **Then** all players simultaneously see the results screen displaying the correct word, each player's score, and the complete list of guesses made during the round.
2. **Given** a round is in progress, **When** a player correctly guesses the word, **Then** the round ends and all players see the results screen showing the correct word, updated scores, and full guess history.
3. **Given** the results screen is displayed, **When** a player views it, **Then** they can see their own score alongside all other players' scores in a ranked or listed format.
4. **Given** the results screen is displayed, **When** a player who never guessed the word views it, **Then** they still see the correct word revealed along with all guesses that were made.

---

### User Story 2 - Host Restarts Game to Lobby (Priority: P2)

After the results screen is displayed, the host can trigger a restart that returns the entire room to the lobby. All players are preserved in the room, but all round-specific state (current word, scores, guesses, drawing canvas) is cleared so a new round can begin fresh.

**Why this priority**: Enables the game session to continue without players needing to leave and rejoin. Players preserved in the lobby ensures continuity of the social game session.

**Independent Test**: Can be fully tested by having the host press restart on the results screen and verifying all players return to the lobby with their names still listed but all round data gone.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed, **When** the host clicks the restart/return-to-lobby button, **Then** all players are transitioned to the lobby screen and the player list is intact.
2. **Given** the host has restarted the game, **When** players arrive at the lobby, **Then** no previous round data (scores, guesses, drawn word) is visible.
3. **Given** the host has restarted the game, **When** a non-host player views the lobby, **Then** they see the same player list as before the round, with no round data remaining.
4. **Given** the results screen is displayed, **When** a non-host player attempts to restart the game, **Then** the restart action is not available to them (only the host can restart).

---

### User Story 3 - Persistent Guess History on Results Screen (Priority: P3)

All guesses submitted during the round are shown on the results screen so every player can review what was attempted, identify who guessed closest or first, and understand the progression of the round.

**Why this priority**: Adds replay value and transparency to the outcome. Players can review the history to understand why certain scores were awarded. Lower priority than viewing the result itself but significantly improves experience.

**Independent Test**: Can be fully tested by making several guesses during a round, ending the round, and confirming the results screen lists all submitted guesses in order.

**Acceptance Scenarios**:

1. **Given** multiple guesses were submitted during a round, **When** the results screen appears, **Then** all guesses are displayed in chronological order with the player name associated with each guess.
2. **Given** no guesses were submitted during a round, **When** the results screen appears, **Then** the guess history section shows an empty state message (e.g., "No guesses were made this round").
3. **Given** a correct guess was made, **When** the results screen appears, **Then** the correct guess is visually distinguished from incorrect guesses in the history.

---

### Edge Cases

- What happens when only one player is in the room when the round ends?
- How does the system handle a player disconnecting mid-round — are their guesses still shown in the history?
- What if the host disconnects before clicking restart — can another player assume host or is restart blocked?
- What happens if a player joins the room while the results screen is showing — do they see results or go straight to lobby?
- What if the round ends at the exact moment a player submits a final guess — is that guess included in history?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the correct word to all players when a round ends, regardless of whether the word was guessed.
- **FR-002**: System MUST show each player's final score for the completed round on the results screen.
- **FR-003**: System MUST display the full chronological guess history from the round, including the player name for each guess.
- **FR-004**: System MUST visually distinguish correct guesses from incorrect guesses in the guess history.
- **FR-005**: System MUST transition all connected players to the results screen simultaneously when a round ends.
- **FR-006**: System MUST allow only the host to trigger a return-to-lobby restart from the results screen.
- **FR-007**: System MUST return all current players to the lobby when the host initiates a restart, preserving the player list.
- **FR-008**: System MUST clear all round-specific state (word, scores, guesses, canvas) when the host initiates a restart.
- **FR-009**: System MUST show an empty state message in the guess history if no guesses were submitted during the round.
- **FR-010**: System MUST handle a late-joining player during the results screen by either showing them the results or redirecting them to the lobby.

### Key Entities

- **Round Result**: The outcome snapshot of a completed round — includes the correct word, all player scores, and the ordered guess history.
- **Player**: A participant in the room, identified by name; persisted across the restart into the lobby.
- **Guess**: A single guess attempt submitted during the round — includes the player who made it, the guess text, and whether it was correct.
- **Room**: The shared game session containing players, round state, and the results; persists across rounds with the same players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results screen (correct word, scores, and guess history) within 2 seconds of a round ending.
- **SC-002**: 100% of players in the room at round-end are shown accurate scores and the correct word — no player sees stale or missing data.
- **SC-003**: The full guess history on the results screen is complete — no guesses submitted during the round are missing.
- **SC-004**: After the host triggers a restart, all players arrive in the lobby within 3 seconds and the player list matches the pre-round player list exactly.
- **SC-005**: Zero round-specific data (word, guesses, scores) is visible to any player after a successful restart to the lobby.
- **SC-006**: 95% of playtest sessions conclude a round and return to the lobby without requiring a page refresh or manual reconnect.

## Assumptions

- A "round" ends when either the timer reaches zero or a player correctly guesses the word — both trigger the results screen.
- All players currently connected to the room will receive the results screen transition; disconnected players are excluded.
- Scores are calculated server-side before the results screen is shown; the results screen is display-only.
- The host role is assigned at room creation and remains with that player unless they disconnect; host-disconnect handling is out of scope for this feature.
- Players who join the room during the results screen are treated as new late-joiners and are redirected to the lobby on restart.
- Round history (the guess log) is scoped to a single round; it does not accumulate across multiple rounds.
- The restart action returns players to the pre-game lobby, not directly into a new round — the host must start a new round manually from the lobby.
