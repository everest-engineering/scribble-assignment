# Feature Specification: Scenario 1 Room Setup & Lobby

**Feature Branch**: `assignment`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Scenario 1 room setup and lobby with host tracking,
empty and invalid room code validation, room isolation, lobby polling every 2
seconds, and host-only game start requiring at least 2 players. Keep this
limited to Scenario 1 only. Exclude drawer assignment, secret word visibility,
drawing, guesses, scoring, results, and restart."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player creates a new game room and immediately becomes the host in the lobby.
The host can see who has joined and can only start the game when the room has
at least two players.

**Why this priority**: Creating a room and recognizing the host is the entry
point for the rest of the multiplayer flow.

**Independent Test**: Create a room in one browser tab, confirm the creator is
identified as the host, then verify the start action is unavailable until a
second player joins.

**Acceptance Scenarios**:

1. **Given** a player creates a new room, **When** the lobby opens, **Then** the
   creator is shown as the host for that room.
2. **Given** a host is alone in the lobby, **When** the host views the start
   control, **Then** the game cannot be started yet and the minimum player rule
   is communicated clearly.
3. **Given** a host has at least two players in the room, **When** the host
   starts the game, **Then** the room leaves the lobby state for all players in
   that room.

---

### User Story 2 - Player Joins by Room Code (Priority: P2)

A player joins an existing room using its code and receives clear feedback when
the code is empty or invalid.

**Why this priority**: Joining is required for multiplayer testing and must be
reliable before lobby behavior can be validated.

**Independent Test**: Try joining with an empty code, an unknown code, and a
valid code from a second browser tab.

**Acceptance Scenarios**:

1. **Given** a player submits an empty room code, **When** the join action is
   attempted, **Then** the player stays on the join flow and sees a clear
   validation message.
2. **Given** a player submits a room code that does not exist, **When** the join
   action is attempted, **Then** the player stays on the join flow and sees a
   clear invalid-room message.
3. **Given** a player submits a valid room code, **When** the join succeeds,
   **Then** the player enters that room's lobby and appears in that room's
   participant list.

---

### User Story 3 - Lobbies Stay Synced and Isolated (Priority: P3)

Players in a room see lobby updates automatically, while players in other rooms
see only their own room state.

**Why this priority**: Polling and room isolation are the core quality gates for
Scenario 1 and prevent cross-room confusion.

**Independent Test**: Run two rooms in parallel across multiple tabs, join
players to each room, and verify each lobby refreshes only its own participant
list within the expected refresh window.

**Acceptance Scenarios**:

1. **Given** a room lobby is open, **When** another player joins that same room,
   **Then** the participant list refreshes automatically within about 2 seconds
   without requiring a manual refresh action.
2. **Given** two different rooms exist at the same time, **When** players join
   or view either room, **Then** each room shows only its own participants and
   state.
3. **Given** a non-host player is in the lobby, **When** the player attempts to
   start the game, **Then** the action is blocked and the room remains in the
   lobby state.

### Edge Cases

- A player enters only whitespace into the room code field.
- A player tries to join with a room code from a different active room.
- The host tries to start the game before a second player has joined.
- A non-host player reaches the lobby after polling has refreshed and still must
  not gain host-only actions.
- Two rooms receive new joins at nearly the same time and each lobby must remain
  isolated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a unique room that opens in the lobby view
  when a player chooses to create a room.
- **FR-002**: The system MUST automatically mark the room creator as the host for
  that room.
- **FR-003**: The system MUST allow another player to join an existing room by
  entering a valid room code.
- **FR-004**: The system MUST reject empty or whitespace-only room codes with a
  clear validation message and without entering a room.
- **FR-005**: The system MUST reject unknown room codes with a clear invalid-room
  message and without entering a room.
- **FR-006**: The system MUST keep room membership and lobby state isolated by
  room so that activity in one room never appears in another room.
- **FR-007**: The lobby MUST refresh automatically about every 2 seconds while a
  player remains in that room's lobby.
- **FR-008**: The lobby MUST show the latest participant list for that room after
  each refresh.
- **FR-009**: Only the host MUST be allowed to start the game from the lobby.
- **FR-010**: The system MUST prevent game start until at least two players are
  present in the room and MUST communicate that rule clearly.
- **FR-011**: When the host starts the game with at least two players, the room
  MUST leave the lobby state for all players currently in that room.
- **FR-012**: This feature MUST exclude drawer assignment, secret word
  visibility, drawing, guesses, scoring, results, and restart behavior.

### Key Entities *(include if feature involves data)*

- **Room**: A multiplayer game session identified by a unique code, containing
  its current lobby state, its host, and its participants.
- **Player**: A participant who can create or join a room and who may be either
  the room host or a non-host member.
- **Lobby Snapshot**: The current room-specific view that players see before the
  game starts, including participant membership, host designation, and whether
  game start is currently allowed.

## Constraints & Non-Goals *(mandatory)*

- **CN-001**: Room updates in this scenario MUST arrive through scheduled
  refreshes rather than instant push-based updates.
- **CN-002**: Room data for this scenario MUST remain temporary for the current
  runtime only and is not expected to survive a service restart.
- **CN-003**: Players MUST be able to access rooms without sign-in, account
  creation, or identity verification features.
- **CN-004**: This feature MUST build on the existing starter experience without
  expanding into unrelated product areas.
- **CN-005**: The feature MUST keep room behavior deterministic and room state
  isolated whenever multiplayer state changes.
- **CN-006**: The scope is limited to Scenario 1 room setup and lobby behavior
  only.
- **CN-007**: Drawer assignment, word selection, word visibility, drawing,
  guesses, scoring, results, and restart flows are explicit non-goals for this
  specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-player validation session, a player who joins a valid room
  appears in the host's lobby view within 5 seconds without requiring a manual
  refresh.
- **SC-002**: In manual validation, 100% of empty or unknown room-code attempts
  keep the player out of a room and show actionable feedback.
- **SC-003**: In manual validation, hosts can start a room with two or more
  players on the first attempt, while non-hosts and single-player rooms are
  blocked every time they try.
- **SC-004**: In a validation session with at least two active rooms, no player
  ever sees participants or lobby state from another room.

## Assumptions

- Player-name trimming and empty-name validation are addressed in Scenario 2 and
  are out of scope for this specification.
- Room codes continue to use the starter application's existing format and
  uniqueness behavior.
- Starting the game from the lobby only needs to move players out of the lobby
  state for this scenario; the next-stage gameplay details are defined later.
- Players can keep at least two browser tabs open during multiplayer validation.

## Verification Plan *(mandatory)*

- Validate room creation in one browser tab and joining from a second tab.
- Validate empty and unknown room-code failures from the join flow.
- Validate that lobby membership refreshes automatically without manual action.
- Validate host-only start behavior with one player, two players, and a non-host
  participant.
- Validate room isolation by operating at least two rooms in parallel and
  confirming no cross-room leakage.
