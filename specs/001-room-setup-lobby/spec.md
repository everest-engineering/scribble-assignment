# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create Room & Become Host (Priority: P1)

A player opens the app and creates a new room by entering their name. On success they
are taken to the Lobby screen and they are identified as the host of the room. No other
player in the room has host status. The room is given a unique 4-character code.

**Why this priority**: Host tracking is the foundation of the entire scenario. Without
knowing who the host is, start-game gating and lobby display are impossible.

**Independent Test**: Can be tested with a single browser tab — create a room, land on
the Lobby, and confirm the "Start Game" button is visible only for the creator.

**Acceptance Scenarios**:

1. **Given** a player enters a non-empty name on the Create Room screen,
   **When** they submit the form,
   **Then** a new room is created with a unique 4-character code, the player is set as
   the host, and they land on the Lobby screen showing their name and host indicator.

2. **Given** a player submits the Create Room form with an empty or whitespace-only name,
   **When** the form is validated,
   **Then** the submission is rejected and a clear inline error message is displayed —
   no room is created.

3. **Given** a room has been created,
   **When** a second room is created independently,
   **Then** both rooms have different codes and their participant lists are fully
   isolated — joining one does not affect the other.

---

### User Story 2 — Join Room via Code (Priority: P2)

A player opens the app and joins an existing room by entering the room code and their
name. On success they land on the Lobby screen. They are not the host. The host's
name is already in the participant list.

**Why this priority**: Joining is required for multi-player play and is the second most
fundamental operation after creation.

**Independent Test**: Open two browser tabs — tab A creates a room, tab B joins using
the code. Verify tab B lands on the Lobby and sees tab A's player in the list.

**Acceptance Scenarios**:

1. **Given** a valid room code and a non-empty player name,
   **When** a player submits the Join Room form,
   **Then** they are added to the room's participant list and land on the Lobby screen
   with their name shown and no host indicator.

2. **Given** a player submits the Join Room form with an empty or whitespace-only code,
   **When** the form is validated,
   **Then** the submission is rejected immediately with a clear inline error — no API
   call is made.

3. **Given** a player enters a code that does not match any existing room,
   **When** the form is submitted,
   **Then** a clear error message is displayed ("Room not found" or equivalent) and
   the player remains on the Join screen.

4. **Given** a player enters a non-empty name but with whitespace padding,
   **When** the form is submitted,
   **Then** the name is trimmed before being sent — the stored name contains no leading
   or trailing whitespace.

---

### User Story 3 — Lobby Auto-Polling (Priority: P3)

While one or more players are waiting in the Lobby, the participant list updates
automatically approximately every 2 seconds without requiring a manual refresh action
from the player.

**Why this priority**: Polling enables multi-player awareness in the lobby — essential
for knowing when enough players are present to start the game.

**Independent Test**: With two browser tabs open, join from tab B; tab A's Lobby should
show the new participant within ~2 seconds without any user interaction on tab A.

**Acceptance Scenarios**:

1. **Given** Player A is on the Lobby screen,
   **When** Player B joins the same room from a separate browser tab,
   **Then** Player A's participant list updates to include Player B within approximately
   2 seconds, without Player A clicking any button.

2. **Given** the Lobby is polling,
   **When** the backend is temporarily unavailable for one poll cycle,
   **Then** the Lobby does not crash or navigate away — it retries on the next cycle
   and displays stale data until a successful response is received.

---

### User Story 4 — Host-Only Start Game (Priority: P4)

Only the host can start the game, and only when at least 2 players are in the lobby.
The Start Game button is visible only to the host. Non-host players see a waiting
message instead. The button is disabled when fewer than 2 players are present.

**Why this priority**: This gates the transition from Lobby to Game and enforces the
minimum player constraint required by the business rules.

**Independent Test**: With one player in the lobby (the host), the Start button MUST be
disabled. With 2+ players the button is enabled for the host only. Non-host sees no
button.

**Acceptance Scenarios**:

1. **Given** the host is in the Lobby with only 1 participant (themselves),
   **When** they view the Lobby screen,
   **Then** the Start Game button is visible but disabled, and a message such as
   "Waiting for more players…" is shown.

2. **Given** at least 2 players are in the Lobby,
   **When** the host views the Lobby screen,
   **Then** the Start Game button is enabled and the waiting message is replaced or
   updated to reflect readiness.

