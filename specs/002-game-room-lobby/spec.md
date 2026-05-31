# Feature Specification: Game Room Lobby

**Feature Branch**: `002-game-room-lobby`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player who wants to run a drawing game session opens the app and chooses to create a new room. The system immediately generates a unique code they can share with friends, and that player becomes the host automatically — no extra setup required.

**Why this priority**: This is the entry point for every game session. Without room creation, nothing else is possible. It anchors all other stories.

**Independent Test**: A single player can create a room, receive a unique code, and see themselves listed as host in the lobby. Delivers the foundational hosting capability.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen, **When** they choose "Create Room", **Then** a new room is created with a unique shareable code and the player is designated host.
2. **Given** a room has been created, **When** the host views the lobby, **Then** they see the room code prominently, their own name marked as host, and a disabled "Start Game" button (fewer than 2 players).
3. **Given** two separate sessions simultaneously create rooms, **When** both rooms are active, **Then** each room has a distinct code and players in one room cannot see or interact with players in the other.

---

### User Story 2 - Player Joins an Existing Room (Priority: P1)

A player who received a room code from a friend enters it to join the session. They land in the lobby, can see who is already there, and wait for the host to start the game.

**Why this priority**: Equal priority to room creation — the game is only useful when players can join. Together these two stories form the minimum viable lobby.

**Independent Test**: One player creates a room, a second player enters the code, and the second player appears in the lobby of the first player's session.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen and has a valid room code, **When** they enter the code and confirm, **Then** they join the matching room and see the current player list.
2. **Given** a player enters an empty code field and tries to join, **When** they submit, **Then** an inline error message is shown indicating the field cannot be empty and the join is blocked.
3. **Given** a player enters a code that does not correspond to any active room, **When** they submit, **Then** a clear error message is shown (e.g., "Room not found — check your code and try again") and the player remains on the join screen.
4. **Given** a player enters a malformed code (wrong format/length), **When** they submit, **Then** an inline validation message explains the expected format and the join is blocked.

---

### User Story 3 - Lobby Stays Up to Date in Real Time (Priority: P2)

All players in the lobby — host and guests alike — see an automatically refreshing list of who has joined. They do not need to manually refresh the page; the list updates within about 2 seconds of any change.

**Why this priority**: Without live updates, players have no signal that others have arrived and the host cannot confidently decide when to start. However, game creation and joining already work independently (P1), so this is an enhancement to the experience.

**Independent Test**: Three players join a room in sequence; each player's lobby screen shows all three names without any manual page reload, within 2 seconds of each arrival.

**Acceptance Scenarios**:

1. **Given** two players are in a lobby, **When** a third player joins, **Then** all existing players see the updated player list within approximately 2 seconds, without reloading the page.
2. **Given** a player is in the lobby, **When** another player disconnects or leaves, **Then** the remaining players see the updated list within approximately 2 seconds.
3. **Given** the lobby is open, **When** no players join or leave for 10 seconds, **Then** no unnecessary errors or flickering occur and the player list remains stable.

---

### User Story 4 - Host Starts the Game (Priority: P2)

Once enough players (at least 2) have joined, the host can start the drawing game session. Only the host sees an active "Start Game" control; other players wait. Trying to start with fewer than 2 players is prevented.

**Why this priority**: This completes the pre-game flow. Lobby refresh (P2 above) and this story together represent the full lobby experience, but neither is a prerequisite for validating the core join mechanics.

**Independent Test**: With exactly 2 players in the lobby, the host's "Start Game" button becomes active and clickable; clicking it transitions the session out of the lobby state. Guest players do not see the button as actionable.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with only 1 player total, **When** they view the lobby, **Then** the "Start Game" button is visible but disabled, with a message indicating more players are needed.
2. **Given** the host is in the lobby with 2 or more players, **When** they view the lobby, **Then** the "Start Game" button becomes active and clickable.
3. **Given** a guest player is in the lobby, **When** they view the lobby, **Then** they do not see an active "Start Game" control — they see a waiting indicator instead.
4. **Given** the host clicks "Start Game" with 2 or more players present, **When** the action is confirmed, **Then** the game session begins for all players in the room.

---

### Edge Cases

- What happens when a player tries to join a room that has already started?
- How does the system handle a player who closes their browser tab mid-lobby?
- What happens if the host leaves the lobby before starting — is a new host assigned, or does the room dissolve?
- What is the maximum number of players per room?
- Can the same player name appear twice in one room (duplicate display names)?
- What happens if a polling request fails (network error) — does the lobby show a stale state or an error?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code when a player creates a new room.
- **FR-002**: System MUST designate the room creator as the host automatically, without any manual step.
- **FR-003**: System MUST allow a player to join an existing room by entering its code.
- **FR-004**: System MUST reject join attempts with an empty code and display a clear inline error.
- **FR-005**: System MUST reject join attempts with a code that does not match any active room and display a descriptive error message.
- **FR-006**: System MUST reject join attempts with a malformed code (incorrect format or length) and explain the expected format.
- **FR-007**: System MUST keep each room's player list and state fully isolated from all other rooms.
- **FR-008**: System MUST refresh the lobby player list automatically for all players in a room at approximately 2-second intervals via polling.
- **FR-009**: System MUST display a disabled "Start Game" control to the host when fewer than 2 players are in the room, accompanied by a message explaining why it is unavailable.
- **FR-010**: System MUST enable the "Start Game" control for the host only once at least 2 players are present in the room.
- **FR-011**: System MUST NOT display an active "Start Game" control to non-host players.
- **FR-012**: System MUST transition all players in the room into the game session when the host starts the game.

### Key Entities *(include if feature involves data)*

- **Room**: Represents an active game session container. Identified by a unique code. Has a designated host and a list of current players. Exists independently from all other rooms.
- **Player**: A participant in a room. Has a display name and a role (host or guest). Belongs to exactly one room at a time.
- **Room Code**: A short, unique, human-readable identifier shared out-of-band so others can join the room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can create a room and receive a shareable code in under 3 seconds.
- **SC-002**: Players can join an existing room using a valid code in under 3 seconds.
- **SC-003**: Invalid or empty code submissions are rejected with visible feedback within 1 second, without a full page reload.
- **SC-004**: The lobby player list reflects the current state of the room within 2 seconds of any join or leave event, without manual user action.
- **SC-005**: 100% of "Start Game" actions initiated by a host with fewer than 2 players present are blocked before submission.
- **SC-006**: No player in Room A can view or interact with data belonging to Room B under any sequence of actions.
- **SC-007**: At least 90% of players successfully complete the join flow on their first attempt when given a valid code.

## Assumptions

- Players must provide a display name before creating or joining a room; name uniqueness within a room is enforced by the system (scoped assumption — see Edge Cases).
- Room codes are short alphanumeric strings (e.g., 6 characters); exact format is an implementation detail but must be consistent enough for the validation error message to describe it clearly.
- Rooms are temporary and exist only for the duration of an active game session; there is no persistence of rooms between sessions.
- The polling interval of ~2 seconds is a target; minor variance (±500ms) is acceptable as long as updates feel near-real-time.
- If the host disconnects before starting, the room is dissolved and remaining players are notified — a host-promotion mechanism is out of scope for this feature.
- Maximum player count per room is a product decision not specified; the lobby must function correctly for at least 2 and up to 8 players (assumption — can be revised).
- Players are assumed to have a stable enough connection to support 2-second polling; degraded-network handling (e.g., showing a stale-data warning) is a stretch goal.
- Authentication (persistent accounts, passwords) is out of scope; players identify themselves by a session-scoped display name only.
