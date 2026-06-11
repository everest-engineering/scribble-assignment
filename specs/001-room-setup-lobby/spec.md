# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Room setup and lobby"

## Clarifications

### Session 2026-06-10

- Q: What visual state should the UI show during loading transitions (create, join, refresh)? → A: Show a loading spinner with status text ("Creating room...", "Joining...", "Refreshing...").
- Q: Should the "Start Game" action include changing room status from lobby to playing (drawer assignment, word selection), or is that deferred? → A: Include status transition (lobby→playing), drawer assignment, and word selection within this feature's scope.
- Q: How should the system handle a room code collision on creation? → A: Retry silently with a new random code until a unique one is found.

## User Scenarios & Testing *(mandatory)*

**UX Note**: During create, join, and refresh operations, the UI shows a loading spinner with contextual status text ("Creating room...", "Joining...", "Refreshing...") to indicate progress. Buttons are disabled during loading to prevent duplicate submissions.

### User Story 1 - Create a Room and Enter Lobby (Priority: P1)

A player wants to host a new drawing game. They enter a display name, create a room, and are placed in the lobby where they can see the room code and share it with friends.

**Why this priority**: Room creation is the entry point for the entire game. Without it, no game can start. This is the foundation that all other features depend on.

**Independent Test**: Can be fully tested by a single player creating a room and verifying they see the lobby with correct room code and their name in the participant list.

**Acceptance Scenarios**:

1. **Given** a player on the home screen, **When** they navigate to Create Room, enter a display name, and submit, **Then** a new room is created, they are assigned as the host, and they land on the lobby page showing the room code, their name as a participant, and a "host" indicator.
2. **Given** a player who just created a room and is on the lobby page, **When** they view the screen, **Then** the room code is prominently displayed so they can share it with others.
3. **Given** a player on the Create Room page, **When** they submit with an empty or whitespace-only display name, **Then** they see a validation error and the room is not created.

---

### User Story 2 - Join a Room and See Lobby (Priority: P1)

A player who received a room code from a friend wants to join the game. They enter their display name and the room code, join the room, and are placed in the lobby alongside the host and other players.

**Why this priority**: Without the ability to join, multiplayer is impossible. This is equally foundational alongside room creation.

**Independent Test**: Can be fully tested by creating a room in one browser tab, then joining it from another tab using the room code, verifying the player appears in the lobby in both tabs.

**Acceptance Scenarios**:

1. **Given** an existing room with room code "ABCD", **When** a player enters "ABCD" and a display name and submits, **Then** they join the room and land on the lobby page showing all participants including the host.
2. **Given** a player on the Join Room page, **When** they submit with an empty room code or empty display name, **Then** they see a validation error.
3. **Given** a player on the Join Room page, **When** they enter a room code that does not exist, **Then** they see an error message indicating the room was not found.
4. **Given** a room that has already started playing, **When** a player attempts to join using that room's code, **Then** they see an error message that the game has already started.

---

### User Story 3 - Lobby Experience with Live Updates (Priority: P2)

Players waiting in the lobby see all joined participants update in real time. The host has the ability to start the game once enough players have joined.

**Why this priority**: The lobby is the staging area where players gather before a game. Live updates and host controls make the experience smooth and social. While polling is lower priority than core create/join, it is essential for a good user experience.

**Independent Test**: Can be fully tested by opening two browser tabs in the same room and verifying that when one player joins, the other sees them appear in the lobby within a few seconds.

**Acceptance Scenarios**:

1. **Given** a player in the lobby, **When** the lobby loads, **Then** they see a list of all current participants including their display names and who the host is.
2. **Given** a player in the lobby, **When** another player joins the room, **Then** the participant list updates within 3 seconds (via polling).
3. **Given** a player in the lobby, **When** another player leaves the room, **Then** the participant list updates within 3 seconds.
4. **Given** the host in the lobby with at least 2 participants (including host), **When** they click "Start Game", **Then** the room status changes, and all participants see the game begin.
5. **Given** the host in the lobby with only 1 participant, **When** they attempt to click "Start Game", **Then** they see a message that at least 2 players are needed.

---

### User Story 4 - Leave a Room (Priority: P3)

A player who no longer wants to wait or accidentally joined the wrong room can leave.

**Why this priority**: Leaving a room is a basic courtesy feature. It is lower priority because it doesn't block the core game flow.

