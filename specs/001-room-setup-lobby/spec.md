# Feature Specification: Scribble Room Setup & Lobby Navigation

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scribble Room Setup & Lobby navigation — create a room to host the drawing game; join a created room via unique code; creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-02

- Q: How do non-host players get navigated to the Game screen when the host presses "Start Game"? → A: Polling returns room status; when `in-progress`, all polling clients auto-navigate to the Game screen.
- Q: What happens when the host disconnects or leaves the lobby before starting the game? → A: Out of scope for this feature; documented as a known limitation.
- Q: Is there a maximum number of players allowed per room? → A: Max 4 players per room.
- Q: What loading state should be shown when Create Room or Join Room is submitted? → A: Disable the submit button and show an inline spinner while the request is in-flight.
- Q: Should the polling error indicator clear automatically when polling resumes successfully? → A: Yes, the error indicator clears automatically on the next successful poll.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room and Reach the Lobby (Priority: P1)

A player on the home screen enters their name and creates a new room. They are immediately
recognised as the host. The system generates a unique room code that the host can share. The
player lands in the lobby, which shows the list of current participants and the room code
prominently.

**Why this priority**: This is the entry point for every game session. Without room creation no
other story is possible.

**Independent Test**: Navigate to the home screen, enter a player name, press "Create Room", and
verify the lobby screen appears with a unique room code and the creator listed as a participant.

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **When** they enter a valid player name and press
   "Create Room", **Then** a new room is created, the player is assigned as host, and they are
   navigated to the Lobby screen displaying the room code and their name in the participant list.
2. **Given** a player is on the Start screen, **When** they attempt to create a room without
   entering a player name, **Then** the form is not submitted and an inline validation message
   prompts them to enter a name.
3. **Given** two separate browser tabs each create a room, **When** each lobby is viewed,
   **Then** the participant lists and room codes are independent — actions in one room have no
   effect on the other.

---

### User Story 2 - Join an Existing Room via Room Code (Priority: P1)

A second player navigates to the Join Room screen, enters the room code shared by the host, and
enters their name. They land in the same lobby as the host and appear in the participant list.

**Why this priority**: Alongside room creation, joining is the other half of the session-start
flow. Both stories are P1 because neither delivers value without the other.

**Independent Test**: With an existing room code, open the Join Room screen, enter the code and a
player name, and verify the lobby shows both the host and the new participant.

**Acceptance Scenarios**:

1. **Given** a room exists with a known code, **When** a second player enters the code and their
   name on the Join Room screen and submits, **Then** they are navigated to the Lobby screen and
   appear in the participant list alongside the host.
2. **Given** the Join Room screen is displayed, **When** a player submits an empty room code,
   **Then** the form is not submitted and a clear inline message indicates a code is required.
3. **Given** the Join Room screen is displayed, **When** a player submits a room code that does
   not match any active room, **Then** an error message is displayed explaining the room was not
   found, and the player remains on the Join Room screen.
4. **Given** a player joins a room in tab A, **When** tab B is viewing a different room, **Then**
   the new participant does not appear in tab B's lobby — rooms are fully isolated.

---

### User Story 3 - Lobby Polling and Host Start Game (Priority: P2)

The lobby automatically refreshes its participant list approximately every 2 seconds without
requiring manual interaction. Once at least 2 players are present, the host sees the "Start Game"
button enabled. Non-host players see the button disabled or hidden. When the host presses "Start
Game", all players are navigated to the Game screen.

**Why this priority**: Polling and the host-only start gate are the features that make the lobby
functional for a real multi-player session. They depend on US1 and US2 being complete.

**Independent Test**: Open two browser tabs — one as host, one as joiner. Without pressing manual
refresh, confirm that when the second player joins the host's lobby updates within ~2 seconds and
the "Start Game" button becomes enabled for the host only.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** approximately 2 seconds pass, **Then** the
   participant list is refreshed automatically without any user interaction.
2. **Given** only 1 player is in the lobby (the host), **When** the lobby is displayed,
   **Then** the "Start Game" button is visible but disabled for the host.
3. **Given** at least 2 players are in the lobby, **When** the lobby is displayed,
   **Then** the "Start Game" button is enabled for the host only.
4. **Given** a non-host player is in the lobby with 2 or more participants, **When** the lobby
   is displayed, **Then** the "Start Game" button is either absent or permanently disabled for
   that player.
5. **Given** the host presses "Start Game" with at least 2 players present, **When** the action
   is confirmed, **Then** all players in the room are navigated to the Game screen: the host is
   navigated immediately, and non-host players are auto-navigated when their next polling response
   returns a room status of `in-progress`.

