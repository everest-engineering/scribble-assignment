# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Create a specification for Scenario 1: Room Setup & Lobby. Requirements: room creator becomes host; players can join using room code; lobby automatically refreshes through polling (~2 seconds); host can start the game; minimum 2 players required before starting; non-host players cannot start the game; room state remains synchronized across browser tabs."

## Clarifications

### Session 2026-06-05

- Q: When the host starts the game in this feature group, what is the expected outcome? → A: Validate host + 2-player rule, set room status to started, transition all players to the game screen; drawer assignment and secret word selection are deferred to Group 2 (Scenario 2).
- Q: How do non-host players reach the game screen after the host starts? → A: Non-host tabs detect the room status change on their next poll (~2s) and auto-navigate to the game screen; no extra action is required from the joiner.
- Q: How should the room code be presented in the lobby? → A: Always display the canonical uppercase code as stored/generated, regardless of how a user typed it when joining.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room (Priority: P1)

A player opens the app, chooses to create a room, gives a name, and lands in a lobby that shows a
unique room code they can share. As the creator, they are the host of that room.

**Why this priority**: Hosting is the entry point for every game; nothing else can happen without a
room and a designated host.

**Independent Test**: Create a room in one browser tab and confirm a lobby appears showing a unique
code and the creator identified as host.

**Acceptance Scenarios**:

1. **Given** a player on the create screen, **When** they create a room, **Then** a new room with a
   unique code is created, the creator is added as the first participant, and they are marked as the
   host.
2. **Given** a room was just created, **When** the lobby loads, **Then** the room code is displayed
   in its canonical uppercase form and the host is visually identified in the participant list.
3. **Given** two rooms created in succession, **When** their codes are compared, **Then** the codes
   are different (codes are unique among active rooms).

---

### User Story 2 - Player joins a room by code (Priority: P1)

A second player enters an existing room code and joins that room, landing in the same lobby as the
host.

**Why this priority**: A drawing game needs at least two people; joining is required for any match.

**Independent Test**: With a room already created, join it from a second tab using its code and
confirm both tabs resolve to the same room.

**Acceptance Scenarios**:

1. **Given** an existing room code, **When** a player joins with it, **Then** they are added to that
   room's participant list and taken to its lobby.
2. **Given** a room code typed in lowercase or with surrounding spaces, **When** a player joins,
   **Then** the code is normalized and the correct room is found.
3. **Given** a non-existent room code, **When** a player tries to join, **Then** they are not added
   to any room and see a clear "room not found" message.
4. **Given** an empty or whitespace-only room code, **When** a player tries to join, **Then** the
   attempt is rejected with a clear validation message and no join occurs.

---

### User Story 3 - Lobby stays in sync via polling (Priority: P2)

While waiting in the lobby, every player sees the participant list update on its own as others join,
without pressing a button, so all browser tabs show the same room state.

**Why this priority**: Manual refresh is the starter's behavior; automatic, synchronized updates are
the visible proof the lobby is "live" and are explicitly required by Scenario 1.

**Independent Test**: Open the lobby in tab 1, join from tab 2, and confirm tab 1 shows the new
player within about 2 seconds with no manual action.

**Acceptance Scenarios**:

1. **Given** a host alone in a lobby, **When** a second player joins from another tab, **Then** the
   host's lobby shows the second player within about 2 seconds with no manual refresh.
2. **Given** two tabs in the same room, **When** the participant list changes, **Then** both tabs
   converge on the same list within about one polling interval.
3. **Given** a player leaves the lobby screen, **When** they navigate away, **Then** polling stops
   for that screen (no further background requests).
4. **Given** a transient fetch failure during polling, **When** the next poll succeeds, **Then** the
   lobby recovers and shows the current participant list without crashing.

---

### User Story 4 - Host-only start with a 2-player minimum (Priority: P1)

Only the host can start the game, and only once at least two players are present. Non-hosts never see
an enabled start control.

**Why this priority**: This is the gate between the lobby and the game; it enforces the core rule of
Scenario 1 and prevents invalid single-player games.

**Independent Test**: As host with one player, confirm start is disabled; add a second player, confirm
start becomes available to the host only; confirm a non-host can never start.

**Acceptance Scenarios**:

1. **Given** a host alone in a room, **When** they view the lobby, **Then** the start control is
   disabled and explains that at least 2 players are required.
2. **Given** a room with 2+ players, **When** the host views the lobby, **Then** the host can start
   the game.
3. **Given** a room with 2+ players, **When** a non-host views the lobby, **Then** they have no
   enabled start control and see that they are waiting for the host.
4. **Given** a non-host attempts to start anyway, **When** the request is processed, **Then** it is
   rejected with a clear "only the host can start" message.
5. **Given** a host attempts to start with fewer than 2 players, **When** the request is processed,
   **Then** it is rejected with a clear "need at least 2 players" message.
6. **Given** a valid start by the host with 2+ players, **When** start succeeds, **Then** the room
   status changes from lobby to started and all participants in that room are taken to the game
   screen (drawer role and secret word are not assigned in this group).
