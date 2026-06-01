# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-29

**Status**: Active

**Input**: Scenario 1 from README — Room Setup & Lobby

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player wants to host a drawing game. They access the Create Room screen, and the system automatically creates a room with a unique code, marks them as the host, and transitions them to the lobby to await other players.

**Why this priority**: Hosting is the entry point to a playable game. Without room creation, no multiplayer experience exists.

**Independent Test**: A player can create a room, receive a unique code, and land on a lobby screen showing themselves as the only participant. The UI clearly indicates their host status.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room screen, **When** they submit the form, **Then** a new room is created with a unique 4-6 character alphanumeric code, the player is marked as host, and they are transitioned to the Lobby screen.
2. **Given** a player is on the Lobby screen as host, **When** they view the participant list, **Then** they see themselves listed with a clear "Host" indicator.
3. **Given** a player has created a room, **When** they navigate away and return (simulating browser close/refresh), **Then** their room persists in memory and can be rejoined via the room code.

---

### User Story 2 - Joiner Joins an Existing Room by Code (Priority: P1)

A player wants to join a game in progress or in lobby. They enter a room code, and the system validates it, adds them to the room participant list, and transitions them to the lobby.

**Why this priority**: Join capability is equally critical as hosting for multiplayer gameplay. Both are P1 because neither is viable without the other.

**Independent Test**: A second player can join a hosted room via valid code, see themselves in the participant list alongside the host, and both players see the same list when they poll/refresh.

**Acceptance Scenarios**:

1. **Given** a player is on the Join Room screen and a valid room code exists, **When** they enter the code and submit, **Then** they are added to the room's participant list and transitioned to the Lobby screen.
2. **Given** a player enters an invalid or non-existent room code, **When** they submit, **Then** an error message is displayed explaining the code is invalid, and they remain on the Join Room screen.
3. **Given** a player enters an empty code or whitespace-only code, **When** they submit, **Then** validation rejects it with a clear error message (e.g., "Code is required").
4. **Given** two players are in the same room, **When** both fetch the room state (via lobby polling), **Then** they see an identical participant list including both names and the host indicator.

---

### User Story 3 - Lobby Polling for Real-Time Participant Updates (Priority: P1)

Once in the lobby, players need to see when new participants join without manual refresh. The frontend polls the backend every ~2 seconds to fetch the latest room state and update the participant list.

**Why this priority**: Without automatic polling, players would manually refresh to see join/leave events, creating a poor UX. This is essential for a functional multiplayer lobby.

**Independent Test**: A player in the lobby sees a new participant appear within ~3 seconds of that participant joining (accounting for polling interval variance).

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** another player joins the room, **Then** the new participant appears in the participant list within ~3 seconds (polling interval ~2s + network latency margin).
2. **Given** the Lobby screen is active, **When** the page is idle for 10+ seconds, **Then** polling continues to occur (no inactivity timeout interrupts it).
3. **Given** a player is polling and the network is temporarily unavailable, **When** the fetch fails, **Then** the UI does not crash; instead, an optional subtle indicator may appear, and polling retries on the next interval.

---

### User Story 4 - Host-Only Start Game with Minimum Player Validation (Priority: P1)

Only the host can initiate game start. Before allowing start, the system validates that at least 2 players are present (host + 1 joiner minimum). If validation fails, the host sees a clear error.

**Why this priority**: This is the gateway from lobby to active gameplay. Without this gate, single-player games or games without a host could start, breaking game assumptions. It is critical for game integrity.

**Independent Test**: The host can click Start only when ≥2 players are present. The button is disabled or a clear message explains why when <2 players are present.

**Acceptance Scenarios**:

1. **Given** the host is in the Lobby with only themselves present (1 player), **When** they attempt to start the game, **Then** a message is displayed explaining "At least 2 players required to start", and the game does not start.
2. **Given** the host is in the Lobby with themselves and 1 joiner (2 players total), **When** they click Start Game, **Then** the game transitions to the Game screen and the round begins.
3. **Given** the host is in the Lobby and a second player joins, **When** the participant list updates (via polling), **Then** the Start Game button becomes active/enabled.
4. **Given** a joiner is in the Lobby, **When** they look for a Start button, **Then** no Start button is visible (or it is clearly labeled as "Host Only").

---

### User Story 5 - Room Isolation & Multi-Room Support (Priority: P2)

Multiple rooms can coexist in-memory without interference. A player joining Room A cannot see or affect Room B's state. Each room maintains an independent participant list and game state.

**Why this priority**: While critical for system integrity, this is testable after US1-US4 are functional. It is P2 because it assumes rooms are created and joined (P1).

**Independent Test**: Two instances of the app (two browser tabs or windows) can join different rooms simultaneously. Participants in Room A do not appear in Room B's lobby, and actions in Room A do not affect Room B.

**Acceptance Scenarios**:

1. **Given** a player creates Room A, **When** another player creates Room B, **Then** the two rooms have different codes and isolated participant lists.
2. **Given** Player X is in Room A and Player Y is in Room B, **When** Player X joins Room A's lobby, **Then** Player X sees only their own room's participants and does not see Player Y.
3. **Given** Room A has [Host, Player2] and Room B has [Host, Player2, Player3], **When** a participant polls their room state, **Then** they see the correct count for their room only.

