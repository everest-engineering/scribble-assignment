# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-lobby-flow`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "A user can create a new drawing game room or join an existing room using a unique room code. The room creator is automatically assigned the Host role. Join requests must validate room codes and display clear error messages for empty, invalid, or non-existent codes. Each room operates independently, ensuring players, game state, and actions are fully isolated from other rooms. The lobby must automatically refresh approximately every 2 seconds to keep player lists and room state synchronized across clients. The Start Game action is restricted to the Host and becomes available only when at least two players are present. Non-host players cannot start the game. Once started, the game transitions all players in the room into the game state."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room as Host (Priority: P1)

A player can create a new drawing game room and enter the lobby as the Host.
The room displays a unique room code that other players can use to join.

**Why this priority**: A playable room cannot exist until a creator can start a
lobby and receive the Host role.

**Independent Test**: Create a room from a fresh session and confirm the player
lands in a lobby with a unique room code, appears in the player list, and is
identified as Host.

**Acceptance Scenarios**:

1. **Given** a player wants to host a game, **When** they create a room, **Then**
   a new room is created with a unique room code.
2. **Given** a player has created a room, **When** the lobby is displayed,
   **Then** that player is shown as the Host.
3. **Given** a room has only the Host present, **When** the lobby is displayed,
   **Then** the Start Game action is not available as a usable action.

---

### User Story 2 - Join an Existing Room (Priority: P1)

A player can join an existing drawing game room by entering its room code.
Invalid join attempts show clear error messages without moving the player into a
room.

**Why this priority**: Multiplayer play requires at least one additional player
to join the Host's room reliably.

**Independent Test**: Create one room, copy its room code into a second session,
and confirm the second player joins the same lobby as a non-host. Then attempt
empty, invalid, and non-existent room codes and confirm each produces clear
feedback.

**Acceptance Scenarios**:

1. **Given** an existing room code, **When** another player submits that code,
   **Then** the player joins the matching room lobby.
2. **Given** a player joins a room created by someone else, **When** the lobby is
   displayed, **Then** the joining player is not identified as Host.
3. **Given** an empty room code, **When** the player attempts to join, **Then** a
   clear error message explains that a room code is required.
4. **Given** an invalid or non-existent room code, **When** the player attempts
   to join, **Then** a clear error message explains that the room cannot be
   joined.

---

### User Story 3 - Keep Rooms Isolated and Synced (Priority: P2)

Players in a lobby see player list and room state updates without manual
refresh, while separate rooms remain fully independent from one another.

**Why this priority**: Players need confidence that their lobby is current and
that actions in one room do not affect another room.

**Independent Test**: Open two rooms in separate sessions, add players to each,
and confirm each lobby refreshes its own player list approximately every 2
seconds without showing players or state from the other room.

**Acceptance Scenarios**:

1. **Given** two players are in the same lobby, **When** either player's session
   waits for the next automatic refresh, **Then** both sessions show the same
   current player list and room state.
2. **Given** two separate rooms exist, **When** players join or actions occur in
   one room, **Then** the other room's player list and room state do not change.
3. **Given** a lobby is open, **When** room state changes, **Then** the lobby
   reflects the change within approximately 2 seconds under normal conditions.

---

### User Story 4 - Start Game as Host (Priority: P2)

The Host can start the game only after at least two players are present. Non-host
players cannot start the game, and all players in the room transition into the
game state when the Host starts.

**Why this priority**: The lobby must enforce fair control over the game start
and prevent single-player or unauthorized starts.

**Independent Test**: With one Host and one non-host in the same lobby, confirm
only the Host can start the game. After the Host starts, confirm both players
enter the game state and unrelated rooms are unaffected.

**Acceptance Scenarios**:

1. **Given** a room has fewer than two players, **When** the Host views the
   lobby, **Then** Start Game is not available as a usable action.
2. **Given** a room has at least two players and the viewer is Host, **When** the
   Host views the lobby, **Then** Start Game is available.
