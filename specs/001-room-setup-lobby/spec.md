# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Room setup and lobby support with host-only start, automatic lobby polling, clear validation for join codes, and room isolation."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Host Creates Room and Starts Game (Priority: P1)

A host creates a new game room, waits for at least one other player, and starts the game once the room is ready.

**Why this priority**: This is the primary entry point for the game and unlocks all multiplayer gameplay.

**Independent Test**: Create a room, confirm the creator is marked as host, add a second player, and verify the host can start the game while others cannot.

**Acceptance Scenarios**:

1. **Given** an empty start screen, **When** a player creates a room with a valid name, **Then** the system creates a new room, marks that player as host, and navigates them to the lobby.
2. **Given** a lobby with one player, **When** the host attempts to start the game, **Then** the start control is disabled and a message indicates at least two players are required.
3. **Given** a lobby with two or more players, **When** the host clicks start, **Then** the game enters the next phase and all players are transitioned out of the lobby.

---

### User Story 2 - Joiner Enters Room and Sees Live Lobby Updates (Priority: P2)

A player joins an existing room by code and sees an automatically refreshing participant list.

**Why this priority**: Multiplayer presence is essential for collaborative gameplay and smooth join experience.

**Independent Test**: Join an existing room from another browser/tab and verify the participant list updates automatically within about 2 seconds.

**Acceptance Scenarios**:

1. **Given** a valid room code, **When** a player enters the code and a display name, **Then** the player joins the room and sees the current lobby participant list.
2. **Given** the room state changes on another client, **When** the local client remains on the lobby screen, **Then** it refreshes the lobby snapshot automatically without manual refresh.

---

### User Story 3 - Room Code and Name Validation (Priority: P3)

The system rejects invalid room codes and empty player names with clear feedback.

**Why this priority**: Good validation prevents confusing failures and supports first-time users.

**Independent Test**: Attempt to join with a bad room code and attempt to create/join with empty or whitespace-only names.

**Acceptance Scenarios**:

1. **Given** a non-existent or malformed room code, **When** a player submits join, **Then** the system shows a clear error and does not enter the room.
2. **Given** an empty or whitespace-only name, **When** a player submits create or join, **Then** the system rejects the submission and displays a validation message.

---

### Edge Cases

- What happens when two players attempt to join the same room at the same time?
- How does the lobby behave if the host leaves before the game starts?
- What happens if the room is created then immediately queried by a joiner before the backend has fully registered it?
- How is a room code treated with different letter casing (e.g. uppercase vs lowercase)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and automatically assign that player as the host.
- **FR-002**: System MUST allow a player to join an existing room by entering a room code and a display name.
- **FR-003**: System MUST reject room creation or join requests when the display name is empty or whitespace-only after trimming.
- **FR-004**: System MUST reject join attempts for invalid or non-existent room codes and present a clear error message.
- **FR-005**: System MUST keep rooms isolated so participants in one room cannot see or join another room by mistake.
- **FR-006**: The lobby screen MUST refresh the room snapshot automatically at a regular interval of approximately 2 seconds.
- **FR-007**: The start game action MUST only be available to the host.
- **FR-008**: The start game action MUST remain disabled until the lobby contains at least two players.
- **FR-009**: System MUST preserve the current lobby state while polling so the joiner experience remains stable.

### Key Entities _(include if feature involves data)_

- **Room**: Represents an active game instance identified by a unique code and containing player list and current phase.
- **Player**: Represents a participant with a display name, role state, and a host flag.
- **Lobby Snapshot**: Represents the current room state visible in the lobby, including player names, host identity, and start eligibility.
- **Host**: The room creator who has exclusive permission to start the game.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A room can be created and the creator is identified as host in the lobby.
- **SC-002**: A second player can join using a valid room code and see the current participant list.
- **SC-003**: The lobby updates to reflect room state changes automatically within 2 seconds.
- **SC-004**: The start action is only enabled for the host and only when two or more players are present.
- **SC-005**: Invalid room codes and empty names produce a visible error message and do not navigate into the room.
- **SC-006**: Rooms remain isolated; actions in one room do not change another room's lobby state.

## Assumptions

- Player names are short display names only and do not require full account profiles.
- Room codes are generated uniquely by the backend and validated on every join request.
- Lobby polling is acceptable for live state updates and should run roughly every 2 seconds.
- No authentication or persistent storage is required; all state is held in memory for the session lifetime.
- The host is defined as the room creator and remains the only player allowed to start the game.