---

### Edge Cases

- What happens when a player enters the lobby URL directly without having created or joined a
  room? → They should be redirected to the Start screen.
- What happens when the polling request fails (e.g., network error)? → The existing participant
  list is retained and a non-blocking error indicator is shown; polling continues on the next
  interval. The error indicator clears automatically when the next poll succeeds.
- What happens when a player name contains only whitespace? → The form rejects it with the same
  validation feedback as an empty name.
- What happens when the room code is entered in lower-case? → The system accepts it
  case-insensitively and resolves to the correct room.
- What happens when a player attempts to join a room that already has 4 participants? → The join
  attempt is rejected with a clear error message; the player remains on the Join Room screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code for each newly created room.
- **FR-002**: System MUST assign the creator of a room the host role automatically.
- **FR-003**: System MUST reject room creation or join attempts with an empty or whitespace-only
  player name and display an inline validation message.
- **FR-004**: System MUST reject a join attempt with an empty or whitespace-only room code and
  display an inline validation message.
- **FR-005**: System MUST return a clear error when a player attempts to join a room with a code
  that does not match any active room.
- **FR-006**: System MUST keep each room's participant state fully isolated; participants in one
  room MUST NOT appear in another room.
- **FR-007**: System MUST treat room codes case-insensitively (e.g., "abc1" resolves to "ABC1").
- **FR-008**: The lobby MUST automatically poll for the current participant list approximately
  every 2 seconds.
- **FR-009**: The "Start Game" button in the lobby MUST be enabled only for the host and only
  when at least 2 participants are present in the room.
- **FR-010**: Non-host players MUST NOT be able to trigger the start-game action.
- **FR-011**: Pressing "Start Game" MUST navigate all players to the Game screen: the host
  immediately, and non-host players automatically when their next polling response returns room
  status `in-progress`.
- **FR-012**: A player who navigates directly to the Lobby URL without a valid session MUST be
  redirected to the Start screen.
- **FR-013**: A room MUST NOT accept more than 4 participants; a join attempt when the room is
  full MUST be rejected with a clear error message.
- **FR-014**: While a Create Room or Join Room request is in-flight, the submit button MUST be
  disabled and an inline spinner MUST be displayed to prevent duplicate submissions.

### Key Entities *(include if feature involves data)*

- **Room**: Identified by a unique code; holds a list of up to 4 participants; has a status
  (waiting, in-progress); exists only for the lifetime of the server process (no persistence).
- **Participant**: Belongs to exactly one room; has a name and a unique identifier; one
  participant per room is designated the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby in under 5 seconds from pressing
  "Create Room".
- **SC-002**: A second player can join an existing room and appear in the lobby in under 5
  seconds from pressing "Join Room".
- **SC-003**: The lobby participant list reflects the true server-side state within 3 seconds of
  a new player joining (accounting for up to one ~2s poll interval plus network round-trip).
- **SC-004**: 100% of invalid or empty room codes submitted on the Join Room screen result in a
  visible, human-readable error message; the player is not navigated away from the Join Room
  screen.
- **SC-005**: The "Start Game" button activates for the host as soon as a second participant is
  detected by the lobby's polling cycle, without any manual page refresh.
- **SC-006**: Rooms are isolated: adding a participant to room A produces zero changes visible in
  room B's lobby.

## Assumptions

- Player identity is session-scoped: there is no login, account, or persistent identity. A
  participant ID is issued per room-join action and lives in client memory for that session.
- Room state is held entirely in server memory; there is no database or file-backed persistence
  (aligned with constitution Principle V).
- A single player can only join a room once per session (duplicate names in the same room are
  not explicitly prohibited but are not a requirement of this feature).
- The polling interval of ~2 seconds is approximate; exact timing may vary by a few hundred
  milliseconds due to network and rendering overhead.
- Room codes are uppercase alphanumeric strings; the exact length and generation algorithm are
  implementation details outside the scope of this spec.
- The Game screen itself (gameplay, drawing, guessing) is out of scope for this feature; this
  spec covers only room creation, joining, lobby display, and the host start-game trigger.
- Host disconnection or departure from the lobby before starting the game is a known limitation;
  behaviour in this scenario is undefined and deferred to a future feature.
- The starter codebase already provides `CreateRoomPage`, `JoinRoomPage`, and `LobbyPage`
  scaffolds; this feature completes their behaviour rather than introducing new pages.
