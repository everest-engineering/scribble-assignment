# Feature Specification: Room Setup & Lobby

**Feature Branch**: `assignment`

**Created**: 2026-05-28

**Status**: Draft

**Feature Directory**: `specs/001-room-setup-lobby`

---

## Overview

Enable players to create or join a drawing-game room using a unique code, with
the creator automatically designated as host. The lobby refreshes automatically
via polling so all participants see an up-to-date player list, and only the host
can start the game once at least two players are present.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Room as Host (Priority: P1)

A player opens the app, enters their name, and creates a room. They are
immediately recognised as the host and land on the lobby with the room code
displayed prominently so they can share it.

**Why this priority**: All other scenarios depend on a room existing and a host
being identified. Nothing else works without this foundation.

**Independent Test**: Open one browser tab, create a room with a valid name, and
confirm the lobby shows the room code, the player's name, and a disabled or
unavailable "Start Game" button (only one player present).

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **When** they enter a non-empty
   name (after trimming) and click Create Room, **Then** a room is created, the
   player is recorded as the host (first participant), and the app navigates to
   the Lobby showing the room code.

2. **Given** a player tries to create a room with an empty or whitespace-only
   name, **When** they submit the form, **Then** the form displays the error
   message "Name cannot be empty" and no room is created.

3. **Given** a room is created, **When** any GET /rooms/:code request is made,
   **Then** the response includes a `hostId` field identifying the creator.

---

### User Story 2 — Join a Room as Participant (Priority: P1)

A second player opens the app, enters their name and the room code they received
from the host, and joins the existing room. Both the host and joiner now see each
other in the lobby.

**Why this priority**: Multi-player gameplay requires at least two participants;
join flow is equally foundational to room creation.

**Independent Test**: Tab 1 creates a room; Tab 2 joins using the code. After
the lobby auto-refreshes, both tabs show two participants in the list.

**Acceptance Scenarios**:

1. **Given** a valid room code and a non-empty player name, **When** the player
   submits the join form, **Then** they are added to the room and the lobby
   displays their name alongside existing participants.

2. **Given** a player enters an empty or whitespace-only name, **When** they
   submit the join form, **Then** the form displays "Name cannot be empty" and
   the player is not added to any room.

3. **Given** a player enters a room code that does not exist, **When** they
   submit the join form, **Then** the app displays "Room not found" and remains
   on the join screen.

4. **Given** a player enters an empty room code, **When** they submit the join
   form, **Then** the app displays "Room code cannot be empty" and does not
   attempt a network request.

5. **Given** two separate rooms exist (Room A and Room B), **When** a player
   joins Room B, **Then** Room A's participant list is unaffected (rooms are
   fully isolated).

---

### User Story 3 — Lobby Auto-Polling (Priority: P2)

The lobby page polls the backend automatically every ~2 seconds so that when a
new player joins, all participants see the updated list without manually clicking
Refresh.

**Why this priority**: Without polling the lobby feels broken — players cannot
see each other join. Required before the host can make a meaningful start
decision.

**Independent Test**: Tab 1 is on the Lobby. Tab 2 joins the room. Within
3 seconds Tab 1's participant list updates without any manual interaction.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** another player joins the
   room, **Then** the first player's lobby participant list updates automatically
   within approximately 2 seconds without any manual action.

2. **Given** the lobby is polling, **When** the player navigates away from the
   Lobby, **Then** polling stops and no further background requests are made.

3. **Given** a poll request fails due to a network error, **When** the next
   interval fires, **Then** polling continues (errors are not fatal) and the
   displayed list retains its last known state.

4. **Given** the lobby is polling and the room status changes to "playing",
   **When** a non-host participant's poll detects this change, **Then** they are
   automatically navigated to the game screen without any manual action.

---

### User Story 4 — Host-Only Start Game (Priority: P2)

The Start Game button is only available to the host and only when at least two
players are present. Non-host participants see a "Waiting for host to start"
message instead of the button.

**Why this priority**: Prevents a lone player or a non-host from starting a
game prematurely, which would break drawer assignment and the game flow.

**Independent Test**: Tab 1 (host) and Tab 2 (joiner) are both in the lobby.
Only Tab 1 shows an enabled Start Game button. Clicking it on Tab 1 navigates
the host to the game screen.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with fewer than 2 participants total,
   **When** the host views the lobby, **Then** the Start Game button is disabled
   with a label or tooltip indicating more players are needed.

2. **Given** the host is in the lobby with 2 or more participants, **When** the
   host views the lobby, **Then** the Start Game button is enabled.

