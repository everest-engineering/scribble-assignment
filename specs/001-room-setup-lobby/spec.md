# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scenario 1 — Room Setup & Lobby: Given a player wants to host or join a drawing game,
When they create or join a room via a unique code, Then the creator is automatically the host;
invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby
refreshes via polling (~2s); and only the host can start the game once at least 2 players
are present.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Creates a Room (Priority: P1)

A player navigates to the Start screen and chooses to create a new room. They enter their
player name and submit. A unique room code is generated, they are recorded as the host, and
they land on the Lobby screen showing themselves as the only participant.

**Why this priority**: Creating a room is the entry point for all other gameplay. Nothing else
can happen without at least one room existing.

**Independent Test**: Open one browser tab. Enter a player name, click "Create and Continue".
Confirm you land on the Lobby screen showing the room code and your name in the participant list.
Confirm you see the "Start Game" button (host-only control).

**Acceptance Scenarios**:

1. **Given** a player on the Start screen, **When** they click "Create Room", enter a non-empty
   name, and submit, **Then** they land on the Lobby screen, the room code is displayed, and
   their name appears in the participant list.
2. **Given** a player creating a room, **When** the room is created, **Then** that player is
   recorded as the host and the "Start Game" button is visible only to them.
3. **Given** a player creating a room with a whitespace-only name, **When** they submit,
   **Then** an error message is shown and no room is created.
4. **Given** a player creating a room with an empty name field, **When** they submit, **Then**
   an error message is shown and no room is created.

---

### User Story 2 — Player Joins an Existing Room (Priority: P1)

A player navigates to the Start screen and chooses to join a room. They enter their player
name and a valid room code. They land on the Lobby screen showing all current participants.

**Why this priority**: Joining is the second half of the room lifecycle; the game requires
at least two players so join is as critical as create.

**Independent Test**: Open two browser tabs. Tab 1 creates a room. Tab 2 uses the displayed
room code to join. Confirm Tab 2 lands on the Lobby and that Tab 1's participant list (after
the next auto-refresh) shows both players.

**Acceptance Scenarios**:

1. **Given** a valid room code and a non-empty player name, **When** the player submits the
   Join form, **Then** they land on the Lobby screen and appear in the participant list.
2. **Given** an invalid (non-existent) room code, **When** the player submits, **Then** a
   clear error message is displayed and the player stays on the Join screen.
3. **Given** an empty room code field, **When** the player submits, **Then** a clear error
   message is shown and no join attempt is made.
4. **Given** a whitespace-only player name on the Join form, **When** they submit, **Then**
   an error message is shown and no join attempt is made.

---

### User Story 3 — Lobby Auto-Refreshes Participant List (Priority: P2)

Once in the Lobby, the participant list updates automatically approximately every 2 seconds
without any manual action from the user. When a new player joins, all players already in the
lobby see the updated list within about 2 seconds.

**Why this priority**: Without polling, the host cannot tell when enough players have joined
to start the game. Manual refresh is a workaround, not the target behaviour.

**Independent Test**: Open two tabs. Tab 1 creates a room and stays on the Lobby. Tab 2 joins.
Without clicking anything on Tab 1, wait up to 3 seconds and confirm Tab 1's participant list
now shows Tab 2's player name.

**Acceptance Scenarios**:

1. **Given** a player on the Lobby screen, **When** another player joins the same room,
   **Then** the lobby participant list updates within approximately 2 seconds without any
   manual interaction.
2. **Given** a player on the Lobby screen, **When** the polling interval fires, **Then** the
   UI does not flash, lose state, or navigate away unnecessarily.
3. **Given** a player who leaves the Lobby screen (navigates away), **When** they leave,
   **Then** polling stops and no further background requests are made for that room.
4. **Given** a player on the Lobby screen, **When** they view the participant list area,
   **Then** there is no manual "Refresh Room" button — the list updates automatically.

---

### User Story 4 — Host Starts the Game (Priority: P2)

Once at least 2 players are in the lobby, the host can start the game. Non-host players
cannot start the game. Clicking "Start Game" transitions the room to an active game state.

**Why this priority**: The start-game gate (host-only, 2-player minimum) is the key control
that separates the lobby phase from the game phase.

**Independent Test**: Open two tabs. Tab 1 creates a room (host). Tab 2 joins. On Tab 1,
confirm "Start Game" becomes active. On Tab 2, confirm "Start Game" is absent or disabled.
Click "Start Game" on Tab 1 and confirm both tabs eventually navigate to the game screen.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with fewer than 2 players, **When** they view the lobby,
   **Then** the "Start Game" button is disabled and the label "Need at least 2 players to start"
   is visible.
2. **Given** the host is in the lobby with 2 or more players, **When** they click "Start Game",
   **Then** the room status transitions and all players are navigated to the game screen.
3. **Given** a non-host player in the lobby with 2 or more players, **When** they view the
   lobby, **Then** the "Start Game" button is absent or permanently disabled for them.
4. **Given** a non-host participant who attempts to start the game via a direct request,
   **When** the server processes the request, **Then** it returns an error and the room
   status does not change.

---

### User Story 5 — Multi-Room Isolation (Priority: P3)

