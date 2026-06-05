# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-scribble-game`

**Created**: 2026-06-05

**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — Create a Room and Become Host (Priority: P1)

A player opens the app, creates a room with their name, and is automatically designated
as the host. They land on the lobby screen showing their name and a shareable room code.

**Why this priority**: Room creation is the entry point to the entire game. Without it,
no other scenario can begin.

**Independent Test**: Open one tab, create a room. Confirm you land on the lobby, see
your name in the participant list, and see a Start Game button that is disabled.

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **When** they enter a non-empty name and
   click Create Room, **Then** a unique 4-character room code is issued, the player is
   recorded as host, and they land on the Lobby screen showing their name.

2. **Given** a player submits a name that is whitespace-only, **When** they attempt to
   create a room, **Then** the system rejects the input and shows a message asking for a
   non-empty name.

3. **Given** the host is the only participant, **When** they view the Lobby, **Then** the
   Start Game button is visible but disabled (or absent).

---

### User Story 2 — Join a Room by Code (Priority: P1)

A second player enters the room code and their name to join an existing room. After joining
they land on the lobby and see themselves alongside the host.

**Why this priority**: Joining is the complementary half of room creation; both are
needed before any game can start.

**Independent Test**: Open a second tab, join the room created in User Story 1 using the
correct code and a non-empty name. Confirm both participants appear in the lobby.

**Acceptance Scenarios**:

1. **Given** a room exists, **When** a second player enters the correct code and a
   non-empty name and clicks Join, **Then** they land on the Lobby screen and both
   participants are listed.

2. **Given** a player submits a whitespace-only name, **When** they attempt to join,
   **Then** the system rejects the input with a visible message and stays on the Join
   screen.

3. **Given** a player enters a blank or non-existent room code, **When** they submit
   the form, **Then** a clear error message is shown and they remain on the Join screen.

---

### User Story 3 — Lobby Auto-Refresh (Priority: P2)

The lobby participant list updates automatically at approximately 2-second intervals so
all players see who has joined without pressing a button.

**Why this priority**: Polling is required for the host to know when they can start and
for joiners to see their own presence confirmed — but it is layered on top of the
create/join flows already working.

**Independent Test**: Host tab is open on lobby. Join from a second tab. Within 2 seconds
the host tab shows the new participant without any manual action.

**Acceptance Scenarios**:

1. **Given** the host is on the Lobby screen, **When** a second player joins the room,
   **Then** within approximately 2 seconds the host's lobby shows both participants
   without manual refresh.

2. **Given** two players are in the lobby, **When** the lobby polling fires, **Then** both
   screens stay in sync with the server's participant list.

---

### User Story 4 — Host-Only Start with Minimum Players (Priority: P2)

Once at least 2 players are in the lobby, only the host can start the game. Non-host
players see no actionable Start button.

**Why this priority**: This is the gate between Scenario 1 and Scenario 2; it must work
before game-start logic is built.

**Independent Test**: With 2 players in the lobby, confirm the Start Game button is
enabled in the host tab and absent (or non-interactive) in the joiner tab. Click Start in
the host tab and confirm both tabs navigate to the game screen.

**Acceptance Scenarios**:

1. **Given** 2 or more players are in the lobby, **When** the host views the lobby,
   **Then** the Start Game button is enabled.

2. **Given** 2 or more players are in the lobby, **When** a non-host player views the
   lobby, **Then** they see no Start Game button or it is non-interactive.

3. **Given** the Start Game button is enabled, **When** the host clicks it, **Then** all
   players in the room navigate to the game screen.

---

### Edge Cases

- A player enters a room code in the wrong case — codes are matched exactly as issued;
  the Join screen should display the code in the canonical form to avoid confusion.
- Two players create rooms simultaneously — each gets a distinct room code; their
  participants are fully isolated.
- The host refreshes the page while on the lobby — the room and participant list survive
  as long as the backend is running (in-memory state); no reconnect mechanism is required.
- A player tries to join with a name that becomes empty after trimming — treated the same
  as a blank name: rejected with a message.
- The lobby polling call fails (network error or server error) — the UI MUST display an
  inline error message on the lobby screen and keep the polling interval running so the
  error clears automatically on the next successful poll.
- A player tries to join a room that is already active (game has started) — the join
  MUST be rejected with a visible error message "Game already started"; the player
  remains on the Join screen.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST assign the room creator as host and store that association
  with the room.
- **FR-002**: The system MUST reject player names that are empty or whitespace-only and
  display a visible error message.
- **FR-003**: Player names MUST be trimmed of leading and trailing whitespace before
  storage; a name that is empty after trimming MUST be rejected.
- **FR-004**: The lobby participant list MUST refresh automatically at approximately a
  2-second interval without user action. If a polling call fails, the UI MUST show an
  inline error message and continue retrying; the error MUST clear on the next
  successful poll.
- **FR-005**: The Start Game button MUST be visible and interactive only for the host
  and only when 2 or more players are present in the room.
- **FR-006**: Non-host players MUST NOT see an interactive Start Game button.
- **FR-007**: Clicking Start Game MUST transition all players in the room to the game
  screen.
- **FR-008**: Room codes MUST be 4 characters and unique across all active rooms.
- **FR-009**: Rooms MUST be isolated — joining or starting one room MUST NOT affect
  another.
- **FR-010**: The system MUST return a clear error response when a join is attempted
  with a non-existent room code.
- **FR-011**: The system MUST reject a join attempt on a room whose status is `"active"`
  with the message "Game already started"; the player MUST remain on the Join screen.

### Key Entities

- **Room**: Code (4-char), status (`lobby` | `active`), participant list, host participant
  id (`hostId`), created/updated timestamps.
- **Participant**: Id, display name (trimmed), join timestamp. Host identity is carried
  on the Room via `hostId`, not as a flag on Participant.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A host and a second player can create and join a room and both see each
  other in the lobby within one browser session.
- **SC-002**: The lobby participant list updates on all connected screens within 3 seconds
  of a new player joining, without any manual action.
- **SC-003**: 100% of the acceptance scenarios in this spec pass when tested manually
  with two browser tabs.
- **SC-004**: All invalid inputs (empty/whitespace name, bad room code) produce a visible
  error message without leaving the current screen.
- **SC-005**: Two rooms created in the same session have no shared participants or state.

---

## Clarifications

### Session 2026-06-05

- Q: When the lobby polling call fails, what should the UI do? → A: Show an inline error message on the lobby; keep the interval running so it auto-recovers.
- Q: If a player tries to join a room where the game has already started, what should happen? → A: Reject the join with a visible error "Game already started" — player stays on the Join screen.

---

## Assumptions

- All room state is in-memory; restarting the backend resets all rooms.
- The frontend stores the `participantId` received at create/join time in local component
  state for the duration of the session; no persistent login is needed.
- Polling for lobby refresh reuses the existing `GET /rooms/:code` endpoint.
- The host is always the first participant — the one who called `POST /rooms`.
- Room codes are generated by the backend; the frontend displays them as-is.
- The "Start Game" navigation destination is the existing `/game` route already in the
  starter; this spec does not cover what happens on the game screen.
