# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby"

## User Scenarios & Testing

### User Story 1 - Create Room and Host Assignment (Priority: P1)
As a player, I want to create a room so that I can host a drawing game.

**Why this priority**: Core entry point of the game. Without creating a room, multiplayer cannot start.

**Independent Test**: Create a room from the landing page. Verify that the player is successfully redirected to `/lobby`, a unique code is generated, and the player is marked as the host.

**Acceptance Scenarios**:
1. **Given** the player is on the Start screen, **When** they enter a name and click "Create Room", **Then** a new room is created with a unique 4-character code, the player is added as a participant, and they are designated as the host.

---

### User Story 2 - Join Room and Validation (Priority: P1)
As a player, I want to join an existing room via a unique code, with validation to reject invalid or empty codes.

**Why this priority**: Crucial for connecting players. Validation prevents entering non-existent or empty rooms.

**Independent Test**: Try to join with a non-existent or empty code. Verify a clear error message is shown. Then try to join with a valid code.

**Acceptance Scenarios**:
1. **Given** the player is on the Join Room screen, **When** they leave the room code empty and click "Join Lobby", **Then** the UI shows a clear error message "Room code is required".
2. **Given** the player is on the Join Room screen, **When** they enter a code of invalid format (e.g. not 4 characters), **Then** the request is rejected with feedback "Invalid room code format".
3. **Given** a room code does not exist in backend memory, **When** a player tries to join, **Then** they see a "Room not found" error.

---

### User Story 3 - Lobby Sync via Polling (Priority: P1)
As a participant in a lobby, I want the list of participants to update automatically.

**Why this priority**: Without polling, players would have to manually refresh to see other players join.

**Independent Test**: Open two browser tabs. Let Tab A create a room and join. Let Tab B join the room. Tab A should automatically update the participant list within 2 seconds.

**Acceptance Scenarios**:
1. **Given** a player is waiting in the Lobby screen, **When** another player joins the same room code, **Then** the first player's lobby participant list automatically updates within ~2 seconds without manual refresh.

---

### User Story 4 - Host-Only Start Game Permissions (Priority: P2)
As a host, I want to be the only person who can start the game, and only when there are at least 2 players in the room.

**Why this priority**: Prevents non-hosts or single-player starts from breaking game rules.

**Independent Test**: Open two tabs. In the host tab (Tab A), the "Start Game" button should be disabled until Tab B joins. In Tab B (non-host), the "Start Game" button should not be clickable or visible.

**Acceptance Scenarios**:
1. **Given** the host is in the lobby alone, **When** looking at the "Start Game" button, **Then** the button is disabled.
2. **Given** the host is in the lobby with another player, **When** the player count is >= 2, **Then** the "Start Game" button is enabled.
3. **Given** a non-host player is in the lobby, **When** looking at the Lobby page, **Then** they cannot start the game (button is disabled or hidden, showing "Waiting for host to start").

### Edge Cases
- **Room Isolation:** Players in Room A must not see or sync state with Room B.
- **Lowercase Code Input:** The room code is case-insensitive. Entering `abcd` should resolve to `ABCD`.
- **Extra Whitespace:** Room codes and names should have leading/trailing whitespaces trimmed.

## Requirements

### Functional Requirements
- **FR-001**: The backend MUST store a `hostId` for each created room, mapping it to the creator's participant ID.
- **FR-002**: The backend API `GET /rooms/:code` MUST return the `hostId` as part of the room snapshot payload.
- **FR-003**: The backend MUST validate room codes on `POST /rooms/:code/join` and `GET /rooms/:code` to ensure they are 4-character alphanumeric strings.
- **FR-004**: The frontend MUST run a repeating interval timer (~2s cadence) on the `/lobby` route to fetch the latest room snapshot.
- **FR-005**: The frontend MUST disable/hide the "Start Game" button for any participant whose `participantId` does not match the room's `hostId`.
- **FR-006**: The frontend/backend MUST enforce that starting the game requires `participants.length >= 2`.

## Success Criteria

### Measurable Outcomes
- **SC-001**: 100% of room creations assign the creator's ID as the `hostId`.
- **SC-002**: Automatic lobby refreshes occur within 2000ms ± 200ms of any participant joining.
- **SC-003**: A non-host participant is programmatically blocked from triggering the start game endpoint or navigating past lobby unilaterally.
- **SC-004**: Entering a blank room code returns immediate validation feedback.

## Assumptions
- **Host Persistence:** Once a host is assigned, they remain the host for the duration of that lobby session.
- **In-Memory Store:** The server retains the lobby state in memory; any server restart resets all active rooms.
