# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-31

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create Room as Host (Priority: P1)

A player enters their name and creates a new room. The system generates a unique
room code and automatically designates the creator as the host. The host lands
on the Lobby screen where they can see the room code and their own name in the
participant list.

**Why this priority**: Host creation is the entry point for every game session.
Nothing else works without it.

**Independent Test**: Open one browser tab, enter a name, create a room, and
confirm the Lobby screen shows the room code, the player's name, and a disabled
"Start Game" button (only one player present).

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **When** they enter a valid name
   and click "Create Room", **Then** a room is created, the creator is marked as
   host, and the player is taken to the Lobby screen showing the room code.
2. **Given** a player submits an empty or whitespace-only name, **When** they
   attempt to create a room, **Then** the action is blocked and a clear error
   message is shown on both client and server.
3. **Given** a room is created, **When** the host views the Lobby, **Then** a
   "Start Game" button is visible but disabled because fewer than 2 players are
   present.

---

### User Story 2 — Join Room by Code (Priority: P1)

A player enters a room code shared by the host and joins the existing room. The
joiner lands on the Lobby screen alongside the host.

**Why this priority**: The two-player minimum means join must work before any
game can start. P1 parity with create.

**Independent Test**: Open a second browser tab, enter the room code from US1,
enter a name, join, and confirm both participants appear in the Lobby on both
tabs after the next poll.

**Acceptance Scenarios**:

1. **Given** a valid room code and a valid player name, **When** a player joins,
   **Then** they land on the Lobby screen and are added to the participant list.
2. **Given** an empty or whitespace-only room code, **When** a player attempts
   to join, **Then** the action is blocked and a clear error message is shown.
3. **Given** a room code that does not match any existing room, **When** a
   player attempts to join, **Then** the action is blocked and a clear error
   message such as "Room not found" is shown.
4. **Given** an empty or whitespace-only player name, **When** a player attempts
   to join, **Then** the action is blocked and a clear error message is shown on
   both client and server.

---

### User Story 3 — Lobby Polling & Participant Sync (Priority: P2)

Once in the Lobby, all participants see the current participant list update
automatically every 2 seconds without any manual action.

**Why this priority**: Required for multi-player awareness but depends on US1
and US2 being complete.

**Independent Test**: With two tabs open in the same room (US1 + US2 done),
open a third tab and join. Confirm the third participant appears in the other
two tabs within approximately 2 seconds without any button click.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** another player joins the
   same room, **Then** the new participant appears in the lobby participant list
   within approximately 2 seconds without a manual refresh.
2. **Given** the lobby is polling, **When** the network call fails transiently,
   **Then** polling continues and recovers on the next interval without crashing
   the UI.

---

### User Story 4 — Host-Only Start Game (Priority: P2)

Only the host can start the game, and only when at least 2 players are present.
Non-host participants do not see an active "Start Game" control.

**Why this priority**: Gate for Scenario 2. Depends on host tracking from US1
and join from US2.

**Independent Test**: With two tabs (one host, one joiner), confirm only the
host tab shows an enabled "Start Game" button; the joiner tab does not show an
active start control. Confirm that with only 1 player the host button remains
disabled.

**Acceptance Scenarios**:

1. **Given** 2 or more players are in the lobby, **When** the host views the
   Lobby, **Then** the "Start Game" button is enabled and clickable.
2. **Given** fewer than 2 players are in the lobby, **When** the host views the
   Lobby, **Then** the "Start Game" button is present but disabled with a
   visible indication of why (e.g., "Need at least 2 players").
3. **Given** a non-host player views the Lobby, **Then** no active "Start Game"
   control is shown to them.
4. **Given** a non-host player is viewing the lobby, **When** they attempt to
   start the game via any means, **Then** the backend rejects the request with
   a clear error.

---

### User Story 5 — Room Isolation (Priority: P2)

Participants and state in one room have no effect on any other room. Joining the
wrong room is impossible by design.

