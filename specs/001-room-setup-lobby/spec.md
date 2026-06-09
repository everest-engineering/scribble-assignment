# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room and Become Host (Priority: P1)

A player wants to host a new drawing game. They provide their name, create a room, receive a unique room code, and are automatically designated as the host.

**Why this priority**: Room creation is the entry point for the entire game flow — nothing else works without it.

**Independent Test**: Can be fully tested by a single player: enter a name, click Create Room, verify a room code is displayed and the player is labeled as host in the lobby.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen, **When** they enter a valid name and click Create Room, **Then** a new room is created with a unique alphanumeric code and the player is marked as host.
2. **Given** a player has created a room, **When** they view the lobby, **Then** their name appears in the participant list with a "Host" indicator.

---

### User Story 2 - Join a Room by Code (Priority: P1)

A player wants to join an existing drawing game. They provide their name and a room code, and are added to the room's participant list.

**Why this priority**: Joining is the second fundamental entry point — both create and join must work for multiplayer.

**Independent Test**: Can be tested with two browser tabs: create a room in tab A, then join the same room code from tab B, verify both players appear in the lobby.

**Acceptance Scenarios**:

1. **Given** a room exists with code "ABC123", **When** a player enters the valid code and a valid name, **Then** they are added to the room and see the lobby.
2. **Given** a room exists, **When** two different players join using the same room code, **Then** both appear in the lobby participant list.

---

### User Story 3 - Reject Invalid or Empty Room Codes (Priority: P1)

The system rejects attempts to join with an invalid, malformed, or empty room code with clear feedback.

**Why this priority**: Input validation prevents confusing game states and ensures players get immediate, clear error messages.

**Independent Test**: Can be tested by submitting empty, whitespace-only, or non-existent codes and verifying error messages.

**Acceptance Scenarios**:

1. **Given** a player is on the join screen, **When** they submit an empty room code, **Then** they see a clear error message: "Room code is required."
2. **Given** a player is on the join screen, **When** they submit a room code that does not match any existing room, **Then** they see a clear error message: "Room not found. Check the code and try again."
3. **Given** a player is on the join screen, **When** they submit a whitespace-only room code, **Then** they see a clear error message that the code is invalid.

---

### User Story 4 - Lobby Auto-Refreshes via Polling (Priority: P2)

Players in the lobby see an up-to-date participant list without manually refreshing, via automatic HTTP polling at approximately 2-second intervals.

**Why this priority**: Polling is essential for a playable multiplayer experience — without it, players cannot see who has joined.

**Independent Test**: Can be tested by creating a room in one tab and joining from a second tab — the first tab's lobby should update to show the new player within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room, **Then** the participant list updates automatically within approximately 2 seconds.
2. **Given** a player is in the lobby with participants displayed, **When** a participant joins or leaves, **Then** the lobby refreshes to reflect the current participant set.

---

### User Story 5 - Host Starts Game with Minimum 2 Players (Priority: P2)

Only the host can start the game, and only when at least 2 players (including the host) are present in the room.

**Why this priority**: The game requires at least one drawer and one guesser, and host control prevents unauthorized game starts.

**Independent Test**: Can be tested by having a non-host player attempt to start (should fail) and the host attempt to start with 1 player (should fail) and 2+ players (should succeed).

**Acceptance Scenarios**:

1. **Given** a room with only 1 player (the host), **When** the host clicks Start Game, **Then** they see a message: "Need at least 2 players to start."
2. **Given** a room with 2 or more players, **When** a non-host player clicks Start Game, **Then** the action is rejected and they see: "Only the host can start the game."
3. **Given** a room with 2 or more players, **When** the host clicks Start Game, **Then** the game starts and all players transition to the game screen.

---

### Edge Cases

- What happens when a player tries to join a room that is already in an active game? (Expected: join is rejected with a message that the game is already in progress.)
- What happens when a room code contains leading/trailing whitespace? (Expected: code is trimmed before lookup.)
- What happens when a player's name is empty or whitespace-only? (Expected: rejected with a clear error message.)
- What happens when the room creator disconnects or leaves? (Expected: host status stays with the creator; no transfer occurs.)
- What happens if two players create rooms simultaneously and get the same code? (Expected: codes are unique; collision is prevented at creation time.)
- What happens when the lobby polling request fails due to network error? (Expected: client retries on next poll cycle; no crash, user sees stale data temporarily.)
- What happens when a player tries to join with a name already taken in the room? (Expected: duplicate names are permitted — no uniqueness constraint on names.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique alphanumeric room code when a room is created.
- **FR-002**: System MUST designate the room creator as the host.
- **FR-003**: System MUST allow a player to join a room by providing a valid room code and a display name.
- **FR-004**: System MUST reject empty or whitespace-only room codes with a clear error message.
- **FR-005**: System MUST reject join attempts for non-existent room codes with an error message.
- **FR-006**: System MUST trim whitespace from room codes before processing.
- **FR-007**: System MUST isolate rooms so that participants, state, and game data in one room are invisible to players in other rooms.
- **FR-008**: System MUST expose an endpoint that returns the current room state including participants and host status.
- **FR-009**: Client MUST poll the room state endpoint at intervals no greater than 2 seconds while on the lobby screen.
- **FR-010**: System MUST allow only the host to start the game.
- **FR-011**: System MUST prevent game start when fewer than 2 players are in the room.
- **FR-012**: System MUST return a clear error message when a non-host attempts to start the game.
- **FR-013**: System MUST trim whitespace from player display names before validation.
- **FR-014**: System MUST reject empty or whitespace-only player display names with a clear error message.

### Key Entities

- **Room**: A game session identified by a unique alphanumeric code. Contains a participant list, host designation, and game state (lobby, in-progress, finished).
- **Player**: A participant in a room, identified by a display name. Has a role (host or non-host) within the room.
- **Room Code**: A unique alphanumeric identifier generated at room creation, used by other players to locate and join the room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see a unique room code displayed within 2 seconds of clicking Create Room.
- **SC-002**: A second player can join an existing room by entering its code and see the lobby within 2 seconds of clicking Join.
- **SC-003**: The lobby participant list updates automatically within approximately 2 seconds of another player joining or leaving, without requiring a manual refresh.
- **SC-004**: Invalid or empty room codes are rejected with a descriptive error message displayed within 1 second of submission.
- **SC-005**: A non-host player attempting to start the game sees an error message, while the host can start the game once at least 2 players are present.
- **SC-006**: Two separate rooms operate independently — players in different rooms never see each other's participants, state, or game data.

## Assumptions

- Room isolation is achieved through the unique room code acting as a namespace; rooms do not share state.
- A polling interval of 2 seconds provides a good balance between responsiveness and server load.
- Players join with a self-chosen display name; no authentication or identity verification is required.
- Room codes are 4-6 alphanumeric characters, randomly generated at creation time.
- If the host disconnects, no host transfer or reassignment occurs.
- Duplicate player names within a room are permitted — no name uniqueness constraint.
- Error messages are displayed on-screen to the user, not logged to console only.
