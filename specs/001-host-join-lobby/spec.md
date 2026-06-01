# Feature Specification: Host and Join Lobby Flow

**Feature Branch**: `001-host-join-lobby`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create or Join a Room (Priority: P1)

A player creates a new room or joins an existing room using a unique code.

**Why this priority**: This is the entry point for every multiplayer session.

**Independent Test**: Create a room, join the room from another session, and verify both players are connected to the same room.

**Acceptance Scenarios**:

1. **Given** a player enters a valid name, **When** they create a room, **Then** they become the first participant in that room and are treated as the host.
2. **Given** a player enters a valid room code for an existing room, **When** they join, **Then** they are added to that room and can see the current lobby state.

---

### User Story 2 - Reject Invalid Room Access (Priority: P1)

A player attempts to create or join with an empty or invalid code or name.

**Why this priority**: Bad input should be blocked before the player enters the lobby.

**Independent Test**: Try creating or joining with blank or invalid values and confirm the player stays on the form with a clear error.

**Acceptance Scenarios**:

1. **Given** a player submits an empty or whitespace-only name, **When** they try to create or join, **Then** the request is rejected with a clear message.
2. **Given** a player enters an invalid or empty room code, **When** they try to join, **Then** the request is rejected with a clear message.

---

### User Story 3 - Keep Rooms Isolated and Fresh (Priority: P2)

Players in different rooms should not see each other, and the lobby should stay up to date through automatic polling without manual refresh.

**Why this priority**: Multiplayer rooms must behave independently and stay current.

**Independent Test**: Create two rooms, add players to each, and confirm each lobby shows only its own players and updates while the page is open.

**Acceptance Scenarios**:

1. **Given** two different rooms exist, **When** players join one room, **Then** the other room never shows those players.
2. **Given** a lobby screen is open, **When** room membership changes, **Then** the visible lobby updates automatically through polling at an interval of about 2 seconds.

---

### User Story 4 - Host Can Start the Game (Priority: P2)

Only the host can start the game, and only after at least two players are present.

**Why this priority**: The room needs a clear owner and a minimum player count before play begins.

**Independent Test**: Attempt to start with one player, then with two players, and confirm only the host can start once the minimum is met.

**Acceptance Scenarios**:

1. **Given** a room has fewer than two players, **When** the host tries to start the game, **Then** the game does not begin and a clear message explains why.
2. **Given** a room has at least two players, **When** a non-host tries to start the game, **Then** the action is rejected.
3. **Given** a room has at least two players, **When** the host starts the game, **Then** the room advances to the game state.

### Edge Cases

- What happens when a player tries to join a room that no longer exists?
- What happens when the same room code is used in two different sessions?
- What happens when the lobby refreshes while a room has been deleted or reset?
- What happens when the name or code contains only whitespace?
- What happens when a player tries to start the game before a second player arrives?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room using a valid player name.
- **FR-002**: The system MUST allow a player to join an existing room using a valid room code.
- **FR-003**: The system MUST treat the first participant in a newly created room as the host.
- **FR-004**: The system MUST reject empty or invalid names and room codes with clear feedback.
- **FR-005**: The system MUST keep room membership isolated so that one room's participants are never shown in another room.
- **FR-006**: The system MUST keep the lobby view fresh while it is open by polling for updates at an interval of about 2 seconds, without requiring the user to manually refresh.
- **FR-007**: The system MUST allow only the host to start the game.
- **FR-008**: The system MUST prevent the game from starting until at least two players are present.
- **FR-009**: The system MUST preserve the current room state for players already in the room while new players join.

### Key Entities *(include if feature involves data)*

- **Room**: A unique game space identified by a code, with a host, participants, and a current status.
- **Participant**: A player connected to a room, identified by name and session-specific identity.
- **Lobby View**: The shared room snapshot that players see while waiting to begin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create or join a room and see the shared lobby state successfully on the first try in the normal path.
- **SC-002**: Invalid or empty names and room codes are rejected every time with a clear message.
- **SC-003**: Changes to room membership appear in the lobby automatically through polling within about 2 seconds while the lobby is open.
- **SC-004**: Players in separate rooms never see one another's participants or room state.
- **SC-005**: The game cannot start unless the room has at least two players and the requester is the host.

## Assumptions

- Starter room codes remain unique within the active in-memory set of rooms.
- The first participant created with a room is the host unless a later feature changes that rule.
- The lobby stays open long enough for periodic polling to keep the visible state current.
- Room state is temporary and may be lost when the backend restarts.
- Error messages should be understandable to players without exposing technical details.
