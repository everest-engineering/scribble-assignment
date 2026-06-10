# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Room Setup & Lobby — Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Creates a Room (Priority: P1)

A player opens the app, enters their name, and creates a new room. They automatically become the
host and are taken to the lobby. The room code is displayed prominently so they can share it.

**Why this priority**: Without room creation the entire game is blocked; host identity is the
foundation for all subsequent gating logic.

**Independent Test**: A single user can create a room and land in the lobby with the room code
visible and their name listed as the only participant.

**Acceptance Scenarios**:

1. **Given** the player provides a non-empty, non-whitespace-only name, **When** they submit the
   create form, **Then** a room is created, the player is stored as host, and the lobby displays
   their name with a "Host" label.
2. **Given** the player submits an empty or whitespace-only name, **When** they submit the create
   form, **Then** the form is rejected with the message "Name cannot be empty."
3. **Given** a room is created, **When** two rooms are created independently, **Then** each has
   a unique 4-character code and participant lists are fully isolated from each other.

---

### User Story 2 — Guest Joins a Room (Priority: P1)

A player enters their name and a room code shared by the host. They join the room and are taken to
the lobby where all current participants are visible.

**Why this priority**: Multi-player is the core value; joining must work before any game can be
played.

**Independent Test**: A second user can join an existing room using its code and see both names
in the participant list.

**Acceptance Scenarios**:

1. **Given** a valid room code and a non-empty name, **When** the guest submits the join form,
   **Then** they are added to the room and the lobby shows all participants.
2. **Given** an empty room code, **When** the guest submits, **Then** the form is rejected with
   the message "Room code cannot be empty."
3. **Given** a non-existent room code, **When** the guest submits, **Then** the form is rejected
   with the message "Room not found."
4. **Given** a valid code but an empty or whitespace-only name, **When** the guest submits,
   **Then** the form is rejected with the message "Name cannot be empty."

---

### User Story 3 — Lobby Auto-Refreshes (Priority: P2)

Once in the lobby, all participants see an up-to-date list of players without manually clicking
Refresh. New joiners appear within approximately 2 seconds of joining.

**Why this priority**: Without polling, the host would never see new players arrive, blocking game
start. Manual refresh is insufficient for a fluid multi-player experience.

**Independent Test**: With two browser tabs open on the same lobby, adding a player in one tab
causes their name to appear in the other tab within ~2 seconds — without any user interaction.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the same room, **Then** the
   first player's lobby updates to show the new participant within approximately 2 seconds.
2. **Given** the lobby is auto-polling, **When** the room is unchanged, **Then** the UI does not
   flicker or reload visibly.

---

### User Story 4 — Host-Only Game Start (Priority: P2)

Only the host can start the game. The Start button is visible only to the host and is disabled
until at least 2 players are present.

**Why this priority**: Without host-gating, any player could accidentally start the game; without
the 2-player minimum, a solo player would start a broken game.

**Independent Test**: The host sees a disabled Start button with fewer than 2 players; the button
enables at exactly 2 players. A non-host participant does not see a Start button at all.

**Acceptance Scenarios**:

1. **Given** the host is alone in the lobby, **When** the lobby renders, **Then** the Start
   button is present but disabled, with a hint such as "Need at least 2 players."
2. **Given** a second player joins, **When** the lobby refreshes, **Then** the Start button
   becomes enabled for the host.
3. **Given** a non-host participant is in the lobby, **When** the lobby renders, **Then** no
   Start button is visible to them.
4. **Given** the host clicks Start with ≥2 players, **When** the action is confirmed, **Then**
   all players in the room are transitioned to the game screen.

---

### Edge Cases

- What happens if a player submits a room code in lowercase? → Code matching must be
  case-insensitive.
- What if two players create rooms simultaneously and get the same code? → Codes must be unique;
  collision is resolved by regenerating.
- What if the host leaves the lobby before starting? → Out of scope for this scenario (no
  host-transfer logic required).
- What if a player refreshes the page mid-lobby? → Out of scope; no session persistence required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a player creates a room, they MUST be recorded as the host of that room.
- **FR-002**: Player names MUST be trimmed of leading/trailing whitespace before use.
- **FR-003**: Empty or whitespace-only player names MUST be rejected with the message
  "Name cannot be empty."
- **FR-004**: An empty or whitespace-only room code on join MUST be rejected with the message
  "Room code cannot be empty."
- **FR-005**: A non-existent room code on join MUST be rejected with the message "Room not found."
- **FR-006**: Room code matching MUST be case-insensitive.
- **FR-007**: The lobby MUST poll the room state automatically at approximately 2-second intervals.
- **FR-008**: The Start button MUST only be visible to the host.
- **FR-009**: The Start button MUST be disabled when fewer than 2 players are in the room.
- **FR-010**: The Start button MUST be enabled when 2 or more players are present.
- **FR-011**: Rooms MUST be isolated: participant lists from different rooms MUST NOT merge or
  bleed into each other.

### Key Entities

- **Room**: has a unique code, a host (first participant), a status (`lobby` | `active` |
  `completed`), and a list of participants.
- **Participant**: has a unique id, a trimmed display name, and a `joinedAt` timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby in under 3 seconds on a local network.
- **SC-002**: A second player can join using the room code and appear in the host's lobby within
  2 seconds of joining (via auto-polling).
- **SC-003**: 100% of empty-name and empty-code submissions are rejected before reaching the
  server (client-side validation), with a visible error message.
- **SC-004**: The Start button becomes enabled exactly when 2 or more players are present and is
  never visible to non-host players.
- **SC-005**: Two rooms created simultaneously maintain completely separate participant lists with
  no cross-room data leakage.

## Assumptions

- Session persistence (page refresh recovery) is out of scope.
- There is no host-transfer mechanism; if the host disconnects the room continues unchanged.
- The lobby polling interval of ~2 seconds is an upper bound; slightly faster is acceptable.
- Room codes are 4 uppercase alphanumeric characters (existing generator behaviour preserved).
- The frontend holds the `participantId` in memory (no localStorage or cookies).
