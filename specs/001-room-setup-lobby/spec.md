# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Scenario 1 — Room setup and lobby (README business scenarios, first one)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a room and become host (Priority: P1)

A player wants to host a drawing game. They create a new room, receive a unique room code
they can share, and are automatically recognized as the host. They land in a lobby that shows
themselves as the only participant so far.

**Why this priority**: Hosting is the entry point for every game. Without room creation and
host identity, no other lobby or gameplay behavior can exist. This is the minimum viable
slice — one person can start a room and see the lobby.

**Independent Test**: Create a room from the start screen, confirm a unique code is shown,
confirm the creator is marked as host, and confirm the lobby lists exactly one participant
(the host).

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they create a room, **Then** a unique
   room code is generated and they are taken to the lobby for that room.
2. **Given** a player who just created a room, **When** the lobby loads, **Then** they are
   identified as the host and appear as the only participant.
3. **Given** two players each create their own room, **When** their codes are compared,
   **Then** the codes are different and each room contains only its own creator.

---

### User Story 2 - Join an existing room by code (Priority: P1)

A second player has a room code shared by the host. They enter the code to join that room,
become a (non-host) participant, and land in the same lobby as the host.

**Why this priority**: A multiplayer game needs at least two players. Joining is required to
reach the 2-player minimum and to demonstrate room isolation. It is co-critical with creation.

**Independent Test**: With an existing room open, enter its code from a second browser/tab,
confirm the joiner lands in the lobby, is listed as a participant, and is not marked as host.

**Acceptance Scenarios**:

1. **Given** an existing room code, **When** a player submits that code to join, **Then**
   they are added to the room and taken to its lobby as a non-host participant.
2. **Given** a room with a host already present, **When** a second player joins, **Then** the
   room now has two participants and only the original creator remains the host.
3. **Given** a player attempts to join with a code that does not match any active room,
   **When** they submit, **Then** they receive clear feedback that the room was not found and
   are not taken to a lobby.

---

### User Story 3 - Join input validation with clear feedback (Priority: P2)

A player typing a room code may leave it blank, enter only spaces, or mistype it. The system
rejects invalid or empty codes with a clear, human-readable message instead of failing
silently or crashing.

**Why this priority**: Validation protects the join flow and is a graded edge-case
requirement, but it builds on the join flow (Story 2) already existing.

**Independent Test**: Attempt to join with (a) an empty code, (b) a whitespace-only code, and
(c) a well-formed but non-existent code; confirm each produces a distinct, clear message and
no navigation to a lobby.

**Acceptance Scenarios**:

1. **Given** the join form, **When** a player submits an empty code, **Then** they see a clear
   message that a code is required and remain on the join screen.
2. **Given** the join form, **When** a player submits a whitespace-only code, **Then** it is
   treated as empty and rejected with a clear message.
3. **Given** the join form, **When** a player submits a non-existent code, **Then** they see a
   clear "room not found" style message and remain on the join screen.

---

### User Story 4 - Lobby stays current via automatic refresh (Priority: P2)

Players waiting in a lobby see the participant list update on its own as others join, without
pressing a manual refresh button. Updates appear within roughly two seconds of a change.

**Why this priority**: Automatic refresh is the headline upgrade over the starter's manual
button and is required for a usable multiplayer lobby, but it depends on create/join existing.

**Independent Test**: Open a lobby in one tab, join the same room from a second tab, and
confirm the first tab's participant list shows the new player within ~2 seconds without any
manual action.

**Acceptance Scenarios**:

1. **Given** a host alone in a lobby, **When** another player joins from a separate tab,
   **Then** the host's participant list updates to include the new player within ~2 seconds.
2. **Given** a lobby with automatic refresh active, **When** no changes occur, **Then** the
   participant list remains stable and players are not disrupted.
3. **Given** a player leaves the lobby screen, **When** they navigate away, **Then** automatic
   refreshing for that view stops.

---

### User Story 5 - Host-only start with a two-player minimum (Priority: P1)

Only the host can start the game, and only once at least two players are present. Non-hosts
never see an enabled start control, and the host cannot start a one-person room.

**Why this priority**: This is the gate that ends the lobby phase and the explicit acceptance
condition of Scenario 1. It defines who controls progression and the minimum viable game size.

**Independent Test**: With one player, confirm the host cannot start. Add a second player and
confirm the host can now start, while the non-host never has an active start control.

**Acceptance Scenarios**:

1. **Given** a host alone in a lobby (one participant), **When** they look at the start
   control, **Then** starting is unavailable and a message explains at least two players are
   required.
2. **Given** a lobby with two or more participants, **When** the host chooses to start,
   **Then** the start action is available to them and succeeds.
3. **Given** a lobby with two or more participants, **When** a non-host player views the lobby,
   **Then** no start control is available to them.

---

### Edge Cases

- **Empty / whitespace-only room code on join**: treated as missing; rejected with a clear
  message; no navigation.