---

### Edge Cases

- **Empty room codes**: Rejected with message "Code is required".
- **Non-existent room codes**: Rejected with message "Room not found".
- **Duplicate join attempts**: A player rejoining an existing room should update their name but not duplicate their entry. (Assumption: We treat rejoins by the same player as a re-entry, updating their record.)
- **Whitespace handling in codes**: Codes are trimmed of leading/trailing whitespace before validation.
- **Case sensitivity of codes**: Codes are case-insensitive for user convenience (e.g., `aBc12` == `abc12`).
- **Simultaneous joins**: Two players join at the same millisecond; both are added without race conditions (in-memory store must use synchronous operations).
- **Network failure during polling**: Polling silently retries without crashing the UI.

---

## Functional Requirements

1. **Room Creation**
   - `POST /rooms` endpoint creates a new room with a unique, randomly generated code (4-6 alphanumeric characters).
   - The request body must include the player name (will be validated and trimmed; empty/whitespace-only names should be rejected).
   - The response includes the room code and the player marked as host.

2. **Room Retrieval**
   - `GET /rooms/:code` endpoint returns the current room state (code, participants list, host ID, game state).
   - Codes are case-insensitive; normalization occurs server-side.
   - If the code does not exist, return a 404 with a clear error message.

3. **Join Room**
   - `POST /rooms/:code/join` endpoint adds a player to an existing room's participant list.
   - The request body includes the player name (validated, trimmed).
   - If the code does not exist, return a 404.
   - Duplicate joins (same player rejoining) update their entry but do not duplicate.
   - Response includes the updated room state.

4. **Frontend Polling**
   - The Lobby screen implements HTTP polling to `GET /rooms/:code` every ~2 seconds.
   - Polling starts when the Lobby mounts and continues until the player leaves or the game starts.
   - Poll responses update the participant list in real-time.
   - Network failures are caught; polling retries without crashing the UI.

5. **Host-Only Start Validation**
   - The frontend Start Game button is visible only to the host.
   - Before sending a start request, the frontend validates ≥2 players in the current room state.
   - If validation fails, a user-friendly error message is displayed.
   - (Game start itself is out of scope for this scenario but the endpoint will be prepared.)

6. **Player Name Validation**
   - Names are trimmed (leading/trailing whitespace removed).
   - Names with only whitespace (e.g., `"   "`) are rejected with message "Name is required".
   - Empty names are rejected with the same message.

---

## Success Criteria

1. **Functional Correctness**: Two players can create and join separate rooms independently, each seeing correct, isolated participant lists and real-time updates via polling.
2. **Isolation**: Participants in Room A do not see or interact with Room B's state.
3. **Polling Responsiveness**: A new participant is visible to existing players within ~3 seconds of joining (accounting for polling interval and latency).
4. **Host Control**: Only the host sees a Start button; the button is disabled if <2 players are present and enabled if ≥2 players are present.
5. **Error Handling**: Invalid/empty codes and names are rejected with clear, user-friendly messages. No UI crashes on network errors.
6. **Persistence**: Rooms persist in memory throughout the session; rejoining a room is possible until the browser/backend restarts.

---

## Key Entities

### Room
- `code`: string (unique, 4-6 alphanumeric, case-insensitive)
- `participants`: Player[] (ordered list of players in the room)
- `hostId`: string (ID of the host player)
- `createdAt`: timestamp
- `gameState`: enum (Lobby | InProgress | Finished) — defaults to Lobby

### Player
- `id`: string (unique, generated server-side)
- `name`: string (trimmed, non-empty)
- `isHost`: boolean

---

## Assumptions

1. **Unique Code Generation**: The system can reliably generate and track unique 4-6 character codes. Collision probability is acceptable for this session scope (in-memory store).
2. **Polling Cadence**: ~2 seconds is acceptable latency for a multiplayer lobby. This is a reasonable UX trade-off vs. WebSocket overhead (which is out of scope).
3. **Player Identity**: Players are identified by server-generated IDs within a room. No authentication exists; players are trusted to enter their own names.
4. **Room Cleanup**: Rooms remain in memory until the backend restarts. No automatic cleanup for empty rooms is implemented in this scenario (see Scenario 4 for restart behavior).
5. **Name Uniqueness**: Player names within a room do not need to be unique. (Multiple players can have the same name; this is a UX issue, not a blocker for core gameplay.)
6. **Synchronous Operations**: All room state mutations (join, create) are synchronous; no async operations cause race conditions.

---

## Out of Scope

- WebSocket or real-time sync (polling only)
- Persistent storage (in-memory only)
- Authentication, sessions, or JWT
- Room passwords or invite links
- Kick, mute, or spectator modes
- Room search or discovery (rooms are accessed by code only)

---

## Notes for Planning & Implementation

- The backend `POST /rooms` endpoint already exists; validation for player names must be added.
- The backend `GET /rooms/:code` endpoint already exists; ensure it returns all necessary fields (participants, hostId, gameState).
- The backend `POST /rooms/:code/join` endpoint already exists; ensure duplicate joins are handled correctly (update vs. add).
- Frontend polling logic must be added to the Lobby component.
- Room code case-insensitivity should be normalized server-side (all codes stored lowercase).

