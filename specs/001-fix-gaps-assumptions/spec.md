# Feature Specification: Room Setup & Lobby (Gaps & Assumptions Resolution)

**Feature Branch**: `001-fix-gaps-assumptions`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Fix gaps and assumptions that are mentioned in document.md. strictly involve only gaps and assumptions not other things."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix API Connection & Landing Page Rendering (Priority: P1)
A player opens the application. They must see the correct Scribble branding and game-themed marketing copy immediately, and all buttons must be active and make requests to the correct backend endpoints without failing with 404 network errors.

**Why this priority**: Block blocker for any application usage.
**Independent Test**: Load the root page `/` in a browser. Confirm that the branding displays correctly, and no 404 network errors are logged in the browser console.

**Acceptance Scenarios**:
1. **Given** a player is on the landing page, **When** the page loads, **Then** it renders the Scribble branding and marketing text successfully, and the initial status call to the API does not fail with a 404 error.

---

### User Story 2 - Create Room with Custom Name (Priority: P1)
A player wants to host a game. They input their custom name on the Create Room page and click create. The custom name must be propagated to the backend (not default to "Player"), a unique room code must be generated, and the creator must be added to the room and navigated to the lobby.

**Why this priority**: Required to initialize a game session.
**Independent Test**: Navigate to `/create-room`, enter a custom name, click create, and verify navigation to `/lobby` with the custom name displayed in the participant list.

**Acceptance Scenarios**:
1. **Given** a player enters a custom name on the Create Room screen, **When** they submit the form, **Then** a new room is created with a unique 4-character code, the player is added with their entered name, and the browser navigates to the lobby.

---

### User Story 3 - Join Room with Custom Name and Room Code (Priority: P1)
A player wants to join an existing room. They input the room code and their custom name, and click join.

**Why this priority**: Required for multiplayer coordination.
**Independent Test**: Enter an existing room code and a custom name on the Join Room page, and verify the player joins the room and is navigated to the lobby.

**Acceptance Scenarios**:
1. **Given** a player enters a valid room code and custom name on the Join Room screen, **When** they submit the form, **Then** they are added to the room's participant list and navigated to the lobby.
2. **Given** a player is on the Join Room screen, **When** they enter a non-existent or empty room code, **Then** they see a clear validation error in the UI.

---

### User Story 4 - Lobby Participant List (Priority: P2)
Players in the lobby must see the participant list. Manual refresh button only, no auto-polling.

**Why this priority**: Essential to let players know when others have successfully joined.
**Independent Test**: Open two browser tabs side-by-side. Join a room from Tab B, click the refresh button on Tab A, and verify Tab A's participant list updates.

**Acceptance Scenarios**:
1. **Given** a player is on the Lobby page, **When** another player joins the room, **Then** the Lobby page polls the server and displays the updated participant list on manual refresh.

---

## Edge Cases
- **Invalid Room Code**: Entering a room code that does not exist or is empty must be rejected with a user-friendly error message.
- **Player Name Not Provided**: Submitting empty names for room creation or joining must be handled gracefully by displaying a validation message.
- **Room Isolation**: Separate rooms must not share participant lists or state.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST correct the API base URL in `frontend/src/services/api.ts` by removing the `/bug` suffix.
- **FR-002**: System MUST trim and validate player names on create and join, rejecting empty names.
- **FR-003**: System MUST propagate the custom player name to the backend during room creation and room joining rather than defaulting to "Player".
- **FR-004**: System MUST validate the room code on join, rejecting non-existent codes with clear error messages.
- **FR-005**: System MUST isolate different rooms such that participant lists do not mix.
- **FR-006**: Frontend MUST poll the server status endpoint for the active room on manual refresh when on the Lobby page.

### Key Entities
- **Room**: Represents a game session. Has `code` (string), `participants` (Participant[]), and `status` (string).
- **Participant**: Represents a player. Has `id` (string), `name` (string), and `joinedAt` (string).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: The landing page loads and makes requests to the correct API base URL without 404 errors.
- **SC-002**: Lobby updates and displays newly joined participants on manual refresh.
- **SC-003**: Empty name inputs are rejected with a visible validation error in < 200ms.

## Assumptions
- In-memory data store is used on the backend; no database is needed.
- No WebSockets are used; all sync uses HTTP polling.
- Custom names are required (cannot be blank).
