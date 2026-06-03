# Feature Specification: Room Setup & Lobby

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Add host tracking, room code validation, lobby polling, minimum player check, and host-only start to the room setup and lobby flow"

## User Scenarios & Testing

### User Story 1 - Create and host a room (Priority: P1)

A player opens the app and creates a new room. They are automatically designated as the host, see the lobby with their name in the participant list, and can start the game once another player joins.

**Why this priority**: Core flow — without hosting, no game can start.

**Independent Test**: Can be tested by creating a room and verifying the creator is listed as a participant and a host indicator exists.

**Acceptance Scenarios**:

1. **Given** a player enters a name and clicks "Create Room", **When** the room is created, **Then** the player is redirected to the lobby as the host.
2. **Given** a room exists, **When** the room snapshot is fetched, **Then** the creator is identifiable as the host.
3. **Given** a room has only one participant, **When** the host tries to start the game, **Then** the start action is rejected with a message that at least 2 players are needed.

---

### User Story 2 - Join a room with validation (Priority: P1)

A player with a room code can join an existing lobby. Invalid codes, empty codes, and empty names are rejected with clear error messages. The player sees the lobby with all participants listed.

**Why this priority**: Core flow — without joining, multiplayer is impossible.

**Independent Test**: Can be tested by attempting room codes and names with various valid/invalid values.

**Acceptance Scenarios**:

1. **Given** a room exists with code "ABCD", **When** another player enters "ABCD" and a valid name, **Then** they join the room and see the lobby.
2. **Given** a player enters an empty room code, **When** they attempt to join, **Then** an error message "Room code is required" is shown.
3. **Given** a player enters a room code with surrounding whitespace like " ABCD ", **When** they attempt to join, **Then** the code is trimmed and matched successfully.
4. **Given** a player enters an empty or whitespace-only name, **When** they attempt to create or join a room, **Then** an error message "Player name is required" is shown.
5. **Given** a player enters a room code that does not exist, **When** they attempt to join, **Then** an error message "Room not found" is shown.

---

### User Story 3 - Lobby auto-refreshes via polling (Priority: P2)

Players in the lobby see updated participant lists automatically without manual refresh.

**Why this priority**: Enhances UX — without polling, players would need to manually refresh to see new joiners.

**Independent Test**: Can be tested by opening two browser tabs, joining from the second, and seeing the first tab update automatically within ~3 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room, **Then** the first player sees the updated participant list within ~3 seconds without clicking any button.
2. **Given** a player is in the lobby, **When** they navigate away or close the tab, **Then** polling stops.

---

### User Story 4 - Host-only start game (Priority: P2)

Only the room host can start the game. Non-host players see the start button as disabled or hidden.

**Why this priority**: Ensures game integrity — prevents any participant from triggering game start.

**Independent Test**: Can be tested by joining a room as a second player and verifying the start game button is not active for non-host players.

**Acceptance Scenarios**:

1. **Given** a room with 2+ participants, **When** the host clicks "Start Game", **Then** a request is sent to the backend to transition the room status.
2. **Given** a room with 2+ participants, **When** a non-host player views the lobby, **Then** the "Start Game" button is disabled or hidden.

---

### User Story 5 - Leave the lobby (Priority: P3)

A player in the lobby can return to the home screen without starting a game.

**Why this priority**: Nice-to-have — prevents dead-end navigation.

**Independent Test**: Can be tested by clicking a "Leave" button and confirming return to the home screen.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** they click "Leave Room", **Then** they are redirected to the home screen and the current room session is cleared.

### Edge Cases

- What happens when two rooms generate the same code? — Codes are unique; the generation loop retries on collision.
- What happens if a player refreshes the lobby page? — Currently state is lost; the store redirects to home. Future improvement.
- What happens if all players leave? — Room remains in memory but is empty. No explicit cleanup in this scenario.
- What happens when a player tries to join a room they are already in? — No duplicate check exists; they join as a new participant.

## Requirements

### Functional Requirements

- **FR-001**: Backend MUST assign a host flag to the first participant (room creator) in a room.
- **FR-002**: Backend MUST reject room creation or join requests with empty or whitespace-only player names with a clear error message.
- **FR-003**: Backend MUST reject join requests for non-existent room codes with a clear error message.
- **FR-004**: Backend MUST trim and normalize incoming room codes (uppercase, trim whitespace) before matching.
- **FR-005**: Backend MUST reject join requests with empty room codes.
- **FR-006**: Backend MUST expose a host-only start-game endpoint that transitions room status from "lobby" to "playing".
- **FR-007**: Backend MUST reject start-game requests from non-host participants.
- **FR-008**: Backend MUST reject start-game requests when fewer than 2 participants are in the room.
- **FR-009**: Frontend lobby MUST display a host indicator for the room creator.
- **FR-010**: Frontend lobby MUST poll the backend room snapshot at ~2 second intervals.
- **FR-011**: Frontend lobby MUST stop polling when the component unmounts.
- **FR-012**: Frontend lobby MUST disable/hide the "Start Game" button for non-host players.
- **FR-013**: Frontend lobby MUST show an error message when attempting to start with fewer than 2 players.
- **FR-014**: Frontend MUST provide a "Leave Room" button in the lobby that clears the store and navigates home.

### Key Entities

- **Room**: A game session identified by a unique 4-character code. Contains participants list, status, timestamps.
- **Participant**: A player in a room. Has id, name, joinedAt, and a host flag.
- **RoomSnapshot**: A view of the room returned to clients. Contains code, status, participants list, available words, and roles.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can create a room and be clearly identified as the host within 1 second.
- **SC-002**: A second player can join with a valid code and valid name and see the lobby in under 2 seconds.
- **SC-003**: Invalid codes and empty names are rejected with a clear error message in under 1 second.
- **SC-004**: Lobby participant list auto-updates within ~3 seconds of another player joining.
- **SC-005**: Only the host can start the game; non-hosts see a disabled button.
- **SC-006**: Game cannot be started with fewer than 2 players.

## Assumptions

- Polling uses `setInterval` + `fetch` (no WebSockets per project constraints).
- Host is the first participant in the participants array.
- Room status type will be extended from `"lobby"` only to include `"playing"`.
- The "Start Game" button will trigger a backend API call, not just a client-side redirect.
