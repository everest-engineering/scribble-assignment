# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Room setup and lobby — Host tracking on room creation, join validation with clear error messages, verified multi-room isolation, automatic lobby polling within about 2 seconds, host-only start with 2-player minimum"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Room Creation and Host Assignment (Priority: P1)

A player opens the app, enters their name, and creates a new room. They are
automatically designated as the host and shown the lobby for that room. The
room gets a unique code that others can use to join.

**Why this priority**: Room creation is the entry point for the entire
multiplayer experience. Without it, no other feature is possible.

**Independent Test**: A single player can open the app, enter a name, create a
room, and see a lobby screen with a unique room code displayed.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen with a name input, **When** they
   enter a non-empty name and click "Create Room", **Then** a new room is
   created, they become the host, and they are taken to the lobby showing the
   room code and their name in the participant list.
2. **Given** a player submits the create room form with an empty or
   whitespace-only name, **When** they click "Create Room", **Then** they see a
   clear error message and remain on the start screen.
3. **Given** a room has been created, **When** another room is created, **Then**
   it receives a different unique code and the two rooms operate independently
   with no shared state.

---

### User Story 2 - Join Room with Validation (Priority: P1)

A player joins an existing room by entering its code. Invalid, empty, or
non-existent codes are rejected with clear, specific error messages.

**Why this priority**: Joining is the second essential flow for multiplayer.
Clear validation prevents confusion and guides users to correct input.

**Independent Test**: A player can enter a valid room code and name, join the
room, and see themselves in the lobby participant list alongside the host.

**Acceptance Scenarios**:

1. **Given** a room exists with code "ABC123", **When** a player enters the
   code "ABC123" and a non-empty name, **Then** they join the room and are
   taken to the lobby showing all participants.
2. **Given** a player submits the join form with an empty or whitespace-only
   room code, **When** they click "Join Room", **Then** they see a clear error
   message ("Room code is required") and remain on the join screen.
3. **Given** a player submits the join form with a code that does not match any
   existing room, **When** they click "Join Room", **Then** they see a clear
   error message ("Room not found") and remain on the join screen.
4. **Given** a player submits the join form with an empty or whitespace-only
   name, **When** they click "Join Room", **Then** they see a clear error
   message ("Name is required") and remain on the join screen.

---

### User Story 3 - Lobby Polling and Game Start (Priority: P1)

The lobby displays all joined participants and refreshes automatically every 2
seconds. Only the host can start the game, and only when at least 2 players
are in the room.

**Why this priority**: The lobby is the staging area for multiplayer.
Polling ensures all players see the same participant list. Host-only start
prevents unauthorised game launches.

**Independent Test**: Two players can be in the same lobby; the host sees a
"Start Game" button (enabled once 2 players are present); a non-host sees no
start button; clicking "Start Game" transitions both players to the game
screen.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby with one other player, **When** the host
   clicks "Start Game", **Then** all players in the room transition to the
   game screen.
2. **Given** a non-host player is in the lobby, **When** they view the screen,
   **Then** no "Start Game" button is visible.
3. **Given** a host is alone in the lobby (only 1 player), **When** they view
   the screen, **Then** the "Start Game" button is disabled or hidden with a
   message indicating at least 2 players are needed.
4. **Given** multiple players are in the lobby, **When** a new player joins or
   leaves, **Then** all players see the updated participant list within
   approximately 2 seconds without manual refresh.

---

### Edge Cases

- What happens when a player tries to join a room they are already in? They
  should be allowed back in (or shown a message that they are already a
  member — same lobby state).
- What happens when all participants leave the lobby? The room should remain
  available for new joins until explicitly closed.
- What happens if the network is slow or the backend is unreachable during
  polling? The lobby should display a connection status indicator and
  continue retrying.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a room by providing a
  non-empty player name.
- **FR-002**: The player who creates a room MUST be designated as the host.
- **FR-003**: Each room MUST have a unique code that is generated upon
  creation.
- **FR-004**: System MUST allow players to join a room by providing a room code
  and a non-empty player name.
- **FR-005**: System MUST validate that the room code is non-empty and
  references an existing room before allowing a join.
- **FR-006**: System MUST display a specific, clear error message for each
  validation failure (empty code, empty name, room not found).
- **FR-007**: The lobby MUST display all participants currently in the room.
- **FR-008**: The lobby MUST automatically refresh the participant list
  approximately every 2 seconds.
- **FR-009**: Only the host MUST be able to start the game.
- **FR-010**: The game MUST NOT start until at least 2 players are in the
  room.
- **FR-011**: Rooms MUST be fully isolated — participants and state in one
  room MUST NOT affect any other room.

### Key Entities

- **Room**: A game session identified by a unique code. Contains participants,
  host assignment, and game state. Rooms do not persist beyond the server's
  lifetime.
- **Participant**: A player in a room identified by a participant ID and
  display name. One participant per room is designated as the host.
- **Lobby**: The pre-game state of a room where participants gather before
  starting. Shows participant list and room code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see it in the lobby within 3
  seconds of submitting their name.
- **SC-002**: A second player can join an existing room by code and see
  themselves in the lobby within 3 seconds.
- **SC-003**: After a valid join, the participant list updates on all connected
  screens within approximately 2 seconds.
- **SC-004**: Invalid or empty inputs produce a specific error message within
  1 second of submission.
- **SC-005**: A non-host player cannot start the game under any
  circumstances.
- **SC-006**: Two independent rooms can each host 2+ players without any
  cross-room interference.

## Assumptions

- Players have a stable internet connection with latency under 500ms to the
  backend.
- Room codes are generated by the backend and are short enough for players to
  communicate verbally (e.g., 4-6 alphanumeric characters).
- A single browser tab per player is the expected usage pattern; the system
  does not need to handle the same player joining from multiple tabs.
- Polling is implemented on the frontend by periodically fetching the room
  snapshot from the backend. This aligns with the project constraint that all
  sync uses HTTP polling, not WebSockets.
