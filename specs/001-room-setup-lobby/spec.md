# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Status**: Implemented

## Scenario

### F1.1 Host Tracking
- When a player creates a room, they are automatically the host.
- The host is identified by `participantId` stored on the room.
- Only the host can start the game.

### F1.2 Room Creation Validation
- Creating a room with an empty or whitespace-only name returns a clear error message.
- Room codes are 4-character alphanumeric (auto-generated).
- Room codes are unique and collision-free.

### F1.3 Join Room Validation
- Joining a non-existent room code returns a clear error.
- Joining with an empty or whitespace-only name returns a clear error.
- Player names are trimmed before storing.

### F1.4 Room Isolation
- Each room operates independently. Participants in room A cannot see or affect room B.

### F1.5 Lobby Polling
- The lobby automatically polls `GET /rooms/:code` every ~2 seconds.
- The participant list updates without manual refresh.

### F1.6 Start Game Preconditions
- The "Start Game" button is only visible to the host.
- The "Start Game" button is disabled until at least 2 players are in the room.
- Starting the game calls `POST /rooms/:code/start` and transitions the room status.

### F1.7 Edge Cases
- Room code is uppercased consistently for lookup.
- Max participant limit is 10 (prevent unbounded growth).

## Acceptance Criteria
- [ ] Creator is host; only host sees "Start Game" button.
- [ ] Empty/whitespace name rejected on create and join.
- [ ] Invalid room code rejected with clear message.
- [ ] Lobby refreshes participant list every ~2s automatically.
- [ ] Start Game requires ≥2 players; hidden from non-host.
- [ ] Two rooms are fully isolated (different codes, different participants).

## Requirements

### Functional Requirements
- **FR-001**: System MUST track the room creator as the host via `hostId`.
- **FR-002**: System MUST reject empty or whitespace-only player names on create and join.
- **FR-003**: System MUST auto-generate 4-character alphanumeric room codes.
- **FR-004**: System MUST reject join attempts for non-existent room codes.
- **FR-005**: System MUST trim player names before storing.
- **FR-006**: System MUST isolate rooms so participants cannot affect other rooms.
- **FR-007**: System MUST poll `GET /rooms/:code` every ~2 seconds in the lobby.
- **FR-008**: System MUST show "Start Game" only to the host.
- **FR-009**: System MUST disable "Start Game" until ≥2 participants are in the room.

### Key Entities
- **Room**: Contains code, hostId, participants list, status.
- **Participant**: Has id, name, joinedAt.

## Edge Cases
- Empty or whitespace-only names rejected on both create and join.
- Non-existent room codes rejected with clear error.
- Room codes uppercased for consistent lookup.
- Maximum 10 participants per room.
