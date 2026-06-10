# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Lets build the first implementation that is :

- Room setup & lobby: create/join by code, creator becomes host, reject invalid/empty codes, isolate rooms, poll lobby state ~2s, only host can start once 2+ players present"

## Clarifications

### Session 2026-06-05

- Q: How should host identity be preserved across refreshes — should the creator remain host via session token or only by current page load? → A: Creator stays host via a temporary browser session/token, so refresh keeps host role.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and host a room (Priority: P1)

A player wants to start a new drawing game and immediately host the lobby.

**Why this priority**: Host creation is the foundation of the multiplayer flow and it must work before any game round can begin.

**Independent Test**: A user creates a room, sees a room code, and is identified as host in the lobby without any gameplay logic.

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen with a non-empty display name, **when** they choose to create a room, **then** the system creates a new room, displays a unique room code, and designates that player as host in the lobby.
2. **Given** a player is the room creator, **when** the room is created, **then** the host sees a start-game button that is disabled until a second player joins.
3. **Given** a player is the room creator, **when** at least one other player has joined, **then** the host can start the game from the lobby.

---

### User Story 2 - Join an existing room by code (Priority: P2)

A second player wants to join the existing room using the room code.

**Why this priority**: Joining a room is the main way players connect and test lobby synchronization.

**Independent Test**: A second player enters a room code and joins the correct lobby while the first player is waiting.

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **when** they enter a valid room code and a non-empty display name, **then** they join that room and appear in the lobby participant list.
2. **Given** a player enters an invalid or empty room code, **when** they submit the join form, **then** the system rejects the request with a clear error message and does not enter a room.

---

### User Story 3 - Lobby polling and room isolation (Priority: P3)

Players need to see accurate, up-to-date lobby state and not accidentally join the wrong room.

**Why this priority**: Polling and isolation ensure the lobby is live enough for a multiplayer start and that rooms do not leak participants.

**Independent Test**: When one player joins or leaves, other lobby participants see the updated roster within 2 seconds, and separate rooms remain isolated.

**Acceptance Scenarios**:

1. **Given** two players are in the same room, **when** one player joins the room from another browser tab, **then** the first tab refreshes the lobby state within 2 seconds and shows the new participant.
2. **Given** two different room codes exist, **when** a player tries to join the second room using the first room's code, **then** they are prevented from joining and receive a clear error that the code is invalid for their requested room.
3. **Given** a player is not the host, **when** they view the lobby, **then** they do not see a start-game control or they see it disabled.

---

### Edge Cases

- A player submits a create or join form with an empty display name or empty room code; the system must reject the submission with a clear validation message.
- A player submits a malformed room code or a room code for a room that does not exist; the system must reject it rather than creating a new room.
- Two rooms with different codes exist simultaneously; players in one room must not see or join the other room.
- The host leaves the lobby before the game starts; the system should keep the room isolated and preserve the remaining participant list until a restart or cleanup is introduced in later work.
- If the host leaves the lobby before the game starts, the system MUST promote the earliest-joined remaining participant to host. Clients MUST reflect the updated host on the next lobby poll; the promoted participant MUST receive host controls (start button) according to the usual rules (enabled only when >=2 participants). If no participants remain, the room may persist until a cleanup policy is applied in later work.
- The lobby polling cadence should not cause visible flicker or repeated duplicate entries when the same state is returned.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and immediately become the host.
- **FR-002**: System MUST generate and display a unique room code for each newly created room. Room codes MUST be 4-character uppercase alphanumeric codes using the characters A-Z and digits 2-9 (no ambiguous characters such as 0,1,I,O) unless otherwise specified.
- **FR-003**: System MUST allow a player to join an existing room by entering a valid room code and a non-empty display name.
- **FR-004**: System MUST reject empty, malformed, or unknown room codes with a clear, machine-parseable error and prevent room entry. API contract expectations:

- Malformed or empty room code: return HTTP 400 with a JSON body { "error": "malformed_room_code", "message": "Room code is required and must be 4 characters" }.
- Unknown/non-existent room code: return HTTP 404 with a JSON body { "error": "room_not_found", "message": "Room not found" }.
- Client UIs MUST present the message text to the user and expose it via accessible alerts for screen readers.
- **FR-005**: System MUST isolate rooms so that players in one room cannot see or join another room.
- **FR-006**: System MUST show the current lobby participant list and refresh it automatically at least every 2 seconds.
- **FR-007**: System MUST display a host-only start-game control, and it MUST be enabled only when at least 2 players are present in the lobby.
- **FR-008**: System MUST prevent non-host players from starting the game.

### Key Entities

- **Room**: Represents a unique game lobby with a room code, host, player list, and current state.
- **Player**: Represents a participant in the room with a display name and role information.
- **Lobby State**: Represents the current list of players in a room, host identity, and whether the host may start the game.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player can create a room and see a unique room code, host identity, and a disabled start-action until a second player joins.
- **SC-002**: A second player joining with a valid code appears in the lobby on the first player's screen within 2 seconds.
- **SC-003**: Invalid or empty room codes are rejected with a readable error message in 100% of join attempts.
- **SC-004**: The lobby state refreshes automatically at least once every 2 seconds while a player is in the lobby.
- **SC-005**: Non-host players never gain the ability to start the game in this implementation.
- **SC-006**: Two rooms created with different codes remain isolated, and participants in one room do not appear in the other room.

## Assumptions

- Room code creation and validation are handled by the existing backend service, and room state is stored in memory only.
- This work focuses on lobby setup and does not include actual game round start behavior or drawing interactions.
- The UI already has routes for creating and joining rooms; this feature will extend those routes and lobby state polling.
- There is no authentication system in place, so host identity is derived from the player who created the room and preserved via a browser-local participant token stored in `localStorage`. The creator remains host across refreshes while the token is retained locally; on receiving a 404/room-not-found response the client MUST clear the stored token.
