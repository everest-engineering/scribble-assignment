# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-05

**Status**: Draft

**Input**: Business Scenario 1 — "Given a player wants to host or join a drawing
game, When they create or join a room via a unique code, Then the creator is
automatically the host; invalid/empty codes are rejected with clear feedback;
rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host
can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-05

- Q: How do non-hosts experience the Start control? → A: Hide the Start Game
  button entirely for non-hosts; show them a "Waiting for host to start…"
  message. Only the host renders a Start button (disabled until ≥2 players).
- Q: Where does the empty-code check live? → A: Client-side in JoinRoomPage —
  reject empty/whitespace before any request with "Room code is required". The
  backend continues to 404 unknown codes; no extra backend empty-code rule.
- Q: How is a transient 404/failure during lobby polling handled? → A: Keep the
  last known roster on screen and show a subtle status note; do not clear state
  or redirect on a single failed poll.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a room as host (Priority: P1)

A player opens the app, creates a room, and is automatically the host of a new,
empty-but-for-them room identified by a unique code they can share.

**Why this priority**: Hosting is the entry point for every game; without a host
and a shareable code, no multiplayer flow exists.

**Independent Test**: Create a room in one tab; confirm a unique code is shown,
the creator appears in the participant list marked as host, and the room is in the
`lobby` status.

**Acceptance Scenarios**:

1. **Given** the Start screen, **When** the player creates a room, **Then** a
   unique room code is generated and the creator is recorded as the host
   (`hostId` equals the creator's participant id).
2. **Given** a freshly created room, **When** the lobby loads, **Then** the host
   is shown in the participant list with a "(Host)" indicator.

---

### User Story 2 - Join a room by code with validation (Priority: P1)

A second player joins an existing room using its code, with clear, specific error
messages when the code is empty/whitespace or does not match a room.

**Why this priority**: A game needs at least two players; join validation is the
first place users hit errors, so feedback must be unambiguous.

**Independent Test**: From a second tab, attempt to join with (a) an empty code,
(b) a non-existent code, and (c) the valid code; confirm the specific messages and
that the valid case lands in the same room's lobby.

**Acceptance Scenarios**:

1. **Given** the Join screen, **When** the player submits an empty or
   whitespace-only code, **Then** the join is rejected with "Room code is
   required" and no request is made for a real room.
2. **Given** the Join screen, **When** the player submits a code that matches no
   room, **Then** the join is rejected with "Room not found — check your code and
   try again".
3. **Given** a valid existing code, **When** the player joins, **Then** they are
   added to that room's participant list and routed to the lobby.

---

### User Story 3 - Live lobby with host-only start (Priority: P2)

Players in the lobby see the roster update automatically (~2s polling), and only
the host can start the game, and only once at least 2 players are present.

**Why this priority**: Automatic refresh and a guarded start are what make the
lobby feel live and prevent premature/unauthorized starts.

**Independent Test**: With two tabs in the same room, confirm the second joiner
appears in the first tab within ~2s without manual refresh; confirm only the host
sees an enabled Start button, disabled until the second player arrives.

**Acceptance Scenarios**:

1. **Given** a host alone in the lobby, **When** a second player joins from
   another tab, **Then** the host's roster updates within ~2 seconds with no
   manual action.
2. **Given** the host is alone (1 player), **When** they view the lobby, **Then**
   the Start Game control is disabled.
3. **Given** ≥2 players are present, **When** the host views the lobby, **Then**
   the Start Game control is enabled for the host only; non-hosts never see an
   enabled Start control.

---

### Edge Cases

- Room codes are compared case-insensitively on the backend (the starter already
  upper-cases on join/fetch); a lowercase entry of a valid code still joins.
- Two rooms created back-to-back have distinct codes and fully isolated rosters —
  a join to room A never appears in room B.
- A participant who navigates directly to `/lobby` without a room in state is
  redirected to the Start screen (existing behavior, preserved).
- Polling continues only while the lobby is mounted; leaving the lobby stops the
  interval (no leaked timers).
- Backend restart clears all rooms (in-memory only); a stale code then returns
  the not-found message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Room model MUST include a `hostId` field, and `createRoom()`
  MUST set it to the creating participant's id.
- **FR-002**: The room snapshot returned to clients MUST include `hostId` so the
  frontend can identify the host.
- **FR-003**: Joining MUST reject an empty or whitespace-only room code on the
  client with the message "Room code is required" before any network request.
- **FR-004**: Joining a non-existent room MUST surface the message "Room not
  found — check your code and try again".
- **FR-005**: Rooms MUST be fully isolated: participants, host, and status of one
  room MUST never appear in another room's snapshot.
- **FR-006**: The lobby MUST poll `GET /rooms/:code` on an interval of
  approximately 2 seconds and update the displayed roster automatically, with the
  interval cleared on unmount.
- **FR-007**: The lobby participant list MUST visually mark the host with a
  "(Host)" indicator.
- **FR-008**: The Start Game control MUST be available only to the host and MUST
  be disabled until the room has at least 2 participants.
- **FR-009**: Non-host participants MUST NOT see a Start Game control at all; the
  lobby MUST instead show them a "Waiting for host to start…" message.
- **FR-010**: All synchronization MUST use HTTP polling only; no WebSockets or
  push.
- **FR-011**: A single failed/404 poll MUST NOT clear room state or redirect; the
  lobby MUST retain the last known roster and show a subtle status note.

### Key Entities

- **Room**: A game room identified by a unique `code`, with a `status` (`lobby`
  for this scenario), an ordered `participants` list, and a `hostId` referencing
  the host participant.
- **Participant**: A player in a room with an `id`, `name`, and `joinedAt`; the
  participant whose id equals the room's `hostId` is the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A created room always yields a unique code and a host equal to its
  creator (verifiable via the snapshot's `hostId`).
- **SC-002**: Empty/whitespace and unknown codes produce the two specified
  messages 100% of the time; valid codes join successfully.
- **SC-003**: A second joiner appears in an already-open lobby within ~2 seconds
  with no manual refresh.
- **SC-004**: Across two rooms, no participant from one room is ever visible in
  the other (0 cross-room leakage).
- **SC-005**: The Start Game control is enabled exclusively for the host and only
  at ≥2 players.

## Assumptions

- Room codes remain the existing 4-character uppercase alphabet generated by the
  starter; uniqueness is guaranteed by the existing `generateUniqueCode()`.
- Host is the room creator and does not transfer if the host leaves (leaving/host
  reassignment is out of scope for this scenario).
- "~2 seconds" polling means a 2000ms `setInterval`; minor jitter is acceptable.
- Player-name validation is owned by Scenario 2; this scenario assumes the
  starter's name handling and focuses on host/code/lobby behavior.
- The single-PR workflow keeps all scenarios on the `scribble-lab` branch; spec
  directories are numbered `001`–`004` without per-scenario git branches.
