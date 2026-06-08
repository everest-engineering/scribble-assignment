# Feature Specification: Room & Lobby Management

**Feature Branch**: `001-room-lobby-management`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-07

- Q: How should the system detect that a player has left the lobby? → A: Heartbeat timeout — each poll refreshes the player's "last seen" time; a player not seen for ~10 seconds is treated as departed.
- Q: When the host leaves before starting the game, what should happen? → A: Close the room immediately; remaining players are ejected back to the entry screen.
- Q: What format should room codes use? → A: 4-character uppercase alphanumeric (e.g., "K7P2").
- Q: What is the maximum number of players per room? → A: 8 players.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room (Priority: P1)

A player wants to start a drawing game with friends. They choose to create a room, are given a unique room code to share, and are automatically designated as the host who controls when the game begins.

**Why this priority**: Without the ability to create a room, no game can exist. This is the foundational entry point and the minimum viable slice — a host can create a room and obtain a shareable code even before anyone joins.

**Independent Test**: Can be fully tested by having one player create a room, confirming a unique code is generated and displayed, and confirming that player is shown as the host in the lobby.

**Acceptance Scenarios**:

1. **Given** a player on the entry screen, **When** they choose to create a room, **Then** a new room is created with a unique code and the player is placed in the lobby as the host.
2. **Given** a newly created room with only the host present, **When** the host views the lobby, **Then** the host sees their own name listed and an indication that they are the host.
3. **Given** a newly created room, **When** the host attempts to start the game with fewer than 2 players present, **Then** the start action is unavailable or rejected with a message that at least 2 players are required.

---

### User Story 2 - Player joins a room via code (Priority: P1)

A player who has received a room code from a friend enters that code to join the existing room and appear in its lobby alongside the other players.

**Why this priority**: Joining is the other half of the core multiplayer loop. A room with a host is not useful until other players can join it. Together with Story 1, this delivers a functional shared lobby.

**Independent Test**: Can be tested by creating a room with one player, then having a second player enter the valid code and confirming they appear in the same lobby with both players visible.

**Acceptance Scenarios**:

1. **Given** an existing room with a valid code, **When** a player enters that exact code, **Then** they are added to the room's lobby and can see all current players.
2. **Given** a player has joined a room, **When** the host's lobby refreshes, **Then** the host sees the newly joined player appear in the player list.
3. **Given** a joining player, **When** they enter the lobby, **Then** they are shown as a regular player (not the host) and do not have access to host-only controls.

---

### User Story 3 - Code validation and clear feedback (Priority: P2)

A player attempting to join enters a code that is empty, malformed, or does not correspond to any active room. The system rejects the attempt and clearly explains why so the player can correct it.

**Why this priority**: Essential for usability and preventing confusion, but the core create/join flow (P1) can be demonstrated before exhaustive error handling is polished.

**Independent Test**: Can be tested by attempting to join with an empty field, a wrong code, and a non-existent code, and confirming a distinct, clear message is shown for each without joining any room.

**Acceptance Scenarios**:

1. **Given** the join screen, **When** a player submits an empty code, **Then** they are not joined and are shown a message indicating a code is required.
2. **Given** the join screen, **When** a player submits a code that does not match any active room, **Then** they are not joined and are shown a message indicating the room was not found.
3. **Given** a rejected join attempt, **When** the player corrects the code to a valid one and resubmits, **Then** they are successfully joined to the room.

---

### User Story 4 - Room isolation (Priority: P2)

Multiple rooms run simultaneously without interfering with one another. Players in one room never see players, activity, or state from another room.

**Why this priority**: Critical for correctness in a multi-room environment, but only becomes observable once more than one room exists; the single-room flow can be validated first.

**Independent Test**: Can be tested by creating two separate rooms with different players, and confirming each lobby shows only its own players and that actions in one room have no effect on the other.

**Acceptance Scenarios**:

1. **Given** two active rooms with different codes, **When** a player views either lobby, **Then** they see only the players who joined that specific room.
2. **Given** two active rooms, **When** the host of one room starts the game, **Then** the other room's lobby and players are unaffected.
3. **Given** two active rooms, **When** a player joins one room, **Then** the player count and player list of the other room remain unchanged.

---

### User Story 5 - Lobby auto-refresh and host-controlled start (Priority: P3)

While waiting in the lobby, players see the participant list update automatically as others join or leave, and the host starts the game when ready and enough players are present.

**Why this priority**: Improves the live "waiting room" experience and gates the transition into gameplay, but builds on the create/join/isolation foundations established in earlier stories.

**Independent Test**: Can be tested by having players join and leave a lobby and confirming the displayed list updates within a few seconds without manual action, then confirming the host can start once at least 2 players are present.

**Acceptance Scenarios**:

1. **Given** a player waiting in a lobby, **When** another player joins, **Then** the waiting player's list updates to include the new player within approximately 2 seconds without a manual refresh.
2. **Given** a lobby with at least 2 players, **When** the host triggers the start action, **Then** the game begins for all players in that room.
3. **Given** a lobby with at least 2 players, **When** a non-host player looks for a start control, **Then** they have no ability to start the game.

---

### Edge Cases

