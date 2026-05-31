# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing

### User Story 1 - Host Creates a Room (Priority: P1)

A player wants to host a drawing game. They enter their name and create a room. The system generates a unique room code, marks them as the host, and places them in the lobby.

**Why this priority**: Creating a room is the entry point for the entire game experience — nothing else works without it.

**Independent Test**: Can be fully tested by navigating to the create-room page, entering a name, submitting, and verifying the response includes a room code, participant ID, and host status.

**Acceptance Scenarios**:

1. **Given** a player on the create-room page, **When** they enter a valid name and submit, **Then** a room is created with a unique 4-character code, the player is added as a participant marked as host, and they are placed in the lobby.
2. **Given** a player on the create-room page, **When** they submit with an empty or whitespace-only name, **Then** an error message is displayed and no room is created.
3. **Given** a room already exists, **When** another player creates a new room, **Then** they receive a different room code and both rooms operate independently.

---

### User Story 2 - Player Joins a Room (Priority: P1)

A player wants to join an existing drawing game. They enter a room code and their name. If the code is valid, they join the lobby. If invalid, they receive clear feedback.

**Why this priority**: Joining rooms is the second half of the core entry flow — both create and join must work for the game to function.

**Independent Test**: Can be fully tested by entering a valid existing room code and name, submitting, and verifying the participant is added to the room's participant list.

**Acceptance Scenarios**:

1. **Given** an existing room with code "ABCD", **When** a player enters "ABCD" and a valid name and submits, **Then** they join the room and are placed in the lobby with the room code visible.
2. **Given** any room, **When** a player enters a non-existent code (e.g., "ZZZZ") and submits, **Then** an error message "Room not found" is displayed and they are not added to any room.
3. **Given** any room, **When** a player enters an empty or malformed code (e.g., blank, too short) and submits, **Then** a validation error is displayed.

---

### User Story 3 - Lobby Refreshes via Polling (Priority: P2)

Players in the lobby see an up-to-date participant list without manual refreshing. The lobby automatically polls the server every ~2 seconds.

**Why this priority**: Auto-refresh is important for UX but the game functions with manual refresh; this is a convenience enhancement.

**Independent Test**: Can be fully tested by opening two browser windows in the same room, observing that when a new player joins, the first player's lobby updates within ~2-3 seconds without manual intervention.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** they remain on the page, **Then** the participant list is fetched from the server every ~2 seconds.
2. **Given** two players are in the same lobby, **When** one player leaves, **Then** the other player's lobby reflects the updated participant count within ~2-3 seconds.

---

### User Story 4 - Host Starts the Game (Priority: P2)

Only the host can start the game. The start button is enabled only when at least 2 players are present.

**Why this priority**: The game must start with the right person controlling the flow, but the lobby still works without this feature.

**Independent Test**: Can be fully tested by creating a room as host, verifying only the host sees the "Start Game" button enabled when 2+ players are present.

**Acceptance Scenarios**:

1. **Given** a room with only the host, **When** the host views the lobby, **Then** the "Start Game" button is disabled or hidden.
2. **Given** a room with 2+ participants, **When** the host views the lobby, **Then** the "Start Game" button is enabled.
3. **Given** a room with 2+ participants, **When** a non-host participant views the lobby, **Then** the "Start Game" button is not visible or is disabled.
4. **Given** a room with 2+ participants and the host clicks "Start Game", **Then** all participants are navigated to the game screen and room status changes to "playing".

### Edge Cases

- What happens when a room code contains lowercase letters? (Should be case-insensitive)
- What happens when the server restarts and all rooms are lost? (User sees "Room not found" on next poll)
- What happens when a player tries to join a room that is already in "playing" status? (Should be rejected with appropriate message)

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate a unique 4-character room code when a room is created, using alphanumeric characters excluding ambiguous ones (0/O, 1/I/L).
- **FR-002**: System MUST mark the room creator as the host.
- **FR-003**: System MUST reject room creation with an empty or whitespace-only player name and display an error message.
- **FR-004**: System MUST validate room codes on join — non-existent codes return "Room not found" error; malformed codes (empty, wrong length) return a validation error.
- **FR-005**: System MUST return a participant ID when a player creates or joins a room, used for subsequent requests.
- **FR-006**: System MUST support case-insensitive room code matching on join.
- **FR-007**: System MUST prevent joining a room that is in "playing" status.
- **FR-008**: Frontend MUST poll `GET /rooms/:code` every ~2 seconds while on the lobby page.
- **FR-009**: Only the host can start the game; the start game action is rejected if the requester is not the host.
- **FR-010**: The start game action is only allowed when at least 2 participants are in the room.
- **FR-011**: When the host starts the game, all participants' lobbies transition to the game screen and room status changes to "playing".

### Key Entities

- **Room**: A game session with a unique code, status, participant list, and host designation.
- **Participant**: A player in a room with an ID, name, and host flag.
- **RoomStatus**: The lifecycle state of a room — "lobby", "playing", "round_end", "game_over".

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can create a room and see the lobby in under 2 seconds from submission.
- **SC-002**: A player can join a room by code and see the lobby in under 2 seconds from submission.
- **SC-003**: When a new player joins, all existing lobby participants see the updated list within ~3 seconds (within one polling cycle).
- **SC-004**: Invalid or non-existent room codes produce an error message within 2 seconds.
- **SC-005**: Only the host can trigger the game start; non-host attempts are rejected.

## Assumptions

- Room codes are 4 characters from a safe alphabet (no ambiguous characters).
- The frontend stores the participant ID in memory (via the RoomStore) for the session duration.
- Server-sent events or WebSocket are NOT used — all sync is via HTTP polling.
- Players close their browser tab to "leave" a room (no explicit leave endpoint in v1).
- All room data is lost on server restart (in-memory storage).
