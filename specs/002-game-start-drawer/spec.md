# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Username Trimming & Validation (Priority: P1)

As a player, I want to have my username validated and trimmed so that empty, whitespace-only, or improperly spaced usernames are handled cleanly.

**Why this priority**: Core security and user identification. Prevents empty names in the lobby and ensure clean display layouts.

**Independent Test**: Can be tested by trying to join or create a room with leading/trailing spaces or empty strings and checking if they are trimmed or rejected with clear error feedback.

**Acceptance Scenarios**:

1. **Given** a player enters "   " (only spaces) or "" (empty string) as their username, **When** they click "Create Room" or "Join Room", **Then** the action is rejected, they remain on the landing page, and a validation message "Username cannot be empty or only whitespace." is displayed.
2. **Given** a player enters "  Alice  " as their username, **When** they click "Create Room" or "Join Room", **Then** the username is trimmed to "Alice" and registered under that name in the room.

---

### User Story 2 - Game Start & Drawer Assignment (Priority: P1)

As a room participant, I want to transition into the active game state when the host starts the game, with the first player clearly assigned as the drawer.

**Why this priority**: Necessary to initiate the core gameplay loop.

**Independent Test**: Can be tested by starting the game as a Host and verifying both Host and Guest clients update to show the game is active, with the Host designated as the drawer.

**Acceptance Scenarios**:

1. **Given** a room with Alice (Host) and Bob in the lobby, **When** Alice clicks "Start Game", **Then** the room status transitions to "active", the first round starts, and Alice is assigned the role of "drawer" while Bob is assigned the role of "guesser".
2. **Given** the game has started, **When** Alice and Bob poll the game state, **Then** Alice is clearly identified as the drawer to all participants (e.g. "Alice is drawing!"), and Bob is identified as a guesser.

---

### User Story 3 - Secret Word Selection & Visibility (Priority: P1)

As a player, I want the secret word to be chosen deterministically and visible only to the designated drawer.

**Why this priority**: Fair gameplay. Guessers must not see the word, while the drawer must see it to draw it.

**Independent Test**: Verify that the drawer client receives and renders the secret word, while the guesser client receives only a masked version (e.g. underscores representing letters) and cannot see the raw word in their state response.

**Acceptance Scenarios**:

1. **Given** the game starts with the secret word "rocket" (deterministically chosen as the first word from the starter list `["rocket", "pizza", "castle", "guitar", "sunflower"]`), **When** Alice is the drawer, **Then** Alice's screen displays "Word to draw: rocket".
2. **Given** Bob is a guesser in the same round, **When** the round starts, **Then** Bob's screen displays the masked word representing its length "Word: _ _ _ _ _ _" and he cannot access the word "rocket" via the client state.

---

### Edge Cases

- **Host Leaves Lobby During Start Request**: If the host triggers the start command but disconnects immediately, the game start request must handle this gracefully, either designating the newly promoted host as the drawer or refusing start if the player count drops below 2.
- **Words Starter List Exhaustion**: When rounds progress, the secret words must be selected deterministically using the index (e.g. `(roundNumber - 1) % STARTER_WORDS.length`).
- **No players in room**: If all players leave, the room is deleted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from usernames before any room creation or join processing.
- **FR-002**: The system MUST reject usernames that are empty or consist entirely of whitespace, returning a HTTP 400 bad request with a clear error message.
- **FR-003**: The system MUST support starting a game, transitioning the room status from "lobby" to "active".
- **FR-004**: Upon starting the game, the system MUST assign the "drawer" role to the Host player (the first player/creator) and the "guesser" role to all other players.
- **FR-005**: The system MUST select a secret word deterministically from the starter list: `["rocket", "pizza", "castle", "guitar", "sunflower"]`. For the first round, the word MUST be the first word in the list ("rocket").
- **FR-006**: The system MUST mask the secret word for all players with the "guesser" role, returning only the length of the word (or underscores representing it) in state updates, while returning the full secret word only to the player with the "drawer" role.

### Key Entities

- **Player**: Represents a room participant. Now includes roles: `role: "drawer" | "guesser"` (active only during active game state).
- **Room**: Represents the game session. Now includes `currentWord: string` (only shared with the drawer), `maskedWord: string` (shared with guessers), and status tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Empty or whitespace-only inputs are rejected, and the UI displays an error message within 100ms.
- **SC-002**: Within 1 second of the host clicking "Start Game", all clients in the room transition to the active game screen.
- **SC-003**: The drawer is explicitly identified on all clients' UI.
- **SC-004**: The secret word is hidden from guessers, with zero exposure of the secret word string in the guesser's network response payloads or store.

## Assumptions

- The game starts with the host as the drawer for the first round.
- The starter list of words is `["rocket", "pizza", "castle", "guitar", "sunflower"]`.
- The secret word selection is deterministic (index-based).
