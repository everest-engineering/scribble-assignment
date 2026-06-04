# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-04

**Status**: Clarified

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Creates a Room (Priority: P1)

A player opens the app, enters their name, and creates a new room. They land in the lobby, are
identified as the host, and can share the room code with other players.

**Why this priority**: This is the entry point for every game session. Without room creation and
host tracking, nothing else can work.

**Independent Test**: Open the app in one browser tab, create a room, and confirm the lobby shows
the creator as host and the Start Game button is visible only to them.

**Acceptance Scenarios**:

1. **Given** a player submits a non-empty name on the Create Room screen, **When** the room is
   created, **Then** the player lands in the lobby, the room has a unique 4-character code, and
   the player is recorded as the host.
2. **Given** a player submits a whitespace-only or empty name, **When** they attempt to create a
   room, **Then** the request is rejected with a clear error message and no room is created.
3. **Given** two rooms exist with different codes, **When** a player joins one room, **Then** only
   that room's participants are visible and the other room is unaffected.

---

### User Story 2 — Player Joins a Room by Code (Priority: P1)

A second player enters the room code shared by the host and their own name, joins the room, and
appears in the lobby participant list.

**Why this priority**: Multiplayer requires at least one other player; join is the only entry
point for non-hosts.

**Independent Test**: Open two browser tabs, create a room in tab 1, join with the code in tab 2,
and confirm both participants appear in the lobby within the polling interval.

**Acceptance Scenarios**:

1. **Given** a valid room code and a non-empty player name, **When** the player submits the join
   form, **Then** they land in the lobby and appear in the participant list.
2. **Given** an invalid or non-existent room code, **When** the player submits, **Then** a clear
   error message is shown and the player remains on the Join Room screen.
3. **Given** an empty room code field, **When** the player submits, **Then** the request is
   rejected with a clear error message before any network call is made.
4. **Given** a whitespace-only player name, **When** the player submits the join form, **Then**
   the request is rejected with a clear error message.

---

### User Story 3 — Lobby Refreshes Automatically (Priority: P2)

Players in the lobby see new participants appear without manually clicking a refresh button. The
list updates approximately every 2 seconds.

**Why this priority**: Without automatic polling, players would not know when enough participants
have joined, blocking the host from starting the game.

**Independent Test**: Open the lobby in two tabs, join from a third tab, and confirm the first two
tabs show the new participant within ~2 seconds without any manual action.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room, **Then** the first
   player's lobby updates to show the new participant within approximately 2 seconds.
2. **Given** a player navigates away from the lobby, **When** the lobby unmounts, **Then** polling
   stops and no further network requests are made for that tab.
3. **Given** a poll request fails (network error or server error), **When** the error is received,
   **Then** an inline error message is shown in the lobby and polling continues on the next
   interval without interruption.

---

### User Story 4 — Host Starts the Game (Priority: P2)

The host sees an active Start Game button once at least 2 players are present. Non-host players
see the button disabled or hidden. Clicking Start Game transitions the room to the game screen.

**Why this priority**: The start-game gate (host-only, 2-player minimum) is an explicit business
rule in Scenario 1 and is the bridge to all gameplay features.

**Independent Test**: With 2 players in the lobby, confirm only the host's Start Game button is
enabled; have the host click it and confirm both tabs transition to the game screen.

**Acceptance Scenarios**:

1. **Given** the current player is the host and at least 2 players are in the lobby, **When**
   they click Start Game and the request succeeds, **Then** the host navigates immediately to
   the game screen and the room status becomes `playing`.
2. **Given** a non-host player is in the lobby and the room status changes to `playing`, **When**
   the next poll completes, **Then** the non-host player is automatically navigated to the game
   screen.
3. **Given** the current player is the host but only 1 player is present, **When** they view the
   lobby, **Then** the Start Game button is disabled with a message indicating more players are
   needed.
4. **Given** the current player is not the host, **When** they view the lobby, **Then** the Start
   Game button is visible but permanently disabled with the label "Only the host can start".

---

