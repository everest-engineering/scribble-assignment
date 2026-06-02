# Feature Specification: Gameplay Flow Build-Out

**Feature Branch**: `001-gameplay-flow`
**Created**: 2026-06-01
**Status**: Draft
**Input**: User description: "The starter gives you a working room creation and join flow so you can verify the app runs immediately. Your job is to add validation, host logic, auto-polling, and build the entire game from scratch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hosted room setup and validation (Priority: P1)
A player can create a room and is automatically assigned as the host. Players can join existing rooms with a code, and invalid or empty codes are rejected with clear feedback.

**Why this priority**: This is the entry point for every game, and host validation is the foundation for safe multiplayer behavior.

**Independent Test**: Open the app, create a room, confirm host state, join from a second browser tab, and verify invalid codes are rejected.

**Acceptance Scenarios**:

1. **Given** a player is on the start page, **When** they create a room, **Then** they become the host and see the lobby with their name, host badge, and a room code.
2. **Given** a second player is on the start page, **When** they enter the room code and player name, **Then** they join the same lobby and see the host listed separately.
3. **Given** a player enters an invalid or empty room code, **When** they submit the join form, **Then** the app displays a clear validation error and does not enter a room.

---

### User Story 2 - Lobby polling and host-only game start (Priority: P2)
The lobby refreshes automatically so all players see current participants and state changes, and only the host can start the game once at least two players are present.

**Why this priority**: Real-time lobby awareness and host control are required before gameplay can begin.

**Independent Test**: Join the room from two tabs, wait for automatic refresh, and verify the start button is enabled only for the host after the second player joins.

**Acceptance Scenarios**:

1. **Given** the lobby is open, **When** a new player joins the room, **Then** the lobby updates automatically within about 2 seconds to show the new participant.
2. **Given** the room has only one player, **When** the host views the lobby, **Then** the "Start Game" action is disabled and a message explains that at least two players are required.
3. **Given** the room has two or more players, **When** the host views the lobby, **Then** the host can start the game and the non-host players cannot.

---

### User Story 3 - Round start, secret word visibility, and guessing (Priority: P2)
When the host starts the game, the system assigns the drawer, reveals the secret word only to the drawer, and allows guessers to submit trimmed, case-insensitive guesses that are synced to all players.

**Why this priority**: This delivers the core gameplay experience and enforces the secret word visibility rules required for a drawing game.

**Independent Test**: Start a round, verify the drawer sees the word and guessers do not, submit a guess, and confirm it appears in both tabs.

**Acceptance Scenarios**:

1. **Given** the host starts the game, **When** the round begins, **Then** one player is identified as the drawer and only that player sees the secret word.
2. **Given** a guesser submits a guess with surrounding spaces, **When** the guess is processed, **Then** the guess is trimmed and stored without leading or trailing whitespace.
3. **Given** a guesser submits an empty or whitespace-only guess, **When** they attempt to submit, **Then** the app shows a validation error and does not send the guess.
4. **Given** one or more guesses are submitted, **When** the lobby or game screen is refreshed by polling, **Then** all players see the same guess history.

---

### User Story 4 - Results, scoring, and restart flow (Priority: P3)
When a round ends, all players see the correct word, final scores, and guess history. The host can restart the game, clearing round state while preserving players and returning everyone to the lobby.

**Why this priority**: This closes the game loop and makes the room reusable for another round.

**Independent Test**: Complete a round, verify the results view, restart from the host tab, and confirm both players are back in the lobby with scores reset for the next round.

**Acceptance Scenarios**:

1. **Given** the round has ended, **When** the result state is displayed, **Then** all players see the correct word, the full guess history, and the score summary.
2. **Given** the host clicks restart, **When** the room returns to the lobby, **Then** player membership remains intact and all round-specific state is cleared.

---

### Edge Cases

- A player attempts to join with an empty display name; the join form rejects it and prompts for a valid name.
- A guess submission with only whitespace is rejected before it reaches the server.
- If a player reloads the page in the lobby or game, automatic polling must recover the current room state if the room still exists.
- Host transfer on leave is out of scope for this iteration; the creator remains host for the room lifecycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST validate room codes and reject invalid or empty codes with a clear message during join.
- **FR-002**: The app MUST trim player names and reject empty or whitespace-only names when creating or joining a room.
- **FR-003**: The room creator MUST be marked as the host and the host role MUST be visible to all participants.
- **FR-004**: Only the host MUST be able to start a game, and the start action MUST remain disabled until at least two players are present.
- **FR-005**: The lobby MUST refresh automatically using polling every ~2 seconds to reflect new players and current room state.
- **FR-006**: When a game starts, the system MUST assign a drawer and reveal the secret word only to that drawer.
- **FR-007**: Guess submissions MUST be trimmed, case-insensitive for comparison, and empty or whitespace-only guesses MUST be rejected.
- **FR-008**: The guess history MUST synchronize to all players so every client sees the same list of submitted guesses.
- **FR-009**: Correct guesses MUST award 100 points and incorrect guesses MUST award 0 points.
- **FR-010**: After a round ends, the final result view MUST display the correct word, the full guess history, and cumulative scores to all players.
- **FR-011**: When the host restarts the game, the room MUST return to the lobby state with all players preserved and all round state cleared.
- **FR-012**: Room state MUST remain isolated per code and not leak between different room codes.

### Key Entities

- **Room**: A game room identified by a unique code, containing players, host identity, current round state, and score information.
- **Player**: A participant with a display name, host flag, current score, and game role (drawer or guesser).
- **Round**: The active game state for a single drawing session, including drawer assignment, secret word, guess history, and completion status.
- **Guess**: A player-submitted text value that is trimmed and compared case-insensitively to the secret word.
- **Scoreboard**: Aggregated player scores that update after each round and are visible to all participants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempted joins with invalid room codes must show a validation error instead of entering a room.
- **SC-002**: The host can start the game only after the room has at least two validated players.
- **SC-003**: Lobby updates appear for new participants within 2 seconds of a change in room membership.
- **SC-004**: The drawer sees the secret word after game start and guessers do not.
- **SC-005**: Empty or whitespace-only guesses are rejected before server submission.
- **SC-006**: Guess history is consistent for all active players in the room during polling refreshes.
- **SC-007**: After a round ends, all players see the same correct word, the same history of guesses, and the same score totals.
- **SC-008**: Restarting the game returns all players to the lobby without removing them from the room.

## Assumptions

- The starter room creation and join flow already works and can be reused for this feature.
- In-memory room state is acceptable; restarting the backend clears all rooms.
- The app will use polling rather than WebSockets for lobby and game state synchronization.
- No authentication or player accounts exist; identity is based on the display name for the current room.
- Host transfer on leave is outside scope for this iteration; the original creator remains host for the active room.