- **Empty or whitespace-only code on join**: Treated as missing; rejected with a "code required" message.
- **Code casing / formatting differences**: Codes are matched case-insensitively and surrounding whitespace is ignored so a shared code works regardless of typed case.
- **Joining a room whose game has already started**: A late joiner attempting to enter an in-progress room is informed the game has already started and is not added to the lobby.
- **Player disconnects / closes tab without leaving**: Because the lobby relies on periodic polling, a player who stops polling for ~10 seconds (no "last seen" update) is treated as departed and removed from the player list.
- **Host leaves before starting**: The room is closed immediately and its code is freed; any remaining players are ejected back to the entry screen with a message that the host left.
- **Duplicate display names in the same room**: Players with identical names are disambiguated (e.g., by a suffix) so each appears as a distinct entry.
- **Room reaches capacity**: A player attempting to join a full room is rejected with a "room is full" message.
- **Code collision on creation**: The system guarantees each active room has a unique code, regenerating if a collision would occur.
- **Stale/abandoned rooms**: Rooms with no remaining players are automatically cleaned up and their codes become available for reuse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and MUST generate a unique 4-character uppercase alphanumeric code for each active room (e.g., "K7P2"), regenerating on any collision with an existing active room.
- **FR-002**: System MUST automatically designate the player who creates a room as that room's host.
- **FR-003**: System MUST display the room code to the host so it can be shared with other players.
- **FR-004**: System MUST allow a player to join an existing room by submitting its code.
- **FR-005**: System MUST reject an empty or whitespace-only code with a clear message indicating a code is required, and MUST NOT join the player to any room.
- **FR-006**: System MUST reject a code that does not match any active room with a clear "room not found" message, and MUST NOT join the player to any room.
- **FR-007**: System MUST match codes case-insensitively and ignore surrounding whitespace when joining.
- **FR-008**: System MUST keep every room fully isolated such that players, player lists, and game state of one room are never visible to or affected by another room.
- **FR-009**: System MUST display the current list of players in a room's lobby to all members of that room.
- **FR-010**: System MUST refresh each player's lobby view automatically at approximately 2-second intervals so newly joined or departed players are reflected without manual action.
- **FR-010a**: System MUST update a "last seen" timestamp for a player each time that player polls, and MUST treat a player as departed (removing them from the room's player list) when no update has occurred for approximately 10 seconds.
- **FR-011**: System MUST grant game-start control exclusively to the host and MUST prevent non-host players from starting the game.
- **FR-012**: System MUST prevent the host from starting the game until at least 2 players are present in the room.
- **FR-013**: System MUST begin the game for all players in a room when the host starts it under valid conditions.
- **FR-014**: System MUST prevent players from joining a room whose game has already started and MUST inform them the game is in progress.
- **FR-015**: System MUST close the room immediately when the current host leaves (or is detected as departed) before starting the game, eject any remaining players back to the entry screen with a message that the host left, and free the room's code for reuse.
- **FR-015a**: System MUST close and free the code of any room that has no remaining players.
- **FR-016**: System MUST enforce a maximum of 8 players per room and MUST reject joins to a full room with a clear "room is full" message.
- **FR-017**: System MUST require each joining player to be identified by a display name within the lobby, disambiguating duplicate names so each player is distinct.

### Key Entities *(include if feature involves data)*

- **Room**: A self-contained drawing-game session identified by a unique code. Tracks its members, which member is the host, its current status (waiting in lobby vs. game started), and its capacity (max 8 players).
- **Player**: A participant identified by a display name, belonging to exactly one room at a time, flagged as either host or regular player, and carrying a "last seen" timestamp used to detect departure.
- **Room Code**: The unique, shareable identifier used to locate and join a specific room; a 4-character uppercase alphanumeric string, matched case-insensitively, and freed for reuse once the room closes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and obtain a shareable code in under 5 seconds from choosing to host.
- **SC-002**: A player with a valid code can join the corresponding room and see the current player list in under 5 seconds.
- **SC-003**: 100% of empty or invalid-code join attempts are rejected with a clear, specific message and result in no room membership.
- **SC-004**: When a player joins or leaves, all other members of that room see the updated player list within approximately 2 seconds.
- **SC-005**: 100% of game-start attempts by non-host players are blocked, and 100% of host start attempts with fewer than 2 players are blocked.
- **SC-006**: Across concurrently active rooms, 0 instances occur of a player seeing another room's players or being affected by another room's actions.
- **SC-007**: At least 95% of players successfully create or join a room on their first attempt without assistance.

## Assumptions

- The game is played by people sharing a room code out-of-band (e.g., chat or voice); no in-app invitations or matchmaking are in scope.
- Each player participates from a single device/session and belongs to one room at a time.
- Room capacity is fixed at 8 players per room (clarified 2026-06-07).
- Room codes are 4-character uppercase alphanumeric strings, easy to type/share, generated to be unique among active rooms (clarified 2026-06-07).
- Player presence is tracked via a "last seen" timestamp refreshed on each poll; departures are detected by a ~10-second inactivity timeout rather than a guaranteed disconnect signal (clarified 2026-06-07).
- Lobby updates use periodic polling at roughly 2-second intervals rather than continuous real-time push; minor delays within that window are acceptable.
- Players provide a display name before entering a lobby; no persistent accounts, authentication, or profiles are required for this feature.
- Persistence of rooms is only for their active lifetime; abandoned/empty rooms are cleaned up and not retained.
- The actual drawing/gameplay that follows "start game" is out of scope for this feature, which ends at the transition into the game.