7. **Given** a non-host waiting in the lobby, **When** the host starts the game, **Then** the
   non-host's tab observes the started status on its next poll (within about 2 seconds) and
   auto-navigates to the game screen with no extra action.

---

### Edge Cases

- **Empty/whitespace room code on join** → rejected with a clear message; no room is changed.
- **Wrong-case or padded room code** → normalized (trimmed, case-insensitive) before lookup; lobby
  always shows the canonical uppercase code.
- **Non-existent room code** → "room not found"; the player stays on the join screen.
- **Two rooms with different players** → fully isolated; a participant or action in room A never
  appears in room B (multi-room isolation).
- **Start pressed at exactly 1 player** → blocked with the 2-player-minimum message.
- **Non-host triggers start** → blocked at the source of truth, not merely hidden in the UI.
- **Polling continues after navigation away** → must not happen; polling is scoped to the lobby.
- **Transient sync failure** → a single failed refresh does not crash the lobby or wipe the list.
- **Start while in lobby** → room status becomes started; no drawer or secret word is set (Group 2).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a room with a unique, shareable code and add the creator as its
  first participant.
- **FR-002**: The system MUST record the host of a room as the participant who created it.
- **FR-003**: The room view provided to clients MUST convey which participant is the host.
- **FR-004**: The system MUST let a player join an existing room by its code and add them to that
  room's participant list.
- **FR-005**: The system MUST normalize submitted room codes (trim surrounding whitespace,
  case-insensitive match) before looking up a room.
- **FR-005a**: The lobby MUST display the room code in its canonical uppercase form as stored,
  regardless of how a user typed the code when joining.
- **FR-006**: The system MUST reject a join to a non-existent room with a clear, user-facing message
  and make no change to any room.
- **FR-007**: The system MUST reject an empty or whitespace-only room code with a clear validation
  message and perform no join.
- **FR-008**: The system MUST keep rooms fully isolated: participants and actions in one room MUST
  never affect or appear in another room.
- **FR-009**: The lobby MUST refresh the participant list automatically about every 2 seconds while
  the lobby is open, with no manual action required.
- **FR-010**: The lobby MUST stop refreshing when the lobby screen is no longer active.
- **FR-011**: All tabs viewing the same room MUST converge on the same participant list within about
  one refresh interval.
- **FR-012**: The system MUST allow only the host to start the game.
- **FR-013**: The system MUST allow starting only when at least 2 participants are present.
- **FR-014**: The system MUST reject a non-host start attempt with a clear message, enforced at the
  source of truth and not only hidden in the UI.
- **FR-015**: The system MUST reject a host start attempt with fewer than 2 players with a clear
  message.
- **FR-016**: The lobby MUST present the start control as enabled only for the host and only when the
  2-player minimum is met; otherwise it MUST explain why start is unavailable.
- **FR-017**: On a successful start, the system MUST change the room status from lobby to started and
  MUST move all participants in that room to the game screen. Non-host clients MUST detect the
  started status via their lobby polling (within about one ~2s interval) and auto-navigate to the
  game screen without any additional action.
- **FR-018**: A successful start in this group MUST NOT assign a drawer role or select a secret word;
  those behaviors belong to Group 2 (Game start & drawer flow).
- **FR-019**: The interface MUST not crash on errors during create, join, or refresh; it MUST surface
  a readable message and keep functioning.

### Key Entities

- **Room**: A game space identified by a unique code. Has a status (lobby or started in this group),
  a host (one participant), and an ordered list of participants. Rooms are independent of one another.
- **Participant**: A player within a room, with a stable identifier assigned at create/join time, a
  display name, and an indicator of whether they are the host.
- **Room View**: The representation of a room shown to a client, conveying the code, status,
  participant list, and which participant is the host.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can create a room and reach the lobby in a single action, every time.
- **SC-002**: 100% of newly created rooms have a code distinct from all currently active rooms.
- **SC-003**: After a second player joins, every tab in that room reflects the new participant within
  about 2 seconds without any manual refresh.
- **SC-004**: 100% of invalid join attempts (empty, whitespace-only, or unknown code) are rejected
  with a clear message and cause no room changes.
- **SC-005**: Across two simultaneously active rooms, no participant or action ever leaks between them
  (zero cross-room contamination).
- **SC-006**: Starting the game succeeds only for the host with at least 2 players; every other start
  attempt is blocked with an explanatory message.
- **SC-007**: After a successful start, every participant in the room reaches the game screen and the
  room status is started, without drawer or secret word being assigned.

## Assumptions

- The room creator is the host for the lifetime of the room (no host transfer in this lab).
- A participant's identity is the identifier returned at create/join time, held by the client; there
  is no authentication or persistence.
- Polling at about 2 seconds is an acceptable synchronization mechanism (real-time push is out of
  scope).
- Room codes are short, human-shareable strings; uniqueness is enforced among currently active rooms
  only (state is in-memory and cleared on restart).
- "At least 2 players" counts all current participants in the room, including the host.
- Start in this group only gates the lobby-to-game transition (status + navigation); drawer assignment
  and secret word selection are implemented in Group 2.
