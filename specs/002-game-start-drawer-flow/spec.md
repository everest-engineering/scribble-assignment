# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Game start and drawer flow - Player name validation (trim, reject empty), drawer assignment, deterministic secret word selection, drawer-only word visibility"

## Clarifications

### Session 2026-06-01

- Q: How are duplicate display names handled? → A: Duplicate names are rejected (case-sensitive comparison after trimming).
- Q: Who can start the game? → A: Only the room creator can start the game.
- Q: Are display names case-sensitive for duplicate detection? → A: Yes, names are case-sensitive ("Alice" and "alice" are distinct).
- Q: How is the drawer deterministically assigned? → A: The drawer is the player who has been in the room the longest (first to join).
- Q: What happens if the drawer disconnects mid-game? → A: A new drawer is assigned from remaining players (next longest-joined); if all players leave, the game ends.

## User Scenarios & Testing

### User Story 1 - Join a Game Room with a Valid Name (Priority: P1)

A player navigates to a game room and enters a display name to join. The system validates the name by trimming whitespace and rejecting empty or whitespace-only names. Once accepted, the player appears in the room's player list alongside other joined players.

**Why this priority**: Name validation is the entry point for all subsequent game interactions. Without it, no player can participate.

**Independent Test**: A player can join a room with a non-empty trimmed name and see themselves listed alongside other players. Attempting to join with an empty or whitespace-only name shows a clear rejection.

**Acceptance Scenarios**:

1. **Given** a player is in the join screen of an existing game room, **When** they enter a display name with leading and trailing whitespace (e.g. "  Alice  "), **Then** the name is trimmed to "Alice" and the player joins the room successfully.
2. **Given** a player is in the join screen of an existing game room, **When** they submit an empty string as their name, **Then** the system rejects the submission and displays an informative error message.
3. **Given** a player is in the join screen of an existing game room, **When** they submit a name consisting only of whitespace characters, **Then** the system rejects the submission and displays an informative error message.
4. **Given** a player has joined a room with the name "Alice", **When** another player attempts to join the same room with the trimmed name "Alice", **Then** the system rejects the duplicate with an informative error message.
5. **Given** a player has joined a room with the name "Alice", **When** another player attempts to join the same room with the name "alice", **Then** the system accepts the name (case-sensitive comparison — "Alice" and "alice" are distinct).

---

### User Story 2 - Start the Game and Assign a Drawer (Priority: P1)

Once enough players have joined the room, the game can be started. The system deterministically assigns one player as the drawer for the round. All other players become guessers.

**Why this priority**: Drawer assignment is the core game mechanic. Without knowing who draws, no game can proceed.

**Independent Test**: When a room with the minimum required players starts a game, exactly one player is assigned as the drawer and the remaining players are assigned as guessers. The assignment is deterministic — the same set of players starting the game under the same conditions always yields the same drawer.

**Acceptance Scenarios**:

1. **Given** a room with at least the minimum number of players (default: 2), **When** the game starts, **Then** exactly one player is assigned as the drawer.
2. **Given** a room with exactly 2 players, **When** the game starts, **Then** one player is the drawer and the other is a guesser.
3. **Given** a room with 5 players, **When** the game starts, **Then** exactly one player is the drawer and the remaining four are guessers.
4. **Given** the same set of players in two separate game sessions (or after a reset), **When** the game starts, **Then** the drawer assignment produces the same result each time for the same input state.

---

### User Story 3 - Secret Word Selection and Drawer-Only Visibility (Priority: P1)

When the game starts, the system deterministically selects a secret word from a predefined word pool. The selected word is displayed only to the drawer. Guessers see that a word has been selected but cannot see the word itself.

**Why this priority**: The secret word is the core game content. The drawer must know it to draw, and guessers must not see it to preserve the game.

**Independent Test**: When a game starts, the drawer can see the secret word on their screen, while guessers see an indication that a word has been selected (e.g., "The word has been chosen") without revealing the word itself. The same game state always produces the same word.

**Acceptance Scenarios**:

1. **Given** a game has started with a drawer assigned, **When** the drawer views their game screen, **Then** they see the secret word displayed.
2. **Given** a game has started, **When** a guesser views their game screen, **Then** they do not see the secret word; instead they see a message indicating a word has been selected.
3. **Given** the same room state (same player list, same game seed) on two separate occasions, **When** the game starts, **Then** the same secret word is selected both times (deterministic behavior).
4. **Given** two different rooms with different player compositions, **When** both games start, **Then** each room may have a different secret word, and each word is only visible to the respective room's drawer.

