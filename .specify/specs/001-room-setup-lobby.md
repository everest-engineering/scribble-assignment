# Feature Specification: Room Setup & Lobby

**Feature Group**: 001 — Room Setup & Lobby
**Created**: 2026-06-09
**Status**: Draft
**Input**: Business Scenario 1 — Room Setup & Lobby

---

## Problem Statement

The starter provides basic room creation and joining but lacks host tracking,
join validation, automatic polling, and host-gated game start. Two browser tabs
can join the same room but must manually refresh to see new participants. Any
participant can click "Start Game" regardless of host status or player count.

This feature group addresses the room lifecycle from creation through lobby
waiting, ensuring rooms are isolated, joinable only with valid inputs, and
that the host controls when the game begins.

---

## User Story

### User Story — Room Setup & Lobby (Priority: P1)

A player wants to host or join a private drawing game session. After creating
or joining a room, they wait in a lobby that automatically shows new
participants. Only the room creator (host) can start the game, and only when
at least two players are present.

**Why this priority**: P1 — Every subsequent feature group (drawer flow,
gameplay, results) depends on this foundation. Without rooms, hosting, and
lobby sync, no game can begin.

**Independent Test**: Two browser tabs can create a room, join it, see each
other appear in the lobby within approximately 2 seconds, and verify that
only the host can start the game.

---

## Functional Requirements

### FR-001: Room Creation
The system MUST allow a player to create a new room by providing a display
name. The creator MUST be designated as the host. The system MUST generate a
unique room code and return it to the creator.

### FR-002: Room Joining
The system MUST allow a second player to join an existing room by providing a
room code and a display name.

### FR-003: Code Validation
The system MUST reject room join attempts with invalid codes and provide a
clear error message distinguishing between:
- Empty or blank room codes
- Room codes that do not match any existing room

### FR-004: Name Validation
The system MUST reject empty or whitespace-only display names for both room
creation and room joining, with a clear error message.

### FR-005: Room Isolation
The system MUST ensure that participants in one room cannot see or interact
with participants or state in any other room.

### FR-006: Lobby Polling
While a participant is in the lobby, the system MUST automatically refresh
the room state at approximately 2-second intervals to reflect new joiners.

### FR-007: Host-Gated Start
The system MUST allow only the host (room creator) to start the game. If a
non-host participant attempts to start the game, the system MUST reject the
action with a clear message.

### FR-008: Minimum Player Requirement
The system MUST prevent starting the game when fewer than 2 participants are
present in the room. If the host attempts to start with only 1 participant,
the system MUST reject the action with a clear message.

### FR-009: Host Status Visibility
The system MUST indicate to all participants which participant is the host.

---

## Acceptance Criteria

The following criteria use the EARS (Easy Approach to Requirements Syntax)
notation where applicable.

### Room Creation

- **AC-001 (Response)**: When a player submits a valid display name, the
  system shall create a new room, designate the player as host, and return a
  unique room code.
- **AC-002 (Universal)**: Every room code shall be unique across all active
  rooms.
- **AC-003 (Universal)**: Every room code shall be exactly 4 alphanumeric
  characters, using only uppercase letters and digits.
- **AC-004 (Response)**: When a player submits an empty or whitespace-only
  display name, the system shall reject room creation with a clear error
  message.

### Room Joining

- **AC-005 (Response)**: When a player submits a valid room code and a valid
  display name, the system shall add the player to the room and return the
  current room state.
- **AC-006 (Response)**: When a player submits a room code that does not match
  any existing room, the system shall reject the join attempt with a clear
  error message stating the room was not found.
- **AC-007 (Response)**: When a player submits an empty or blank room code,
  the system shall reject the join attempt with a clear error message stating
  that a room code is required.
- **AC-008 (Universal)**: Joining a room shall never remove or affect existing
  participants in that room.
- **AC-009 (Universal)**: All join errors shall include a human-readable
  message describing what was invalid.

### Name Validation

- **AC-010 (Universal)**: Display names shall be trimmed of leading and
  trailing whitespace before acceptance.
- **AC-011 (Universal)**: A display name consisting only of whitespace after
  trimming shall be treated as empty and rejected.
- **AC-012 (Universal)**: The empty string shall be rejected as a display name
  for both room creation and room joining.

### Room Isolation

