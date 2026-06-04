# Feature Specification: Room Setup & Lobby

**Feature Group**: 1 — Room Setup & Lobby
**Date**: 2026-06-04
**Status**: Draft

## User Stories

### User Story 1 — Host Creates Room (P1)
A player enters a name and creates a room. They are automatically the host and land in the lobby.

**Acceptance Scenarios**:
1. Given a player enters a non-empty name, When they click "Create and Continue", Then a room is created with a 4-character code and they become the host
2. Given a player enters only whitespace, When they submit, Then they see an error "Name cannot be empty"
3. Given a room is created, When the creator views the lobby, Then they see a "Start Game" button that only they can use

### User Story 2 — Player Joins Room (P2)
A player enters their name and a room code to join an existing game.

**Acceptance Scenarios**:
1. Given a valid room code and non-empty name, When they submit, Then they join the room and land in the lobby
2. Given an invalid/unknown room code, When they submit, Then they see an error "Room not found"
3. Given an empty room code, When they submit, Then they see an error "Room code is required"

### User Story 3 — Lobby Auto-Refresh (P2)
The lobby automatically polls the server to show updated participant lists.

**Acceptance Scenarios**:
1. Given a player is in the lobby, When another player joins, Then the participant list updates within ~2 seconds without manual refresh

### User Story 4 — Host Starts Game (P2)
Only the host can start the game, and only when at least 2 players are present.

**Acceptance Scenarios**:
1. Given the host is in the lobby with ≥2 players, When they click "Start Game", Then the game begins and all players navigate to the game screen
2. Given a non-host player is in the lobby, When they look for a "Start Game" button, Then it is not visible
3. Given the host is alone in the lobby, When they look for "Start Game", Then the button is disabled with a message "Need at least 2 players"

## Edge Cases
- Empty/whitespace-only player names are rejected
- Duplicate room codes are impossible (generated until unique)
- Room code is case-insensitive (ABCD = abcd)
- Rooms are fully isolated; participants in one room never see another room's data

## Functional Requirements
- **FR-001**: System MUST track which participant created the room (hostId)
- **FR-002**: System MUST reject empty/whitespace names with 400 status
- **FR-003**: System MUST return 404 for unknown room codes on join
- **FR-004**: System MUST poll GET /rooms/:code every ~2000ms from the lobby
- **FR-005**: System MUST only allow the host to start the game
- **FR-006**: System MUST require ≥2 participants to start
- **FR-007**: System MUST have a POST /rooms/:code/start endpoint

## Key Entities
- **Room**: code, status, hostId, participants[], createdAt, updatedAt
- **Participant**: id, name, joinedAt, score
- **RoomSnapshot**: public view of room

## Success Criteria
- **SC-001**: Two browser tabs can see each other in the lobby within 2s
- **SC-002**: Host-only start enforced on both frontend and backend
- **SC-003**: All error cases return user-visible messages
- **SC-004**: Three separate rooms can exist simultaneously without cross-talk