- **Non-existent room code**: rejected with a clear "room not found" message; no navigation.
- **Room code casing**: a code entered in a different letter case than displayed still resolves
  to the same room (codes are matched case-insensitively).
- **Multi-room isolation**: a participant joining room A never appears in room B; each room's
  participant list and host are independent.
- **Start with only one player**: blocked with a clear "need at least 2 players" message.
- **Non-host attempts to start**: no start capability is presented to non-hosts.
- **Backend restart**: because rooms are in-memory only, a previously valid code becomes
  "room not found" after a backend restart; the join flow surfaces this as a normal not-found
  message rather than a crash.
- **Transient refresh failure**: if a single automatic refresh cannot reach the backend, the
  lobby keeps the last known participant list and does not crash; refreshing resumes on the
  next cycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and MUST generate a unique room
  code for it that is distinct from every other active room.
- **FR-002**: System MUST automatically designate the player who creates a room as that room's
  host.
- **FR-003**: System MUST place the creator into the room's lobby as its first participant.
- **FR-004**: System MUST allow a player to join an existing room by submitting its code, and
  MUST add them to that room's lobby as a non-host participant.
- **FR-005**: System MUST match submitted room codes case-insensitively against active rooms.
- **FR-006**: System MUST reject an empty or whitespace-only room code on join with a clear,
  human-readable message, and MUST NOT navigate the player into a lobby.
- **FR-007**: System MUST reject a code that matches no active room with a clear "room not
  found" style message, and MUST NOT navigate the player into a lobby.
- **FR-008**: System MUST keep rooms fully isolated: a participant or action in one room MUST
  NOT appear in or affect any other room.
- **FR-009**: System MUST display the current list of participants for a room in its lobby.
- **FR-010**: System MUST automatically refresh the lobby participant list on a recurring
  cadence of approximately two seconds while a player is viewing the lobby, without manual
  action.
- **FR-011**: System MUST stop automatic lobby refreshing when the player navigates away from
  the lobby view.
- **FR-012**: System MUST present the ability to start the game only to the host.
- **FR-013**: System MUST allow the game to be started only when at least two participants are
  present in the room.
- **FR-014**: System MUST give clear feedback to the host when starting is unavailable because
  fewer than two participants are present.
- **FR-015**: System MUST NOT crash the lobby on a transient refresh or network failure; it
  MUST retain the last known participant list and resume on the next cycle.
- **FR-016**: System MUST keep all room state in memory only (no persistence), consistent with
  the project constitution.

### Key Entities *(include if feature involves data)*

- **Room**: A single game space identified by a unique, shareable code. Holds its status
  (currently "lobby"), its ordered list of participants, and a reference to which participant
  is the host. Exists only in memory for the lifetime of the backend process.
- **Participant**: A player within one room. Has a display identity and a flag/role indicating
  whether they are the host. Belongs to exactly one room.
- **Host**: The participant who created the room. Exactly one per room. Holds the exclusive
  ability to start the game once the participant minimum is met.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach its lobby as the identified host in a single
  action, 100% of the time.
- **SC-002**: Two independently created rooms always have different codes and never share
  participants (0% cross-room leakage across repeated trials).
- **SC-003**: When a second player joins a room, the first player's lobby reflects the new
  participant within approximately two seconds without any manual refresh.
- **SC-004**: 100% of empty, whitespace-only, and non-existent room-code join attempts are
  rejected with a clear message and produce no lobby navigation.
- **SC-005**: The host can start the game in 0% of cases with one participant and in 100% of
  cases with two or more participants; non-hosts can never start.
- **SC-006**: A room code entered in any letter casing resolves to the correct room 100% of the
  time.
- **SC-007**: The lobby never crashes the interface on a failed refresh; the last known
  participant list remains visible until the next successful refresh.

## Assumptions

- **Player names**: Detailed name validation (trimming, rejecting empty/whitespace names) is
  owned by Scenario 2 and is out of scope here; a participant is assumed to have some display
  identity on creation/join. This spec covers room-code validation, not name validation.
- **Single round / single game status**: Rooms only have a "lobby" status in this scenario;
  the in-game and result statuses are introduced by later scenarios.
- **Refresh cadence**: "Polling (~2s)" is interpreted as an automatic refresh approximately
  every two seconds; exact timing may vary slightly and is acceptable within that range.
- **Leaving a room**: Explicit "leave room" / participant removal is not a stated Scenario 1
  requirement; participants are assumed to remain until the backend clears state. Disconnect
  handling beyond stopping refresh on navigation is out of scope.
- **Room lifecycle / cleanup**: Active rooms live in memory; inactive-room cleanup is a
  constitutional concern but no explicit expiry policy is required by Scenario 1.
- **"Start the game" outcome**: This scenario covers the precondition and availability of the
  start action (host-only, 2+ players). What happens after starting — drawer assignment, word
  selection — is owned by Scenario 2.
- **Code format**: Room codes are short, shareable, and unique; exact length/alphabet follows
  the existing starter behavior and is not re-specified here.
