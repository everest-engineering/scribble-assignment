# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-lobby`
**Created**: 2026-05-29
**Status**: Draft
**Input**: User description: "Room setup and lobby. The room creator automatically becomes the host
(explicit hostId). Joining validates the code — empty, malformed, or unknown codes are rejected
with a clear message; codes match case-insensitively. Rooms are fully isolated from each other.
The lobby polls the server about every 2 seconds so new players appear without manual refresh.
Only the host can start the game, and only once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Room and Become Host (Priority: P1)

A player opens the app and creates a new room. The system assigns them a unique room code and
records them as the host. They land on the lobby screen where they can see themselves listed as
a participant and wait for others to join.

**Why this priority**: All other scenarios depend on a room existing with a valid host. Without
room creation, nothing else works.

**Independent Test**: Open the app in one browser tab, create a room, confirm a room code is
displayed and the player appears in the participant list with a visual host indicator.

**Acceptance Scenarios**:

1. **Given** the home screen, **When** a player submits a valid name and clicks "Create Room",
   **Then** a new room is created, a unique uppercase room code is displayed, the player is shown
   in the lobby participant list, and only that player sees a "Start Game" button.
2. **Given** the home screen, **When** a player submits an empty or whitespace-only name and
   clicks "Create Room", **Then** the room is not created and a clear error message is displayed.
3. **Given** a room is created, **When** the creator views the lobby, **Then** they are
   identified as the host and no other participant sees the "Start Game" button.

---

### User Story 2 — Join an Existing Room (Priority: P1)

A second player receives a room code (e.g., verbally or visually) and enters it to join the
lobby. The system validates the code and, if valid, adds them to the room. They see the current
participant list immediately.

**Why this priority**: The lobby is only meaningful with at least two participants; joining is
the prerequisite for any multi-player scenario.

**Independent Test**: Open a second browser tab, enter the room code from User Story 1, and
confirm the second player appears in the lobby on both tabs.

**Acceptance Scenarios**:

1. **Given** an existing room, **When** a second player submits a valid name and the correct
   room code, **Then** they are added to the room and see the lobby participant list.
2. **Given** the join form, **When** a player submits an empty room code, **Then** they receive
   a clear error message and are not redirected.
3. **Given** the join form, **When** a player submits a code with incorrect formatting (e.g.,
   symbols, spaces only), **Then** they receive a clear error message and are not added to any room.
4. **Given** the join form, **When** a player submits a syntactically valid code that does not
   match any room, **Then** they receive a clear "room not found" message.
5. **Given** the join form, **When** a player submits the correct code in lowercase or mixed
   case, **Then** they are successfully added (codes are matched case-insensitively).

---

### User Story 3 — Live Lobby Updates via Polling (Priority: P2)

Once in the lobby, all participants see the participant list update automatically (without
refreshing the page) as new players join. The host and all guests always have an up-to-date
view of who is present.

**Why this priority**: Required for a usable multi-player experience, but can be tested
independently once US1 and US2 work.

**Independent Test**: With two browser tabs both in the same lobby, have a third tab join;
both existing tabs should show the new participant within approximately 2 seconds without any
manual interaction.

**Acceptance Scenarios**:

1. **Given** two players in the lobby, **When** a third player joins, **Then** both existing
   participants see the updated list within roughly 2 seconds without refreshing.
2. **Given** a player is in the lobby, **When** the connection to the server is temporarily
   unavailable, **Then** the UI shows an error or stale indicator rather than crashing.

---

### User Story 4 — Host Starts the Game (Priority: P2)

Once at least 2 players are in the lobby, the host can start the game. Non-host participants
do not see a start control. Attempting to start with fewer than 2 players is blocked with a
clear message.

**Why this priority**: Closes the lobby scenario and gates entry to gameplay; depends on
US1–US3 being in place.

**Independent Test**: With exactly 2 players in the lobby, click "Start Game" as the host and
confirm both tabs transition away from the lobby screen.

**Acceptance Scenarios**:

1. **Given** 2 or more players in the lobby, **When** the host clicks "Start Game", **Then**
   the game transitions out of the lobby state for all participants.
2. **Given** only 1 player in the lobby, **When** the host attempts to start, **Then** the
   "Start Game" button is disabled or an error is shown — the game does not start.
3. **Given** a non-host participant in the lobby, **When** they view the lobby, **Then** no
   "Start Game" control is visible or accessible to them.
4. **Given** a player who did not create the room attempts to trigger game start (e.g., via
   direct API call), **Then** the server rejects the request with an appropriate error.

---

### Edge Cases

