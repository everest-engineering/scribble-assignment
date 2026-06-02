# Feature Specification: Room Setup & Lobby

**Feature Branch**: `sdd-2-scribble-assignment`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "Scenario 1 — Room Setup & Lobby: Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Room and View the Lobby (Priority: P1)

A player opens the drawing game, enters their display name, and creates a new room. The system assigns them as the host and displays a unique room code on the lobby screen. The lobby shows the host as the sole participant and begins polling for updates so new joiners appear automatically.

**Why this priority**: Room creation is the entry point for the entire game flow — nothing else works without it.

**Independent Test**: Open the app, enter a display name, and click "Create Room." Confirm the lobby appears, the room code is visible, and your name is listed as host. Open the browser network tab and verify polling requests fire approximately every 2 seconds.

**Acceptance Scenarios**:

1. **Given** a player is on the start screen, **When** they enter a display name and create a room, **Then** the room is created and they are placed in the lobby as the host with a unique room code displayed.
2. **Given** a player is in the lobby as the host, **When** the lobby polls for updates, **Then** the participant list refreshes without manual intervention.

---

### User Story 2 - Join a Room by Code (Priority: P1)

A second player opens the app, enters the room code shared by the host along with their display name, and joins the room. They land on the same lobby screen and see the host and any other participants. The host's lobby view updates to show the new joiner.

**Why this priority**: Multi-player requires at least two participants. Joining is the mechanism that makes the game social.

**Independent Test**: Open a second browser tab, enter the room code from User Story 1, and join. Confirm both tabs show two participants in the lobby within 2 seconds of polling.

**Acceptance Scenarios**:

1. **Given** a room exists with a visible room code, **When** a second player enters the code and their display name to join, **Then** both the host and the joining player see two participants on the lobby screen.
2. **Given** a player enters a non-existent or malformed room code, **When** they attempt to join, **Then** a clear error message is shown and they remain on the join screen.
3. **Given** a player enters an empty room code, **When** they attempt to join, **Then** a clear validation message is shown and the join is not submitted.

---

### User Story 3 - Host Starts the Game (Priority: P2)

Once at least two players are present in the lobby, the host can start the game. Non-host players see no start option or receive a message that only the host can start. If fewer than two players are present, the start action is disabled or shows an error.

**Why this priority**: Starting the game transitions from setup to gameplay. It is a lower priority than creation and joining because those must work first.

**Independent Test**: With two players in the lobby (from US1 and US2), confirm the host sees a "Start Game" control. Click it. Confirm the game screen loads. In a separate browser tab with a non-host player, confirm the start control is not present or disabled.

**Acceptance Scenarios**:

1. **Given** at least two players are in the lobby, **When** the host clicks "Start Game," **Then** the game begins and all players transition to the game screen.
2. **Given** a non-host player is in the lobby, **When** they attempt to start the game, **Then** the action is denied (control is hidden, disabled, or returns an error).
3. **Given** only one player is in the lobby, **When** the host attempts to start the game, **Then** a message is shown indicating at least 2 players are needed.

---

### Edge Cases

- Empty or whitespace-only room code submitted for joining
- Room code that does not match any existing room
- Player name is empty or whitespace-only (basic validation — thorough trimming deferred to Scenario 2)
- Host closes or navigates away from the lobby — room stays alive; non-host players remain but game cannot start without a host
- Network failure during lobby polling — client should gracefully handle and retry
- Two players attempt to join the exact same room simultaneously
- Player attempts to join a room they are already in

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room by providing a display name.
- **FR-002**: System MUST designate the room creator as the host.
- **FR-003**: System MUST generate a unique room code for each new room. If the generated code collides with an existing active room, the system MUST retry with a new code until a free one is found.
- **FR-004**: System MUST allow a player to join a room using a valid room code and display name.
- **FR-005**: System MUST reject join attempts with empty or non-existent room codes and show a clear error message.
- **FR-006**: System MUST keep room data fully isolated — players in one room cannot see or affect data in another room.
- **FR-007**: System MUST refresh the lobby participant list via polling at approximately 2-second intervals.
- **FR-008**: System MUST allow only the host to start the game.
- **FR-009**: System MUST prevent the game from starting unless at least 2 players are present.
- **FR-010**: System MUST display the room code prominently in the lobby so it can be shared with other players.

### Key Entities *(include if feature involves data)*

- **Room**: A game session identified by a unique, system-generated code. Contains a list of participants, a designated host, and a current state (lobby, in-progress, finished).
- **Player**: A participant in a room, identified by a display name. If two players share the same display name, a disambiguation suffix (e.g., " (2)") is appended for internal identification and shown to other players. Each player has a role (host or non-host) determined at room creation or join time.
- **Room Code**: A unique alphanumeric identifier (system-generated) used to share room access between players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room, share the code, and see a second player appear in the lobby within 3 seconds of the second player joining.
- **SC-002**: An invalid or empty room code displays a clear error message within 1 second of submission — no crash or blank state.
- **SC-003**: Two rooms operating simultaneously show no cross-contamination — actions in one room never appear in the other.
- **SC-004**: A non-host player cannot start the game; either the start control is absent, disabled, or returns a clear denial message.
- **SC-005**: The game start button is disabled or absent when fewer than 2 players are in the lobby, and a clear message explains the requirement.

## Clarifications

### Session 2026-06-01

- Q: Room code collision strategy — A: Retry with new code (regenerate until a unique code is found; ~1.7M namespace makes this effectively invisible).
- Q: Duplicate display names in a room — A: Auto-disambiguate (allow duplicates but append a numeric suffix like "Alice (2)" for internal identification; display name shown to other players includes the suffix).
- Q: Host departs the lobby — A: Keep room alive (room stays active, non-host players remain; game cannot start until a host is present again; no automatic host transfer).

## Assumptions

- Players access the game from a standard modern web browser — no mobile app is required.
- Players have stable internet connectivity; polling failures are handled gracefully with retries and user-visible status.
- Room codes are 4-character alphanumeric strings generated by the system (uppercase letters and digits). POST /rooms api is already present to handle this.
- No explicit maximum room size is enforced for this scenario; the game requires at least 2 players and can reasonably support 8-10 concurrent participants.
- Player name validation (trimming, empty rejection) is a dependency shared with Scenario 2; basic handling is included here and refined later.
- The starter already provides basic create/join/fetch-room endpoints and in-memory storage — this spec builds on that foundation.
- No authentication or session system exists — players are identified by their display name within a room session.
