# Feature Specification: Fix Room Lobby Flow

**Feature Branch**: `001-fix-room-lobby-flow`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "1. Fix the error in the code click Create Room, enter a name, and continue. 2. click Join Room, enter a name and the code. 3. click Refresh Room to see the second player appear in the participant list."

## Clarifications

### Session 2026-05-30

- Q: Should this fix include adding inline error messages on the Create Room / Join Room forms and a loading state during lobby refresh, or is the scope strictly limited to fixing the broken API URL? → A: Full scope — fix the URL AND add inline field validation on create/join forms, loading state on refresh, and consistent error display.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and join a room (Priority: P1)

As a player, I want to create a room and have another player join it so that we
can play together.

**Why this priority**: The entire multiplayer game depends on two or more players
being able to join the same room. Without this, no gameplay is possible.

**Independent Test**: Can be tested by opening two browser tabs, creating a room
in one tab and joining the same room code in the other, then verifying both
players appear in the participant list.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen, **When** they enter a name and
   click "Create Room", **Then** they are taken to the lobby and see themselves
   in the participant list.
2. **Given** a player is on the home screen, **When** they click "Create Room"
   with an empty or whitespace-only name, **Then** they see an inline validation
   error and are not taken to the lobby.
3. **Given** a room has been created, **When** a second player enters the room
   code and their name and clicks "Join Room", **Then** they are taken to the
   lobby and see both players in the participant list.
4. **Given** a player is on the Join Room screen, **When** they click "Join
   Room" with an empty name or empty code, **Then** they see an inline
   validation error and are not taken to the lobby.

---

### User Story 2 - Refresh lobby to see updated participants (Priority: P2)

As a player in the lobby, I want to click "Refresh Room" to see the latest
participant list so that I know when other players have joined.

**Why this priority**: Players need a way to see newly joined participants
without automatic polling being available yet.

**Independent Test**: Can be tested by having two browser tabs open on the same
room, joining the second player, then clicking "Refresh Room" in the first tab
to verify the second player appears.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby with one participant, **When** a second
   player joins and the first player clicks "Refresh Room", **Then** the
   participant list updates to show both players.
2. **Given** a player is viewing the lobby, **When** they click "Refresh Room",
   **Then** a loading indicator appears while the request is in progress.
3. **Given** a player is viewing the lobby, **When** they click "Refresh Room"
   while the server is unavailable, **Then** they see an inline error message
   on the lobby indicating the refresh failed.

---

### Edge Cases

- What happens when the backend server is not running and a player tries to
  create or join a room?
- What happens when a player enters an invalid or non-existent room code?
- What happens when a player enters only whitespace as their name?
- What happens when the refresh button is clicked while a refresh is already in
  progress?
- What happens when the API URL is still misconfigured after the fix?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Players MUST be able to create a new room by entering a name and
  clicking "Create Room".
- **FR-002**: Players MUST be able to join an existing room by entering a room
  code and their name.
- **FR-003**: After creating or joining a room, the player MUST be taken to the
  lobby showing the current participant list.
- **FR-004**: Players MUST be able to click "Refresh Room" in the lobby to fetch
  the latest participant list from the server.
- **FR-005**: The lobby MUST display all participants currently in the room.
- **FR-006**: Errors from the server (network failure, invalid code, etc.) MUST
  be displayed as inline messages on the relevant form (Create Room / Join Room)
  or as an alert on the lobby refresh, never as browser console-only errors.
- **FR-007**: The Create Room form MUST validate that the player name is not
  empty or whitespace-only before submitting, showing an inline error if
  invalid.
- **FR-008**: The Join Room form MUST validate that the player name and room
  code are not empty or whitespace-only before submitting, showing inline errors
  if invalid.
- **FR-009**: The lobby refresh button MUST show a loading indicator while the
  fetch request is in progress and MUST re-enable once the request completes
  (success or failure).
- **FR-010**: All server API calls from the frontend MUST use the correct base
  URL so that requests reach the backend endpoints successfully.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique code, containing a list of
  participants and game state.
- **Participant**: A player connected to a room, identified by name and a
  server-assigned unique ID.
- **Room Snapshot**: A read-only view of a room's current state (participants,
  status, available words, roles).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see themselves in the lobby within
  3 seconds of clicking "Create Room".
- **SC-002**: A second player can join the same room, and both players see each
  other in their respective lobby views after a refresh.
- **SC-003**: Error messages are displayed within 2 seconds when an operation
  fails (network error, invalid code, etc.).
- **SC-004**: A loading indicator appears on the lobby refresh button within
  200ms of clicking and disappears when the request completes.
- **SC-005**: Inline validation errors appear on the Create Room and Join Room
  forms immediately when the user submits with invalid input (empty name, empty
  code).
- **SC-006**: No API request fails due to an incorrect base URL — all requests
  reach the correct backend endpoints.

## Assumptions

- The backend server runs on `http://localhost:3001` by default during
  development.
- Players use a modern browser with JavaScript enabled.
- Room codes are generated by the backend and shared between players out of
  band.
- The backend correctly handles room creation, joining, and snapshot retrieval —
  the fix is limited to frontend connection issues.
