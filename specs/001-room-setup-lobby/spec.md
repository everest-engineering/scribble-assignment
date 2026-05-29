# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Feature Group 1 - Room Setup and Lobby. Given a player wants to host or join a drawing game, when they create or join a room via a unique code, then the creator becomes the host, invalid room codes are rejected with clear feedback, rooms remain isolated, lobby refreshes automatically every 2 seconds, only the host can start the game, and start game requires at least 2 players. Generate user stories, acceptance criteria, edge cases, and success metrics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room as Host (Priority: P1)

A player can create a new drawing game room and receive a unique room code that other players can use to join. The room creator is clearly identified as the host in the lobby.

**Why this priority**: Room creation is the entry point for every hosted game session and establishes who can control game start.

**Independent Test**: A player creates a room, lands in the lobby, sees a unique room code, appears in the player list, and is marked as host.

**Acceptance Scenarios**:

1. **Given** no existing room for the player, **When** the player creates a room, **Then** a new room is created with a unique code and the player is assigned as host.
2. **Given** a player has created a room, **When** they view the lobby, **Then** the room code, current player list, host indicator, and start-game availability are visible.

---

### User Story 2 - Join a Room by Code (Priority: P2)

A player can join an existing drawing game room by entering the room's unique code. Invalid codes are rejected with clear feedback and do not place the player into any room.

**Why this priority**: Joining by code is required for multiplayer participation and must be reliable enough for players to gather before a game starts.

**Independent Test**: One player creates a room and another player joins using the displayed code; a second attempt with an invalid code shows an error without changing either lobby.

**Acceptance Scenarios**:

1. **Given** an active lobby and its room code, **When** another player enters that code, **Then** the player joins the matching room and appears only in that room's lobby.
2. **Given** a missing, malformed, expired, or nonexistent room code, **When** a player attempts to join, **Then** the join is rejected with clear feedback and no room state changes.
3. **Given** two active rooms, **When** a player joins one room by code, **Then** players and lobby state from the other room remain hidden and unaffected.

---

### User Story 3 - Start the Game from Lobby (Priority: P3)

The host can start the game from the lobby once enough players have joined. Non-host players cannot start the game, and the host is prevented from starting until at least 2 players are present.

**Why this priority**: Starting rules protect the game flow from accidental or unauthorized starts and ensure a playable multiplayer session.

**Independent Test**: A host and a non-host interact with the same lobby and verify that only the host can start, and only after the lobby has at least 2 players.

**Acceptance Scenarios**:

1. **Given** a lobby with only the host, **When** the host attempts to start the game, **Then** the game does not start and the host sees clear feedback that at least 2 players are required.
2. **Given** a lobby with at least 2 players, **When** the host starts the game, **Then** the room transitions out of lobby state for all players in that room.
3. **Given** a non-host player in a lobby, **When** they attempt to start the game, **Then** the game does not start and the player receives clear feedback that only the host can start.

---

### User Story 4 - See Lobby Updates Automatically (Priority: P4)

Players in the same lobby see membership and start-readiness changes automatically without manually refreshing the page.

**Why this priority**: Automatic lobby freshness helps players understand when everyone has joined and when the game can begin.

**Independent Test**: Two players are in the same lobby; when one joins, leaves, or the start eligibility changes, the other sees the update within the expected refresh window.

**Acceptance Scenarios**:

1. **Given** a player is waiting in a lobby, **When** another player joins the same room, **Then** the waiting player's lobby reflects the new player within 2 seconds.
2. **Given** a lobby changes from fewer than 2 players to at least 2 players, **When** the next refresh occurs, **Then** host start eligibility is updated for all players in the lobby.
3. **Given** multiple rooms exist, **When** one room's lobby changes, **Then** only players in that room see the update.

---

### Edge Cases