Players in one room cannot see or affect the state of a different room. Creating or joining
room A has no effect on room B.

**Why this priority**: Isolation is a correctness requirement expected to hold naturally with
per-room in-memory storage, but must be explicitly verified.

**Independent Test**: Open three tabs. Tabs 1 and 2 each create separate rooms. Tab 3 joins
room 1. Confirm room 2's participant list does not include Tab 3's player.

**Acceptance Scenarios**:

1. **Given** two separate rooms exist, **When** a player joins room A, **Then** room B's
   participant list is unchanged.
2. **Given** two separate rooms with different hosts, **When** the host of room A starts the
   game, **Then** room B's status is unaffected.

---

### Edge Cases

- What happens when a player submits a room code in lowercase? The system normalises the
  code to uppercase before lookup; the player lands on the lobby normally.
- What happens when the backend restarts while a player is in the lobby? The room no longer
  exists; the next poll returns a 404 and the player is redirected to the Start screen
  with an error message.
- What happens when a lobby poll fails with a transient error (network timeout, 5xx)? The
  error message is displayed inline in the lobby and polling continues at the normal interval;
  the error clears automatically when the next poll succeeds.
- What happens when two players join the same room at the same moment? Both are added
  independently; both land on the lobby showing all participants.
- What happens if a player refreshes the browser while in the lobby? The in-memory session
  is lost; the player is redirected to the Start screen (persistence is out of scope).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign the creating player as the host when a room is created.
- **FR-002**: The system MUST store a host identifier on the room and include it in every
  room snapshot so the frontend can determine host status.
- **FR-003**: The system MUST reject player names that are empty or whitespace-only, returning
  a user-visible error message.
- **FR-004**: The system MUST reject join requests for room codes that do not match any active
  room and return a clear error message.
- **FR-005**: The system MUST normalise room code input to uppercase before performing a lookup.
- **FR-006**: The lobby MUST poll the room snapshot automatically at approximately 2-second
  intervals while the Lobby screen is visible.
- **FR-007**: Lobby polling MUST stop when the player navigates away from the Lobby screen.
  The manual "Refresh Room" button MUST be removed; polling is the sole refresh mechanism.
- **FR-008**: The "Start Game" control MUST be visible only to the host. When fewer than
  2 players are present it MUST be disabled and accompanied by the label "Need at least
  2 players to start". It becomes enabled once 2 or more players are in the room.
- **FR-009**: The "Start Game" control MUST be absent or permanently disabled for non-host
  players regardless of player count.
- **FR-010**: The backend MUST reject start-game requests from non-host participants; the
  room status MUST NOT change as a result.
- **FR-011**: Each room MUST be fully isolated; operations on one room MUST NOT affect any
  other room's state.
- **FR-012**: The system MUST display user-facing error messages for all failure states
  including invalid code, empty name, and server errors.
- **FR-013**: When a lobby poll fails with a transient error, the lobby MUST display the
  error inline and continue polling; the error MUST clear automatically on the next
  successful poll.

### Key Entities

- **Room**: Identified by a unique 4-character uppercase code. Holds a participant list, a
  host identifier, a status value (starting as `lobby`), and creation/update timestamps.
- **Participant**: A player in a room. Has a unique identifier, a display name, and a join
  timestamp. The participant whose identifier matches the room's host identifier is the host.
- **RoomSnapshot**: The read-only view of a room returned to the frontend. Includes the room
  code, current status, full participant list, and host identifier.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the Lobby screen in under 5 seconds on a
  local network.
- **SC-002**: A player can join an existing room by code and reach the Lobby screen in under
  5 seconds on a local network.
- **SC-003**: When a new player joins, their name appears in all already-open lobbies within
  3 seconds without any manual action.
- **SC-004**: An invalid or empty room code produces a visible error message before any
  navigation occurs.
- **SC-005**: The host cannot trigger game start with fewer than 2 players present (control
  is disabled).
- **SC-006**: A non-host player cannot trigger game start under any circumstance, including
  direct backend access.
- **SC-007**: The participant lists of two independent rooms remain fully isolated during
  concurrent use.

---

## Clarifications

### Session 2026-06-04

- Q: How should the lobby behave when a poll fails with a transient error (network timeout, 5xx)? → A: Show the error inline in the lobby and keep polling; the error clears on the next successful poll.
- Q: Should the existing manual "Refresh Room" button be kept alongside auto-polling? → A: No — remove it; polling replaces it entirely.
- Q: What label should accompany the disabled "Start Game" button when fewer than 2 players are present? → A: "Need at least 2 players to start."

---

## Assumptions

- Player identity is held in browser memory only. A page refresh clears the session and
  returns the player to the Start screen. Persistence is out of scope.
- The room code uniqueness guarantee is provided by the existing retry loop in the backend
  store; no changes to that mechanism are needed.
- Room codes are case-insensitive from the user's perspective; both sides normalise to
  uppercase.
- The polling interval is fixed at 2000 ms and defined as a named constant.
- The host is always the first player added at room creation. The host identifier is stored
  once on the room and never changes.
- The "Start Game" action transitions the room to an active status; the frontend detects this
  via the next lobby poll and navigates all players to the game screen.
- Rooms are isolated by design through per-room in-memory storage keyed by unique code.
