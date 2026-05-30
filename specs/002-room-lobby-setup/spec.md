# Feature Specification: Room Setup & Lobby

**Feature Branch**: `002-room-lobby-setup`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Room Setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-05-30

- Q: How should the system handle duplicate display names in the same room? → A: Allow duplicates but auto-append a discriminator (e.g., "Alice" and "Alice (2)") in the participant list.
- Q: When should rooms without enough players be expired and cleaned up? → A: No expiration — rooms persist until the host explicitly leaves or the server restarts.
- Q: Should there be rate limits on room creation and join attempts? → A: Soft limits — max 5 room creates per minute and 10 join attempts per minute per session, with error feedback.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room and manages the lobby (Priority: P1)

As a player, I want to create a new room, be designated as the host, and see the lobby with my name in the participant list so that others can join my game.

**Why this priority**: Multiplayer gameplay starts with a host creating a room. Without this, no game can begin.

**Independent Test**: Can be tested by opening the application, entering a name, clicking "Create Room", and verifying the lobby shows the player as both a participant and the host.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen, **When** they enter a display name and click "Create Room", **Then** a new room is created with a unique code and the player is taken to the lobby as the designated host.
2. **Given** a player is on the home screen, **When** they click "Create Room" with a blank or whitespace-only name, **Then** they see an inline validation error and are not taken to the lobby.
3. **Given** a host is in the lobby with at least 2 participants, **When** they click "Start Game", **Then** the game begins and all participants are notified.
4. **Given** a host is in the lobby with only 1 participant (themselves), **When** they look for the option to start, **Then** the start button is disabled or hidden with a message indicating more players are needed.

---

### User Story 2 - Player joins a room via code (Priority: P1)

As a player, I want to join an existing room by entering a valid code so that I can participate in the game with the host and other players.

**Why this priority**: Joining is the other half of the multiplayer flow. Both create and join must work for any game session to happen.

**Independent Test**: Can be tested by opening two browser tabs, creating a room in one tab, then joining the same room code in the second tab and verifying both players appear in the participant list.

**Acceptance Scenarios**:

1. **Given** a room exists with a valid code, **When** a second player enters that code and their name and clicks "Join Room", **Then** they are taken to the lobby and see all current participants.
2. **Given** a player is on the Join Room screen, **When** they submit with a blank room code or a blank name, **Then** they see inline validation errors and are not taken to the lobby.
3. **Given** a player is on the Join Room screen, **When** they submit a code that does not match any active room, **Then** they see a clear error message indicating the code is invalid and are not taken to the lobby.
4. **Given** a player is on the Join Room screen, **When** they submit a code for a room that is already in-game (not in lobby state), **Then** they see a clear error message that the room is no longer accepting new players.

---

### User Story 3 - Lobby refreshes with participant updates (Priority: P2)

As a player waiting in the lobby, I want the participant list to refresh automatically so that I can see when new players join without manually reloading.

**Why this priority**: A seamless lobby experience reduces friction and makes the game feel responsive. Without automatic refresh, players would need to manually reload to see new joiners.

**Independent Test**: Can be tested by opening two browser tabs on the same room, joining the second player, and verifying the first player's lobby automatically shows the second player within 3 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby with one participant, **When** another player joins, **Then** the first player's participant list updates to show the new player within 3 seconds.
2. **Given** a player is viewing the lobby, **When** the lobby refresh request fails (network error, server unavailable), **Then** the player sees a non-intrusive error indicator and the lobby continues to poll on the next interval.
3. **Given** a player is viewing the lobby with 5 participants, **When** one participant disconnects, **Then** that participant is removed from the list within 3 seconds.

---

### User Story 4 - Room isolation prevents cross-room interference (Priority: P3)

As a player in a room, I want my room's data (participant list, host, game state) to be completely separate from other rooms so that activities in other rooms do not affect my experience.

**Why this priority**: Room isolation is critical for correctness but does not block basic create/join flows. It ensures the system can support multiple concurrent game sessions without data leakage.

**Independent Test**: Can be tested by creating two rooms in separate browser sessions, verifying that joining one room does not affect participants in the other, and that starting a game in one room does not affect the other.

**Acceptance Scenarios**:

1. **Given** two separate rooms (Room A and Room B) exist, **When** a player joins Room A, **Then** Room B's participant list is unaffected.
2. **Given** the host of Room A starts the game, **When** a player in Room B views their lobby, **Then** Room B's state is unchanged.