### Edge Cases

- What happens when a player submits a room code with mixed case? The code must be normalised to
  uppercase before lookup so `abcd` and `ABCD` resolve to the same room.
- What happens when two players create rooms simultaneously and receive the same code? The backend
  must guarantee code uniqueness before persisting.
- What happens when a player refreshes the browser page while in the lobby? They lose their
  in-memory session (expected; no persistence is in scope).
- What happens if the host closes their tab? There is no host reassignment. The room remains
  in the lobby state but no participant can start the game; other players must create a new
  room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record the room creator as the host at room creation time.
- **FR-002**: Player names MUST be trimmed; empty or whitespace-only names MUST be rejected with
  a user-facing error message on both create and join flows.
- **FR-003**: Room codes MUST be treated case-insensitively; the system MUST normalise codes to
  uppercase before lookup.
- **FR-004**: Joining with a non-existent or malformed room code MUST return a clear error message
  and leave the player on the Join Room screen.
- **FR-005**: Each room MUST be fully isolated; participants, status, and state of one room MUST
  NOT be visible to or affected by players in a different room.
- **FR-006**: The lobby participant list MUST refresh automatically at approximately 2-second
  intervals without requiring manual user action.
- **FR-007**: Polling MUST stop when the player navigates away from the lobby.
- **FR-008**: The Start Game action MUST be available only to the host of the room.
- **FR-009**: The Start Game action MUST be disabled until at least 2 players are present in the
  room.
- **FR-010**: The Start Game action MUST transition the room status to `playing` on the backend.
- **FR-011**: The host MUST be navigated to the game screen immediately upon a successful Start
  Game response.
- **FR-012**: Non-host players MUST be automatically navigated to the game screen when their
  next lobby poll returns `status: "playing"`.
- **FR-013**: The Start Game button for non-host players MUST be visible but permanently disabled
  with the label "Only the host can start".
- **FR-014**: When a lobby poll fails, the lobby MUST display an inline error message and
  continue polling; polling MUST NOT stop on a transient error.
- **FR-015**: Host abandonment (tab close / navigation away) MUST NOT trigger host reassignment;
  the room remains stalled in lobby state.

### Key Entities

- **Room**: Unique code, host identity, list of participants, current status (`lobby` | `playing`
  | `finished`), creation timestamp, last-updated timestamp.
- **Participant**: Unique identity, display name, join timestamp; the first participant in a room
  is its host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land in the lobby in under 3 seconds on a local
  network.
- **SC-002**: A second player can join a room by code and appear in the host's lobby within the
  next polling cycle (~2 seconds) without any manual refresh.
- **SC-003**: Submitting an invalid or empty room code always produces a visible error message;
  the player never silently reaches the lobby with bad input.
- **SC-004**: The host's Start Game button becomes enabled exactly when a second player joins;
  non-host players cannot trigger game start under any condition.
- **SC-005**: Two rooms created concurrently always receive different codes; joining one room
  never reveals or modifies the other room's participants.

## Assumptions

- The host is defined as the first participant added at room creation time; no explicit host
  designation is provided by the caller.
- A room code is exactly 4 uppercase alphanumeric characters; the existing generation algorithm
  in the starter is preserved.
- Polling uses the existing `fetchRoom` method on `RoomStore`; no new transport mechanism is
  introduced.
- When the host starts the game, the room status changes on the backend and all polling clients
  detect the transition on their next poll.
- In-memory session loss on page refresh is expected and out of scope; no persistence or
  session-recovery mechanism is required.
- The manual Refresh button in the starter lobby MAY be retained alongside automatic polling as
  a convenience, but it is not required once polling is in place.
- Non-host players navigate to the game screen via poll detection (status `playing`), not via
  a direct push or broadcast from the host's action.
- The host navigates immediately on a successful Start Game API response; they do not wait for
  a poll cycle.
- Polling errors are non-fatal: an inline message is shown and the interval continues.
- Host abandonment results in a stalled room with no reassignment; this is expected behaviour
  given the in-memory-only constraint.
