# Feature Spec: Room Setup and Lobby

**Feature**: `002-room-setup-lobby`
**Parent Assignment Spec**: `specs/001-scribble-game/spec.md`

## User Story

As a player, I want to create or join a Scribble room and wait in a shared lobby so that a host can start the game only when enough players are present.

## Acceptance Criteria

1. Given a player enters a non-empty display name, when they create a room, then the system creates a four-character room code and marks that player as host.
2. Given a player enters a valid room code and non-empty display name, when they join the room, then they appear in the same lobby as the host.
3. Given a player enters an empty or whitespace-only display name, when they try to create or join, then the system rejects the action with clear feedback.
4. Given a player enters a malformed or unknown room code, when they try to join, then the system rejects the action with clear feedback.
5. Given multiple rooms exist, when participants join one room, then participants and state from other rooms must not appear.
6. Given the lobby has fewer than two players, when the host views the start control, then starting is unavailable.
7. Given the lobby has at least two players, when the host starts the game, then the room can transition to active state.
8. Given a non-host views the lobby, when at least two players are present, then starting remains unavailable for that non-host.

## Requirements

- The system MUST trim player names before persistence.
- The system MUST reject empty or whitespace-only player names.
- The system MUST normalize room codes to uppercase.
- The system MUST reject malformed room codes.
- The system MUST keep room state isolated by room code.
- The lobby MUST poll for room snapshots about every 2 seconds.
- The lobby MUST identify the host and show the current participant count.
- Only the host MUST be allowed to start the game.
- Starting MUST require at least two participants.

## Entities

- Room: code, status, host participant id, participants, round state, timestamps.
- Participant: id, display name, joined timestamp.
- Room snapshot: viewer-specific room state used by frontend screens.

## Validation

Automated validation covers backend room store behavior, schema validation, frontend API calls, frontend room store state updates, and lobby rendering/navigation behavior. Manual validation covered two local browser sessions creating and joining the same room before game start.