3. **Given** a non-host participant is in the lobby, **When** they view the
   lobby, **Then** they do not see an enabled Start Game button; they see a
   "Waiting for host to start" message instead.

4. **Given** the host clicks the enabled Start Game button, **When** the action
   completes, **Then** the host navigates immediately to the game screen (POST
   /rooms/:code/start succeeds and returns the updated room in "playing" status);
   non-host participants detect the status change via their next poll and
   auto-navigate to the game screen without any manual action.

---

### Edge Cases

- Empty room code (whitespace only) on join: rejected client-side before any
  network request, message "Room code cannot be empty".
- Room code with mixed case (e.g. "abcd"): normalised to uppercase before lookup.
- Player name with leading/trailing whitespace: trimmed before submission; if
  result is empty, rejected with "Name cannot be empty".
- Polling while offline: errors are swallowed silently; list retains last known
  state; polling resumes when connectivity returns.
- Start Game while only 1 player present: button disabled; no API call made.
- Non-host attempting to start: Start Game button not rendered for non-hosts;
  even if API is called directly, server rejects with 403.

---

## Clarifications

### Session 2026-05-28

- Q: When host clicks Start Game, do non-hosts navigate immediately or via polling? → A: Host navigates immediately; non-hosts detect the `status === "playing"` transition via their next poll (~2s lag) and auto-navigate then.
- Q: When poll detects room status is "playing", should non-hosts auto-navigate or wait for manual action? → A: Auto-navigate to the game screen when poll detects `status === "playing"`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record the first participant of a room as the host
  (`hostId` on the Room model).
- **FR-002**: The `POST /rooms` endpoint MUST return `hostId` in the room
  snapshot response.
- **FR-003**: The `GET /rooms/:code` endpoint MUST return `hostId` in the room
  snapshot so the frontend can determine whether the current viewer is the host.
- **FR-004**: Player names MUST be trimmed of leading/trailing whitespace before
  any storage or comparison; empty/whitespace-only names MUST be rejected with a
  human-readable error message.
- **FR-005**: Room codes MUST be normalised to uppercase before lookup on join.
- **FR-006**: The lobby MUST poll `GET /rooms/:code` approximately every 2 seconds
  and update the participant list without a full page reload.
- **FR-007**: Polling MUST stop when the user navigates away from the Lobby.
- **FR-008**: Only the host MAY trigger game start; the `POST /rooms/:code/start`
  endpoint MUST validate that the requesting participant is the host and that at
  least 2 participants are present, returning 403 otherwise.
- **FR-009**: The Start Game button MUST be visible and enabled only to the host
  when ≥2 participants are present.
- **FR-010**: Rooms MUST be fully isolated; joining or modifying one room MUST
  NOT affect any other room.
- **FR-011**: An invalid or non-existent room code on join MUST return a 404 and
  display "Room not found" to the user.

### Key Entities

- **Room**: code (4-char uppercase), status ("lobby" | "playing" | "result"),
  hostId (participant id of creator), participants (array), createdAt, updatedAt.
- **Participant**: id (UUID), name (trimmed string), joinedAt.
- **RoomSnapshot** (API response): code, status, hostId, participants,
  availableWords, roles — returned to all viewers; used by frontend to derive
  host status.

---

## Success Criteria *(mandatory)*

- **SC-001**: A player can create a room, share the code, and a second player can
  join — both see each other in the lobby within 3 seconds of joining, without
  any manual refresh action.
- **SC-002**: All name and code validation errors present a human-readable
  message; no silent failures or generic "error" messages are shown.
- **SC-003**: The Start Game button appears only for the host and only when ≥2
  players are in the lobby; non-hosts see a waiting message.
- **SC-004**: Two separate rooms with players in each remain completely isolated —
  joining Room B does not change Room A's participant list.
- **SC-005**: Navigating away from the lobby stops all background polling — no
  lingering network requests after leaving the page.

---

## Assumptions

- A single room supports a small number of players (2–6); no capacity limits are
  enforced for this lab.
- The host is always the first participant; there is no host-transfer mechanism.
- Room codes are 4 uppercase alphanumeric characters as generated by the starter.
- The `participantId` returned at room creation/join is stored in frontend state
  for the lifetime of the browser session; there is no persistence across page
  reloads.
- The polling interval of ~2 seconds is implemented as a fixed `setInterval`; no
  back-off or jitter is required.
- The `POST /rooms/:code/start` endpoint is new — it does not exist in the
  starter and must be added.
- "Host-only" enforcement on the server uses the `participantId` passed as a
  query parameter (consistent with existing `GET /rooms/:code` pattern); no
  session or token auth is required.