**Independent Test**: Can be tested by having a player join a room, then leave it, and verifying the other participants see them removed from the lobby.

**Acceptance Scenarios**:

1. **Given** a player in the lobby, **When** they click "Leave Room", **Then** they are returned to the home screen and the room no longer shows them as a participant.
2. **Given** the host leaves the room, **When** the room still has other participants, **Then** host status passes to the next participant who joined earliest.

---

### Edge Cases

- What happens when all players leave a room? The room should be cleaned up and made unavailable for new joins.
- What happens when a player enters a display name that matches another player's name in the same room? Duplicate names should be allowed since participants are identified internally by unique IDs.
- What happens when a room code is entered in lowercase? The system should accept codes case-insensitively.
- What happens when the maximum number of players (8) is reached? The room should reject new join attempts with a "room full" message.
- What happens if a player navigates directly to the lobby URL without creating or joining a room? The system should redirect them to the home screen.
- Who can start the game and when? - Only Host can start the game after atleast 2 participants are present
- What happens if the randomly generated room code collides with an existing room? The system should silently retry with a new code until a unique one is found.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow players to create a new room by providing a display name, and return a unique room code. If the randomly generated code collides with an existing room, the system must silently retry with a new code until a unique one is found.
- **FR-002**: System MUST designate the first participant (room creator) as the host.
- **FR-003**: System MUST allow players to join an existing room by providing a room code and display name.
- **FR-004**: System MUST reject join attempts with empty or whitespace-only display names.
- **FR-005**: System MUST reject join attempts with non-existent room codes with a clear error.
- **FR-006**: System MUST reject join attempts for rooms with a status other than "lobby" (e.g., already playing).
- **FR-007**: System MUST reject join attempts when the room has reached maximum capacity (8 participants).
- **FR-008**: System MUST display all participants in the lobby, showing each participant's display name and identifying the host.
- **FR-009**: System MUST provide automatic lobby state updates (polling ~2s) so participants see changes without manual refresh.
- **FR-010**: System MUST allow the host to start the game only when at least 2 participants are in the room. Starting the game transitions the room status from "lobby" to "playing", assigns one participant as drawer, and selects a secret word.
- **FR-015**: System MUST assign one participant as drawer and the remaining participants as guessers when the game starts.
- **FR-016**: System MUST select a secret word from the word list when the game starts; the word must be visible only to the assigned drawer.
- **FR-011**: System MUST allow any participant to leave the room they are in.
- **FR-012**: System MUST transfer host status to the earliest-joined remaining participant when the host leaves.
- **FR-013**: System MUST clean up rooms that have zero participants.
- **FR-014**: System MUST accept room codes case-insensitively.

### Key Entities

- **Room**: A game session identified by a unique 4-character alphanumeric code. Has a status (lobby, playing, finished), a host participant, a list of participants, and timestamps for creation and last update. Status transitions from "lobby" to "playing" when the host starts the game.
- **Participant**: A player in a room, identified by a unique participant ID (assigned at join time) and a display name (provided by the player). Has a joined-at timestamp and a role (drawer or guesser) assigned when the game starts. The first participant in a room is designated the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see the lobby within 2 seconds of submitting the form.
- **SC-002**: A player can join a room using a valid room code and see the lobby within 2 seconds of submitting the form.
- **SC-003**: Invalid room codes and empty display names produce clear error messages.
- **SC-004**: Lobby participant list updates within 3 seconds of another player joining or leaving (via polling).
- **SC-005**: The host sees the "Start Game" control; non-host participants do not.
- **SC-006**: The host cannot start the game with fewer than 2 participants.
- **SC-007**: All participants in the room transition from lobby to game within 3 seconds of the host starting the game.
- **SC-008**: Rooms with zero participants are removed and cannot be joined again.

## Assumptions

- Maximum of 8 participants per room (reasonable default for a drawing game).
- Polling interval of approximately 2 seconds for lobby state updates.
- Display names are chosen freely by players (no authentication, no uniqueness requirement).
- Room codes are 4 uppercase alphanumeric characters, accepted case-insensitively.
- Participants are identified internally by unique IDs, not by display name.
- When the host leaves, the next-joined participant (by join order) becomes host.
- Leaving a room is a voluntary action; no automatic disconnect detection for v1.