**Why this priority**: Correctness requirement — without isolation, rooms
contaminate each other.

**Independent Test**: Create two separate rooms in separate browser sessions.
Confirm that joining room A shows only room A's participants, and joining room B
shows only room B's participants.

**Acceptance Scenarios**:

1. **Given** two rooms exist with different codes, **When** a player joins room
   A, **Then** they see only room A's participants and room A's state.
2. **Given** room A and room B each have participants, **When** polling occurs
   in room A, **Then** room B's participants do not appear in room A's lobby.

---

### Edge Cases

- Empty string or whitespace-only player name on create or join: blocked on
  client with inline error; also blocked on server with a `400` response.
- Empty string or whitespace-only room code on join: blocked on client before
  any network call.
- Room code that does not exist: server returns an error; UI shows "Room not
  found" message.
- Player submits the join form twice in quick succession: second request is
  either ignored or results in a duplicate-prevention error.
- Backend base URL misconfiguration (e.g., trailing path segment): fix the
  known typo `/bug` in `frontend/src/services/api.ts` line 22 so all API calls
  reach the correct base URL `http://localhost:3001`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a player creates a room, the backend MUST record that player
  as the host of that room.
- **FR-002**: The backend MUST return a `isHost` (or equivalent) flag in the
  room snapshot so the frontend can conditionally render host-only controls.
- **FR-003**: The frontend MUST display a "Start Game" button on the Lobby
  screen that is visible only to the host and is disabled when fewer than 2
  players are present.
- **FR-004**: The backend MUST reject a start-game request from any participant
  who is not the host with an appropriate error response.
- **FR-005**: The backend MUST reject a start-game request when fewer than 2
  players are in the room with an appropriate error response.
- **FR-006**: The Lobby screen MUST poll `GET /rooms/:code` approximately every
  2 seconds to refresh the participant list without user interaction.
- **FR-007**: Polling MUST stop when the player navigates away from the Lobby
  screen.
- **FR-008**: Player names MUST be trimmed; empty or whitespace-only names MUST
  be rejected on the client before submission and on the server with a `400`
  response.
- **FR-009**: Room codes MUST be trimmed on the client; empty or
  whitespace-only codes MUST be rejected before any network call.
- **FR-010**: Joining a non-existent room MUST return a clear error message to
  the user.
- **FR-011**: Rooms MUST be fully isolated: participant lists, host status, and
  game state MUST NOT bleed between rooms.
- **FR-012**: The known `/bug` typo in `frontend/src/services/api.ts` line 22
  MUST be fixed so the API base URL points to `http://localhost:3001` without
  a path suffix.

### Key Entities

- **Room**: Identified by a unique code; has a list of participants, a host
  participant ID, and a status (`lobby` initially).
- **Participant**: Has an ID, a display name, and a flag indicating whether they
  are the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land on the Lobby screen in under
  3 seconds on a local network.
- **SC-002**: A second player can join using the room code and appear in both
  players' lobby views within the next polling cycle (≤ 2 seconds).
- **SC-003**: The "Start Game" button becomes enabled within the next polling
  cycle after a second player joins, without any manual action by the host.
- **SC-004**: Attempting to join with an invalid code or empty name displays an
  error message before any game state is affected.
- **SC-005**: Two independently created rooms show no shared participants
  regardless of polling timing.

## Assumptions

- The backend in-memory store is the single source of truth; no persistence
  across server restarts is required.
- Room codes are generated by the backend (existing behaviour preserved).
- "Start Game" navigates to the game screen; the game start API endpoint will
  be added as part of this scenario's implementation.
- The existing `GET /rooms/:code` endpoint is used for lobby polling; no new
  polling-specific endpoint is needed.
- A participant's `isHost` status is determined at creation time and does not
  change for the lifetime of the room.
- Player names need not be unique within a room, but cannot be empty or
  whitespace-only.
- The existing `POST /rooms` and `POST /rooms/:code/join` endpoints are
  extended (not rewritten) to include host tracking.
