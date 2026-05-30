# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Feature 1: Room Setup & Lobby. Room creator becomes host; invalid and empty room codes show clear errors; rooms remain isolated; lobby polls every ~2 seconds; only host can start a game; start requires at least 2 players. Out of scope: WebSockets, database persistence, authentication."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Identify Host (Priority: P1)

A player creates a room and is clearly treated as the room host so the lobby has a single
player who can manage game start.

**Why this priority**: Host ownership is required before start permissions and lobby
controls can be enforced.

**Independent Test**: Create a new room and verify the creator is marked as host in the
lobby while other participants are not.

**Acceptance Scenarios**:

1. **Given** a player enters a usable display name, **When** they create a room, **Then**
   they are added as the first participant and identified as the host.
2. **Given** a second player joins the same room, **When** the lobby participant list is
   shown, **Then** only the original creator is identified as host.

---

### User Story 2 - Join Lobby With Clear Errors (Priority: P1)

A player can join an existing room by code and receives clear feedback when the code is
empty or invalid.

**Why this priority**: Joining is the core multiplayer entry path and must be reliable
before lobby coordination can work.

**Independent Test**: Attempt to join with an empty code, an unknown code, and a valid
code; verify the first two attempts show clear errors and the valid attempt joins the
correct room.

**Acceptance Scenarios**:

1. **Given** a player submits an empty room code, **When** they try to join, **Then** they
   remain on the join screen and see a clear message that a room code is required.
2. **Given** a player submits a room code that does not match an active room, **When** they
   try to join, **Then** they remain on the join screen and see a clear message that the
   room could not be found or joined.
3. **Given** a player submits a valid active room code, **When** they try to join, **Then**
   they enter that room's lobby and appear in its participant list.

---

### User Story 3 - Keep Rooms Isolated and Fresh (Priority: P2)

Players in one room see only participants from that room, and lobby membership updates
automatically within about two seconds.

**Why this priority**: Room isolation prevents cross-room confusion, and polling removes
the need for manual refresh during lobby setup.

**Independent Test**: Create two rooms in separate browser sessions, join each with a
different second player, and verify each lobby only shows its own participants after the
polling interval.

**Acceptance Scenarios**:

1. **Given** two active rooms exist, **When** players join each room, **Then** each lobby
   shows only participants who joined that room.
2. **Given** a lobby is open, **When** another player joins the same room, **Then** the
   participant list updates automatically within about two seconds without requiring a
   manual refresh.

---

### User Story 4 - Host Starts Game When Ready (Priority: P2)

Only the host can start the game, and the game can start only after at least two players
are present.

**Why this priority**: Start permissions and readiness rules prevent accidental or
single-player game starts.

**Independent Test**: Verify a non-host cannot start, a host with one player cannot start,
and a host with at least two players can start.

**Acceptance Scenarios**:

1. **Given** a room has only the host, **When** the host attempts to start the game, **Then**
   the lobby remains open and shows a clear message that at least two players are required.
2. **Given** a room has at least two players, **When** a non-host views the lobby, **Then**
   they cannot start the game.
3. **Given** a room has at least two players, **When** the host starts the game, **Then**
   the room leaves the lobby state and all players can proceed to the game screen.

### Edge Cases

- Empty or whitespace-only room codes are rejected before joining.
- Unknown room codes produce a clear, user-facing error without changing the current room.
- Multiple rooms with similar activity remain isolated by room code.
- A participant who joins after another user is already viewing the lobby appears after the
  next polling refresh.
- A host cannot start a game with fewer than two participants.
- A non-host cannot start a game, even when enough participants are present.
- Polling failures show a recoverable message while keeping the most recent room snapshot
  visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign the room creator as the host when a room is created.
- **FR-002**: The system MUST expose host identity in the room information shown to lobby
  participants.
- **FR-003**: The system MUST reject empty or whitespace-only room codes with a clear
  message that a room code is required.
- **FR-004**: The system MUST reject unknown or inactive room codes with a clear message
  that the room could not be found or joined.
- **FR-005**: The system MUST keep room participants and lobby state isolated by room code.
- **FR-006**: The lobby MUST refresh automatically approximately every two seconds while a
  player remains in the lobby.
- **FR-007**: The system MUST allow only the host to start the game.
- **FR-008**: The system MUST prevent game start until at least two participants are in the
  room.
- **FR-009**: When the host starts a ready room, the system MUST change the room from lobby
  setup to game-started state for all participants.
- **FR-010**: The system MUST keep the feature within the stated scope: no WebSockets, no
  database persistence, and no authentication.

### Key Entities

- **Room**: A temporary game space identified by a room code. It contains lobby status,
  host identity, and the participants who joined that code.
- **Participant**: A player in a room. Each participant has a display name and can be the
  host or a regular lobby member.
- **Host**: The participant who created the room and is allowed to start the game when the
  room is ready.
- **Lobby**: The pre-game state where participants gather, see the room code, and wait for
  the host to start.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-browser check, the room creator is identified as host in the lobby
  100% of the time.
- **SC-002**: Empty and unknown room-code attempts show clear feedback without entering a
  lobby in 100% of tested attempts.
- **SC-003**: Participants joining one room never appear in another room during a
  multi-room isolation check.
- **SC-004**: A newly joined participant appears in an already-open lobby within three
  seconds during normal local testing.
- **SC-005**: Non-host participants are prevented from starting the game in 100% of tested
  attempts.
- **SC-006**: Hosts are prevented from starting until at least two participants are present
  and can start once the minimum is met.

## Assumptions

- The first participant created with a room is the host.
- A room code identifies exactly one active temporary room.
- Rooms are temporary and are cleared when the service restarts.
- Lobby synchronization uses polling and does not require real-time push.
- Starting the game only needs to transition players out of the lobby for this feature;
  drawing, scoring, and results are handled by later features.
