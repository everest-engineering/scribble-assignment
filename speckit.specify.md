# Feature Specification: Room Setup, Lobby, & Game Start

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Scenario 1 & 2"

## User Scenarios & Testing

### User Story 1 - Create Room and Host Assignment (Priority: P1)
As a player, I want to create a room so that I can host a drawing game.

**Why this priority**: Core entry point of the game. Without creating a room, multiplayer cannot start.

**Independent Test**: Create a room from the landing page. Verify that the player is successfully redirected to `/lobby`, a unique code is generated, and the player is marked as the host.

**Acceptance Scenarios**:
1. **Given** the player is on the Start screen, **When** they enter a name and click "Create Room", **Then** a new room is created with a unique 4-character code, the player is added as a participant, and they are designated as the host.

---

### User Story 2 - Join Room and Validation (Priority: P1)
As a player, I want to join an existing room via a unique code, with validation to reject invalid or empty codes.

**Why this priority**: Crucial for connecting players. Validation prevents entering non-existent or empty rooms.

**Independent Test**: Try to join with a non-existent or empty code. Verify a clear error message is shown. Then try to join with a valid code.

**Acceptance Scenarios**:
1. **Given** the player is on the Join Room screen, **When** they leave the room code empty and click "Join Lobby", **Then** the UI shows a clear error message "Room code is required".
2. **Given** the player is on the Join Room screen, **When** they enter a code of invalid format (e.g. not 4 characters), **Then** the request is rejected with feedback "Invalid room code format".
3. **Given** a room code does not exist in backend memory, **When** a player tries to join, **Then** they see a "Room not found" error.

---

### User Story 3 - Lobby Sync via Polling (Priority: P1)
As a participant in a lobby, I want the list of participants to update automatically.

**Why this priority**: Without polling, players would have to manually refresh to see other players join.

**Independent Test**: Open two browser tabs. Let Tab A create a room and join. Let Tab B join the room. Tab A should automatically update the participant list within 2 seconds.

**Acceptance Scenarios**:
1. **Given** a player is waiting in the Lobby screen, **When** another player joins the same room code, **Then** the first player's lobby participant list automatically updates within ~2 seconds without manual refresh.

---

### User Story 4 - Host-Only Start Game Permissions (Priority: P2)
As a host, I want to be the only person who can start the game, and only when there are at least 2 players in the room.

**Why this priority**: Prevents non-hosts or single-player starts from breaking game rules.

**Independent Test**: Open two tabs. In the host tab (Tab A), the "Start Game" button should be disabled until Tab B joins. In Tab B (non-host), the "Start Game" button should not be clickable or visible.

**Acceptance Scenarios**:
1. **Given** the host is in the lobby alone, **When** looking at the "Start Game" button, **Then** the button is disabled.
2. **Given** the host is in the lobby with another player, **When** the player count is >= 2, **Then** the "Start Game" button is enabled.
3. **Given** a non-host player is in the lobby, **When** looking at the Lobby page, **Then** they cannot start the game (button is disabled or hidden, showing "Waiting for host to start").

---

### User Story 5 - Game Start and Drawer Assignment (Priority: P1)
As a player in a lobby, I want the game to start and roles to be assigned so that gameplay can begin.

**Why this priority**: Core game start transition. Without it, gameplay cannot be entered.

**Independent Test**: The host clicks "Start Game". Verify both Host and other players are automatically routed to `/game`. Verify the Host is assigned as the Drawer.

**Acceptance Scenarios**:
1. **Given** a lobby has at least 2 players, **When** the host clicks "Start Game", **Then** the room status transitions to `"game"`, the host is assigned as the `drawer`, and a secret word is selected.
2. **Given** a player is polling the lobby status, **When** the room status updates to `"game"`, **Then** the client automatically navigates the player to the `/game` screen.

---

### User Story 6 - Role-Based Secret Word Visibility (Priority: P1)
As the designated drawer, I want to see the secret word so that I know what to draw, and I want to ensure guessers cannot see it.

**Why this priority**: Crucial game rule. If guessers see the secret word via API or UI, the game is compromised.

**Independent Test**: Start a game. Inspect the API response on the Guessing player's browser. Verify that `secretWord` is null/empty in their response and not displayed in their UI. Verify the Drawer sees the word in the UI.

**Acceptance Scenarios**:
1. **Given** the game has started and a player is assigned the `drawer` role, **When** they view their game screen, **Then** the secret word is displayed.
2. **Given** the game has started and a player is assigned the `guesser` role, **When** they view their game screen, **Then** they see "You are a Guesser" and the secret word is hidden.

### Edge Cases
- **Room Isolation:** Players in Room A must not see or sync state with Room B.
- **Lowercase Code Input:** The room code is case-insensitive. Entering `abcd` should resolve to `ABCD`.
- **Extra Whitespace:** Room codes and names should have leading/trailing whitespaces trimmed.
- **Securing Secret Word:** Under the hood, the backend MUST filter out the `secretWord` field from the API response unless the request matches the drawer's `participantId`.

## Requirements

### Functional Requirements
- **FR-001**: The backend MUST store a `hostId` for each created room, mapping it to the creator's participant ID.
- **FR-002**: The backend API `GET /rooms/:code` MUST return the `hostId` as part of the room snapshot payload.
- **FR-003**: The backend MUST validate room codes on `POST /rooms/:code/join` and `GET /rooms/:code` to ensure they are 4-character alphanumeric strings.
- **FR-004**: The frontend MUST run a repeating interval timer (~2s cadence) on the `/lobby` route to fetch the latest room snapshot.
- **FR-005**: The frontend MUST disable/hide the "Start Game" button for any participant whose `participantId` does not match the room's `hostId`.
- **FR-006**: The frontend/backend MUST enforce that starting the game requires `participants.length >= 2`.
- **FR-007**: The backend MUST expose a `POST /rooms/:code/start` route to start the game.
- **FR-008**: The backend MUST transition the room status to `"game"`, assign `drawerId` to the host's participant ID, and choose a deterministic secret word when game starts.
- **FR-009**: The backend MUST mask/omit the `secretWord` in the returned room snapshot unless `viewerParticipantId` is the `drawerId`.
- **FR-010**: The frontend MUST poll the room status while on `/game` and automatically redirect to `/lobby` if status transitions back to lobby.

## Success Criteria

### Measurable Outcomes
- **SC-001**: 100% of room creations assign the creator's ID as the `hostId`.
- **SC-002**: Automatic lobby refreshes occur within 2000ms ± 200ms of any participant joining.
- **SC-003**: A non-host participant is programmatically blocked from triggering the start game endpoint or navigating past lobby unilaterally.
- **SC-004**: Entering a blank room code returns immediate validation feedback.
- **SC-005**: The secret word is 100% hidden from the network responses returned to guessing players.
- **SC-006**: Transition from lobby to game screen happens automatically for all players within 2 seconds of the host starting the game.

## Assumptions
- **Host Persistence:** Once a host is assigned, they remain the host for the duration of that lobby session.
- **In-Memory Store:** The server retains the lobby state in memory; any server restart resets all active rooms.
- **Deterministic Word Choice:** Choosing words deterministically via a hash of the room code guarantees that multiple players in the room agree on the word without storing random state changes.
