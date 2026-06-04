# Feature Specification: Scenario 1 — Room Setup & Lobby

**Feature Branch**: `feat/scribble-lab`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scenario 1 — Room Setup & Lobby

## User Scenarios & Testing

### User Story 1 — Host Creates and Manages a Lobby (Priority: P1)

A player wants to host a drawing game. They create a room, get a unique code, share it with friends, see who joins via live polling, and start the game once enough players are present.

**Why this priority**: This is the foundational entry point for all gameplay. No other scenario works without a room and lobby.

**Independent Test**: A player can open the app, create a room with a name, see a 4-character room code, share the code with another player who joins, both see each other in the lobby within ~2 seconds, and the host can start the game once 2 players are present.

**Acceptance Scenarios**:

1. **Given** a player opens the app, **When** they click "Create Room" and enter a player name, **Then** a room is created with a unique 4-character code and the player is the host.

2. **Given** a room exists, **When** a second player enters the room code and their name, **Then** they join the room and appear in the participant list.

3. **Given** a player enters an empty room code, **When** they attempt to join, **Then** they see a validation error "Room code is required" and no API call is made.

4. **Given** a player enters an invalid/non-existent room code, **When** they attempt to join, **Then** they see a clear error message "Unable to join room".

5. **Given** a room in the lobby, **When** 2 or more participants are present and the host clicks "Start Game", **Then** the game begins.

6. **Given** a room with only 1 participant (the host), **When** the host attempts to start the game, **Then** they are prevented with a message "At least 2 players are required to start".

7. **Given** a room with 2+ participants, **When** a non-host participant attempts to start the game, **Then** they are prevented — only the host can start.

---

### Edge Cases

- What happens when a player submits an empty or whitespace-only room code? — Zod `.min(1)` rejects it before reaching the store.
- What happens when a player joins a room that was deleted/expired? — API returns 404 "Unable to join room".
- What happens when the same player name joins twice? — Each join creates a new participant with a unique ID; duplicates are allowed.
- What happens if the lobby poll request fails (network error)? — Error is caught and displayed; previous room state is preserved.
- What happens if the host closes their browser? — Room still exists in memory; other players remain. (Cleanup is out of scope for this scenario.)

## Requirements

### Functional Requirements

- **FR-001**: System MUST designate the room creator as the host, tracked via `hostId`.
- **FR-002**: System MUST reject empty/null room codes with a clear validation error before any API call.
- **FR-003**: System MUST maintain room isolation — each room's data is independent of all others.
- **FR-004**: System MUST provide lobby state via HTTP polling at ~2 second intervals.
- **FR-005**: System MUST allow only the host to start the game.
- **FR-006**: System MUST require at least 2 participants before the game can start.
- **FR-007**: System MUST generate unique room codes (4-char alphanumeric, collision-checked).

### Key Entities

- **Room**: Represents a game session. Contains code, status, participants, hostId, timestamps.
- **Participant**: Represents a player. Contains id, name, joinedAt.
- **RoomSnapshot**: Client-facing projection of a Room — includes hostId, participants, available words, roles.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can create a room and have another player join in under 5 seconds (including polling delay).
- **SC-002**: Empty/invalid room codes are rejected with a clear error message in under 1 second.
- **SC-003**: Lobby state is reflected on all connected clients within ~2 seconds of a change.
- **SC-004**: Only the host can successfully start the game; non-hosts receive a 403 error.

## Assumptions

- Users have stable internet connectivity.
- At most a few dozen rooms exist concurrently.
- Browser supports `fetch` API and ES module loading.
- Room codes are shared out-of-band (copy-paste, chat, etc.).
- Host departure/cleanup is handled by future scenarios.
