# Feature Specification: Room Creation and Join

**Feature Branch**: `001-create-join-room`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room and Become Host (Priority: P1)

A player opens the application, enters their name, creates a new room, and is automatically designated as the host. They are taken to a lobby where they can see themselves listed as the host.

**Why this priority**: Creating a room is the entry point for hosting a game. Without this, no game session can begin.

**Independent Test**: Can be fully tested by a single player creating a room and observing they are marked as the host in the lobby.

**Acceptance Scenarios**:

1. **Given** the player is on the home screen, **When** they enter a valid name and choose to create a room, **Then** a unique room code is generated and they become the host.
2. **Given** the player enters a name containing only whitespace, **When** they attempt to create a room, **Then** the system rejects the request with a clear error message.

---

### User Story 2 - Join a Room via Unique Code (Priority: P2)

A player opens the application, enters their name and an existing room code, and joins the room. They appear in the room's lobby alongside other players.

**Why this priority**: Joining is the complementary entry point for non-host players and enables multiplayer sessions.

**Independent Test**: Can be fully tested by creating a room in one browser tab and joining it from another using the room code.

**Acceptance Scenarios**:

1. **Given** a room exists with a valid code, **When** a player enters their name and the correct code, **Then** they are added to the room's lobby.
2. **Given** a player enters an invalid, empty, or non-existent room code, **When** they attempt to join, **Then** the system rejects the request with a clear error message.
3. **Given** a player enters a name containing only whitespace, **When** they attempt to join a room, **Then** the system rejects the request with a clear error message.

---

### User Story 3 - Host Starts the Game (Priority: P2)

Once at least two players are present in the lobby, the host can start the game. Non-host players cannot start the game.

**Why this priority**: Starting the game transitions players from the lobby into gameplay, which is the core purpose of the application.

**Independent Test**: Can be tested by having two players in a lobby and verifying only the host sees and can trigger the start action.

**Acceptance Scenarios**:

1. **Given** a room has two or more players, **When** the host clicks to start the game, **Then** the game begins and all players are transitioned to the game screen.
2. **Given** a room has fewer than two players, **When** the host attempts to start the game, **Then** the action is blocked with a clear message that at least two players are required.
3. **Given** a room has two or more players, **When** a non-host player attempts to start the game, **Then** the action is rejected.

---

### User Story 4 - Lobby Auto-Refresh (Priority: P3)

While in the lobby, the player list automatically updates approximately every 2 seconds via HTTP polling so that new joiners appear without manual refreshes.

**Why this priority**: Polling improves the user experience by keeping the lobby state current, but manual refresh is a viable fallback.

**Independent Test**: Can be tested by joining a room from a second tab and observing the first tab's lobby update within a few seconds.

**Acceptance Scenarios**:

1. **Given** a player is in a room lobby, **When** another player joins the room, **Then** the new player appears in the lobby list within approximately 2 seconds.
2. **Given** a player is in a room lobby, **When** they remain idle, **Then** the lobby state continues to refresh automatically without requiring a page reload.

---

### Edge Cases

- What happens when a player tries to join a room that does not exist? → Rejected with clear feedback.
- What happens when the host leaves before starting? → Host transfers automatically to the next player who joined (FIFO); room stays open.
- How does the system handle duplicate player names in the same room? → Allowed; names need only be meaningful within a room.
- What happens if a player refreshes their browser while in the lobby? → Treated as a new session; no reconnection or state persistence.
- What happens when two players attempt to create rooms simultaneously? → Each receives a unique room code; no collision.

## Clarifications *(post-workshop)*

| # | Topic | Clarification |
|---|-------|---------------|
| 1 | Host leaves before game starts | Host transfers automatically to the next player who joined (FIFO); room stays open. |
| 2 | Empty / idle room cleanup | Rooms with 0 players are deleted immediately. Rooms with players but idle (no game start, no new joins) for 10 minutes are also removed. |
| 3 | Joining a room after game starts | New joiners are rejected with a clear message that the game is already in progress. |
| 4 | Host verification mechanism | Server returns a unique opaque `playerId` on join/create; the client includes it in all subsequent requests to prove identity. |
| 5 | Polling failure behavior | On a failed poll, the client silently retries at the same ~2-second interval with no visible error UI. |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a room by providing a non-empty, non-whitespace player name.
- **FR-002**: System MUST generate a unique room code for every created room.
- **FR-003**: System MUST automatically designate the room creator as the host.
- **FR-004**: System MUST allow a player to join an existing room by providing a non-empty player name and a valid room code.
- **FR-005**: System MUST reject empty or whitespace-only player names with a clear, user-facing error message.
- **FR-006**: System MUST reject invalid, empty, or non-existent room codes with a clear, user-facing error message.
- **FR-007**: System MUST keep rooms fully isolated; players in one room cannot observe or interact with another room.
- **FR-008**: System MUST refresh the lobby state automatically approximately every 2 seconds using HTTP polling.
- **FR-009**: Only the host MUST be able to start the game.
- **FR-010**: System MUST prevent starting the game when fewer than 2 players are present and display a clear message.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a game session. Key attributes: unique code, host player reference, list of players, current state (lobby or playing).
- **Player**: Represents a participant. Key attributes: name, host flag indicating whether they are the room's host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby in under 2 seconds.
- **SC-002**: The lobby player list reflects a new joiner within 3 seconds.
- **SC-003**: 100% of invalid or non-existent room code attempts receive a clear error message.
- **SC-004**: 100% of empty or whitespace-only name attempts receive a clear error message.
- **SC-005**: The game start control is visible only to the host and is disabled or hidden when fewer than 2 players are present.

## Assumptions

- Room codes are exactly 4 uppercase alphanumeric characters that are easy to share and type.
- Player names do not need to be globally unique; uniqueness within a room is not enforced.
- There is no reconnection or session persistence across browser refreshes; a refresh is treated as a new session.
- Only one round is implemented per game, with no drawer rotation, timers, or multiple rounds.
- The word list is fixed: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.

## Fixes Applied

- **API Base URL Typo**: The default `API_BASE_URL` in `frontend/src/services/api.ts` contained an erroneous `/bug` suffix (`http://localhost:3001/bug`), causing all API requests to return 404 "Route not found". Corrected to `http://localhost:3001`.
