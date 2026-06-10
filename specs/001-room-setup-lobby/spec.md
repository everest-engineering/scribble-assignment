# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Room setup and lobby: mark the room creator as host (isHost flag on participant), validate and trim player names on create and join with inline error messages, reject unknown room codes with a 404 error, replace the manual refresh button in the Lobby with automatic polling every 2 seconds using setInterval with cleanup on unmount, show Start Game button only to the host and disable it until at least 2 players are present, verify rooms are fully isolated from each other"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creation & Name Validation (Priority: P1)

A player opens the Create Room screen, enters a name, and submits. The system
trims the name, rejects blank/whitespace-only names with an inline error, and —
when the name is valid — creates a new room in which the creator is marked as the
host. The player lands on the Lobby screen.

**Why this priority**: Host identity is the foundation for all host-only actions
(Start Game). It must exist before anything else in this feature can be tested.

**Independent Test**: Open Create Room, submit an empty name and confirm the
inline error appears without navigating away. Then enter a valid name, submit,
and confirm the Lobby loads with the creator listed as the host.

**Acceptance Scenarios**:

1. **Given** the Create Room form is displayed, **When** the player submits with
   a blank name (empty or whitespace-only), **Then** an inline error message
   appears below the name field and no navigation occurs.
2. **Given** the Create Room form is displayed, **When** the player submits with
   a name that is whitespace-padded (e.g., "  Ada  "), **Then** the name is
   stored as "Ada" (trimmed).
3. **Given** a valid trimmed name is submitted, **When** the room is created,
   **Then** the creator's participant record has `isHost: true` and all other
   fields are populated.
4. **Given** a room is created, **When** the creator arrives at the Lobby screen,
   **Then** the participant list shows the creator's name with a host indicator.

---

### User Story 2 - Join & Invalid Code Handling (Priority: P2)

A second player opens the Join Room screen, enters their name and a room code,
and submits. The system trims the name, rejects blank/whitespace-only names with
an inline error, and rejects an unknown room code with a clear inline error
message backed by a 404 response from the server. When both name and code are
valid, the player is added to the room and lands on the Lobby screen with
`isHost: false`.

**Why this priority**: Joining is the entry point for all non-host players.
Correct error handling here prevents silent failures and supports multi-room
isolation testing.

**Independent Test**: On the Join Room screen, test: (a) blank name rejected
with inline error, (b) unknown room code rejected with inline error, (c) valid
name + valid code lands on Lobby with the joining player listed (not as host).

**Acceptance Scenarios**:

1. **Given** the Join Room form is displayed, **When** the player submits with a
   blank or whitespace-only name, **Then** an inline error appears and no
   navigation occurs.
2. **Given** a non-existent room code is entered, **When** the player submits,
   **Then** the server returns a 404 response and the frontend shows an inline
   error message such as "Room not found. Check the code and try again."
3. **Given** a valid name and a valid existing room code are submitted, **Then**
   the joining participant is added with `isHost: false` and the player lands on
   the Lobby.
4. **Given** a name padded with whitespace (e.g., "  Bo  "), **When** the form
   is submitted, **Then** the name is stored as "Bo" (trimmed).

---

### User Story 3 - Lobby Auto-Polling (Priority: P3)

While on the Lobby screen, the participant list refreshes automatically every
2 seconds without any manual action. When the component unmounts (user navigates
away), polling stops completely with no further network requests.

**Why this priority**: Automatic polling unblocks the core multiplayer loop. The
manual Refresh button is removed so the UX is not cluttered with a control that
is no longer needed.

**Independent Test**: Open two browser tabs on the same room's Lobby. In tab 2,
join the room. Within 2 seconds, tab 1's participant list updates automatically
without any button press. Navigate away from the Lobby in tab 1 and confirm no
further polling requests appear in the browser's network panel.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** 2 seconds have elapsed,
   **Then** the room state is re-fetched from the server automatically.
2. **Given** a second player joins the room in a separate tab, **When** the
   2-second poll fires in the first tab, **Then** the new participant appears
   in the list without any manual interaction.
3. **Given** the player navigates away from the Lobby, **When** polling was
   active, **Then** no further fetch requests are made for that room.
4. **Given** a fetch error occurs during polling, **When** the next poll
   interval fires, **Then** polling continues and the error is shown inline
   without crashing the page.

---

### User Story 4 - Host-Only Start Game Gate (Priority: P4)

The Start Game button is visible only to the host and remains disabled until at
least 2 participants are present in the room. Non-host participants see no Start
Game button. When the host has 2 or more players and clicks Start Game, the game
flow proceeds.

**Why this priority**: Prevents premature game starts and correctly enforces host
authority. Depends on US1 (host flag) and US3 (polling that updates the count).

**Independent Test**: Open two tabs — tab 1 is the host, tab 2 is a joiner. On
tab 1 with only 1 participant, confirm Start Game is disabled. On tab 2, confirm
Start Game is not visible at all. After tab 2 joins and the poll updates tab 1,
confirm Start Game becomes enabled for the host.

