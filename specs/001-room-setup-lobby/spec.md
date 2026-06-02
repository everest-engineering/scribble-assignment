# Feature Specification: Room Setup and Lobby Readiness

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-02

**Status**: Implemented

**Input**: User description: "Enhance the Scribble starter to support room creation, joining with validation, host identity, lobby polling, and host-only start gating."

## User Scenarios & Testing

### User Story 1 - Room setup and lobby readiness (Priority: P1)

As a player, the system must allow creating or joining a room with clear validation so that players can gather in an isolated lobby and the host can start only when the room is ready.

**Why this priority**: This is the minimum usable slice. Without reliable room creation, joining, validation, host identity, and lobby sync, the rest of the game flow cannot start.

**Independent Test**: Can be fully tested by creating a room in one tab, joining it from a second tab, observing automatic lobby updates, and verifying that invalid names, invalid room codes, and invalid start conditions are rejected.

**Acceptance Scenarios**:

1. **Given** a player creates a room with a valid trimmed name, **When** the room is created, **Then** the player is stored as host, receives a room code, and sees the lobby.
2. **Given** a player enters an empty or whitespace-only name, **When** they try to create or join a room, **Then** the request is rejected with clear feedback.
3. **Given** a player enters an invalid or empty room code, **When** they try to join, **Then** the request is rejected with clear feedback and they remain on the join flow.
4. **Given** one player is in a lobby and a second player joins from another tab, **When** polling runs, **Then** the first player sees the second player appear within about 2 seconds without manual refresh.
5. **Given** a non-host player is in the lobby, **When** they try to start the game, **Then** the action is unavailable or rejected.
6. **Given** a host has fewer than two players in the room, **When** they try to start the game, **Then** the start is rejected with clear feedback.
7. **Given** two different rooms exist, **When** players join each room, **Then** each room sees only its own participants.

---

### Edge Cases

- What happens when a player enters lowercase room code text while the room codes are stored uppercase?
- How does the system handle rapid repeated clicks on start?
- What happens when a client refreshes during lobby polling?
- How does the system handle duplicate player names in the same room?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow a player to create a room with a unique room code.
- **FR-002**: System MUST mark the room creator as the host.
- **FR-003**: System MUST trim player names before validation and persistence.
- **FR-004**: System MUST reject empty or whitespace-only player names with clear feedback.
- **FR-005**: System MUST require a valid room code to join a room.
- **FR-006**: System MUST reject empty or invalid room codes with clear feedback.
- **FR-007**: System MUST keep room state isolated by room code.
- **FR-008**: System MUST refresh shared lobby and game state through polling at approximately 2-second intervals.
- **FR-009**: System MUST allow only the host to start the game.
- **FR-010**: System MUST reject start attempts when fewer than two players are present.

### Key Entities

- **Player**: Represents a participant in a room, including id, name, host status, and score.
- **Room**: Represents an isolated game space identified by a code and containing players plus round state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Two players can create and join the same room and see synchronized lobby membership updates without manual refresh within about 2 seconds.
- **SC-002**: 100% of invalid blank-name and invalid room-code attempts are rejected with explicit user feedback during manual validation.

## Assumptions

- The existing in-memory backend store will continue to be used and persistent storage is out of scope.
- Polling is the required synchronization mechanism because WebSockets are explicitly out of scope.
- A lightweight player identity such as `playerId` is sufficient and does not require full authentication.
- Manual two-tab or two-browser validation is sufficient unless the repository already contains tests that can be extended cheaply.
