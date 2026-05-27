# Feature Specification: Room Setup And Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Scenario 1: Room Setup And Lobby

Given a player wants to host or join a drawing game, when they create or join a room via a unique code, then the creator is automatically the host; invalid or empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling at about 2 seconds; and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Host a Room (Priority: P1)

A player opens the game and creates a new room. The system generates a unique room code and automatically assigns the creator as host. The host is taken to the lobby where they can see their own player entry and a waiting message.

**Why this priority**: Room creation is the primary entry point for any multiplayer game session. Without this, no game can begin.

**Independent Test**: Can be fully tested by a single player creating a room and confirming they appear in the lobby as host with a visible room code.

**Acceptance Scenarios**:

1. **Given** a player has launched the game, **When** they choose to create a new room, **Then** a unique room code is generated and displayed, and the player is designated as host
2. **Given** a player has created a room, **When** the lobby loads, **Then** the player sees their own name listed with a "Host" indicator and a waiting message for other players

---

### User Story 2 - Join a Room with a Valid Code (Priority: P1)

A player enters a room code provided by the host and joins the lobby. The player sees themselves in the player list alongside the host and any other joined players.

**Why this priority**: Joining a room is the secondary entry point. Both create and join are needed for any multiplayer session to form.

**Independent Test**: Can be fully tested by having a second player join an existing room and confirming they appear in the host's lobby.

**Acceptance Scenarios**:

1. **Given** a room exists with an active host, **When** another player enters the correct room code, **Then** the joining player is added to the room and appears in the player list
2. **Given** two or more players are in a lobby, **When** a new player joins, **Then** all connected players see the updated player list

---

### User Story 3 - Invalid or Empty Room Codes (Priority: P2)

A player enters a room code that is either empty, malformed, or does not match any active room. The system displays a clear error message and the player is not added to any room.

**Why this priority**: Clear error handling is important for usability, but the core flows (create/join valid) must work first.

**Independent Test**: Can be fully tested by attempting to join with an empty input or a non-existent code and verifying the error message.

**Acceptance Scenarios**:

1. **Given** a player is on the join screen, **When** they submit an empty code, **Then** the system rejects the input and displays "Please enter a room code"
2. **Given** a player is on the join screen, **When** they submit a code that does not match any active room, **Then** the system rejects the input and displays "Room not found. Please check the code and try again"

---

### User Story 4 - Host Starts the Game (Priority: P2)

Once at least two players are in the lobby, the host sees a "Start Game" button. Non-host players see a waiting message. The host clicks the button to begin the game.

**Why this priority**: Starting the game is the gateway to actual gameplay. It depends on having players in the lobby first.

**Independent Test**: Can be fully tested by having a host and one joiner in a lobby, then the host clicking start.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby with only their own player, **When** they look for a start option, **Then** the start button is disabled or hidden
2. **Given** a host and at least one other player are in the lobby, **When** the host clicks "Start Game", **Then** the game begins for all players
3. **Given** a host and at least one other player are in the lobby, **When** a non-host player attempts to start the game, **Then** the action is rejected

---

### Edge Cases

- What happens when the host leaves or disconnects before the game starts? The room should handle host migration or dissolve the room
- How does the system handle two players joining with the same code simultaneously? Both should be admitted independently
- What happens when a player enters a code for a room that is already in-game (not in lobby)? The system should reject the join with "Game already in progress"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code for each newly created room
- **FR-002**: System MUST designate the room creator as the host
- **FR-003**: System MUST reject empty room codes with a clear error message
- **FR-004**: System MUST reject room codes that do not match any active room
- **FR-005**: System MUST ensure rooms are fully isolated (players, state, and data in one room are not accessible from another room)
- **FR-006**: Lobby MUST refresh player state via polling at approximately 2-second intervals
- **FR-007**: System MUST only allow the host to start the game
- **FR-008**: System MUST require at least 2 players present in the lobby before the game can start
- **FR-009**: System MUST display the room code to the host after room creation so it can be shared
- **FR-010**: System MUST remove a player from a room when they disconnect or leave

### Key Entities *(include if feature involves data)*

- **Room**: Represents a single game session. Contains a unique room code, the host player identifier, the list of joined players, and the current game state (lobby, in-progress, finished). Rooms are fully isolated from each other.
- **Player**: Represents a participant in a room. Has an identifier, a display name, and a role (host or participant). Players exist within the context of a single room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see the room code within 2 seconds
- **SC-002**: A player can join a room by entering a valid code and see themselves in the lobby within 3 seconds
- **SC-003**: Invalid or empty room codes are rejected with a user-visible error message within 1 second
- **SC-004**: The lobby player list updates to reflect new joiners within 3 seconds of their arrival
- **SC-005**: The host can successfully start the game once 2 or more players are present, and non-host players cannot start the game

## Assumptions

- Players share room codes through external means (voice chat, messaging) — in-app code sharing is out of scope
- Room codes are short alphanumeric strings (e.g., 4-6 characters) for easy sharing
- A player can only be in one room at a time
- The game supports an unlimited number of rooms concurrently, bounded only by server resources
- The host leaving before the game starts results in the room being dissolved or the host role transferring — this is a known edge case for future iteration