**Acceptance Scenarios**:

1. **Given** the host is on the Lobby screen with only 1 participant (themselves),
   **Then** the Start Game button is present but disabled.
2. **Given** a non-host participant is on the Lobby screen, **Then** no Start
   Game button is rendered.
3. **Given** the host is on the Lobby screen and a second player has joined,
   **When** the poll updates the participant list to 2 or more, **Then** the
   Start Game button becomes enabled.
4. **Given** the host clicks the enabled Start Game button, **Then** the
   application navigates to the Game screen.

---

### User Story 5 - Room Isolation (Priority: P5)

Two separate rooms created concurrently contain only their own participants.
Joining room A does not affect room B, and fetching room B does not return
participants from room A.

**Why this priority**: Isolation is a correctness guarantee, not a visible
feature. It must hold throughout all other stories.

**Independent Test**: Create two rooms (tab 1 and tab 2). Join room 1 from tab 3.
Fetch room 2 directly (via the GET endpoint or a third Lobby tab) and confirm
the room 1 joiner is not present.

**Acceptance Scenarios**:

1. **Given** two rooms exist with different codes, **When** a player joins room A,
   **Then** room B's participant list is unchanged.
2. **Given** two rooms exist, **When** room B is fetched, **Then** only room B's
   participants are returned.
3. **Given** room A is created, **When** room B is created immediately after,
   **Then** each room has a distinct code and each participant list starts with
   only its own creator.

---

### Edge Cases

- Player submits name with only spaces (e.g., "   ") — treated as blank, rejected with an error.
- Player submits a room code in lowercase — code is normalised to uppercase before lookup.
- Player submits a room code with extra whitespace — code is trimmed before lookup.
- Host disconnects (navigates away) mid-lobby — other players remain in the room; the host flag stays on the original host's participant record.
- A poll fires while a previous poll response is still in-flight — only one outstanding fetch should be active; a new one MUST NOT start until the current one resolves.
- Room code collision during generation — the store already retries; no duplicate codes should be visible to players.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store an `isHost` flag on the participant record for the player who creates a room, set to `true`. All other participants in the same room MUST have `isHost: false`.
- **FR-002**: The system MUST trim all player name inputs before storing or validating them.
- **FR-003**: The system MUST reject a blank or whitespace-only player name on both Create Room and Join Room, displaying an inline error message on the relevant form field without navigating away.
- **FR-004**: The system MUST return a 404 response when a join or fetch request references a room code that does not exist, and the frontend MUST surface a user-readable inline error message.
- **FR-005**: The Lobby screen MUST poll the room state automatically at approximately 2-second intervals.
- **FR-006**: Lobby polling MUST stop and release all timers when the Lobby component unmounts.
- **FR-007**: The Start Game button MUST be rendered only for the host participant.
- **FR-008**: The Start Game button MUST remain disabled when fewer than 2 participants are present in the room.
- **FR-009**: The Start Game button MUST become enabled once 2 or more participants are present (as reflected by the latest polled snapshot).
- **FR-010**: Each room MUST be fully isolated; joining or fetching one room MUST NOT affect or expose data from another room.
- **FR-011**: The manual Refresh Room button in the Lobby MUST be removed once automatic polling is in place.

### Key Entities

- **Participant**: A player in a room. Attributes: unique id, trimmed display name, join timestamp, `isHost` boolean flag.
- **Room**: An isolated game session. Attributes: unique 4-character code, status (`lobby`), ordered list of participants, creation timestamp, last-updated timestamp.
- **RoomSnapshot**: The read-only view of a room returned to clients. Includes the room's participants (with `isHost` visible), status, and available metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land on the Lobby within 3 seconds on a local network.
- **SC-002**: The Lobby participant list reflects a newly joined player within 4 seconds of that player joining (within one 2-second poll cycle plus response time).
- **SC-003**: 100% of blank/whitespace-only name submissions are rejected with an inline error and no unintended navigation.
- **SC-004**: 100% of join attempts with a non-existent room code result in an inline error message referencing the invalid code.
- **SC-005**: After navigating away from the Lobby, zero additional polling requests are made for that room (verified via browser network panel).
- **SC-006**: Two concurrently running rooms never share participant data as observed through the GET room endpoint.

## Assumptions

- The backend runs on `localhost:3001`; the frontend connects via the `VITE_API_URL` environment variable (defaults to that address).
- Room state is stored in memory only; restarting the backend clears all rooms.
- A "host" is always the first participant who created the room. There is no host-transfer mechanism in this scope.
- The `isHost` flag is included in the `Participant` type returned in `RoomSnapshot` so the frontend can determine host status without a separate lookup.
- Only one outstanding poll request should be in flight at a time; if a request takes longer than 2 seconds, the next poll starts after the previous one completes.
- The existing `form__error` CSS class is used for inline error messages; no new styles are required for this feature.
- Player names are not required to be unique within a room.
- The existing routing to `/game` is used when Start Game is clicked; the game navigation logic is out of scope for this feature.
