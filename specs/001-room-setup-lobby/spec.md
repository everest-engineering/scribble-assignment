# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-assignment` (single-branch lab; feature dir `specs/001-room-setup-lobby`)

**Created**: 2026-06-17

**Status**: Draft

**Feature Group**: 1 of 4 — Scenario 1 (Room Setup & Lobby)

**Input**: User description: "Room Setup & Lobby — creator becomes host; invalid/empty codes rejected with clear feedback; rooms fully isolated; lobby refreshes via polling (~2s); only the host can start the game once at least 2 players are present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room and is identified as host (Priority: P1)

A player chooses to host a game. They create a room, receive a unique room code to share, and land in
the lobby where they are clearly marked as the host. They are the only person who can later start the game.

**Why this priority**: Hosting is the entry point for every game. Without host identity there is no
authority to start the game and no anchor for the lobby. This is the minimum viable slice.

**Independent Test**: Create a room in one browser; confirm a unique code is shown and the creator is
visibly labelled "host" in the participant list. No second player is required to verify this slice.

**Acceptance Scenarios**:

1. **Given** the start screen, **When** a player creates a room, **Then** a unique room code is generated and shown, and the creator appears in the lobby flagged as the host.
2. **Given** a freshly created room, **When** the lobby loads, **Then** exactly one participant (the creator) is present and marked as host.
3. **Given** two separately created rooms, **When** comparing their codes, **Then** the codes are different and each room lists only its own creator.

---

### User Story 2 - Player joins an existing room via its code (Priority: P1)

A second player enters a shared room code to join an existing lobby. On success they appear in the same
lobby as the host. Invalid attempts are rejected with clear, specific feedback.

**Why this priority**: A lobby with one person is not a game. Joining is required for any multiplayer
flow and is the partner slice to hosting.

**Independent Test**: With a known room code, join from a second browser and confirm the joiner appears in
the same lobby; then attempt an empty code and an unknown code and confirm distinct error messages.

**Acceptance Scenarios**:

1. **Given** a valid existing room code, **When** a player joins, **Then** they enter that room's lobby and are listed as a (non-host) participant.
2. **Given** an empty or whitespace-only code, **When** the player attempts to join, **Then** the join is rejected with a "room code is required" message and no navigation occurs.
3. **Given** a syntactically present but non-existent code, **When** the player attempts to join, **Then** the join is rejected with a "room not found" message distinct from the empty-code message.
4. **Given** a code entered in lower case, **When** the player joins, **Then** the code is matched case-insensitively to the existing room.

---

### User Story 3 - Lobby stays current automatically (Priority: P2)

Players in a lobby see the participant list update on its own as others join, without anyone pressing a
refresh button.

**Why this priority**: The starter already proves manual refresh works; automatic polling is the explicit
Scenario 1 upgrade that makes the lobby feel live. It depends on Stories 1–2 existing first.

**Independent Test**: Open the lobby as host; from a second browser join the room; confirm the new player
appears in the host's lobby within a few seconds with no manual action.

**Acceptance Scenarios**:

1. **Given** a host waiting in the lobby, **When** another player joins, **Then** the new participant appears in the host's lobby automatically within approximately 2 seconds.
2. **Given** a player viewing a lobby, **When** the page remains open, **Then** the participant list reflects the current room membership without the user pressing a refresh control.
3. **Given** automatic refresh is active, **When** a participant chooses the manual refresh, **Then** it still works as a fallback.

---

### User Story 4 - Only the host can start, and only with enough players (Priority: P2)

The host starts the game once the room has at least two players. Players who are not the host never get an
enabled start control, and the host cannot start a one-person room.

**Why this priority**: Start gating prevents broken games (no opponents, ambiguous authority) and sets up
the handoff to Feature Group 2. It depends on host identity and join already working.

**Independent Test**: As host with one player, confirm the start control is disabled with an explanation;
add a second player and confirm it becomes enabled; from the non-host browser confirm no enabled start
control is ever offered.

**Acceptance Scenarios**:

1. **Given** a room with only the host present, **When** the host views the lobby, **Then** the start control is disabled and explains that at least 2 players are required.
2. **Given** a room with 2 or more players, **When** the host views the lobby, **Then** the start control is enabled and the host can start the game.
3. **Given** a room with 2 or more players, **When** a non-host views the lobby, **Then** no enabled start control is presented to them.
4. **Given** the host starts the game, **When** the start succeeds, **Then** the room leaves the waiting-lobby state into a started state observable to all players in that room.
5. **Given** a non-host attempts to trigger a start, **When** the request is evaluated, **Then** it is refused.

