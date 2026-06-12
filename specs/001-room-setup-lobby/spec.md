# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby
**Given** a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host a room (Priority: P1)

A player creates a new drawing room and becomes the host immediately.

**Why this priority**: Hosting is the entry point for multiplayer games and must work reliably before other players can join.

**Independent Test**: Create a room from the entry page, verify the creator is assigned host status, and confirm room code and lobby state appear.

**Acceptance Scenarios**:

1. **Given** a player is on the room creation page, **When** they create a room, **Then** the system generates a unique room code, opens a lobby for that room, and marks that player as the host.
2. **Given** the room host is in the lobby, **When** the lobby state refreshes, **Then** the host still sees the same room code and host label without losing room isolation.

---

### User Story 2 - Join an existing room (Priority: P1)

A second player joins using a valid room code and enters the same isolated lobby.

**Why this priority**: Multiplayer gameplay requires more than one player in the same room; joining is essential to enable the game.

**Independent Test**: Attempt to join with an active room code from another browser tab and confirm the second player enters the same lobby.

**Acceptance Scenarios**:

1. **Given** a player has a valid room code, **When** they enter it on the join page and submit, **Then** they are placed into the corresponding room lobby and see the list of current players.
2. **Given** a player uses a valid code but the room is already isolated from other rooms, **When** they join, **Then** they do not see data from any other room.

---

### User Story 3 - Reject invalid or empty room codes (Priority: P1)

A player receives clear feedback if the entered room code is missing, malformed, or invalid.

**Why this priority**: Preventing invalid room access maintains room isolation and reduces confusion.

**Independent Test**: Submit an empty, malformed, or invalid code and verify a visible validation message is displayed and the join attempt is blocked.

**Acceptance Scenarios**:

1. **Given** a player submits an empty room code, **When** they try to join, **Then** the system shows a clear validation message and keeps them on the join screen.
2. **Given** a player submits a code that is malformed or does not match any active room, **When** they try to join, **Then** the system shows a clear invalid-code error and does not allow entry.

---

### User Story 4 - Only the host can start the game (Priority: P2)

The host sees the start-game control and can only begin the game when the lobby has at least two players.

**Why this priority**: Game progression must be gated by host control and a minimum player count to preserve fairness and expected flow.

**Independent Test**: Verify that a non-host player cannot see or use the start control, and that the host cannot start until a second player is present.

**Acceptance Scenarios**:

1. **Given** the room has only the host, **When** the host views the lobby, **Then** the start button is disabled or hidden until a second player joins.
2. **Given** a second player joins the room, **When** the host views the lobby, **Then** the host can start the game and the lobby transitions to the game state.
3. **Given** a non-host player is in the lobby, **When** they view the lobby, **Then** they do not see an active start-game control.

---

### User Story 5 - Lobby refreshes via polling (Priority: P2)

Lobby state updates automatically on a periodic refresh cycle.

**Why this priority**: Timely lobby updates are needed to show new players and host status without real-time push protocols.

**Independent Test**: Observe the lobby page for new players appearing within the polling window after another player joins.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room, **Then** the first player's lobby view refreshes within about 2 seconds and shows the new player.
2. **Given** the lobby is active, **When** the page polls the backend, **Then** it continues to show the current room state and does not merge data from other rooms.

---

### Edge Cases

- What happens when a room code is valid but the room has been removed due to inactivity? The system should treat it as invalid and show the invalid-code message.
- What happens when the host refreshes the page? The room should remain available and the host identity should persist for that room session.
- What happens if a second player joins while the host is starting the game? The start action should require the current active player list from the latest lobby refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique, shareable room code when a player creates a new room.
- **FR-002**: System MUST assign the room creator as the host immediately on room creation.
- **FR-003**: System MUST accept a room code on join attempts and validate its format and existence before entering a room.
- **FR-004**: System MUST reject empty room codes with a clear validation message.
- **FR-005**: System MUST reject room codes that are malformed or do not match an active room with a clear invalid-code error.
- **FR-006**: System MUST isolate room data so that players can only access the lobby and state for their specific room.
- **FR-007**: System MUST allow only the host to start the game and disallow a start action from any other player.
- **FR-008**: System MUST require at least two players before the host can start the game.
- **FR-009**: System MUST refresh lobby state periodically by polling the backend at approximately a 2-second interval.
- **FR-010**: System MUST maintain room state and player list across lobby polling cycles without leaking other rooms' state.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a unique game session identified by a room code, containing host assignment, player list, current state, and last activity timestamp.
- **Player**: Represents a participant in a room, including display name, unique session identifier, host flag, and current lobby status.
- **Lobby**: Represents the pre-game room view where players wait, see player presence, host controls, and the room code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can create or join a room with a valid code and reach the lobby successfully in at most 3 steps.
- **SC-002**: Empty, malformed, or nonexistent room codes produce a visible error message immediately, preventing entry.
- **SC-003**: Only the room creator is granted host privileges and only the host can see the start control.
- **SC-004**: The host can start the game only after at least two players are present.
- **SC-005**: Lobby state updates automatically within approximately 2 seconds after another player joins.
- **SC-006**: Rooms remain isolated so that no player can see data from any room other than their own.

## Assumptions

- Players access the game through a browser and the client can poll the backend at a short interval.
- Host identity is managed within the room session and does not require separate authentication.
- Room persistence is in-memory and can be invalidated when a room becomes inactive.
- The join flow is limited to code-based room access and does not require user accounts or external identity.
