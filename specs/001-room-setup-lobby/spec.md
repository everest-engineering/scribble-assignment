# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Room Setup & Lobby — Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-10

- Q: Should there be a maximum player count per room? → A: No maximum — any number of players can join an active room.
- Q: What timeout should be used for cleaning up inactive/empty rooms? → A: 5 minutes.
- Q: Can two players have the same display name in a room? → A: No — display names must be unique within a room.
- Q: Room code length — 4 or 4-6 characters? → A: Exactly 4 characters.
- Q: Should "Host leaves" remain in Edge Cases? → A: No — remove from Edge Cases; already documented as deferred in Assumptions.
- Q: Should concurrent join operations be guarded by locking? → A: No — single-threaded Node.js is sufficient; no explicit concurrency guard needed.
- Q: What should the UI show during create/join API calls? → A: Loading spinner on the submit button, button disabled during request to prevent double-submit.
- Q: How does the client detect that the game has started in a polling architecture? → A: Next poll returns `status !== "lobby"`; the start endpoint response also triggers immediate navigation for the initiator.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room and Starts Game (Priority: P1)

A player wants to host a drawing game. They create a room, receive a unique room code, and share it with others. After at least one other player joins, the host starts the game. The lobby automatically refreshes so everyone sees the updated player list.

**Why this priority**: Room creation and hosting is the entry point for all gameplay — without it, no game can begin.

**Independent Test**: Can be fully tested by creating a room, observing the generated code, having a second player join via that code, and verifying the host can see both players and start the game.

**Acceptance Scenarios**:

1. **Given** a player wants to host a game, **When** they choose to create a room, **Then** a new room is created with a unique alphanumeric code and the creator is designated as the host.

2. **Given** a room has been created with the host present, **When** the host views the lobby, **Then** they see their own name in the player list with a "Host" indicator.

3. **Given** a host is in the lobby with at least one other player present, **When** the host clicks "Start Game", **Then** the game begins for all connected players.

4. **Given** a host is in the lobby with only themselves present (fewer than 2 players), **When** they attempt to start the game, **Then** they receive a message that at least 2 players are required.

---

### User Story 2 - Player Joins a Room via Code (Priority: P1)

A player receives a room code from a host and wants to join the game. They enter the code and see the lobby with the host and other players who have already joined.

**Why this priority**: Joining is equally critical — a game with only a host is not playable.

**Independent Test**: Can be fully tested by creating a room, then joining it from a different session using the correct room code, and verifying both players appear in the lobby.

**Acceptance Scenarios**:

1. **Given** an existing room with a valid code, **When** a player enters the correct code, **Then** they are added to the room and see the lobby with the host and any other players.

2. **Given** a room exists with 3 players, **When** a fourth player joins with the correct code, **Then** they enter the lobby and all 4 players are visible in the player list.

---

### User Story 3 - Player Enters an Invalid or Empty Code (Priority: P1)

A player attempts to join a room but provides a code that is invalid, expired, or empty. The system rejects the attempt and displays a helpful message.

**Why this priority**: Robust input validation prevents confusion and guides users toward correct usage.

**Independent Test**: Can be fully tested by attempting to join with empty input, a non-existent code, and a malformed code, then verifying an appropriate error message in each case.

**Acceptance Scenarios**:

1. **Given** a player is on the join screen, **When** they submit an empty room code, **Then** they see a clear error message indicating that a code is required.

2. **Given** a player is on the join screen, **When** they submit a code that does not match any active room, **Then** they see an error message indicating the room was not found.

3. **Given** a player is on the join screen, **When** they submit a code that is malformed (wrong format), **Then** they see an appropriate error message.

---

### Edge Cases

- **Duplicate join**: A player who is already in a room re-enters the same code — they should see the lobby rather than an error, or be shown a clear message that they are already in the room.
- **Concurrent joins**: Multiple players join in quick succession — all should be added reliably with the polling reflecting accurate state.
- **Duplicate name**: A player tries to join with a display name already taken in the room — they are prompted to choose a different name.
- **Room expiry**: Rooms that are empty for a period should be cleaned up to prevent memory leaks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any player to create a new room without authentication.
- **FR-002**: Upon room creation, system MUST generate a unique alphanumeric room code and designate the creator as the host.
- **FR-003**: System MUST allow any player to join an existing room by providing a valid room code.
- **FR-004**: System MUST reject join attempts with an empty room code and display a clear error message.
- **FR-005**: System MUST reject join attempts with a non-existent room code and display a clear error message.
- **FR-006**: System MUST maintain room isolation — players in one room cannot see or interact with players in another room.
- **FR-007**: System MUST refresh the lobby player list via polling at approximately 2-second intervals so all players see current state.
- **FR-008**: Only the host MUST be able to start the game from the lobby.
- **FR-009**: System MUST prevent the game from starting unless at least 2 players (including the host) are present in the room.
- **FR-010**: When the game starts, all players in the room MUST be transitioned to the game view — the initiator navigates immediately on the start response; other clients navigate on the next poll cycle when the room status is no longer `"lobby"`.
- **FR-011**: System MUST clean up rooms that have been empty/inactive for 5 minutes to prevent memory leaks.
- **FR-012**: System MUST enforce unique display names within a room — a player attempting to join with a taken name must be prompted to choose a different one.
- **FR-013**: The UI MUST show a loading indicator on the submit button and disable it during create/join API requests to prevent double-submission.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique alphanumeric code. Contains a list of players, a designated host, and a game state (waiting, in-progress). Isolated from all other rooms.
- **Player**: A participant in a room, identified by a display name that is unique within the room. Has a role (host or participant). Players are anonymous (no authentication).
- **Lobby**: The pre-game waiting area within a room where players see the player list and the host can start the game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and receive a unique code within 2 seconds of requesting creation.
- **SC-002**: A player can join a room by entering a valid code and see the lobby with the correct player list within 3 seconds.
- **SC-003**: Invalid or empty room codes produce a clear error message visible to the user within 1 second of submission.
- **SC-004**: The lobby player list refreshes automatically such that a player joining is visible to all other players within 3 seconds.
- **SC-005**: Only the host can trigger game start; non-host players who attempt to start receive feedback within 1 second.
- **SC-006**: The system prevents game start with fewer than 2 players, showing a clear message to the host.
- **SC-007**: Rooms are fully isolated — actions in one room never affect the state of another room.
- **SC-008**: Inactive rooms are cleaned up within 5 minutes, keeping memory usage bounded.

## Assumptions

- Players connect from individual browser tabs/sessions with no shared state between them.
- Room codes are exactly 4 alphanumeric characters, sufficient for uniqueness.
- Players provide a display name when creating or joining a room (no authentication system).
- Maximum room capacity: no limit — any number of players can join an active room.
- Host departure handling (reassignment or room closure) is deferred to a future iteration.
- The 2-second polling interval is a reasonable default for lobby state synchronization.
- The system operates in a single server process with in-memory state (no persistence).

