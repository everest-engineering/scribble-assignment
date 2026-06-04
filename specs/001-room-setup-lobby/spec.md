# Scenario Specification: Room Setup & Lobby

**Parent Feature**: [001-scribble-game](../001-scribble-game/spec.md)

**Priority**: P1

**Status**: Draft

## User Story

A player wants to host or join a drawing game by creating a room or joining an existing one. The first player to create a room becomes the host. The lobby displays all participants, kept in sync via HTTP polling (~2 seconds). The host can start the game once at least 2 players have joined.

**Why this priority**: Baseline entry point. Without room creation, joining, and lobby sync, multiplayer gameplay cannot start.

**Independent Test**: Run backend and frontend, create a room in Tab 1, copy the code, join in Tab 2, and verify the participant list updates in Tab 1 without reload.

## Acceptance Scenarios

1. **Given** a player wants to create a room, **When** they submit a non-empty name, **Then** a new room is created with a unique 4-character code, they land in the lobby, and they are marked as the host.
2. **Given** a player wants to join a room, **When** they submit a non-empty name and an existing room code, **Then** they join the room and appear in the lobby.
3. **Given** a player submits an empty or whitespace-only name on create/join, **When** they submit the form, **Then** the request is rejected with a clear validation error.
4. **Given** a player submits an invalid or non-existent room code, **When** they submit the join form, **Then** the request is rejected with a clear "Room code not found" message.
5. **Given** two players are in the lobby, **When** a new participant joins, **Then** the lobby page automatically refreshes via 2s polling and shows the new participant.
6. **Given** players are in the lobby, **When** the host looks at the lobby, **Then** they see the "Start Game" button (disabled if < 2 players, active if >= 2). Other guests must not see "Start Game".

## Functional Requirements

- **FR-001**: Backend MUST trim and validate `playerName` on create/join; reject empty or whitespace-only values.
- **FR-002**: Backend MUST store the room creator's participant ID as `hostId`.
- **FR-003**: Backend MUST validate room codes on join (upper-case input) and return 404 if the room does not exist.
- **FR-004**: Frontend MUST poll room state every 2 seconds on the lobby page.
- **FR-005**: Frontend MUST show "Start Game" only to the host.
- **FR-006**: Frontend MUST enable "Start Game" only when there are at least 2 players.

## Edge Cases

- Empty or whitespace-only player names on create/join.
- Case-insensitive room codes on join (e.g. `abcd` → `ABCD`).
- Multi-room isolation: lobby actions affect only the target room.

## Success Criteria

- **SC-001**: Two players can create/join the same lobby in under 1 minute.
- **SC-003**: 100% of empty or whitespace player names are rejected on create/join.

## Related Artifacts

- API: [Create Room, Join Room, Fetch Snapshot](../001-scribble-game/contracts/api.md)
- Data model: [Room, Participant](../001-scribble-game/contracts/data-model.md)
