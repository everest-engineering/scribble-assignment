# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Join Game with Valid Name (Priority: P1)

A player attempts to join a game session by entering their name. The system trims leading and trailing whitespace from the name. If the resulting name is empty or contains only whitespace, the system rejects the join attempt and displays a validation message. Otherwise, the player successfully joins the game lobby.

**Why this priority**: This is the foundational entry point for all game flow. Without valid player identity, no game can start.

**Independent Test**: Can be fully tested by submitting various name inputs (valid, empty, whitespace-only, trimmed) and verifying join acceptance/rejection behavior.

**Acceptance Scenarios**:

1. **Given** a player is on the join screen, **When** they enter a valid name with leading/trailing spaces (e.g., "  Alice  "), **Then** the name is trimmed to "Alice" and the player joins successfully.
2. **Given** a player is on the join screen, **When** they submit an empty string, **Then** the join is rejected and a message indicates the name cannot be empty.
3. **Given** a player is on the join screen, **When** they submit whitespace-only input (e.g., "   "), **Then** the join is rejected and a message indicates the name cannot be empty.
4. **Given** a player is on the join screen, **When** they enter a normal name (e.g., "Bob"), **Then** the player joins successfully with the name "Bob".

---

### User Story 2 — Start First Round with Drawer Assignment (Priority: P1)

The game session transitions from the lobby into the first round. The host (or first player who joined) is assigned as the drawer and is clearly visually distinguished from other players. A secret word is deterministically selected from a starter word list.

**Why this priority**: This is the core gameplay initiation. Without a clear drawer and a word, the game cannot proceed.

**Independent Test**: Can be fully tested by starting a game with multiple players and verifying that (1) exactly one player is designated as drawer, (2) the drawer is clearly identified in the UI, and (3) a word is selected from the starter list.

**Acceptance Scenarios**:

1. **Given** a game has 2 or more players in the lobby and the host initiates game start, **When** the first round begins, **Then** the host (or first player) is assigned as the drawer and is clearly labeled as such to all players.
2. **Given** a round is starting, **When** a secret word is selected, **Then** it is deterministically chosen from the configured starter word list (i.e., same game state always yields the same word).
3. **Given** multiple players are in the game, **When** the drawer is assigned, **Then** only the drawer can see the secret word; all other players see a placeholder indicating they are guessing.

---

### User Story 3 — Drawer Views Secret Word (Priority: P2)

The assigned drawer sees the secret word displayed in their interface while other players do not. The drawer uses this word as the reference for their drawing.

**Why this priority**: Essential for the drawer's role but only relevant after drawer assignment is established (Story 2).

**Independent Test**: Can be fully tested by observing the UI state for the drawer versus non-drawer players during an active round — drawer sees the word, others do not.

**Acceptance Scenarios**:

1. **Given** a player has been assigned as the drawer for the current round, **When** the round is active, **Then** the secret word is prominently displayed on the drawer's screen.
2. **Given** a player is a guesser (not the drawer), **When** the round is active, **Then** the secret word is not visible anywhere on their screen.

---

### User Story 4 — Non-Drawer Player Experience (Priority: P3)

Players who are not the drawer see the game canvas and a clear indication that they are in "guessing" mode. They know who the current drawer is.

**Why this priority**: Completes the round-start experience for all participants but is secondary to establishing the drawer and word.

**Independent Test**: Can be fully tested by joining as a non-drawer player during an active round and verifying the UI shows the canvas, drawer identity, and guessing-mode indicators.

**Acceptance Scenarios**:

1. **Given** a round is active and the player is not the drawer, **When** they view the game screen, **Then** they can see the drawing canvas and the name of the current drawer.
2. **Given** a round is active and the player is not the drawer, **When** they view the game screen, **Then** they see a clear indicator that they are guessing (e.g., "Guess the word!" prompt).

---

### Edge Cases

- What happens when only one player is in the lobby and tries to start? System should require a minimum of 2 players before the game can start.
- How does the system handle a player joining after the round has already started? The late-joining player should not see the current secret word and should enter as a guesser.
- What if the starter word list is empty or unavailable? System should display an error to the host and prevent round start.
- How does the system handle duplicate player names? Names should be unique within a session; duplicates should be rejected with a message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names before processing join requests.
- **FR-002**: System MUST reject join requests where the trimmed name is empty or contains only whitespace, and display a validation message to the user.
- **FR-003**: System MUST assign the host (or the first player who joined the session) as the drawer for the first round.
- **FR-004**: System MUST clearly identify the drawer to all players in the session (e.g., via visual label, badge, or highlight).
- **FR-005**: System MUST select the secret word deterministically from a predefined starter word list for each round.
- **FR-006**: System MUST display the secret word only to the drawer during an active round.
- **FR-007**: System MUST NOT display the secret word to any player who is not the current drawer.
- **FR-008**: System MUST prevent game start if fewer than 2 players are in the lobby.
- **FR-009**: System MUST show a guessing-mode indicator to all non-drawer players during an active round.
- **FR-010**: System MUST handle the case where the starter word list is empty by preventing round start and showing an error.

### Key Entities

- **Player**: Represents a participant in the game session. Has a name (trimmed, non-empty), a role (drawer or guesser), and a join order.
- **Game Session**: Represents an active game instance. Contains a list of players, the current round number, the assigned drawer, and the secret word for the current round.
- **Starter Word List**: A predefined collection of words from which the secret word is selected deterministically.
- **Round**: Represents a single drawing/guessing cycle within a game session. Has a drawer, a secret word, and a set of guessing players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players with valid names can join a game session in under 2 seconds from name submission.
- **SC-002**: 100% of empty or whitespace-only name submissions are rejected with a visible error message.
- **SC-003**: The drawer is correctly identified and visible to all players within 1 second of round start.
- **SC-004**: The secret word is never displayed to non-drawer players (0% word leakage across all test scenarios).
- **SC-005**: The deterministically selected word matches the expected word from the starter list for a given round state (100% accuracy).
- **SC-006**: 95% of first-time users can correctly identify who the drawer is without additional instruction.

## Assumptions

- Players access the game through a web browser with JavaScript enabled.
- The starter word list contains a sufficient number of words (at least 50) to support multiple rounds.
- Player names are limited to printable characters; special character validation is out of scope for this feature.
- The game uses HTTP polling for synchronization (per project constraints); no WebSockets are used.
- All game state is stored in-memory (per project constraints); no database persistence is used.
- No authentication is required to join a game (per project constraints).
- The "host" is defined as the player who created the room or the first player in the session.
- Deterministic word selection means the same seed (e.g., round number + session ID) always produces the same word, ensuring reproducibility.
