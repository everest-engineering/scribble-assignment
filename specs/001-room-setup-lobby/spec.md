# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 1 (Room Setup & Lobby)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Game Room (Priority: P1)

A player who wants to host a drawing game creates a new room, receives a shareable room code,
and enters the lobby as the designated host.

**Why this priority**: Without room creation and host assignment, no game session can begin.
This is the entry point for the entire multiplayer flow.

**Independent Test**: A single player creates a room, lands on the lobby screen, sees themselves
listed as a participant, and is identified as the host. The room code is visible and shareable.

**Acceptance Scenarios**:

1. **Given** a player on the start screen, **When** they choose to create a room and submit a
   display name, **Then** a unique room code is generated, the player becomes the host, and they
   are navigated to the lobby.
2. **Given** a newly created room, **When** the host views the lobby, **Then** they see the room
   code, their name in the participant list, and a host indicator distinguishing them from guests.
3. **Given** two separate hosts each create a room, **When** both lobbies are viewed, **Then**
   each room has a distinct code and participant list with no cross-room visibility.

---

### User Story 2 - Player Joins an Existing Room (Priority: P2)

A player who received a room code enters their name and code to join an existing lobby.

**Why this priority**: Multiplayer requires at least one guest to join. Join validation prevents
confusion from bad codes and gives players actionable feedback.

**Independent Test**: Open a second browser tab, join using a valid code, and confirm the new
player appears in both tabs' participant lists after the lobby refreshes.

**Acceptance Scenarios**:

1. **Given** an active room with a known code, **When** a player submits a valid room code and
   display name, **Then** they join the room and land on the lobby participant list.
2. **Given** the join form, **When** a player submits an empty or whitespace-only room code,
   **Then** the join is rejected before any network request and a clear error message is shown.
3. **Given** the join form, **When** a player submits a room code that does not match any active
   room, **Then** the join is rejected and a clear error message explains the room was not found.
4. **Given** players in Room A and Room B, **When** a player joins Room B, **Then** they appear
   only in Room B's participant list and never in Room A's list.

---

### User Story 3 - Lobby Stays Synchronized (Priority: P3)

All players in a lobby see an up-to-date participant list without manually refreshing.

**Why this priority**: Manual refresh is error-prone in a multiplayer waiting room. Automatic
updates confirm joins in near real time and match player expectations for a shared lobby.

**Independent Test**: With two browser tabs in the same room, join from a third tab (or second
tab after host creates) and verify both existing tabs show the new participant within about
2 seconds without clicking refresh.

**Acceptance Scenarios**:

1. **Given** a player is on the lobby screen, **When** another player joins the same room,
   **Then** the lobby participant list updates automatically within approximately 2 seconds.
2. **Given** a player is on the lobby screen, **When** no changes occur in the room, **Then**
   the lobby continues polling at roughly 2-second intervals without disrupting the UI.
3. **Given** a player leaves the lobby screen, **When** they navigate away, **Then** polling
   stops to avoid unnecessary background activity.

---

### User Story 4 - Host Starts the Game When Ready (Priority: P4)

Only the host can start the game, and only when at least two players are present in the lobby.

**Why this priority**: Starting without enough players or without host control would break game
flow and fairness. This gates progression to Scenario 2.

**Independent Test**: With one player, confirm start is blocked for everyone. Add a second player,
confirm only the host can start; non-host sees the control disabled or hidden with explanatory copy.

**Acceptance Scenarios**:

1. **Given** a lobby with only the host (one participant), **When** any player views the lobby,
   **Then** the start-game action is unavailable and messaging explains at least two players are
   required.
2. **Given** a lobby with two or more participants, **When** the host activates start game,
   **Then** the session transitions toward gameplay (handoff to Scenario 2).
3. **Given** a lobby with two or more participants, **When** a non-host player views the lobby,
   **Then** they cannot activate start game and see messaging that only the host can start.
4. **Given** the host starts the game, **When** other participants are in the lobby, **Then** all
   participants are taken to the game experience together.

---

### Edge Cases

- What happens when a player submits a room code with mixed letter casing? Treat codes as
  case-insensitive for matching (e.g., `abcd` matches `ABCD`).
- What happens when the same display name is used by two players in one room? Both are listed as
  separate participants; duplicate names are allowed in this scenario.
- What happens when polling fails temporarily (network error)? Show a non-blocking error or status
  message; retry on the next poll interval without clearing the last known participant list.
- What happens when a player tries to start the game from a bookmarked game URL while still in
  lobby status? Redirect or block until the host starts via the lobby flow.
- What happens when the backend restarts and in-memory rooms are lost? Join and refresh attempts
  for that code fail with a clear not-found message (inherent to in-memory scope).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room and receive a unique, shareable
  room code.
- **FR-002**: System MUST designate the room creator as the host for the lifetime of that room
  session.
- **FR-003**: System MUST allow a player to join an existing room by entering a room code and
  display name.
- **FR-004**: System MUST reject join attempts with empty or whitespace-only room codes and
  display a clear, user-facing error message.
- **FR-005**: System MUST reject join attempts for room codes that do not match an active room
  and display a clear, user-facing error message.
- **FR-006**: System MUST keep room data fully isolated so participants in one room never appear
  in another room's lobby.
- **FR-007**: System MUST display the current participant list on the lobby screen for all
  connected players.
- **FR-008**: System MUST automatically refresh lobby state at approximately 2-second intervals
  while a player remains on the lobby screen.
- **FR-009**: System MUST stop automatic lobby refresh when the player navigates away from the
  lobby screen.
- **FR-010**: System MUST restrict the start-game action to the host only.
- **FR-011**: System MUST prevent starting the game until at least two participants are present
  in the lobby.
- **FR-012**: System MUST provide clear messaging when start-game is unavailable (non-host or
  insufficient players).
- **FR-013**: System MUST visually distinguish the host in the participant list.

### Key Entities

- **Room**: A isolated game session identified by a unique code, with a lifecycle status
  (lobby or later states), a host reference, and a list of participants.
- **Participant**: A player within a room, identified uniquely within that room, with a display
  name and join timestamp.
- **Host**: The participant who created the room; holds exclusive permission to start the game
  while the room is in lobby status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create a room and reach the lobby with a visible shareable code in
  under 30 seconds on a first attempt.
- **SC-002**: 100% of join attempts with empty or invalid room codes show a clear error message
  without entering the lobby.
- **SC-003**: When a new player joins, existing lobby viewers see the updated participant list
  within 3 seconds without manual refresh.
- **SC-004**: In two-browser testing, participants in separate rooms never see each other's
  names in their lobby lists.
- **SC-005**: Non-host players are unable to start the game in 100% of test attempts; the host
  can start only when at least two players are present.

## Assumptions

- Players identify themselves with a display name at create/join time; strict name trimming and
  empty-name rejection are deferred to Scenario 2.
- No authentication or accounts; identity is session-local via a participant identifier returned
  at create/join.
- Room state is in-memory only; rooms do not survive a server restart.
- Synchronization uses periodic refresh (polling), not push notifications.
- Room codes are short, human-shareable strings (consistent with the starter format).
- Starting the game transitions the room out of lobby status; detailed game-start behavior
  (drawer, word selection) belongs to Scenario 2.
- A manual refresh control may remain as a fallback but MUST NOT be the only way to see new
  participants.
