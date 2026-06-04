# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Room Setup & Lobby Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present. Analyse the existing codebase to make sure only the missing features from above acceptance criteria is added. Do not reimplement the already existing features."

## Clarifications

### Session 2026-06-02
- Q: Room Capacity → A: 8 Players
- Q: Host Disconnection → A: Close room immediately

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hosting a Game (Priority: P1)

As a player, I want to create a new game room so that I can host a drawing session with my friends.

**Why this priority**: Core entry point for the game. Without a host, rooms cannot be managed or started.

**Independent Test**: Can be tested by clicking "Create Room" and verifying the player is identified as the host in the lobby (e.g., via a "Host" badge).

**Acceptance Scenarios**:

1. **Given** I am on the start page, **When** I create a room, **Then** I am redirected to the lobby and marked as the host.
2. **Given** I am the host, **When** I view the participant list, **Then** I see my name with a "Host" indicator.

---

### User Story 2 - Joining a Game (Priority: P1)

As a player, I want to join an existing room using a code so that I can play with others.

**Why this priority**: Essential for multiplayer interaction.

**Independent Test**: Can be tested by entering a valid room code on the "Join Room" page.

**Acceptance Scenarios**:

1. **Given** a room exists with code "ABCD", **When** I enter "ABCD" and my name, **Then** I am added to the lobby as a participant.
2. **Given** I enter an empty or non-existent room code, **When** I attempt to join, **Then** I see a clear error message explaining why I cannot join.

---

### User Story 3 - Lobby Synchronization (Priority: P2)

As a player in the lobby, I want the participant list to update automatically so that I know when others have joined.

**Why this priority**: Enhances user experience and provides feedback that the system is active without requiring manual refresh.

**Independent Test**: Can be tested by joining a room from a second browser window and observing the first window's list update within 2 seconds.

**Acceptance Scenarios**:

1. **Given** I am in a lobby, **When** another player joins, **Then** their name appears in my list within 2 seconds without manual intervention.

---

### User Story 4 - Starting the Game (Priority: P1)

As a host, I want to start the game once enough players have joined so that we can begin playing.

**Why this priority**: Transitions the app from setup to gameplay.

**Independent Test**: Can be tested by the host clicking "Start Game" when at least 2 players are present.

**Acceptance Scenarios**:

1. **Given** I am the host and there is only 1 player, **When** I view the "Start Game" button, **Then** it is disabled.
2. **Given** I am the host and there are 2 or more players, **When** I click "Start Game", **Then** the game begins for all participants.
3. **Given** I am not the host, **When** I am in the lobby, **Then** I cannot see the "Start Game" button (or it is clearly marked as host-only and disabled).

### Edge Cases

- **Invalid Codes**: Handling of codes with special characters or incorrect lengths (e.g., lowercase vs uppercase).
- **Empty Name**: Preventing players from joining with empty names.
- **Full Room**: Rejecting new players when capacity reaches 8.
- **Host Disconnection**: If the host leaves, the room is closed immediately and all other participants are redirected to the start page.
- **Duplicate Names**: Rejecting players who try to join with a name already present in the room.
- **Player Refresh**: If a player refreshes, they lose their session and must join again with a unique name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store and identify the participant who created the room as the `host`.
- **FR-002**: System MUST validate room codes on the client and server, rejecting empty or non-existent codes with specific feedback (e.g., "Room code is required", "Room not found").
- **FR-003**: System MUST ensure participants in one room cannot see or interact with participants or data from another room (Room Isolation).
- **FR-004**: System MUST implement client-side polling in the lobby to fetch the latest room state every 2 seconds.
- **FR-005**: System MUST restrict the "Start Game" action to the host only.
- **FR-006**: System MUST only enable the "Start Game" action when the total number of participants in the room is at least 2.
- **FR-007**: System MUST notify all participants when the host starts the game (via status change in polled data triggering navigation).
- **FR-008**: System MUST limit room capacity to a maximum of 8 players and reject join attempts when the room is full.
- **FR-009**: System MUST close the room and disconnect all participants if the host leaves the lobby.
- **FR-010**: System MUST reject join attempts with a name that is already taken by another participant in the same room.
- **FR-011**: System MUST treat returning players as new participants (new ID assigned) if they leave or refresh the page.

### Key Entities *(include if feature involves data)*

- **Room**: Represents the game session. Extended to include a reference to the `host`.
- **Participant**: Represents a player in a room, including their role (host/participant).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rooms have exactly one host assigned at creation.
- **SC-002**: Lobby updates reflect new participants within 2 seconds (+ network latency) for all connected clients.
- **SC-003**: Unauthorized start attempts (non-host or < 2 players) are blocked both on the UI and API.
- **SC-004**: Error messages for invalid codes are displayed immediately upon submission.
- **SC-005**: 100% of join attempts to full rooms (8 players) are rejected with clear feedback.

## Assumptions

- Polling is the chosen method for real-time updates as specified in the request.
- The "Start Game" action will update the room's `status` which will be picked up by other clients via polling.
- No persistence across server restarts is required (in-memory storage).
ed (in-memory storage).