---

### Edge Cases

- What happens when a single player is in a room and tries to start the game? The system must prevent starting with fewer than the minimum number of players.
- What happens when a player tries to join with a name that, after trimming, matches an existing player's name? The system rejects the duplicate with an informative error message. Comparison is case-sensitive.
- What happens if a player joins with a name that, after trimming, exceeds the maximum length? The system must reject names over the maximum limit with a clear error.
- What happens to game state if a player leaves after the game starts? If the drawer leaves or disconnects, a new drawer is assigned from remaining players (next longest-joined). If all remaining players leave, the game ends.
- How does the system handle the word pool being exhausted? Since this is a single-round game with no rotation, the word pool must contain at least one word per game session.

## Requirements

### Functional Requirements

- **FR-001**: System MUST validate player display names by trimming leading and trailing whitespace before acceptance.
- **FR-002**: System MUST reject display names that are empty or contain only whitespace after trimming, with a clear error message to the user.
- **FR-003**: System MUST enforce a maximum display name length (default: 20 characters after trimming).
- **FR-003b**: System MUST reject display names that, after trimming, match an existing player's name in the same room. Comparison is case-sensitive.
- **FR-004**: System MUST maintain a list of players currently in the room, visible to all joined players.
- **FR-005**: System MUST allow game start only when the minimum number of players (default: 2) has been reached and the requesting player is the room creator.
- **FR-006**: System MUST deterministically assign exactly one player as the drawer when the game starts. The drawer is the player who has been in the room the longest (first to join).
- **FR-007**: System MUST assign all remaining players as guessers when the game starts.
- **FR-008**: System MUST deterministically select a secret word from a predefined word pool when the game starts.
- **FR-009**: System MUST display the secret word to the drawer only.
- **FR-010**: System MUST NOT display the secret word to guessers; guessers must see an indication that a word is active without revealing the word.
- **FR-011**: System MUST provide the current game state (who is drawer, who are guessers, word selected indicator) to all players via HTTP polling.
- **FR-012**: Drawer assignment and word selection MUST be deterministic — the same initial room state always produces the same outcome.

### Key Entities

- **Player**: A participant in a game room. Has a display name and a role (drawer or guesser).
- **Room**: A game session containing a collection of players, game state (waiting, in-progress), and the current round data.
- **Game State**: The current phase of the room (lobby/waiting, in-progress). Determines what actions are available to players.
- **Secret Word**: The word selected for the current round. Only visible to the drawer.
- **Word Pool**: A predefined collection of words from which the secret word is deterministically selected.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player with a valid non-empty trimmed name can join a room and see themselves in the player list within 2 seconds of submitting their name.
- **SC-002**: Attempting to join with an empty or whitespace-only name results in an immediate visible error message; the player is not added to the room.
- **SC-003**: When a room reaches the minimum player count and the game is started, exactly one player is assigned as drawer and the rest as guessers. This assignment is visible to all players within 2 seconds of game start.
- **SC-004**: The drawer can see the secret word on their screen; guessers cannot see it (they see a "word selected" indicator instead).
- **SC-005**: Given the same initial room state (same players in the same order), starting the game always produces the same drawer assignment and same secret word — verifiable across multiple game sessions or after a reset.
- **SC-006**: The game cannot be started with fewer than the minimum number of players; the start action is either disabled or rejected with a clear message.

## Assumptions

- The minimum number of players to start a game is 2 (one drawer and at least one guesser).
- Each room operates independently with its own game state and player list.
- Display names must be at least 1 character after trimming and at most 20 characters.
- A predefined word pool of at least 20 words is included in the application code.
- Only the room creator can trigger game start once the minimum player count is met.
- Players who join after the game has started are either placed in a spectator state or blocked from joining (consistent with existing room lobby behavior).
- Duplicate display names (after trimming) are rejected. Comparison is case-sensitive.
- All state synchronization between players occurs via HTTP polling, in accordance with project constraints.
- The existing room creation and player-join infrastructure (from the room setup lobby feature) is reused and extended for this feature.