- **AC-013 (State)**: While in Room A, a participant shall never receive
  data from Room B through any room-scoped API call.
- **AC-014 (State)**: While in Room A, a participant shall not be able to
  join or interact with Room B without explicitly submitting Room B's code.
- **AC-015 (Universal)**: Room codes from different rooms shall always be
  distinct.

### Lobby Polling

- **AC-016 (State)**: While the lobby page is displayed and the participant
  has an active room session, the system shall automatically fetch the
  current room state at approximately 2-second intervals.
- **AC-017 (Response)**: When a new participant joins the room, the lobby
  display shall reflect the updated participant list within approximately
  3 seconds of the join occurring.
- **AC-018 (Response)**: If a polling request fails, the system shall
  continue polling rather than stopping permanently.
- **AC-019 (State)**: While a polling request is in flight, the system
  shall not initiate a new request for the same room.

### Host Control

- **AC-020 (Response)**: When the host requests to start the game with 2
  or more participants present, the system shall transition the room to a
  playing state and return success.
- **AC-021 (Response)**: When a non-host participant requests to start the
  game, the system shall reject the action with a clear error message stating
  that only the host can start.
- **AC-022 (Response)**: When the host requests to start the game with fewer
  than 2 participants, the system shall reject the action with a clear error
  message stating that at least 2 players are required.
- **AC-023 (State)**: While the room is in the lobby state, the host status
  shall be visible to all participants in the participant list.

---

## Edge Cases

- A player creates a room and closes their browser before anyone joins.
  Remaining participants should not be affected. The room continues to exist.
- Two players attempt to join the same room simultaneously with the same
  display name. Both should be allowed (display names are not required to be
  unique).
- A player joins a room, then the host closes their browser. The game cannot
  start (no host to trigger it), but the room still exists with remaining
  participants.
- A player enters a room code in lowercase. The system should accept it
  case-insensitively (matching is done on uppercase).
- A player enters a room code with extra spaces. The system should trim the
  input before validation.
- Network errors during polling should not crash the lobby page or reset
  the participant's session.
- A player navigates away from the lobby and back. The room state should
  still be accessible from the current session.

---

## Non-Goals

The following are explicitly NOT in scope for this feature group:

- Implementing game logic (rounds, drawing, guessing, scoring)
- Assigning drawer or guesser roles
- Selecting or revealing secret words
- Canvas or drawing interaction
- Guess submission or validation
- Round results or restart
- Player reconnection after disconnect
- Player removal from a room
- Room deletion or expiry
- Rate limiting on API endpoints

---

## Success Criteria

| ID | Criterion | Verification Method |
|---|---|---|
| SC-001 | Two browser tabs can create and join the same room and see each other in the participant list within approximately 3 seconds | Manual test with two browser tabs |
| SC-002 | Joining with an invalid or empty room code displays a clear error message and does not navigate to the lobby | Manual test with invalid input |
| SC-003 | Joining with an empty or whitespace-only name displays a clear error message and does not navigate to the lobby | Manual test with empty/whitespace name |
| SC-004 | Only the host sees an enabled "Start Game" button (or equivalent control); non-hosts see a disabled button or no button at all | Manual test with two browser tabs |
| SC-005 | The host cannot start the game when only 1 participant is in the room; an error message is displayed | Manual test with single-player room |
| SC-006 | Two rooms created independently show no cross-room data leakage | Manual test: create two rooms, verify each shows only its own participants |
| SC-007 | Existing unit tests continue to pass | Run `npm test` in backend directory |

---

## Key Entities

- **Room**: A game session identified by a unique 4-character code. Contains
  participants, status, and metadata. The host is the participant who created
  the room.
- **Participant**: A player in a room, identified by a unique participant ID
  and a display name. May have host status.
- **Room Status**: Represents the current phase of the room (e.g., lobby,
  playing, finished). This feature group is concerned only with the "lobby"
  status and the transition out of lobby.

---

## Assumptions

- Display names are not required to be unique within a room.
- Room codes are generated using the existing scheme (4 characters, uppercase
  letters and digits, excluding ambiguous characters like 0/O/1/I).
- The existing `structuredClone` defensiveness in room operations is preserved.
- HTTP polling (not WebSockets) is the only synchronization mechanism.
- Two browser tabs on the same machine simulate two distinct players.
- Player session is maintained in frontend state (no authentication or
  persistent sessions).
