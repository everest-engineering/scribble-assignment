# Feature Specification: Room Lobby Access

**Feature Branch**: `001-room-lobby-access`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Given a player wants to host or join a drawing game, when they create or join a room via a unique code, then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-04

- Q: How isolated must rooms be in the backend store? → A: Rooms must be fully
  isolated in memory; actions in one room must never bleed into or affect any
  other room.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create or Join a Room (Priority: P1)

A player can create a new room or join an existing room with a code, and the
room identifies the creator as the host.

**Why this priority**: Room setup is the entry point for every multiplayer flow.

**Independent Test**: Create a room and verify the creator is the host. Join an
existing room with a valid code and verify the player is admitted to that room.

**Acceptance Scenarios**:

1. **Given** a player enters a name and creates a room, **When** the room is created, **Then** the player becomes the host of that room.
2. **Given** a player enters a valid room code, **When** they join the room, **Then** they are placed into that room and can see its current lobby state.

---

### User Story 2 - Validate Room Codes and Isolate Rooms (Priority: P2)

Players receive clear feedback when a room code is missing or invalid, and room
state stays separate between different rooms.

**Why this priority**: Incorrect room access and cross-room leakage would break
the multiplayer experience.

**Independent Test**: Try joining with an empty code and an invalid code, then
create two rooms and confirm their lobby contents do not mix.

**Acceptance Scenarios**:

1. **Given** a player submits an empty or invalid room code, **When** the join
   attempt is made, **Then** the player sees a clear error message and does not
   enter a room.
2. **Given** two different rooms exist, **When** players join one room or the
   other, **Then** each lobby shows only the players that belong to that room.

---

### User Story 3 - Polling Lobby and Host Start Rules (Priority: P3)

The lobby updates automatically at a steady interval, and only the host can
start the game once at least two players are present.

**Why this priority**: The game should stay current without manual refresh, and
the start action needs clear ownership rules.

**Independent Test**: Open the same room in two tabs and confirm the lobby
updates without manual refresh. Then verify that only the host can start the
game, and only after at least two players are present.

**Acceptance Scenarios**:

1. **Given** multiple players are in the same room, **When** the lobby is left
   open, **Then** the player list refreshes automatically about every 2 seconds.
2. **Given** fewer than 2 players are in a room, **When** the host tries to
   start the game, **Then** the game does not start.
3. **Given** 2 or more players are in a room, **When** a non-host tries to
   start the game, **Then** the game does not start.
4. **Given** 2 or more players are in a room, **When** the host starts the game,
   **Then** the room advances out of the lobby for all players in that room.

### Edge Cases

- A player enters only whitespace in the room code field.
- A player tries to join a room code that does not exist.
- Two rooms are created at the same time and their player lists remain separate.
- The lobby refreshes while a player joins or leaves.
- The host leaves before starting the game.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a room and assign that
  player as the host of the new room.
- **FR-002**: The system MUST allow a player to join an existing room using a
  unique room code.
- **FR-003**: The system MUST reject empty, whitespace-only, or invalid room
  codes with a clear, user-facing error message.
- **FR-004**: The system MUST keep each room's player list, lobby state, and
  all room actions fully isolated from every other room so changes in one room
  can never affect another room.
- **FR-005**: The system MUST refresh lobby state automatically without manual
  reload at a steady interval of about 2 seconds, with acceptable visibility
  within 1500-2500 ms.
- **FR-006**: The system MUST allow only the host to start the game.
- **FR-007**: The system MUST prevent the game from starting until at least 2
  players are present in the room.
- **FR-008**: The system MUST apply the start-game rules consistently for every
  player in the same room.

### Key Entities *(include if feature involves data)*

- **Room**: A shared game space identified by a unique code, with a host and a
  participant list.
- **Participant**: A person in a room with a display name and a role in the
  lobby or game flow.
- **Lobby State**: The current visible room state before the game starts,
  including who is present and whether the room can start.
- **Room Isolation**: The guarantee that a room's state, updates, and actions
  remain confined to that room only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new room creator is identified as the host in 100% of room
  creation flows.
- **SC-002**: Joining with an empty or invalid room code always produces a
  clear error instead of entering a room.
- **SC-003**: Players in different rooms never see each other's lobby members
  in normal use.
- **SC-004**: The lobby updates automatically without manual refresh, with
  changes becoming visible within 1500-2500 ms.
- **SC-005**: A non-host cannot start the game in any room.
- **SC-006**: The host cannot start the game until the room has at least 2
  players.

## Assumptions

- Room codes are unique within the running game session.
- The lobby refresh happens automatically while the player remains on the lobby
  screen.
- A clear error message is visible to the player when room entry fails.
- The host remains the host for the lifetime of the room unless the room is
  reset by the game flow.
