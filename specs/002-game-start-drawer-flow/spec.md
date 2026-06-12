# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow
**Given** a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start the first round (Priority: P1)

The game begins when the host starts the first round and the first player is assigned the drawer role.

**Why this priority**: The first round start is the key transition from lobby to gameplay, and it must correctly identify the drawer and expose the secret word only to that player.

**Independent Test**: Start a new game from the lobby and verify the host or first player is labeled as drawer while the secret word is shown only to that user.

**Acceptance Scenarios**:

1. **Given** a room has at least two players and the host starts the game, **When** the first round begins, **Then** the host or first player is marked as the drawer and receives the secret word.
2. **Given** a player is not the drawer, **When** the round begins, **Then** that player does not see the secret word and only sees the game view.

---

### User Story 2 - Enforce trimmed player names (Priority: P1)

Player names must be trimmed and cannot be empty or whitespace-only when joining or creating a room.

**Why this priority**: Valid player names are required for clear drawer attribution and a usable player list.

**Independent Test**: Enter names with whitespace only or leading/trailing spaces and verify they are rejected or trimmed before room creation or join.

**Acceptance Scenarios**:

1. **Given** a player submits a name with only whitespace, **When** they create or join a room, **Then** the system rejects the name and shows a validation message.
2. **Given** a player submits a name with leading or trailing spaces, **When** the room is created or joined, **Then** the system trims the name before storing it.

---

### User Story 3 - Deterministic secret word selection (Priority: P2)

The secret word for the first round is selected from the starter list using a deterministic rule.

**Why this priority**: Predictable word selection ensures the first round behavior is repeatable and testable while avoiding random selection complexity.

**Independent Test**: Start a round and verify the chosen word comes from the starter word list and follows an agreed deterministic rule.

**Acceptance Scenarios**:

1. **Given** a game round begins, **When** the word is selected, **Then** it is chosen from the starter list using a deterministic algorithm.
2. **Given** the first round is restarted with the same initial room state, **When** the secret word is selected again, **Then** the same starter word is chosen.

---

### Edge Cases

- What happens if the host starts the game before any second player joins? The feature should require the lobby to have at least two players before starting the first round.
- What happens when the drawer leaves immediately after the round begins? The system should preserve the drawer identity for the current round and handle the next transition through later rounds (out of scope).
- What happens if a name is only spaces and the client fails to validate it? The backend must also reject whitespace-only player names.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject empty or whitespace-only player names with a clear validation message.
- **FR-002**: System MUST trim leading and trailing whitespace from player names before storing them.
- **FR-003**: System MUST assign the host or first player as the drawer for the first round when the game starts.
- **FR-004**: System MUST select the secret word for the first round deterministically from the starter word list.
- **FR-005**: System MUST expose the secret word only to the drawer and not to other players.
- **FR-006**: System MUST require at least two players in the lobby before the host can begin the first round.
- **FR-007**: System MUST maintain a clearly identifiable drawer label in the game view.

### Key Entities *(include if feature involves data)

- **Player**: A room participant with a trimmed display name, unique identifier, and role for the current round.
- **Drawer**: The player assigned to draw in the current round and the only one who can see the secret word.
- **Secret Word**: The deterministic round word selected from the starter list and revealed only to the drawer.
- **Round**: The active first game phase that begins when the host starts play.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players with empty or whitespace-only names are blocked and shown a validation message before entering a room.
- **SC-002**: Names with leading or trailing spaces are stored trimmed and displayed without surrounding whitespace.
- **SC-003**: The host or first player is shown as the drawer in the first round view.
- **SC-004**: The secret word is visible to the drawer and hidden from all other players.
- **SC-005**: The first round cannot begin unless at least two players are present in the lobby.
- **SC-006**: The selected secret word is from the starter list and follows a deterministic selection rule.

## Assumptions

- The feature is limited to the first round start only; multi-round rotation and timers are out of scope.
- The existing frontend and backend state management will be extended without adding new libraries.
- Room creation and join flows already exist; this feature builds on those flows.
- Secret word selection should be deterministic but may use a simple rule such as the first starter word or a fixed index based on room code.
