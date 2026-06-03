# Feature Specification: Game Result and Restart

**Feature Branch**: `004-game-result-restart`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-03

- Q: What should happen if the host disconnects while on the result screen? → A: Transfer host privileges to another player so the room can continue.
- Q: How do players transition back to the lobby when the host restarts? → A: Instant transition for all players immediately upon the host clicking Restart.
- Q: What happens if a player (non-host) disconnects while on the result screen? → A: They are removed from the room and will not be in the lobby upon restart.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

As a player, I want to see the correct word, final scores, and the full guess history when the round ends, so that I can see how well everyone did.

**Why this priority**: Essential for the game loop to have a clear conclusion and provide closure and feedback to the players.

**Independent Test**: Can be tested by manually transitioning the game into the result state and verifying the UI displays the correct word, scores, and all guesses made during the round.

**Acceptance Scenarios**:

1. **Given** a round has just ended, **When** the result state is displayed, **Then** all players see the correct word that was being drawn.
2. **Given** a round has ended, **When** the result state is displayed, **Then** all players see the final scores for all participants.
3. **Given** a round has ended, **When** the result state is displayed, **Then** all players can see the complete history of guesses made during that round.

---

### User Story 2 - Restart Game to Lobby (Priority: P1)

As a host, I want to restart the game from the results screen, so that we can play another round with the same group of players.

**Why this priority**: Necessary to play multiple times without having to create a new room and share a new link.

**Independent Test**: Can be fully tested by clicking the restart button as the host and verifying all connected clients are routed to the lobby state with a clean slate.

**Acceptance Scenarios**:

1. **Given** the game is in the result state, **When** the host clicks "Restart", **Then** everyone is immediately returned to the lobby.
2. **Given** the host restarts the game, **When** players return to the lobby, **Then** the list of players is preserved exactly as it was.
3. **Given** the host restarts the game, **When** the lobby loads, **Then** all previous round state (scores, drawings, chat history, selected word) is entirely cleared.

### Edge Cases

- **Player Disconnect**: If a non-host player disconnects while on the result screen, they are removed from the room and will not be present in the lobby upon restart.
- **Host Disconnect**: If the host disconnects while on the result screen, host privileges are transferred to another random player so the room can continue and eventually restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition all clients to a result state when a round concludes.
- **FR-002**: System MUST display the correct word to all players on the result screen.
- **FR-003**: System MUST display the final scores for all players on the result screen.
- **FR-004**: System MUST display the full chat/guess history on the result screen.
- **FR-005**: System MUST allow only the designated host to trigger a game restart from the result screen.
- **FR-006**: System MUST return all players to the lobby view instantly when the host triggers a restart.
- **FR-007**: System MUST preserve the existing room code and the list of connected players across a restart.
- **FR-008**: System MUST clear all round-specific state (including scores, guess history, canvas drawing data, and the selected word) upon restart.

### Key Entities

- **Room**: Contains the state of the game (Lobby, Playing, Result), the list of players, and the host identifier.
- **Round State**: Contains transient data like scores, current word, drawing actions, and guesses, which must be reset on restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can view the final round statistics (word, scores, guesses) without data loss or UI errors.
- **SC-002**: Host can restart the game and transition all connected players back to the lobby state instantly.
- **SC-003**: 100% of previous round data (guesses, drawings, scores) is verifiably cleared from the active state upon returning to the lobby.

## Assumptions

- The game consists of single rounds, after which players return to the lobby to start completely fresh.
- Only the host has the authority to restart the game.