- A player enters an empty room code.
- A player enters a malformed or nonexistent room code.
- A player enters a valid-looking room code with extra spaces or different letter casing.
- Two players attempt to create rooms at nearly the same time and must receive distinct room codes.
- A player tries to join a room that is no longer joinable.
- A player attempts to start a game from a room they are not in.
- A non-host attempts to start the game.
- The host attempts to start with only 1 player in the room.
- The host leaves the lobby before the game starts.
- A lobby refresh occurs while a player is joining, leaving, or the room is transitioning to game state.
- Multiple rooms are active at the same time and must not expose or mutate one another's players, host status, or start state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room for a drawing game.
- **FR-002**: System MUST generate a room code that uniquely identifies exactly one active room.
- **FR-003**: System MUST assign the room creator as the host immediately after room creation.
- **FR-004**: System MUST allow a player to join an active lobby by entering its room code.
- **FR-005**: System MUST reject empty, malformed, expired, nonexistent, or otherwise not joinable room codes with clear feedback.
- **FR-006**: System MUST prevent a failed join attempt from adding the player to any room or changing any room state.
- **FR-007**: System MUST keep each room's player list, host status, lobby status, and game-start state isolated from every other room.
- **FR-008**: System MUST show lobby participants the current room code, player list, host indicator, and whether the game can be started.
- **FR-009**: System MUST refresh visible lobby state automatically every 2 seconds while a player remains in the lobby.
- **FR-010**: System MUST allow only the host of a room to start the game.
- **FR-011**: System MUST reject non-host start attempts with clear feedback and no game-state change.
- **FR-012**: System MUST require at least 2 players in a room before allowing the host to start the game.
- **FR-013**: System MUST reject host start attempts with fewer than 2 players using clear feedback and no game-state change.
- **FR-014**: System MUST transition only the host's room out of lobby state when the host starts a game successfully.
- **FR-015**: System MUST validate room codes, player presence, host status, and minimum player count before changing room or game state.

### Key Entities

- **Room**: A single drawing game session identified by a unique code. Tracks lobby status, players, host, and whether the game can start.
- **Player**: A participant in one room. Has a visible identity within the lobby and may be the room host.
- **Host**: The player who created the room, or the player who inherits host control if the original host leaves before the game starts.
- **Lobby**: The pre-game waiting area for a room where players gather, see membership changes, and wait for the host to start the game.

### Traceability & Scope

- **Source Scenario(s)**: Feature Group 1 - Room Setup and Lobby; User Story 1 through User Story 4 in this specification.
- **In Scope**: Creating rooms, joining rooms by code, invalid-code feedback, room isolation, lobby participant display, automatic lobby refresh every 2 seconds, host-only game start, and the 2-player start requirement.
- **Out of Scope**: Drawing canvas gameplay, scoring, word selection, authentication, persistent room history, chat, spectator mode, matchmaking, unrelated refactors, and behavior outside room setup and lobby readiness.
- **Polling Behavior**: Lobby-visible state refreshes every 2 seconds while players remain in the lobby. Players should see membership and start-readiness changes by the next refresh, and refreshes must stop once the player leaves the lobby or the room transitions to game state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create a room and share its room code in under 30 seconds.
- **SC-002**: A second player can join a hosted room by code in under 30 seconds after receiving the code.
- **SC-003**: 100% of invalid room-code attempts show clear feedback and do not change any room's player list.
- **SC-004**: Lobby membership and start-readiness changes are visible to players in the same room within 2 seconds.
- **SC-005**: Players in separate rooms never see each other's player lists, host status, or game-start changes during validation testing.
- **SC-006**: 100% of non-host start attempts are rejected without starting the game.
- **SC-007**: 100% of host start attempts with fewer than 2 players are rejected with clear feedback.
- **SC-008**: In a lobby with at least 2 players, the host can start the game successfully on the first attempt.

## Assumptions

- Players have a visible display name or equivalent lobby identity before creating or joining a room.
- Room codes are normalized for player entry by trimming extra spaces and ignoring letter casing where applicable.
- A room is considered joinable while it is still in lobby state.
- If the host leaves before the game starts, host control transfers to the longest-waiting remaining player; if no players remain, the room can be removed from active lobbies.
- This feature covers the lobby phase only and hands off to a separate game-play feature once a room starts.