3. **Given** a room has at least two players and the viewer is not Host, **When**
   the non-host views the lobby, **Then** Start Game is not available as a usable
   action.
4. **Given** the Host starts the game, **When** the lobby refreshes for players
   in that room, **Then** all players in that room transition into the game
   state.

### Edge Cases

- Empty or whitespace-only room codes are rejected with a clear message.
- Room codes with unsupported characters or incorrect format are rejected with a
  clear message.
- Well-formed room codes that do not match an active room are rejected with a
  clear message.
- Start Game remains unavailable when only one player is present.
- Non-host players cannot start the game even if a start action is attempted.
- A room state change in one room does not alter players, state, or actions in
  any other room.
- Temporary refresh failures do not crash the lobby; the player remains in the
  current lobby with clear feedback if the room can no longer be loaded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new drawing game room.
- **FR-002**: System MUST assign the room creator as the Host for that room.
- **FR-003**: System MUST display a unique room code for each created room.
- **FR-004**: Users MUST be able to join an existing room by submitting its room
  code.
- **FR-005**: System MUST reject empty or whitespace-only room codes with clear
  user-facing feedback.
- **FR-006**: System MUST reject invalid room code formats with clear
  user-facing feedback.
- **FR-007**: System MUST reject room codes that do not match an active room with
  clear user-facing feedback.
- **FR-008**: System MUST identify Host and non-host players in the lobby.
- **FR-009**: System MUST keep each room's players, room state, and actions
  isolated from every other room.
- **FR-010**: System MUST automatically refresh lobby player lists and room state
  approximately every 2 seconds.
- **FR-011**: System MUST make Start Game available only to the Host when at
  least two players are present.
- **FR-012**: System MUST prevent non-host players from starting the game.
- **FR-013**: System MUST prevent the Host from starting the game when fewer than
  two players are present.
- **FR-014**: System MUST transition all players in the same room into the game
  state after the Host starts the game.
- **FR-015**: System MUST ensure starting a game in one room does not change the
  state of any other room.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST use TypeScript and ES Modules in both `frontend/` and `backend/`.
- **CC-002**: Feature MUST use HTTP REST requests and polling for synchronization.
- **CC-003**: Feature MUST keep all room/game state in memory only; databases and persistent storage are out of scope.
- **CC-004**: Feature MUST NOT add WebSockets, Socket.io, server-sent events, authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated dependencies.
- **CC-005**: Backend request and response boundaries MUST use Zod validation.

### Key Entities *(include if feature involves data)*

- **Room**: A single drawing game lobby identified by a unique room code. It has
  a current state, one Host, and a list of players.
- **Player**: A person participating in a room. A player has a display name,
  belongs to one room at a time, and is either the Host or a non-host participant
  for that room.
- **Room Code**: A unique code used by players to join a specific active room.
- **Game State**: The shared state of a room, including whether players are still
  in the lobby or have transitioned into the game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see themselves identified as Host
  within 1 minute.
- **SC-002**: A second player can join an existing room using a valid code, and
  both players see the updated player list within 3 seconds under normal
  conditions.
- **SC-003**: Empty, invalid, and non-existent room code attempts each produce a
  clear error message in 100% of tested cases.
- **SC-004**: In two simultaneous rooms, player lists, room state, and start
  actions remain isolated in 100% of tested cross-room scenarios.
- **SC-005**: Start Game is unavailable for single-player rooms and non-host
  players in 100% of tested cases.
- **SC-006**: When the Host starts a room with at least two players, every player
  in that room reaches the game state within 3 seconds under normal conditions.

## Assumptions

- Room codes are treated case-insensitively for matching.
- Approximately every 2 seconds means clients should normally reflect lobby
  changes within 3 seconds.
- This feature covers room setup, lobby synchronization, and the transition into
  the game state only; drawing, guessing, scoring, and results are handled by
  later features.
- Active room data is expected to exist only for the current running game
  session.
