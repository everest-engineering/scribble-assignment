# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-19

**Status**: Draft

**Input**: Room Setup and Lobby scenario: room creation, joining, validation, lobby polling, and host-controlled game start

## Clarifications

### Session 2026-05-19

- Q: What does "start the game" mean operationally? → A: Change room status to active, navigate all players to game screen. Drawer/word setup deferred to next scenario.
- Q: What are the room capacity limits? → A: Max 8 players per room, max 100 concurrent rooms.
- Q: What happens if the host disconnects? → A: Room becomes unstartable — no host role transfer.
- Q: What are the player name constraints? → A: 1-16 characters, alphanumeric only.
- Q: When are rooms cleaned up? → A: Rooms removed only when all players have left. No timeout-based cleanup.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room (Priority: P1)

A player wants to host a drawing game. They provide their name and create a new
room. The system generates a unique room code and designates them as the host.

**Why this priority**: Room creation is the entry point for the entire game
flow — nothing else works without it.

**Independent Test**: A player can create a room, receive a room code, and see
themselves listed as the host in the lobby.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen, **When** they enter a name and
   create a room, **Then** they receive a unique room code and are designated
   as the host.
2. **Given** a player creates a room, **When** they view the lobby,
   **Then** they see themselves in the participant list with a host indicator.

---

### User Story 2 - Join Room (Priority: P1)

A player wants to join an existing drawing game. They provide their name and a
room code. The system validates the code and adds them to the room.

**Why this priority**: Joining is the second fundamental action — without it
only one player can be in a room.

**Independent Test**: A player can join a room using a valid code and appear
in that room's participant list, while invalid codes are rejected with clear
feedback.

**Acceptance Scenarios**:

1. **Given** a room exists with a valid code, **When** a player enters the
   correct code and their name, **Then** they join the room and see the
   participant list including the host.
2. **Given** a room exists, **When** a player enters an incorrect or
   malformed code, **Then** they see a clear error message explaining the
   code is invalid.
3. **Given** a room exists, **When** a player submits an empty code,
   **Then** they see a clear message that a code is required.

---

### User Story 3 - Lobby and Game Start (Priority: P2)

Players in a room's lobby can see who else is present. The lobby refreshes
automatically so newly joined players appear without manual refresh. The host
can start the game once at least 2 players are in the room.

**Why this priority**: The lobby connects room setup to gameplay. Auto-refresh
and host-gating are essential for a smooth multiplayer experience.

**Independent Test**: Two players in the same room can see each other in the
lobby, the non-host player sees no start button, and the host can start the
game only when 2+ players are present.

**Acceptance Scenarios**:

1. **Given** two players are in the same room lobby, **When** the second
   player joins, **Then** both players see the updated participant list with
   both names within 3 seconds.
2. **Given** only one player is in the room, **When** they attempt to start
   the game, **Then** they see a message that at least 2 players are needed.
3. **Given** at least 2 players are in the room, **When** the host clicks
   start, **Then** the room status changes to active and all players navigate
   to the game screen.
4. **Given** at least 2 players are in the room, **When** a non-host player
   attempts to start the game, **Then** the action is rejected and they see
   a message that only the host can start.

### Edge Cases

- What happens when a player tries to join a room that has already started a
  game?
- Room codes are trimmed of leading/trailing whitespace and matched
  case-insensitively before lookup. Codes with internal spaces are invalid.
- If the host (room creator) disconnects or closes their browser before anyone
  joins, the room becomes unstartable. Remaining players cannot assume host
  role.
- How does the lobby behave if the backend is restarted and rooms are lost?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code when a player creates a
  room. Codes MUST not conflict with any active room.
- **FR-002**: System MUST designate the room creator as the host.
- **FR-003**: System MUST reject empty room codes with an inline error
  message stating "Room code is required".
- **FR-004**: System MUST reject invalid room codes (codes that do not match
  any active room) with an inline error message stating "Room not found".
- **FR-005**: System MUST isolate rooms so that players in one room have no
  visibility into another room's participants, state, or activity.
- **FR-006**: System MUST allow a player to join an active room by providing
  a valid room code and a player name meeting the constraints in FR-011.
- **FR-007**: System MUST display the current participant list to all players
  in the lobby.
- **FR-008**: System MUST automatically refresh the lobby state at
  approximately 2-second intervals while the player is on the lobby screen.
  Refresh MUST stop when the game starts or the room is destroyed. Network
  errors during refresh MUST NOT crash the lobby — the last known state
  remains visible and a non-intrusive indicator MAY indicate connectivity
  issues.
- **FR-009**: System MUST only allow the host to start the game.
- **FR-010**: System MUST reject game start attempts when fewer than 2
  players are in the room and display the message "At least 2 players are needed to start".
- **FR-011**: System MUST handle player names by trimming whitespace, limiting
  to 1-16 alphanumeric characters, and rejecting names outside those bounds.
- **FR-012**: System MUST enforce a maximum of 8 participants per room and a
  maximum of 100 concurrent rooms.
- **FR-013**: System MUST remove rooms when all participants have left. No
  automatic timeout or cleanup for inactive rooms with remaining players.
- **FR-014**: System MUST match room codes case-insensitively and trim
  leading/trailing whitespace before lookup.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a game session. Has a unique code, current status
  (lobby, active), host participant ID, creation timestamp, and a list of
  participants.
- **Participant**: A player in a room. Has a unique identifier, display name,
  and joined-at timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can create a room and receive a shareable code in under
  3 seconds.
- **SC-002**: Players joining with an invalid or empty code see an error
  message within 2 seconds of submission.
- **SC-003**: After a player joins a room, all other players in that room see
  the updated participant list within 3 seconds.
- **SC-004**: The host can start the game when 2+ players are present;
  attempts with fewer than 2 players show "At least 2 players are needed to start".
- **SC-005**: Non-host players cannot start the game — any attempt is
  rejected with an appropriate message.
- **SC-006**: Two separate rooms operate independently — players in one room
  cannot see or interact with players in another.

## Assumptions

- Players already have the app open on the start screen before creating or
  joining a room.
- Room codes are short alphanumeric strings (4-6 characters) suitable for
  verbal sharing.
- Player names are provided by the user; the system does not enforce
  uniqueness of names within a room.
- Lobby refresh interval is approximately 2 seconds — exact timing may vary
  but the lobby MUST feel responsive without overwhelming the server.
- The "without" constraint in the feature description refers to building this
  without WebSockets or real-time push, consistent with the project's
  established boundaries.
- Room data is transient — no persistent storage is required.
- The browser tab is the player's session; there is no authentication or
  account system.
