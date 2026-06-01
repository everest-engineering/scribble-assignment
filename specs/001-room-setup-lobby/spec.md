# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Room Setup & Lobby: Implementing host capabilities, join validations, and automatic HTTP polling for the lobby (approx. every 2s) so players see real-time updates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Host a Room (Priority: P1)

As a player, I want to create a new game room so that I can host a game and invite my friends to join.

**Why this priority**: Without the ability to create a room, there is no game lobby or host, making this the foundational feature for multiplayer setup.

**Independent Test**: Can be fully tested by a user clicking "Create Room" and seeing a new room created with a unique code, where they are designated as the host.

**Acceptance Scenarios**:

1. **Given** a user is on the main menu, **When** they choose to create a room, **Then** a new room is generated with a unique code and they join it automatically as the host.
2. **Given** a host is in the lobby, **When** they view the lobby, **Then** they see their own name, the room code, and controls reserved for the host (e.g., start game).

---

### User Story 2 - Join an Existing Room (Priority: P1)

As a player, I want to join a room using a unique code so that I can play with my friends.

**Why this priority**: Joining is required for the game to be multiplayer. Without it, the host would be alone.

**Independent Test**: Can be fully tested by a second user entering a valid room code and joining the lobby, appearing on the player list.

**Acceptance Scenarios**:

1. **Given** a user is on the main menu, **When** they enter a valid room code and their name, **Then** they are admitted to the lobby as a guest.
2. **Given** a user is trying to join, **When** they enter an invalid or non-existent room code, **Then** they receive a clear error message.
3. **Given** a user is trying to join a room, **When** the room is already full or the game has started, **Then** they are blocked from joining and informed of the reason.

---

### User Story 3 - Real-time Lobby Updates (Priority: P2)

As a player in the lobby, I want to see when other players join or leave in near real-time, so that I know who is ready to play.

**Why this priority**: Essential for a smooth user experience so players aren't waiting blindly, but it relies on creating/joining to exist.

**Independent Test**: Can be fully tested by having two users in the same room. When user A joins or leaves, user B's screen should update automatically within approximately 2 seconds without requiring a manual refresh.

**Acceptance Scenarios**:

1. **Given** multiple players are in a lobby, **When** a new player joins, **Then** all existing players see the new player appear on their screen within ~2 seconds.
2. **Given** multiple players are in a lobby, **When** a player disconnects or leaves, **Then** the remaining players see the player removed from the list within ~2 seconds.

### Edge Cases

- What happens when a player tries to join a room with a username that is already taken by another player in that room?
- How does the system handle the host disconnecting while in the lobby? Does the room close, or is host status transferred?
- What happens if the HTTP polling request fails temporarily due to network issues?
- **Idle Room Cleanup**: Inactive rooms will be automatically deleted if there is no HTTP polling activity from any player for 5 minutes, preventing stateful bloat.

## Clarifications

### Session 2026-05-29
- Q: Room Code Format → A: 6-character alphanumeric (e.g., "A1B2C3")
- Q: Idle Room Cleanup → A: Delete room if no HTTP polling activity for 5 minutes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a new game room and automatically designate them as the host.
- **FR-002**: System MUST generate a unique, easily shareable 6-character alphanumeric room code for new rooms.
- **FR-003**: System MUST allow users to join an existing room by providing a valid room code and a username.
- **FR-004**: System MUST validate room join requests, rejecting them if the room does not exist.
- **FR-005**: System MUST validate room join requests, rejecting them if the room already has 20 players (the maximum limit).
- **FR-006**: System MUST ensure usernames are unique within a single room.
- **FR-007**: System MUST automatically update the lobby state for all connected players via HTTP polling approximately every 2 seconds.
- **FR-008**: System MUST display the list of current players in the lobby to all connected users.
- **FR-009**: System MUST differentiate the host from regular players in the UI.

### Key Entities

- **Room**: Represents a game session, identified by a unique code, containing a list of players and tracking the current state (e.g., "lobby", "playing").
- **Player**: Represents a user in a room, containing their username and host status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully create a room and receive a room code in under 1 second.
- **SC-002**: Users can successfully join a valid room and appear in the lobby.
- **SC-003**: The lobby UI updates for all players within 2.5 seconds of a new player joining or leaving.
- **SC-004**: Invalid join attempts (bad code, duplicate name) correctly return an error message 100% of the time.

## Assumptions

- Users have stable internet connectivity.
- A player leaving a room simply removes them; if the host leaves, the room is destroyed (simplest approach for MVP).
- The frontend will handle polling failures gracefully (e.g., retrying or showing a disconnected state).
- The application will use an in-memory data store for room state, as per general project guidelines (no database).
