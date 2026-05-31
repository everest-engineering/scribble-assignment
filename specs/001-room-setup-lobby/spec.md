# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-31

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Room as Host (Priority: P1)

A player who wants to host a drawing game enters their display name on the
Create Room screen and submits. The system generates a unique room code, makes
the creator the host, and takes them directly to the lobby.

**Why this priority**: Room creation is the entry point for every game session.
No other story is possible without a room.

**Independent Test**: A single player can open the Create Room screen, submit
their name, receive a code, and land in the lobby showing themselves as host —
all without any other player present.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room screen,
   **When** they enter a valid display name and submit,
   **Then** a unique room code is generated, the player is designated host,
   and they are taken to the lobby screen showing their name with a host
   indicator.

2. **Given** a player creates a room,
   **When** a second player also creates a separate room at the same time,
   **Then** each room has a distinct code and the two rooms share no
   participants.

---

### User Story 2 — Join a Room by Code (Priority: P2)

A player who has received a room code from a host enters their display name
and the code on the Join Room screen and submits. If the code is valid and the
room exists, they are added to the room and taken to the lobby.

**Why this priority**: Joining is required for any multi-player session. Without
it the host is permanently alone in the lobby.

**Independent Test**: With a room already created (US1), a second player can
open the Join Room screen, enter the code and a display name, and land in the
lobby alongside the host.

**Acceptance Scenarios**:

1. **Given** a player is on the Join Room screen,
   **When** they enter a valid room code and a display name and submit,
   **Then** they are added to the room and taken to the lobby showing all
   current participants.

2. **Given** a player is on the Join Room screen,
   **When** they submit with an empty room code field,
   **Then** the submission is blocked and a clear inline error message is
   shown before any network request is made.

3. **Given** a player is on the Join Room screen,
   **When** they submit a room code that does not match any existing room,
   **Then** an error message clearly states the room was not found and the
   player remains on the Join Room screen.

---

### User Story 3 — Live Lobby via Polling (Priority: P3)

Every participant already in the lobby sees the participant list refresh
automatically every ~2 seconds. When a new player joins the room, their name
appears in the lobby of all existing participants without any manual reload.

**Why this priority**: Real-time presence feedback is essential for the host
to know when to start the game, but the lobby is usable (for a single player)
without it.

**Independent Test**: With two browser windows in the same room lobby, open
a third window, join the room, and observe the first two windows update their
participant lists within ~3 seconds without any refresh action.

**Acceptance Scenarios**:

1. **Given** one or more players are in the lobby,
   **When** a new player joins the room,
   **Then** the new player's name appears in the participant list of all
   existing lobby members within approximately 3 seconds, without any manual
   page action.

2. **Given** a player is in the lobby,
   **When** no new players have joined,
   **Then** the participant list remains stable and no disruptive visual
   flicker or reload occurs between polling cycles.

---

### User Story 4 — Host Starts the Game (Priority: P4)

When at least 2 players are in the lobby, the host sees an enabled Start Game
button. Clicking it transitions all lobby participants to the game screen.
Non-host participants do not have access to the Start Game control.

**Why this priority**: Starting the game is the final lobby action, contingent
on at least three prior steps (create room, join, lobby polling).

**Independent Test**: With a host and one other player in the lobby, the host
clicks Start Game and both participants are moved to the game screen.

**Acceptance Scenarios**:

1. **Given** only 1 player (the host) is in the lobby,
   **When** the host views the lobby,
   **Then** the Start Game control is disabled or clearly indicates that at
   least 2 players are required.

2. **Given** 2 or more players are in the lobby,
   **When** the host activates the Start Game control,
   **Then** the game begins and all lobby participants are transitioned to the
   game screen.

3. **Given** 2 or more players are in the lobby,
   **When** a non-host participant views the lobby,
   **Then** the Start Game control is absent or non-interactive for that
   participant.

---

### Edge Cases

- What happens when a player submits an empty display name on Create or Join
  screens? → Submission is blocked with an inline error; no room is created or
  joined.
- What happens if the same room code is typed with different casing? → Codes
  are matched case-insensitively (assumption; see Assumptions section).
- What happens if a player navigates away from the lobby and returns? → They
  rejoin the polling loop and see the current participant list.
- What happens if a player attempts to join a room whose game has already
  started? → The join is rejected with a message that the game is in progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique, shareable room code when a player
  creates a room.
- **FR-002**: The room creator MUST be automatically assigned the host role;
  no other participant may be host at room creation.
- **FR-003**: System MUST allow any player to join an existing room by entering
  a valid room code and a non-empty display name.
- **FR-004**: System MUST reject a join attempt that uses an empty room code
  field, displaying a clear, actionable error message to the user.
- **FR-005**: System MUST reject a join attempt that uses a room code
  referencing a non-existent room, displaying a clear error message.
- **FR-006**: Room state (participants, game status) MUST be fully isolated per
  room; actions in one room MUST NOT affect any other room.
- **FR-007**: The lobby MUST display the current participant list and refresh it
  automatically at approximately 2-second intervals without user interaction.
- **FR-008**: The lobby MUST visually distinguish the host participant from
  other participants.
- **FR-009**: Only the host MUST be able to activate the Start Game action.
- **FR-010**: The Start Game action MUST be unavailable (disabled or hidden)
  when fewer than 2 players are present in the lobby.
- **FR-011**: Activating Start Game MUST transition all participants currently
  in the lobby to the game screen.
- **FR-012**: A join attempt against a room whose game has already started MUST
  be rejected with a clear message.

### Key Entities

- **Room**: A game session uniquely identified by a room code, with a host, an
  ordered participant list, and a game state (waiting / in-progress).
- **Participant**: A player within a room, identified by a display name and
  flagged as host or non-host.
- **Room Code**: A short, unique, human-shareable string used to locate and
  join a specific room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and have a shareable code in hand in
  under 5 seconds from submitting the Create Room form.
- **SC-002**: A second player can join a room and both participants appear in
  the lobby within 3 seconds of the join action completing.
- **SC-003**: The lobby participant list reflects a new joiner within 3 seconds
  for all existing lobby members, without any manual refresh.
- **SC-004**: 100% of empty-field and invalid-code join attempts are blocked
  before reaching the server and surface a visible error message to the user.
- **SC-005**: The Start Game control is inaccessible to every non-host
  participant in every test scenario.
- **SC-006**: The Start Game control is unavailable to the host in 100% of
  scenarios where fewer than 2 players are present.
- **SC-007**: Creating or modifying one room produces no observable change in
  any other room's participant list or state.

## Assumptions

- Display names need only be non-empty; uniqueness within a room is not
  enforced for this scenario.
- Room codes are matched case-insensitively on join.
- No maximum participant count per room is enforced in this scenario.
- A player who navigates away and re-submits the join form is treated as a new
  participant entry (no session persistence or reconnect logic required here).
- Polling at ~2 seconds means the client issues a fetch every 2 seconds; minor
  jitter (±500 ms) is acceptable.
- Rooms persist only in memory for the lifetime of the server process; no
  durable storage is required.
- There is no invite-only or password mechanism beyond possessing the room code.