### Edge Cases

- **Empty / whitespace-only room code on join** → rejected with a "code required" message; treated differently from an unknown code.
- **Unknown / non-existent room code** → rejected with a "room not found" message; no partial state created.
- **Case differences in room code** → matched case-insensitively; a code typed in lower case still joins the correct room.
- **Start attempted with fewer than 2 players** → refused; the control is disabled and explains why.
- **Start attempted by a non-host** → refused regardless of player count.
- **Two rooms active at once** → each lobby shows only its own participants and its own start eligibility; one room's membership never leaks into another.
- **Lobby left open with no changes** → polling continues without errors and without duplicating participants.
- **Host identity** → remains the original creator for the room's lifetime within this feature group.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST designate the creator of a room as its host at creation time and expose host identity so the lobby can mark exactly one participant as host.
- **FR-002**: The system MUST generate a unique room code per room and surface it to the host for sharing.
- **FR-003**: The system MUST allow a player to join an existing room by its code and add them to that room's participant list as a non-host participant.
- **FR-004**: The system MUST reject a join when the code is empty or whitespace-only, returning a clear "room code is required" message, and MUST NOT navigate the player onward.
- **FR-005**: The system MUST reject a join when the code does not match any existing room, returning a "room not found" message distinct from the empty-code message.
- **FR-006**: The system MUST match room codes case-insensitively.
- **FR-007**: The system MUST keep rooms fully isolated: a participant list, host identity, and start eligibility belong to exactly one room and never appear in another.
- **FR-008**: The lobby MUST refresh its participant list automatically at approximately 2-second intervals while a player is viewing it, without requiring manual action.
- **FR-009**: The system MUST retain a manual refresh action as a fallback alongside automatic polling.
- **FR-010**: The system MUST present an enabled start control only to the host and only when the room has at least 2 participants.
- **FR-011**: The system MUST NOT present an enabled start control to non-host participants under any participant count.
- **FR-012**: The system MUST refuse a start request that originates from a non-host or that targets a room with fewer than 2 participants, independent of what any client UI shows.
- **FR-013**: On a successful start, the system MUST transition the room out of the waiting-lobby state into a started state that all participants in that room can observe via the same polling mechanism.
- **FR-014**: The system MUST express join and start rejections as clear, user-facing messages rather than silent failures.

### Key Entities *(include if feature involves data)*

- **Room**: A gathering identified by a unique code. Has a lifecycle state (waiting in lobby vs. started), a host, and an ordered list of participants. Exists only in memory for the session.
- **Participant**: A player within one room. Has a display identity and a flag (derivable) indicating whether they are the host. The host is the participant who created the room.
- **Viewer context**: The identity of the participant requesting a room view, used so the lobby can decide whether to offer host-only controls to that viewer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host can create a room and see their unique code and host marker in under 5 seconds from the start screen.
- **SC-002**: 100% of empty/whitespace-only join attempts and 100% of unknown-code join attempts are rejected with distinct, human-readable messages (no silent failures, no onward navigation).
- **SC-003**: When a second player joins, they appear in an already-open lobby within approximately 2 seconds with no manual refresh.
- **SC-004**: The start control is enabled for the host only when 2+ players are present, and is never enabled for non-hosts — verifiable across all player-count and role combinations.
- **SC-005**: With two rooms active simultaneously, neither room ever displays a participant, host, or start eligibility belonging to the other (0% cross-room leakage).

## Assumptions

- Rooms and participants live only in memory; a backend restart clears all rooms (consistent with the in-memory store and the no-database scope).
- Polling (~2s) is the sole synchronization mechanism for the lobby; real-time transport (WebSockets) is explicitly out of scope.
- Player-name trimming and rejection of blank names is **deferred to Feature Group 2** and is not validated here; this group accepts whatever name handling the starter already provides and leaves a seam for stricter validation later.
- Drawer assignment, secret word selection, gameplay, scoring, results, and restart are out of scope for this group; the "started" state introduced by FR-013 is only a seam that later groups build upon.
- The host does not change for the room's lifetime within this group; participant-leave/host-reassignment flows are not in scope (no leave action exists in the starter).
- Each browser tab represents one participant; identity is carried per session, not persisted across reloads.
- The existing create/join/get-room flows and the existing manual refresh are reused and extended, not replaced (brownfield enhancement).
