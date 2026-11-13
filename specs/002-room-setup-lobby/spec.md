# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-01

**Status**: Implemented

**Input**: User description: "create this feature under specs folder itself. Refer document.md and go with ### Group 1 — Room Setup & Lobby"

## Clarifications

### Session 2026-06-01
- Q: What should happen to the lobby if the host player leaves or disconnects? → A: Terminate room immediately (destroy room and redirect guests).
- Q: How should the frontend handle temporary polling failures or offline network states when waiting in the lobby? → A: Show a temporary warning banner (continue polling and dismiss on recovery).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Tracking on Room Creation (Priority: P1)
As a player creating a room, I want to be automatically identified and tracked as the host. The creator of a room must be marked as the host in the backend room store and have host rights in the session.

**Why this priority**: Necessary foundational setup before a game can be controlled or started.
**Independent Test**: Navigate to `/create-room`, enter a player name, submit, and confirm that in the lobby participant list, this player is shown with a visual indicator/badge showing they are the host.

**Acceptance Scenarios**:
1. **Given** a player is creating a new room, **When** the room is successfully created on the server, **Then** the creator is designated as the host in the backend store, and navigated to the lobby.

---

### User Story 2 - Join Validation with Clear Error Feedback (Priority: P1)
As a player joining a room, I want to receive clear error messages if I enter an empty, invalid, or non-existent room code.

**Why this priority**: Vital for a smooth user experience and to prevent players from landing in broken state pages.
**Independent Test**: On the Join Room page, try submitting with an empty room code or a code that doesn't exist (e.g. `ZZZZ`), and verify a clear, user-friendly error message is displayed on screen.

**Acceptance Scenarios**:
1. **Given** a player is on the Join Room page, **When** they enter a room code that does not exist and click join, **Then** the API returns a 404/400 error and the UI displays a clear validation message.

---

### User Story 3 - Multi-Room Isolation (Priority: P1)
As a player, I want to make sure my room and lobby state are completely isolated from other active rooms, so that participants and data do not bleed across rooms.

**Why this priority**: Core system constraint to support multiple concurrent independent game sessions.
**Independent Test**: Create Room A as Alice and Room B as Bob. Join Room B as Charlie. Verify Room A's lobby participant list contains only Alice, while Room B contains Bob and Charlie.

**Acceptance Scenarios**:
1. **Given** two active rooms are created on the server, **When** a player joins one room, **Then** only that room's participant list is updated and the other room's list remains isolated and unchanged.

---

### User Story 4 - Lobby Auto-polling (Priority: P2)
As a player in a lobby, I want the participant list to update automatically at a regular ~2s interval so that I don't have to manually refresh to see when new players have joined.

**Why this priority**: Improves the pre-game lobby flow and provides responsive feedback.
**Independent Test**: Open two browser tabs side-by-side. Join a room from Tab B, and verify Tab A's participant list updates automatically within 2.5 seconds.

**Acceptance Scenarios**:
1. **Given** a player is on the Lobby page, **When** another player joins the room, **Then** the page automatically polls the server endpoint at a ~2s interval and renders the updated list of participants.

---

### User Story 5 - Host-Only Start with 2-Player Minimum (Priority: P1)
As the host in a lobby, I want to be the only person who can see and click the "Start Game" button, and I want the button to remain disabled until at least 2 players are present. Guests should see a status message instead.

**Why this priority**: Game loop validation gate to prevent solo game starts and restrict game start privileges to the host.
**Independent Test**:
1. As the host (alone in lobby), verify the "Start Game" button is visible but disabled.
2. Open a guest tab and join. Verify the guest tab shows "Waiting for host to start..." (no start button).
3. Verify that on the host tab, the "Start Game" button becomes active and clickable once the guest joins.

**Acceptance Scenarios**:
1. **Given** a host player is in the lobby, **When** they are the only player, **Then** the "Start Game" button is visible but disabled.
2. **Given** a guest player is in the lobby, **When** they load the page, **Then** they do not see a "Start Game" button and instead see a status message saying "Waiting for host to start the game."
3. **Given** a host player is in the lobby, **When** a second player joins, **Then** the "Start Game" button becomes enabled.

---

## Edge Cases
- **Host Disconnection**: If the host player leaves or disconnects from the lobby, the room is immediately destroyed and all remaining participants are redirected back to the landing page.
- **Drop Below 2 Players**: If a player leaves the lobby, bringing the count back down to 1, the "Start Game" button on the host page must become disabled again.
- **Empty Player Name**: Submitting empty names for room creation or joining must be validated and rejected.
- **Invalid Room Code Format**: Reentering codes that do not match the expected 4-character uppercase alphanumeric pattern should be rejected on the client side.
- **Polling Failures**: If polling fails due to temporary network issues, a connection warning banner is displayed in the lobby while the client continues attempting to connect, disappearing once connection is restored.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST automatically track the room creator as the host.
- **FR-002**: System MUST reject empty or invalid room codes on join with clear error messages in the UI.
- **FR-003**: System MUST isolate different rooms such that participant lists and room states do not bleed across room codes.
- **FR-004**: Frontend MUST poll the server status endpoint for the active room automatically at a regular 2000ms (2s) interval when on the Lobby page.
- **FR-005**: Frontend MUST restrict the visibility of the "Start Game" button in the lobby to the host only.
- **FR-006**: Frontend MUST disable the "Start Game" button for the host when the participant count is less than 2.
- **FR-007**: System MUST immediately terminate the room and redirect guests to the landing page if the host leaves or disconnects from the lobby.
- **FR-008**: Frontend MUST display a temporary connection warning banner in the lobby when polling fails, and automatically hide it once connection is restored.

### Key Entities
- **Room**: Represents a game session. Has `code` (string), `participants` (Participant[]), `status` (string), and `hostId` (string).
- **Participant**: Represents a player. Has `id` (string), `name` (string), `joinedAt` (string), and `isHost` (boolean).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: The lobby list updates automatically within 2.5 seconds of a new player joining without manual refresh.
- **SC-002**: Non-host participants never see or have access to start the game session.
- **SC-003**: The "Start Game" button transitions from disabled to enabled within 2.5 seconds of a second participant joining (bounded by the 2s polling interval).
- **SC-004**: Submitting empty names or invalid room codes shows validation error messages on screen within 200ms.

## Assumptions
- No WebSockets are used; HTTP polling at a ~2s cadence is sufficient for lobby auto-polling.
- In-memory data store is used on the backend.
- A lobby consists of a single round setup.
