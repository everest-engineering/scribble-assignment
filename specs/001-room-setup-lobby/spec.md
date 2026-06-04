# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room & Become Host (Priority: P1)

As a player, I want to create a new game room so that I can host a drawing game for my friends.

**Why this priority**: Core entry point for the game. Without room creation, no games can be played.

**Independent Test**: Can be fully tested by entering a username on the landing page, selecting "Create Room", and verifying the transition to a lobby showing the player as host and a unique room code.

**Acceptance Scenarios**:

1. **Given** a player is on the landing page and enters their name "Alice", **When** they click "Create Room", **Then** a new room is created, Alice is redirected to the lobby, she is designated as the Host, and a unique room code is generated and displayed.
2. **Given** Alice has created a room, **When** she views the lobby page, **Then** she is the only player listed, and she is marked with a "Host" indicator.

---

### User Story 2 - Join Room & Lobby Polling (Priority: P2)

As a player, I want to join an existing game room using a code so that I can play with my friends, and see who is in the lobby in real time.

**Why this priority**: Enables multiplayer interaction. The lobby must sync automatically so players know when others have joined.

**Independent Test**: Can be tested by having one player create a room and another player join using the room code, verifying both players see each other on their screens without reloading.

**Acceptance Scenarios**:

1. **Given** a room with code "ROOM1" exists, **When** Bob enters his name "Bob" and code "ROOM1" on the landing page and clicks "Join Room", **Then** Bob is added to the room, redirected to the lobby, and sees the player list containing both Alice (Host) and Bob.
2. **Given** Bob is in the lobby, **When** Charlie joins the room, **Then** Bob's lobby player list updates automatically within 2 seconds to include Charlie.
3. **Given** Bob attempts to join with a non-existent code "BADCODE" or an empty code, **When** he clicks "Join Room", **Then** the action is rejected, he remains on the landing page, and a clear error message is displayed.

---

### User Story 3 - Host Controls & Game Start Constraint (Priority: P3)

As the host, I want control over when to start the game, but only when enough players have joined.

**Why this priority**: Ensures the game starts in a playable state (minimum 2 players) and prevents non-hosts from starting the game.

**Independent Test**: Verify that the start button is disabled when only the host is in the lobby, becomes enabled when a second player joins, and is completely hidden or disabled for non-host players.

**Acceptance Scenarios**:

1. **Given** Alice (Host) is the only player in the lobby, **When** she views the lobby page, **Then** the "Start Game" button is visible but disabled.
2. **Given** Alice (Host) and Bob (Player) are in the lobby, **When** Alice views the lobby, **Then** the "Start Game" button becomes enabled.
3. **Given** Bob is in the lobby as a non-host player, **When** Bob views the lobby page, **Then** he does not see an active "Start Game" button and instead sees a status message saying "Waiting for Host to start...".

---

### Edge Cases

- **Duplicate Usernames**: If a player attempts to join a room with a username that is already taken by an active player in that room, the system must reject the join request and prompt the user to choose a different name.
- **Host Disconnection**: If the Host leaves the lobby, the host status must be transferred to the next player who joined. If the last player leaves the lobby, the room must be cleaned up and deleted from memory.
- **Joining an Active Game**: If a player attempts to join a room code where the game has already started, the join request must be rejected with feedback that the game is in progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to create a new game room with a username, automatically assigning them as the Host.
- **FR-002**: The system MUST generate a unique, non-empty, alphanumeric room code for every new room.
- **FR-003**: The system MUST validate room codes on joining, rejecting empty, non-existent, or invalid codes with clear feedback.
- **FR-004**: Game rooms MUST be fully isolated, meaning players, state, and messages in one room are completely inaccessible to other rooms.
- **FR-005**: The frontend MUST poll the backend at regular intervals (~2 seconds) to fetch the latest lobby state (player list, game status).
- **FR-006**: The system MUST prevent starting the game unless there are at least 2 players in the room.
- **FR-007**: Only the room's Host MUST have the capability/control to start the game. Non-hosts MUST see a status indication that they are waiting for the Host.

### Key Entities

- **Player**: Represents a participant in the game. Contains attributes like a unique player ID (within the session/room), username, and a flag indicating if they are the host.
- **Room**: Represents a game session. Contains a unique room code, a list of connected Players, the current room state (e.g., lobby, active, finished), and a reference to the Host player.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create or join a room within 3 seconds under normal network conditions.
- **SC-002**: Validation feedback for invalid/empty room codes is displayed immediately upon submission.
- **SC-003**: The player list in the lobby updates automatically within 2.5 seconds of a new player joining.
- **SC-004**: Non-host players are prevented from initiating the game start action.

## Assumptions

- Rooms and player data are stored in-memory on the backend and are ephemeral (cleared upon server restart).
- The username must be unique within a single room. If a username is already taken, the join request is rejected with feedback.
- If the host leaves, the next oldest player in the room is automatically promoted to host. If the last player leaves, the room is deleted.
- Standard HTTP GET/POST polling is used for synchronization, running at an interval of 2 seconds.
