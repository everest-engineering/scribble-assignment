# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-lobby-setup`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby. Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-11

- Q: What should the lobby display when a polling request fails (network error, server error)? → A: Silently retry - no UI disruption, keep displaying last known state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room as Host (Priority: P1)

A player opens the app and creates a new room. The system generates a unique room
code and designates the creator as the host. The player sees the room code and
the lobby with themselves as the sole participant.

**Why this priority**: Room creation is the entry point for every game session.
Without it, no other flow is possible.

**Independent Test**: A player opens the app, enters a display name, and creates
a room. The system displays a unique 4-character room code and places the player
in the lobby. The player is identified as the host.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen, **When** they enter a display name
   and click "Create Room", **Then** a new room is created with a unique 4-character
   code and the player is listed as the host in the lobby.
2. **Given** a player has created a room, **When** they view the lobby, **Then**
   the room code is clearly displayed and the player's name is marked as the host.
3. **Given** two players each create rooms simultaneously, **When** both rooms
   exist, **Then** each room has a different unique code and the participants
   and host of each room are isolated.

---

### User Story 2 - Join Room with Code Validation (Priority: P1)

A player enters a room code to join an existing room. The system validates the
code and either admits the player or shows a clear error message.

**Why this priority**: Joining is the second fundamental flow. Players must be
able to enter a game together, and invalid inputs must be handled gracefully.

**Independent Test**: A player enters a 4-character room code and clicks "Join".
If the code matches an existing room, the player is added to the lobby. If the
code is invalid, empty, or whitespace-only, a clear error message is displayed.

**Acceptance Scenarios**:

1. **Given** a room exists with code "ABCD", **When** a player enters "ABCD" and
   clicks "Join", **Then** the player is added to the room's participant list
   and sees the lobby.
2. **Given** a room exists with code "ABCD", **When** a player enters "abcd" and
   clicks "Join", **Then** the player is added to the room (codes are case-insensitive).
3. **Given** a player enters an empty or whitespace-only room code, **When** they
   click "Join", **Then** a clear error message is shown and no join attempt is made.
4. **Given** a player enters a room code that does not match any existing room,
   **When** they click "Join", **Then** a clear error message is shown (e.g.,
   "Room not found").
5. **Given** a player is already in a room, **When** they join a different room,
   **Then** they can participate in the new room (no blocking restriction across
   rooms).

---

### User Story 3 - Lobby Auto-Polling (Priority: P2)

The lobby automatically refreshes the participant list at approximately 2-second
intervals so all players see updated participant counts without manual action.

**Why this priority**: Manual refresh works for initial testing, but auto-polling
is essential for a smooth multiplayer experience. Without it, players must
manually press a refresh button to see who has joined.

**Independent Test**: Two browser tabs join the same room. The first tab's lobby
shows the second player appear within approximately 2 seconds without any manual
refresh.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room,
   **Then** the first player's lobby updates to show the new participant within
   approximately 2 seconds.
2. **Given** a player is in the lobby, **When** no changes occur, **Then** the
   polling continues without disrupting the UI (no flickering or unnecessary
   re-renders).

---

### User Story 4 - Host Starts Game (Priority: P2)

Only the host can start the game, and only when at least 2 players are present
in the room. Non-host players see a waiting state.

**Why this priority**: Starting the game is the transition from lobby to gameplay.
The host restriction ensures clear ownership, and the 2-player minimum ensures
a viable game.

**Independent Test**: The host sees a "Start Game" button once 2+ players are in
the lobby and can click it to start. Non-host players see a "Waiting for host..."
message and cannot start the game.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with 2 or more players, **When** they click
   "Start Game", **Then** the room status changes from "lobby" to "playing" and
   all players in the lobby are transitioned to the game screen.
2. **Given** the host is in the lobby with only 1 player (themselves), **When**
   they view the lobby, **Then** the "Start Game" button is disabled or hidden,
   with an indication that more players are needed.
3. **Given** a non-host player is in the lobby, **When** they view the lobby,
   **Then** no "Start Game" button is available and a "Waiting for host to
   start..." message is shown.
4. **Given** a room has 2+ players but a non-host player attempts to start the
   game, **Then** the request is rejected by the backend and a clear error is
   returned.

---

### Edge Cases

- What happens when a player tries to create a room without entering a display
  name? (Default name "Player" is assigned per the existing starter behavior.)
- What happens when a player joins a room that is already in "playing" status?
  (Room should still be joinable in lobby status only; playing rooms should
  not accept new joiners.)
- What happens when all players leave a room? (Room persists in memory until
  explicitly cleaned up.)
- What happens if the room code generation produces a duplicate? (The system
  regenerates until a unique code is created.)
- What happens when a polling request fails due to network or server error?
  (The system silently retries on the next polling cycle; the UI continues
  showing the last known room state.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code when a room is created.
- **FR-002**: System MUST designate the room creator as the host.
- **FR-003**: System MUST display the room code prominently after creation.
- **FR-004**: System MUST accept join requests with valid room codes that match
  an existing room in "lobby" status.
- **FR-005**: System MUST reject join requests with empty or whitespace-only
  room codes with a clear error message.
- **FR-006**: System MUST reject join requests for non-existent room codes with
  a clear error message.
- **FR-007**: System MUST treat room codes case-insensitively (e.g., "abcd" and
  "ABCD" match the same room).
- **FR-008**: System MUST isolate rooms so participants in one room cannot see
  or interact with another room.
- **FR-009**: Lobby MUST poll for room state updates at approximately 2-second
  intervals.
- **FR-010**: Only the host MUST be able to start the game.
- **FR-011**: Game MUST NOT start until at least 2 players are in the room.
- **FR-012**: Non-host players MUST NOT see or have access to the "Start Game"
  control.
- **FR-013**: Polling MUST continue without visible UI disruption when no state
  has changed.
- **FR-014**: When a polling request fails (network error or server error), the
  system MUST silently retry on the next interval and continue displaying the
  last known room state without UI disruption.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique 4-character code. Contains a
  status (lobby/playing), a participant list, and a host identifier.
- **Participant**: A player in a room, identified by a unique participant ID and
  display name.
- **Host**: The participant who created the room. Has special privileges (start
  game, restart game). Stored as a reference to a participant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see the room code displayed within
  2 seconds of clicking "Create Room".
- **SC-002**: A player can join an existing room by entering its code and see
  themselves in the lobby within 2 seconds of clicking "Join".
- **SC-003**: Invalid room codes (empty, whitespace, non-existent) show a clear
  error message; no join attempt succeeds with an invalid code.
- **SC-004**: A second player joining a room becomes visible to the first player
  in the lobby within approximately 3 seconds of joining (allowing for one
  polling cycle).
- **SC-005**: A host can start the game once 2 players are present; a non-host
  player cannot start the game under any input combination.
- **SC-006**: Two rooms with different codes remain fully isolated — players in
  one room cannot see players or activity from the other room.

## Assumptions

- Host identification relies on participantId matching (no authentication
  system). The backend stores the host's participantId on room creation.
- Room codes are 4-character alphanumeric, excluding ambiguous characters
  (0/O, 1/I, etc.) to minimize input errors.
- No maximum room size is enforced. Any number of players can join a room in
  lobby status.
- If the host leaves the room, no host transfer occurs. The room remains
  playable but no player can start a new game — this is acceptable for the
  initial implementation.
- Lobby polling uses HTTP GET requests to fetch the room snapshot. The
  existing `GET /rooms/:code` endpoint is extended to include host
  information and game status.