- What happens when a player submits a name that is only whitespace? → Rejected with a clear
  message (trimmed name must be non-empty).
- What happens when two players try to join simultaneously with the same code? → Both should
  succeed; rooms handle concurrent joins gracefully.
- What happens if a player navigates away from the lobby? → Remaining participants continue to
  see the lobby; the departed player is not explicitly removed in this scenario (future scope).
- What is the maximum number of players in a room? → No cap is enforced in this scenario.
- What happens when a player tries to join a room whose game has already started? → Rejected with a clear "game already in progress" message; player stays on the join screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a room by providing a non-empty, non-whitespace name.
- **FR-002**: The system MUST automatically assign the room creator as the host (recorded as `hostId`).
- **FR-003**: The system MUST generate a unique, uppercase room code for each new room.
- **FR-004**: The system MUST allow a player to join a room by submitting a name and a room code.
- **FR-005**: The system MUST reject join attempts with an empty room code and display a clear error message.
- **FR-006**: The client MUST validate the room code contains only alphanumeric characters (no spaces or symbols) before submitting; invalid-format codes MUST be rejected client-side with a clear error message without making a server request.
- **FR-007**: The server is the canonical authority for room existence; a code that passes client-side format validation but matches no room MUST return a clear "room not found" message.
- **FR-015**: The server MUST reject a join attempt for a room that is no longer in `lobby` status with a clear "game already in progress" error; the player remains on the join screen.
- **FR-008**: The system MUST match room codes case-insensitively (e.g., "abc1" resolves to room "ABC1").
- **FR-009**: The lobby screen MUST display the current participant list and refresh it automatically at approximately 2-second intervals without requiring user action.
- **FR-010**: Only the host MUST see and be able to activate the "Start Game" control.
- **FR-011**: The "Start Game" action MUST be blocked (client and server) when fewer than 2 players are present.
- **FR-012**: The server MUST reject a start-game request from any participant who is not the host.
- **FR-013**: Rooms MUST be fully isolated: participants in one room MUST NOT see or affect participants in another room.
- **FR-014**: Player names MUST be trimmed of leading/trailing whitespace; empty or whitespace-only names MUST be rejected with a clear error message. Duplicate display names within a room are permitted — participants are distinguished by their system-assigned ID.

### Key Entities

- **Room**: Represents an isolated game session. Key attributes: unique room code (uppercase),
  `hostId`, status (`lobby` initially), ordered participant list, creation time.
- **Participant**: A player within a room. Key attributes: participant id, display name (trimmed),
  join timestamp. The creator is flagged as host via the room's `hostId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land in the lobby within 3 seconds of submitting their name.
- **SC-002**: A player can join an existing room (valid code) within 3 seconds of submitting the join form.
- **SC-003**: 100% of join attempts with empty, malformed, or unknown room codes are rejected with a user-visible error message.
- **SC-004**: New participants appear in all active lobby views within 4 seconds of joining (reflecting the ~2 s polling cadence plus network round-trip).
- **SC-005**: The "Start Game" action succeeds only when ≥ 2 players are present and the requester is the host — verified in both browser-tab acceptance tests.
- **SC-006**: All existing automated test suites (`schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`) remain green after implementation.

## Clarifications

### Session 2026-05-29

- Q: Who owns "malformed" room code validation — client, server, or both? → A: Client validates non-empty + alphanumeric characters only (no spaces/symbols) without a server call; server is authoritative for existence (unknown vs. valid).
- Q: What should the server return when a player tries to join a room whose game has already started? → A: Reject with a clear "game already in progress" error; player stays on the join screen.
- Q: Are player display names required to be unique within a room? → A: No — duplicates are allowed; participants are distinguished by their system-assigned ID, not their display name.

## Assumptions

- Room codes are auto-generated strings of 4 uppercase alphanumeric characters (e.g., `AB3X`).
  The exact format is an implementation detail; what matters is uniqueness and canonicalization
  to uppercase.
- No participant cap is enforced in this scenario; behavior with very large rooms is out of scope.
- Player names are capped at 20 characters after trimming; validation of maximum length is a
  reasonable default and does not require explicit clarification.
- Players who navigate away from the lobby are not explicitly removed from the participant list
  in this scenario; cleanup is future scope.
- The polling interval target is approximately 2 seconds. Minor variance (±500 ms) is acceptable.
- A single browser tab represents one participant; there is no session/authentication — identity
  is ephemeral and scoped to the current page session.
- The frontend already has a working create-room / join-room flow as part of the starter; this
  scenario extends and hardens it rather than replacing it.
