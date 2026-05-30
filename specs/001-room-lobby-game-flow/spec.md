# Feature Specification: Room setup and lobby

**Feature Branch**: `001-room-lobby-game-flow`

**Created**: 2026-05-30

**Status**: Draft

**Input**: Scenario 1 from the Scribble lab: room setup and lobby.

## Scenario Statement

**Given** a player wants to host or join a drawing game, **When** they create or join a room via a unique code, **Then** the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling within about 2 seconds; and only the host can start the game once at least 2 players are present.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create room as host (Priority: P1)

A player creates a room with a valid display name and enters a lobby where they are clearly identified as the host.

**Why this priority**: Room creation is the entry point for multiplayer play.

**Independent Test**: Create a room and verify the lobby shows the generated room code, the creator in the participant list, and host status for the creator.

**Acceptance Scenarios**:

1. **Given** the user is on the create-room page, **When** they submit a non-empty trimmed player name, **Then** a unique room code is created and the user enters the lobby.
2. **Given** the room was just created, **When** the lobby renders, **Then** the creator is listed as a participant and marked as the host.
3. **Given** the user submits an empty or whitespace-only player name, **When** they attempt to create a room, **Then** creation is rejected with a clear validation message.

---

### User Story 2 - Join room by code (Priority: P2)

A second player joins an existing room with a valid room code and display name.

**Why this priority**: A drawing game requires at least two players.

**Independent Test**: Create a room in one browser, join it from another browser using the code, and verify both players appear in the same lobby.

**Acceptance Scenarios**:

1. **Given** a valid room code exists, **When** a player submits that code with a non-empty trimmed display name, **Then** they join the room and enter the lobby.
2. **Given** the room code is entered in lowercase, **When** the join form is submitted, **Then** the code is normalized and the join succeeds.
3. **Given** the room code is empty or invalid, **When** the join form is submitted, **Then** the user receives clear feedback and remains on the join page.
4. **Given** a join attempt fails, **When** the error is displayed, **Then** the entered name and room code remain available for correction.

---

### User Story 3 - Keep lobby synced and isolated (Priority: P3)

Lobby participants stay up to date through polling, and room data does not leak across rooms.

**Why this priority**: Players need confidence that they are in the right room with the right participants.

**Independent Test**: Create two rooms, join each with different players, and verify each lobby only shows its own participants after polling.

**Acceptance Scenarios**:

1. **Given** a lobby is open, **When** another player joins the same room, **Then** the participant list updates automatically within about 2 seconds.
2. **Given** two different rooms exist, **When** players join one room, **Then** the other room's participants and status are unchanged.
3. **Given** the backend cannot refresh the lobby, **When** polling fails, **Then** the lobby shows a retryable error state.

---

### User Story 4 - Start game only when ready (Priority: P4)

Only the host can start a room once at least two players are present.

**Why this priority**: The game needs one drawer and at least one guesser before it can begin.

**Independent Test**: Try starting with one player, as a non-host, and as the host with two players.

**Acceptance Scenarios**:

1. **Given** the host is alone in the lobby, **When** they attempt to start the game, **Then** start is blocked because at least two players are required.
2. **Given** a non-host is in the lobby, **When** they attempt to start the game, **Then** start is blocked because only the host can start.
3. **Given** the host is in a lobby with at least two players, **When** the host starts the game, **Then** the room leaves the lobby and proceeds to game start.

### Edge Cases

- Empty display names are rejected after trimming on Create Room and Join Room.
- Empty room codes are rejected with clear feedback.
- Invalid room codes are rejected with clear feedback and preserved form values.
- Lowercase room codes are normalized to uppercase.
- Rooms are isolated from one another.
- Lobby state refreshes by HTTP polling within about 2 seconds.
- Direct navigation to lobby without room state redirects to the start page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a room using a non-empty trimmed player name.
- **FR-002**: System MUST assign the room creator as the initial host.
- **FR-003**: System MUST generate a unique room code for each room.
- **FR-004**: System MUST allow a player to join an existing room using a valid room code and non-empty trimmed player name.
- **FR-005**: System MUST reject empty or invalid room codes with clear user-facing feedback.
- **FR-006**: System MUST normalize room codes to uppercase.
- **FR-007**: System MUST preserve join form values when join validation fails.
- **FR-008**: System MUST keep rooms fully isolated from each other.
- **FR-009**: System MUST refresh lobby state by HTTP polling within about 2 seconds.
- **FR-010**: System MUST allow only the current host to start the game.
- **FR-011**: System MUST require at least two players before the host can start the game.

### Key Entities *(include if feature involves data)*

- **Room**: Represents one isolated lobby with a unique code, host identity, participant list, and status.
- **Participant**: Represents a player in a room with an identifier, display name, and join timestamp.
- **Room Snapshot**: Represents the latest lobby view, including code, host, participants, and status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A creator can create a room and appear as host in the lobby within one attempt.
- **SC-002**: A second player can join by code and appear in the same lobby.
- **SC-003**: Empty or invalid room codes are rejected with clear feedback.
- **SC-004**: Separate rooms show only their own participants and status.
- **SC-005**: Lobby participant changes appear automatically within about 2 seconds.
- **SC-006**: Start is blocked for non-hosts and for host-only rooms with fewer than two players.
- **SC-007**: The host can start once at least two players are present.

## Clarifications

- Lobby sync uses HTTP polling only.
- No WebSockets, databases, authentication, accounts, or persistent sessions are included.

## Relevant Files

- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/services/api.ts`
