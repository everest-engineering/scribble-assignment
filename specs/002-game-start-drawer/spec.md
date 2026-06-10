# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow — Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-10

- Q: What is the exact maximum character limit for player display names? → A: 15 characters.
- Q: What characters are permitted in player display names? → A: Alphanumeric (A-Z, a-z, 0-9), spaces, hyphens, and underscores only.

### Session 2026-06-11

- Q: What should SC-002's timing SLA be given the ~2s polling interval? → A: Align with polling — "within the next polling cycle (~2s)".
- Q: What should the error message text be for rejected names? → A: Consolidated single message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game Starts and Drawer Is Assigned (Priority: P1)

When the host starts a game with at least 2 players present, the first round begins and the host is assigned as the drawer. All players see who the drawer is, and only the drawer sees the secret word.

**Why this priority**: This is the core entry point to gameplay — without drawer assignment and word revelation, no one can play.

**Independent Test**: Can be fully tested by creating a room with 2+ players, starting the game, and verifying that the host is marked as the drawer and receives the secret word while other players do not.

**Acceptance Scenarios**:

1. **Given** a room with 2 or more players and the host has clicked "Start Game", **When** the game transitions to "playing", **Then** the host is assigned as the drawer and all players can see which participant is the drawer.
2. **Given** a game has started and a player is the drawer, **When** they view the game screen, **Then** they see the secret word displayed on their screen.
3. **Given** a game has started and a player is not the drawer, **When** they view the game screen, **Then** they do not see the secret word.
4. **Given** a room with only 1 player (the host), **When** the host attempts to start the game, **Then** the game does not start and the host sees a message that at least 2 players are needed.

---

### User Story 2 - Player Names Are Validated (Priority: P1)

When a player creates or joins a room, their display name is trimmed of leading/trailing whitespace. If the result is empty or whitespace-only, the request is rejected with the message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".

**Why this priority**: Valid names ensure every participant can be meaningfully identified in the game. Empty/whitespace names create confusion and break UI display.

**Independent Test**: Can be fully tested by attempting to create or join a room with whitespace-padded names, empty names, and valid names, then observing the system's response in each case.

**Acceptance Scenarios**:

1. **Given** a player is creating a room, **When** they provide a name with leading or trailing whitespace, **Then** the whitespace is trimmed and the room is created with the trimmed name.
2. **Given** a player is creating a room, **When** they provide an empty name or a name consisting only of whitespace, **Then** the request is rejected and they see a message that a non-empty name is required.
3. **Given** a player is joining a room, **When** they provide a name with leading or trailing whitespace, **Then** the whitespace is trimmed and they join with the trimmed name.
4. **Given** a player is joining a room, **When** they provide an empty name or a name consisting only of whitespace, **Then** the request is rejected and they see a message that a non-empty name is required.
5. **Given** a player is creating or joining a room, **When** they provide a name containing invalid characters (e.g., `<`, `>`, `@`, `!`), **Then** the request is rejected and they see a message about allowed characters.
6. **Given** a player is creating or joining a room, **When** they provide a name longer than 15 characters, **Then** the request is rejected and they see a message about the maximum length.

---

### User Story 3 - Secret Word Is Deterministically Selected (Priority: P2)

When the game starts, the system selects a secret word from the starter word list. The same room setup always produces the same word, ensuring predictability.

**Why this priority**: Deterministic word selection is required by the game's design principles and enables reproducible testing.

**Independent Test**: Can be fully tested by creating two rooms with identical setups (same player count, same order) and verifying both produce the same secret word.

**Acceptance Scenarios**:

1. **Given** a game has started in a room, **When** the secret word is selected, **Then** the word is one of the words from the starter list.
2. **Given** two game sessions start with identical room and participant configurations, **When** both select a secret word, **Then** the same word is chosen in both cases.

---

### Edge Cases

- **Host leaves during game**: If the host/drawer leaves the room after the game has started, the behavior is deferred to a future iteration (consistent with existing lobby assumptions).
- **Participant with empty name tries to rejoin**: If a player who initially joined with a valid name later tries to rejoin with an empty name, they are rejected.
- **All guessers leave**: If all guessers leave and only the drawer remains, the game continues — no automatic end condition is enforced in this feature.
- **Name exceeds maximum length**: Player names longer than 15 characters are rejected with the message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the host starts a game with 2+ participants, the system MUST transition the room status to `"playing"` and assign the host as the drawer for the first round.
- **FR-002**: The system MUST clearly indicate which participant is the drawer in all game state responses sent to any participant.
- **FR-003**: When the game starts, the system MUST deterministically select one word from the starter list as the secret word for the round.
- **FR-004**: The secret word MUST be included in game state responses only when the requesting participant is the drawer. Non-drawers MUST NOT receive the secret word.
- **FR-005**: When a player creates or joins a room, the system MUST trim leading and trailing whitespace from the provided name before using it.
- **FR-006**: The system MUST reject room creation or join requests where the provided name, after trimming, is empty or consists only of whitespace. The error message MUST be: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".
- **FR-007**: The game state MUST include the drawer's participant ID so the frontend can display the drawer identity to all players.
- **FR-008**: The game start endpoint MUST return the updated game state (including drawer assignment and, for the drawer, the secret word) in the response.
- **FR-009**: Player display names MUST only contain alphanumeric characters (A-Z, a-z, 0-9), spaces, hyphens, and underscores. Names containing any other characters MUST be rejected with the error message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".
- **FR-010**: The system MUST reject room creation or join requests where the trimmed name exceeds 15 characters, with the error message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores".

### Key Entities *(include if feature involves data)*

- **Room**: A game session that transitions from `"lobby"` to `"playing"` when the game starts. When playing, it has an assigned drawer and a secret word for the current round.
- **Participant**: A player in the room. May be designated as the drawer or a guesser for a given round.
- **Secret Word**: A word from the starter list, deterministically selected for the first round, visible only to the drawer.
- **Game State**: The current state of an active game, including the drawer identity, secret word (drawer only), and the list of available words (all players).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a game starts with 2+ participants, the drawer assignment is reflected in the game state within 1 second of the start request.
- **SC-002**: All participants can see who the drawer is within the next polling cycle (~2s) of the game starting (on their next poll or response).
- **SC-003**: Only the drawer receives the secret word in API responses; guessers never receive it.
- **SC-004**: Names with leading/trailing whitespace are silently trimmed and used correctly — no errors, no unexpected whitespace in the UI.
- **SC-005**: Empty or whitespace-only names are rejected with the error message: "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores", visible to the user within 1 second of submission.
- **SC-006**: The same room configuration always produces the same secret word, verifiable through repeated tests.
- **SC-007**: The secret word is always one of the words from the predefined starter list.

## Assumptions

- The drawer is always the host for the first round; drawer rotation is deferred to a future iteration or is out of scope.
- The secret word is selected deterministically based on the room code (e.g., using a hash of the room code modulo the number of words in the starter list).
- Player names are limited to a maximum of 15 characters to prevent UI issues.
- The starter word list contains at least one word — the system handles an empty list gracefully.
- Host departure after game start (including drawer abandonment) is deferred to a future feature iteration.
- The existing polling mechanism (~2s interval) continues to be used for state synchronization after game start.