3. **Given** a non-host player is in the Lobby,
   **When** they view the Lobby screen,
   **Then** no Start Game button is shown — they see a waiting message indicating the
   host will start the game.

4. **Given** 2+ players are present and the host clicks Start Game,
   **When** the request is processed,
   **Then** the room transitions to the active game state and all players are navigated
   to the Game screen on their next poll cycle.

---

### Edge Cases

- A player submitting a Join form with a code that consists entirely of whitespace MUST
  receive the same "empty code" error as a genuinely empty input.
- Room codes MUST be compared case-insensitively on the server — a player entering
  `ab12` for a room coded `AB12` MUST succeed.
- A room code that was once valid but whose room no longer exists (e.g., server
  restarted) MUST return a "Room not found" error, not an unhandled crash.
- Two players joining simultaneously with identical names MUST both succeed — names are
  not unique identifiers; `participantId` (UUID) is the unique identity.
- The Start Game request from a non-host participant MUST be rejected with a clear error
  (HTTP 403 or equivalent) even if the minimum player count is met.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a player creates a room, the system MUST assign them as the host and
  include a `hostId` (matching the creator's `participantId`) in the room state.
- **FR-002**: The system MUST validate that a player name is non-empty after trimming
  whitespace, both on room creation and room joining. Violations MUST return a clear
  error before any room state is modified.
- **FR-003**: The system MUST validate that a room code is non-empty after trimming
  whitespace on join. Violations MUST be surfaced to the user without an API call.
- **FR-004**: Room lookup MUST be case-insensitive for the room code.
- **FR-005**: Each room MUST maintain a fully isolated participant list. Joining room A
  MUST NOT affect the participant list of room B.
- **FR-006**: The Lobby screen MUST poll the room snapshot endpoint at approximately
  2-second intervals and update the displayed participant list on each successful
  response.
- **FR-007**: The Lobby MUST display a visual indicator distinguishing the host from
  other participants.
- **FR-008**: The Start Game control MUST be rendered only for the host participant.
  Non-host participants MUST see a waiting message in its place.
- **FR-009**: The Start Game control MUST be disabled (non-interactive) when fewer than
  2 participants are present in the room.
- **FR-010**: The Start Game action MUST transition the room's `status` from `"lobby"`
  to `"active"` on the backend. Only the host's participant ID MUST be authorised to
  trigger this transition.

### Key Entities

- **Room**: Identified by a unique 4-character code. Holds `status` (`"lobby"` |
  `"active"`), an ordered list of participants, `hostId` (the `participantId` of the
  creator), `createdAt`, and `updatedAt` timestamps.
- **Participant**: Identified by a UUID (`participantId`). Holds a trimmed display
  `name` and `joinedAt` timestamp. Not unique by name.
- **RoomSnapshot**: The read-only view of a room returned to clients. Includes the
  room's code, status, participant list, and `hostId`. Does not expose internal
  mutable references.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land on the Lobby screen in under 3 seconds
  on a local network.
- **SC-002**: A second player can join using the room code and appear in the first
  player's Lobby participant list within approximately 2 seconds of joining, without
  any manual refresh.
- **SC-003**: All invalid input scenarios (empty name, empty code, unknown code) surface
  a human-readable error message — zero unhandled blank screens or raw error objects
  shown to the user.
- **SC-004**: The Start Game button is reliably gated — in manual testing across 10
  attempts, it is never enabled for a non-host and never enabled with fewer than
  2 players.
- **SC-005**: Two rooms created independently share no participant data — verified by
  creating two rooms and confirming each shows only its own participants after
  multiple join operations on each.

## Assumptions

- Player identity within a session is tracked client-side using the `participantId`
  returned at room creation or join. There is no server-side session or cookie.
- The `participantId` is stored in the frontend's in-memory store (e.g., Zustand) for
  the duration of the browser session. Refreshing the page does not restore identity.
- Room codes are 4 characters drawn from an unambiguous alphabet (no O/0, I/1 etc.)
  as implemented in the existing `generateCode` function.
- The backend's in-memory store is the only persistence layer — restarting the server
  clears all rooms, which is acceptable for this lab.
- "Start Game" triggers the room status transition only; drawer assignment and word
  selection are out of scope for this scenario (covered in Scenario 2).
- The frontend polling interval is managed by a `setInterval` inside the Lobby page
  component and cleared on unmount to avoid memory leaks.
- Polling failures are silent (no toast/modal) — the UI simply retains the last
  successfully fetched participant list until the next successful poll.
