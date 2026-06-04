# Feature Specification: Room Setup & Lobby

**Feature Branch**: `assignment`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scribble assignment business scenarios

## User Story

As a player, I want to create or join a room so that I can participate in a Scribble game with other players.

**Priority**: P1

**Why this priority**: Multiplayer gameplay cannot begin without room creation and lobby synchronization.

**Independent Test**: Create a room, join from a second browser session, verify polling updates participants, and verify only the host can start the game.

## Acceptance Scenarios

1. **Given** a player creates a room, **When** the room is successfully created, **Then** the creator becomes the host.
2. **Given** a player enters an invalid room code, **When** they attempt to join, **Then** the system displays a clear validation error.
3. **Given** two players are in the same room, **When** participant data changes, **Then** the lobby updates through polling within approximately two seconds.
4. **Given** fewer than two players are present, **When** the host attempts to start the game, **Then** the system prevents game start and displays feedback.
5. **Given** a non-host player is in the lobby, **When** viewing room controls, **Then** they cannot start the game.

## Functional Requirements

* FR-001: System MUST assign the room creator as host.
* FR-002: System MUST reject invalid room codes.
* FR-003: System MUST synchronize lobby state through polling.
* FR-004: System MUST restrict game start to the host.
* FR-005: System MUST require at least two players before game start.

## Success Criteria

* SC-001: Two browser sessions can successfully join the same room.
* SC-002: Lobby participant updates appear within approximately two seconds.

## Edge Cases

* Empty room codes
* Invalid room codes
* Empty player names
* Whitespace-only player names
* Starting with fewer than two players
* Multiple rooms existing simultaneously
* Backend restart clearing room state