---

### Edge Cases

- What happens when a player tries to create a room when the server is unavailable?
- What happens when a player enters a room code that contains special characters or is malformed?
- What happens when the host's connection drops while in the lobby?
- What happens if the maximum number of concurrent rooms is reached?
- What happens when a player who is not the host tries to start the game?
- What happens when a player joins with the same display name as an existing participant?
- What happens when a player exceeds the rate limit for room creation or join attempts?
- What happens when the lobby polling detects the host has disconnected?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room with a unique code and automatically designate them as the host.
- **FR-002**: The system MUST assign each room a unique code that is used to identify and join that room.
- **FR-003**: Players MUST be able to join an existing room by providing the room's unique code and a display name.
- **FR-004**: The system MUST reject room joining with a blank or whitespace-only room code, displaying a clear inline error message.
- **FR-005**: The system MUST reject room joining with a blank or whitespace-only display name, displaying a clear inline error message.
- **FR-006**: The system MUST reject room joining with a non-existent or expired room code, displaying a clear error message.
- **FR-007**: After creating or joining a room, the player MUST be taken to the lobby view showing the current participant list.
- **FR-008**: The lobby MUST display the room code so that the host can share it with other players.
- **FR-009**: The lobby MUST refresh its participant list automatically via polling at approximately 2-second intervals.
- **FR-010**: The lobby MUST continue polling on a regular interval even after a transient network failure.
- **FR-011**: Only the host MUST be able to start the game from the lobby. Non-host participants MUST NOT see a start game control.
- **FR-012**: The host MUST only be able to start the game when at least 2 players (including the host) are present in the room.
- **FR-013**: Each room's data (participants, host, game state) MUST be fully isolated from other rooms — operations in one room MUST NOT affect any other room.
- **FR-014**: When the host starts the game, all participants currently in the lobby MUST be notified and transitioned to the game view.
- **FR-015**: If a player joins a room with a display name that matches an existing participant, the system MUST auto-append a numeric discriminator (e.g., "Alice (2)") to distinguish them in the participant list.
- **FR-016**: The system MUST enforce rate limits of maximum 5 room creation requests per minute per session, displaying a clear error message when exceeded.
- **FR-017**: The system MUST enforce rate limits of maximum 10 room join attempts per minute per session, displaying a clear error message when exceeded.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique alphanumeric code. Contains a list of participants, a designated host, and current game state (lobby, in-progress, finished).
- **Player**: A participant in a room, identified by a server-assigned unique ID and a display name provided at join time. If the display name duplicates another player's name, a numeric discriminator is appended. Has a boolean flag indicating whether they are the host.
- **Room Snapshot**: A read-only view of a room's current state sent to clients, containing the room code, participant list (with host designation), and game status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see themselves in the lobby as host within 3 seconds of clicking "Create Room".
- **SC-002**: A player can join an existing room by entering a valid code and see the full participant list within 3 seconds of clicking "Join Room".
- **SC-003**: When a new player joins a room, all existing lobby participants see the updated participant list within 3 seconds (2 polling intervals maximum).
- **SC-004**: Error messages for invalid/empty codes or names appear within 1 second of form submission.
- **SC-005**: Only the host can trigger the game start — non-host players have no visible start control.
- **SC-006**: The game starts only when at least 2 players are in the room, enforced both in the UI and on the server.
- **SC-007**: Operations in separate rooms never interfere with each other — creating, joining, or starting in one room produces no side effects in another.

## Assumptions

- Room codes are 4-6 character alphanumeric strings generated by the server and shared between players out of band.
- The maximum number of players per room is 8, after which the room is considered full and additional join attempts are rejected.
- If the host disconnects while in the lobby, the room remains active and the host designation transfers to the next participant who has been in the room longest, or the room is disbanded if no other players remain.
- Rooms are not auto-expired due to inactivity — they persist until the host explicitly leaves/disbands the room or the server restarts (resulting in loss of in-memory data).
- Players use modern web browsers with JavaScript enabled.
- The polling interval of 2 seconds is approximate — actual intervals may vary slightly due to network latency and request processing time.
- All participants remain in the lobby until the host starts the game — there is no concept of leaving the lobby mid-session for this feature scope.
