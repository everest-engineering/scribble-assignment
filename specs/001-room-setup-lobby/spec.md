# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby — Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-26

- Q: What should happen when the host disconnects or leaves while players are in the lobby? → A: Host transfers to the next-earliest player still in the room.
- Q: What should the polling error recovery behavior be on transient network errors? → A: Retry silently with exponential back-off (2s → 4s → 8s), then surface an error to the user after 3 consecutive failures.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room (Priority: P1)

A player opens the app and creates a new game room. They are automatically
designated as the host. A unique room code is generated so others can join.

**Why this priority**: Room creation is the entry point for every game session.
No other scenario can proceed without it.

**Independent Test**: Open the app, click "Create Room", enter a player name,
and submit. Verify the player lands on the lobby screen with a visible room
code and is identified as the host.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen, **When** they enter a valid player
   name and click "Create Room", **Then** a room is created, the player is
   marked as host, a unique room code is displayed on the lobby screen.
2. **Given** a player submits the create form with an empty or whitespace-only
   name, **When** they attempt to create a room, **Then** a clear error message
   is shown and no room is created.
3. **Given** two players each create a room, **When** both rooms exist
   simultaneously, **Then** each room has a unique code and the participant
   lists are isolated (players from room A do not appear in room B).

---

### User Story 2 - Join a Room by Code (Priority: P1)

A player joins an existing room by entering its unique code. They become a
guesser (not host).

**Why this priority**: Multiplayer requires at least two players. Joining is the
second essential flow alongside creation.

**Independent Test**: Open a second browser tab, click "Join Room", enter the
room code from the first tab and a player name. Verify the player lands on the
same room's lobby.

**Acceptance Scenarios**:

1. **Given** a room exists with a known code, **When** a second player enters
   that code and a valid name, **Then** they join the room and see the lobby
   with both participants listed.
2. **Given** a player submits the join form with an empty or whitespace-only
   name, **When** they attempt to join, **Then** a clear error message is shown
   and they are not added to the room.
3. **Given** a player submits the join form with a non-existent room code,
   **When** they attempt to join, **Then** a clear error message is shown
   indicating the room was not found.

---

### User Story 3 - Lobby Auto-Refresh (Priority: P2)

Players in the lobby see an up-to-date participant list without manually
refreshing. The lobby polls the server automatically.

**Why this priority**: Without auto-refresh, players would need to manually
click a button to see who else has joined, creating a poor user experience.

**Independent Test**: Create a room in tab A, join it from tab B. Wait up to
3 seconds and confirm tab A shows the new participant without any manual
refresh.

**Acceptance Scenarios**:

1. **Given** a player is in a lobby, **When** another player joins the room,
   **Then** the lobby updates to show the new participant within approximately
   2 seconds without manual interaction.
2. **Given** a player is in a lobby, **When** no changes occur, **Then** the
   lobby silently polls without disrupting the user interface.

---

### User Story 4 - Host Starts Game (Priority: P2)

Only the host can start the game, and only when at least 2 players are present.
Non-host players see a waiting state.

**Why this priority**: Starting the game is the gateway to gameplay. The
host-only rule prevents conflicts, and the 2-player minimum ensures the game
is playable.

**Independent Test**: With two players in a lobby, confirm the host (and only
the host) can click "Start Game". Verify the game screen loads for all
players.

**Acceptance Scenarios**:

1. **Given** exactly one player (the host) is in the lobby, **When** the host
   looks at the lobby, **Then** the "Start Game" button is disabled or hidden,
   with a message indicating at least one more player is needed.
2. **Given** at least 2 players are in the lobby, **When** the host clicks
   "Start Game", **Then** all players navigate to the game screen.
3. **Given** at least 2 players are in the lobby, **When** a non-host player
   attempts to start the game (e.g., looks for a start button), **Then** they
   see no option to start and/or a message that only the host can start.

### Edge Cases

- What happens when a player attempts to join a room that is full?
  — Not applicable; the starter does not define a room capacity limit.
- How does the system handle a player who refreshes the page while in the
  lobby? — The browser re-fetches room state from the API using the stored
  room code; the player rejoins the same lobby.
- What happens when the backend is restarted (losing in-memory state) while
  players are in a lobby? — The polling request returns a 404 or error; the
  frontend shows a "Room no longer available" message.
- What happens when a transient network error occurs during lobby polling?
  — The client retries silently with exponential back-off (2s → 4s → 8s).
  After 3 consecutive failures, an error notification is displayed but polling
  continues at 8s intervals to self-recover when the connection is restored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a room with a valid
  non-empty player name.
- **FR-002**: System MUST assign the room creator as the host.
- **FR-003**: System MUST generate a unique room code for each room.
- **FR-004**: System MUST reject room creation with empty or whitespace-only
  player names and display a clear error message.
- **FR-005**: System MUST allow a player to join an existing room using its
  unique code and a valid player name.
- **FR-006**: System MUST reject join attempts with empty or whitespace-only
  player names and display a clear error message.
- **FR-007**: System MUST reject join attempts with non-existent room codes
  and display a clear error message.
- **FR-008**: System MUST keep rooms fully isolated — participants in one room
  must never appear in another room's data.
- **FR-009**: System MUST automatically refresh the lobby participant list via
  polling at approximately 2-second intervals.
- **FR-010**: System MUST allow only the host to start the game.
- **FR-011**: System MUST enforce a minimum of 2 participants before the game
  can be started.
- **FR-012**: System MUST navigate all participants to the game screen when
  the host starts the game.
- **FR-013**: System MUST handle lobby polling failures by retrying silently
  with exponential back-off (2s → 4s → 8s) and must display an error
  notification after 3 consecutive failures.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique code. Contains a list of
  participants, a host designation, and a status (lobby, in-progress).
- **Participant**: A player within a room. Has a name and a role (host or
  non-host). The creator is the initial host.
- **Room Code**: A short alphanumeric string used to identify and join a room.
  Must be unique across all active rooms.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see the lobby screen within
  3 seconds of submitting the form.
- **SC-002**: A player can join a room by code and see the updated lobby with
  all participants within 3 seconds of submitting the form.
- **SC-003**: When a new player joins, all existing lobby participants see the
  updated participant list within 3 seconds (accounting for polling interval).
- **SC-004**: The host can start the game when at least 2 players are present;
  non-host players cannot start the game under any condition.
- **SC-005**: Two simultaneous rooms operate independently — actions in one
  room never affect the other.

## Assumptions

- Player names are trimmed of leading/trailing whitespace before validation
  and storage.
- Room codes are generated by the system (players do not choose their own
  codes).
- The first player to create a room is the initial host.
- Host transfer on departure is deferred to a future scenario. The current
  scenario does not provide a leave/disconnect mechanism.
- Lobby polling stops once the game starts (replaced by game-state polling in
  a later scenario).
- The polling interval of approximately 2 seconds is acceptable for a casual
  game; no configurable interval is needed.
- No room capacity limit is enforced beyond what the starter defines.
- No authentication is required — any player can create or join a room.
