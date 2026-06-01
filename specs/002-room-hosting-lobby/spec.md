# Feature Specification: Room Hosting & Lobby

**Feature Branch**: `002-room-hosting-lobby`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Room (Priority: P1)

A player wants to host a drawing game and share a code so others can join.

**Why this priority**: This is the core flow that enables multiplayer matches.

**Independent Test**: Player A opens "Create Room", receives a unique room code, and is placed in the lobby as the host. No other rooms are affected.

**Acceptance Scenarios**:

1. **Given** a signed-in or anonymous player on the Create Room page, **When** they submit the create action, **Then** a new room with a unique code is created and returned to the creator, and the creator is assigned the host role.
2. **Given** the creator is in the lobby, **When** another player joins with the code, **Then** the joining player appears in the same room's lobby and not in any other room.

---

### User Story 2 - Join Room with Code (Priority: P1)

A player joins an existing room using its code.

**Why this priority**: Enables multiplayer by letting players find and join rooms.

**Independent Test**: Player B enters a code provided by Player A and is added to Player A's lobby.

**Acceptance Scenarios**:

1. **Given** a player on the Join Room page, **When** they submit a valid room code, **Then** they are placed in that room's lobby and shown current participants.
2. **Given** a player submits an invalid or empty code, **When** the join attempt occurs, **Then** the UI shows a clear, user-friendly error message and the join is rejected.

---

### User Story 3 - Lobby Polling & Isolation (Priority: P1)

Players in the lobby see live participant updates via short-interval polling and rooms are isolated.

**Why this priority**: Live lobby state and isolation ensure correct game composition and a good UX without websockets.

**Independent Test**: With two browsers pointing at the same room code, when a player joins in one browser, the other browser shows the new participant within ~2s.

**Acceptance Scenarios**:

1. **Given** players A and B in the same room lobby, **When** C joins the room, **Then** A and B see C appear within ~2 seconds (polling interval) without affecting other rooms.
2. **Given** two different room codes in parallel, **When** players join each, **Then** participants appear only in their respective lobbies (no cross-room visibility).

---

### User Story 4 - Host Controls Start Game (Priority: P1)

Only the host can start the game, and only when at least two players are present.

**Why this priority**: Prevents premature starts and enforces host authority.

**Independent Test**: As host, Player A can start when Player B joins; Player B (non-host) cannot start.

**Acceptance Scenarios**:

1. **Given** a room with 1 player (host), **When** host attempts to start, **Then** the start action is disabled and an explanation shown ("Need at least 2 players").
2. **Given** a room with >=2 players, **When** the host clicks Start, **Then** the game transitions to the in-game state for that room only.
3. **Given** a non-host attempts to invoke Start, **When** they trigger the action, **Then** the system rejects it with a clear message.

---

### Edge Cases

- Joining while the host starts the game simultaneously: ensure join either completes before or after start consistently and does not corrupt room state.
- Race when two creators create rooms with the same generated code (ensure code generation avoids collisions).
- Room cleanup: empty rooms must be garbage-collected after a short timeout to avoid stale codes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room and return a unique room code.
- **FR-002**: The system MUST assign the creating player the `host` role for that room immediately upon creation.
- **FR-003**: The system MUST allow players to join a room by entering a room code.
- **FR-004**: The system MUST reject invalid or empty room codes and present a clear error message to the user.
- **FR-005**: Rooms MUST be logically isolated; changes in one room (participants, state) MUST NOT be visible in other rooms.
- **FR-006**: The lobby UI MUST refresh participant lists using polling at approximately a 2-second interval.
- **FR-007**: Only a player with the `host` role MAY start the game for that room.
- **FR-008**: The start action MUST be disallowed when the room has fewer than 2 players; an explanatory message MUST be shown.
- **FR-009**: Room lifecycle MUST include deterministic cleanup of empty or inactive rooms after a configurable timeout.
- **FR-010**: All client-facing messages for failures (invalid code, unauthorized start) MUST be user-friendly and actionable.

### Key Entities _(include if feature involves data)_

- **Room**: Unique identifier (code), hostId, player list (ids, display names), createdAt, lastActiveAt, state (`lobby`|`in-game`).
- **Player**: id (session-scoped), displayName, joinedAt, role (`host`|`player`).
- **Lobby View**: Read-only projection of the room's player list and metadata for display.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Creating a room returns a unique non-empty code to the user within one second 95% of the time.
- **SC-002**: Invalid or empty codes produce a clear error message; 100% of such attempts must not create or join rooms.
- **SC-003**: Lobby participant changes are visible to other clients for the same room within 2.5 seconds (polling tolerance).
- **SC-004**: Only the host can successfully start the game; attempts by non-hosts are rejected and logged.
- **SC-005**: The system supports at least 100 concurrent active rooms in memory without observable degradation (baseline load target).

## Assumptions

- Players are identified by ephemeral session IDs; no persistent authentication is required for this feature.
- WebSockets are out of scope; the lobby uses short-interval HTTP polling (~2s) to update state.
- All room data is stored in-memory for this application; persistent storage is out of scope.
- Mobile-specific UX is out of scope for the initial rollout.
- Code generation uses a collision-resistant algorithm; collisions are handled by regenerating codes.
