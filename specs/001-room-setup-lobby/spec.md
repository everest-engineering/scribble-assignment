# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-02

**Status**: Draft

**Input**: Room Setup & Lobby — a player creates or joins a room via a unique code; the creator is the host; invalid/empty codes are rejected; rooms are isolated; the lobby polls for updates (~2s); only the host can start the game once at least 2 players are present.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Creates a Room (Priority: P1)

A player opens the app, enters their name, and creates a new room. They are taken to the lobby screen, identified as the host, and can see their room code. They wait for others to join before starting the game.

**Why this priority**: Room creation is the entry point for every game session. Nothing else can happen without it.

**Independent Test**: Navigate to Create Room, enter a name, submit — confirm you land on the Lobby screen, your name is listed, and the room code is visible.

**Acceptance Scenarios**:

1. **Given** a player enters a valid name and submits Create Room, **When** the request succeeds, **Then** they are taken to the Lobby screen showing their name, the room code, and a "Start Game" button that is disabled.
2. **Given** a player submits Create Room with an empty or whitespace-only name, **When** they attempt to submit, **Then** the form is not submitted and a clear error message is shown inline.
3. **Given** a room is created, **When** any subsequent room is created, **Then** it has a different room code and its participant list is fully isolated from other rooms.

---

### User Story 2 — Player Joins a Room (Priority: P1)

A player opens the app, enters their name and the room code shared by the host, and joins the room. They are taken to the lobby and appear in the participant list.

**Why this priority**: Multiplayer requires at least one joiner. Join is as critical as create.

**Independent Test**: Open a second browser tab, enter a valid name and the existing room code — confirm you land on the Lobby and both players appear in the participant list.

**Acceptance Scenarios**:

1. **Given** a player enters a valid name and a valid existing room code, **When** they submit Join Room, **Then** they are taken to the Lobby and their name appears in the participant list.
2. **Given** a player submits Join Room with an empty or whitespace-only name, **When** they attempt to submit, **Then** the form is not submitted and a clear error message is shown inline.
3. **Given** a player enters a code that does not match any existing room, **When** they submit, **Then** they remain on the Join Room screen and a clear "room not found" error message is shown.
4. **Given** a player enters an empty room code, **When** they attempt to submit, **Then** the form is not submitted and a clear error message is shown inline.
5. **Given** two separate rooms exist, **When** a player joins one room, **Then** they do not appear in the other room's participant list.

---

### User Story 3 — Lobby Polls for New Participants (Priority: P2)

Once in the lobby, participants see the up-to-date participant list without having to manually refresh. The lobby polls the server approximately every 2 seconds and updates the display automatically.

**Why this priority**: Manual refresh makes the multi-player experience feel broken. Polling is the minimum viable sync mechanism.

**Independent Test**: Open two tabs. Join the same room from the second tab. Without clicking refresh in the first tab, confirm the new participant appears within ~2 seconds.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the same room, **Then** the new participant appears in the first player's lobby within approximately 2 seconds without any manual action.
2. **Given** a player is in the lobby, **When** no new participants join, **Then** the participant list remains unchanged and no visible flicker or reset occurs.
3. **Given** the backend is temporarily unreachable during a poll, **When** the poll fails, **Then** the lobby continues to display the last known participant list and polling resumes on the next interval.

---

### User Story 4 — Host Starts the Game (Priority: P2)

Once at least 2 players are in the lobby, the host can start the game. Non-host players see the Start Game button but cannot activate it. The game begins for all participants when the host starts it.

**Why this priority**: Starting the game is the final gate before gameplay begins. It must enforce the host-only and minimum-player constraints.

**Independent Test**: Join a room with 2 players. Confirm only the host's Start Game button is enabled. Click it — confirm all players navigate to the Game screen.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with fewer than 2 players, **When** the lobby is displayed, **Then** the Start Game button is visible but disabled with a message indicating more players are needed.
2. **Given** the host is in the lobby with at least 2 players, **When** the host clicks Start Game, **Then** the game transitions for all players in the room.
3. **Given** a non-host player is in the lobby, **When** the lobby is displayed, **Then** the Start Game button is either hidden or visibly disabled and non-interactive for that player.
4. **Given** the host has not yet started the game, **When** a non-host player attempts to trigger game start (e.g., direct API call), **Then** the request is rejected with a clear error.

---

### Edge Cases

- What happens when a player tries to join a room using a code with mixed case? The code matching MUST be case-insensitive.
- What happens if the same player name is used by two participants in the same room? Names are not required to be unique; participant identity is tracked by ID.
- What happens if the host leaves the lobby before starting? Out of scope for this scenario — no host reassignment or lobby teardown is required.
- What happens when the room code contains spaces or special characters? The form MUST trim the code input before submission; non-alphanumeric codes after trimming MUST be rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign the creator of a room as its host and persist the host identity for the lifetime of the room.
- **FR-002**: The system MUST generate a unique room code for each new room.
- **FR-003**: Player names MUST be trimmed before use; empty or whitespace-only names MUST be rejected with a user-visible error message.
- **FR-004**: Room codes MUST be trimmed before lookup; empty or whitespace-only codes MUST be rejected with a user-visible error message.
- **FR-005**: Joining with a code that does not match any existing room MUST return a clear "room not found" error to the player.
- **FR-006**: Each room MUST maintain a fully isolated participant list; a participant joining one room MUST NOT appear in any other room.
- **FR-007**: The lobby MUST automatically refresh the participant list via polling at approximately a 2-second interval.
- **FR-008**: The Start Game button MUST be disabled (or hidden) for non-host players at all times.
- **FR-009**: The Start Game button MUST be disabled for the host when fewer than 2 participants are present in the room.
- **FR-010**: Only the host MUST be permitted to trigger the game-start action; non-host requests to start MUST be rejected by the backend.

### Key Entities

- **Room**: Identified by a unique code; has a host participant, a list of participants, a status (`lobby`), and creation metadata.
- **Participant**: Identified by a unique ID within a room; has a display name and join timestamp. The host is the participant whose ID matches the room's `hostId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby in under 5 seconds on a local network.
- **SC-002**: A player can join an existing room by code and appear in the host's lobby within 2 seconds of joining (via polling), without manual refresh.
- **SC-003**: 100% of attempts to join with an invalid or empty code are rejected with a visible error message — no silent failures.
- **SC-004**: 100% of attempts to start the game by a non-host player are rejected.
- **SC-005**: Two separate rooms created in the same session share zero participant data.

## Assumptions

- The host is the first participant to create the room and retains that role for the room's lifetime. Host reassignment is out of scope.
- Room codes are case-insensitive when used for joining; the backend normalises them to uppercase before lookup.
- Player names are not required to be unique within a room; identity is tracked by participant ID.
- The lobby polling interval is approximately 2 seconds; minor drift (±500ms) is acceptable.
- If the backend is unreachable during a poll, the lobby silently retains the last known state and retries on the next interval — no error overlay is shown for transient poll failures.
- WebSockets and server-push are out of scope; all sync is achieved via client-side polling of the existing `GET /rooms/:code` endpoint.
- The game-start action is gated on the backend by checking `hostId`; the frontend gate (disabled button) is a UX convenience only.
