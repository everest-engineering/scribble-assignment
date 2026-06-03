# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-03

- Q: Should rooms enforce a maximum player limit, and if so, what is that limit? → A: Enforce a maximum of 12 players per room.
- Q: What validation rules should be applied to player nicknames (e.g., character types, length limits)? → A: Any character allowed, max 20 characters.
- Q: What format should the generated room code follow (e.g., uppercase alphabetic, numeric, mixed case)? → A: Exactly 6 alphanumeric characters (mixed case/numbers, e.g., '3x8F2P').
- Q: What should happen when a lobby player is considered disconnected (e.g., immediate removal, or transition to a disconnected state with a grace period)? → A: Immediate removal from the room and player list after 10 seconds of no polling.
- Q: How should the system determine who the "next oldest" player is for host promotion? → A: Promote the player who joined the lobby first among the remaining players (chronological join order).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

As a player, I want to create a new game room so that I can host a drawing game with my friends.

**Why this priority**: This is the entry point for the game. Without creating a room, no games can be played.

**Independent Test**: Can be fully tested by clicking "Create Room" on the home page, entering a player name, and verifying a new room is created with a unique code and the player is shown as the host.

**Acceptance Scenarios**:

1. **Given** a player is on the home page, **When** they choose to create a room and provide a valid nickname (not empty, max 20 characters), **Then** a new room with a unique room code is generated, the creator is added as the host, and they are redirected to the lobby.
2. **Given** a player is on the create room form, **When** they attempt to create a room with an empty nickname, **Then** the system rejects the request and displays a clear error message.
3. **Given** a player is on the create room form, **When** they attempt to create a room with a nickname exceeding 20 characters, **Then** the system rejects the request and displays a clear validation error message.

---

### User Story 2 - Player Joins an Existing Room (Priority: P1)

As a player, I want to join an existing game room using a code shared by the host so that I can play with them.

**Why this priority**: Multiplayer drawing requires other players to join the same room. This is critical for the game to work.

**Independent Test**: Can be fully tested by entering an active room code and a player name on the home page, and verifying the player joins the correct lobby.

**Acceptance Scenarios**:

1. **Given** an active room exists with a code, **When** a player enters that code and a valid nickname (not empty, max 20 characters) on the home page, **Then** they are successfully added to the room's lobby and see all other players.
2. **Given** a player tries to join a room, **When** they enter an invalid, empty, or non-existent room code, **Then** they receive clear feedback (e.g., "Room not found") and remain on the home page.
3. **Given** a player tries to join a room, **When** they enter a nickname that is already taken by another player in that room, **Then** they receive feedback that the name is taken and are prompted to choose another name.
4. **Given** a room has reached its maximum capacity of 12 players, **When** a 13th player attempts to join using the correct room code, **Then** the join request is rejected and the system displays a "Room is full" error message.
5. **Given** an active room exists, **When** a player attempts to join with a nickname exceeding 20 characters, **Then** the system rejects the request and displays a clear validation error message.

---

### User Story 3 - Lobby Polling and Starting the Game (Priority: P2)

As a participant in a lobby, I want the player list to update automatically, and as the host, I want to start the game when there are enough players.

**Why this priority**: Ensures players see who is in the room in real-time without manual refresh, and provides the transition from lobby to actual gameplay.

**Independent Test**: Can be tested by having a host create a room, a second player join from another window, verifying the host's screen updates within 2 seconds, and verifying only the host can click "Start Game" once there are at least 2 players.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins or leaves, **Then** the lobby list updates automatically within approximately 2 seconds.
2. **Given** a lobby has only 1 player (the host), **When** the host looks at the lobby, **Then** the "Start Game" button is disabled with a message indicating at least 2 players are required.
3. **Given** a lobby has 2 or more players, **When** a non-host player looks at the lobby, **Then** they see the list of players but cannot see or click the "Start Game" button.
4. **Given** a lobby has 2 or more players, **When** the host clicks the "Start Game" button, **Then** the game starts and all connected players are transitioned to the game screen.

---

### Edge Cases

- **Host Disconnection**: If the host disconnects or leaves the lobby, the host status MUST be transferred to the player who has been in the lobby the longest (chronological join order, i.e., the first remaining player in the join sequence). If the room becomes empty, it should be deleted.
- **Join after Game Start**: If a player attempts to join a room that has already started playing, they should be rejected with a clear message (e.g., "Game already in progress").
- **Inactive Players**: If a player's client stops polling for a duration of 10 seconds, the system MUST automatically remove them from the room (freeing up their slot) and update the lobby list for all other players.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique, short, alphanumeric room code of exactly 6 characters (mixed case and/or numbers, e.g., "3x8F2P") for each newly created room.
- **FR-002**: System MUST reject empty, invalid, or inactive room codes and show appropriate validation error messages to the user.
- **FR-003**: System MUST identify the creator of the room as the "Host" and store this role in the room's session state.
- **FR-004**: System MUST ensure rooms are fully isolated, meaning actions or state in one room do not affect or leak into any other room.
- **FR-005**: System MUST support retrieving the list of active players in a room and refresh this list automatically via polling (approximately every 2 seconds).
- **FR-006**: System MUST only enable the "Start Game" action for the host of the room when the total player count in the room is 2 or more.
- **FR-007**: System MUST restrict non-host players from starting the game, hiding or disabling any controls to start the game.
- **FR-008**: System MUST enforce a maximum limit of 12 players per room, rejecting new players who try to join a full room with a clear validation error message.
- **FR-009**: System MUST validate player nicknames to ensure they are not empty and do not exceed 20 characters, returning a clear error message if validation fails.

### Key Entities

- **Room**: Represents an isolated session of the game. Key attributes: unique code, status (lobby, active, finished), list of players, and host reference.
- **Player**: Represents a user in a room. Key attributes: unique ID within the room, display name, role (host or player), and connection/activity status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new room and land in the lobby in under 2 seconds.
- **SC-002**: A user entering an invalid room code receives validation feedback within 500ms.
- **SC-003**: When a new player joins a room, all existing players in the lobby see the updated player list within 3 seconds.
- **SC-004**: 100% of non-host players are prevented from initiating the game.

## Assumptions

- Players do not need to register or log in (no permanent accounts). A temporary nickname is chosen upon room creation or join.
- Room data is held in-memory (no persistent database). If the server restarts, all active rooms are lost.
- If a room becomes completely empty (all players leave), the room is automatically closed and cleaned up from memory.
- A player limit per room is set to a maximum of 12 players to maintain responsiveness.
- Nicknames can contain any characters (including emojis and spaces) up to the 20-character limit.
- Room codes are case-sensitive and must match exactly for a player to join.
- The client polls the server every 2 seconds to signal activity and retrieve the latest room state. If no poll is received for 10 seconds, the server cleans up that player.
- The room maintains the list of players in a strict chronological join order to simplify host transfer calculations.
