# Feature Specification: Room Setup & Lobby

**Feature Branch**: *(none — branch creation skipped per request; work continues on current branch)*

**Created**: 2026-05-29

**Status**: Draft

**Input**: Scenario 1 from README — Room Setup & Lobby: a player hosts or joins a drawing game via a unique room code; the creator is the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); only the host can start the game once at least 2 players are present.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Creates a Room (Priority: P1)

A player who wants to run a drawing game creates a new room, receives a unique shareable code, enters the lobby as the designated host, and can see themselves listed as a participant.

**Why this priority**: Without room creation and host assignment, no game session can exist. This is the minimum viable entry point for the entire lab.

**Independent Test**: Open one browser tab, create a room with any player name, land on the lobby, and verify a unique room code is shown, status is lobby, exactly one participant is listed, and the current player is identified as host.

**Acceptance Scenarios**:

1. **Given** a player on the home screen, **When** they submit the create-room form with a player name, **Then** a new room is created with a unique code, the player is placed in the lobby, and that player is recorded as the room host.
2. **Given** a host is in the lobby, **When** they view the lobby, **Then** the room code is visible and copy-friendly so it can be shared with others.
3. **Given** two hosts each create separate rooms, **When** both rooms exist, **Then** each room has a distinct code and neither room's participant list includes players from the other room.

---

### User Story 2 - Player Joins an Existing Room (Priority: P2)

A player who received a room code enters their name and code to join an existing lobby. Invalid or empty codes are rejected with a clear, user-visible error; successful joins add the player to the correct room only.

**Why this priority**: Multiplayer requires at least one joiner beyond the host. Join validation prevents confusion and protects room isolation.

**Independent Test**: With a room already created in tab A, open tab B, join using the valid code, and confirm tab B enters the same lobby participant list. Repeat with empty and invalid codes and confirm errors appear without entering a lobby.

**Acceptance Scenarios**:

1. **Given** an active room with code `ABCD`, **When** a second player submits a valid matching code (case-insensitive) and a player name, **Then** they join that room's lobby and appear in the participant list for all clients viewing that room.
2. **Given** a player on the join form, **When** they submit an empty or whitespace-only room code, **Then** the join is rejected before any room lookup and a clear error message explains that a code is required.
3. **Given** a player on the join form, **When** they submit a code that does not match any active room, **Then** the join is rejected and a clear error message explains the room was not found.
4. **Given** rooms `ROOM1` and `ROOM2` each with their own participants, **When** a player joins `ROOM1`, **Then** they never appear in `ROOM2`'s participant list and cannot load `ROOM2` state using `ROOM1`'s session context.

---

### User Story 3 - Lobby Stays Synchronized via Polling (Priority: P3)

While in the lobby, all connected players see an up-to-date participant list without manual action. The lobby refreshes automatically on an interval of approximately 2 seconds so joins and departures become visible promptly.

**Why this priority**: Polling-based sync is the lab's only multi-client transport. Automatic lobby refresh proves the architecture before gameplay begins.

**Independent Test**: Host in tab A, joiner in tab B. Without clicking refresh, verify tab A shows the joiner within about 2 seconds of tab B joining. Optionally verify tab B sees the host's presence on the same cadence.

**Acceptance Scenarios**:

1. **Given** a host waiting in the lobby, **When** another player joins the same room from a second client, **Then** the host's lobby participant list updates automatically within approximately 2 seconds.
2. **Given** multiple players in the same lobby, **When** any client is viewing the lobby, **Then** all clients converge on the same participant count and names for that room code on each poll cycle.
3. **Given** a player in the lobby, **When** a poll request fails temporarily, **Then** the UI surfaces a non-crashing error and continues attempting refresh on subsequent intervals.

---

### User Story 4 - Host Starts the Game When Ready (Priority: P4)

Only the host may start the game, and only when at least two players are in the lobby. Non-hosts see that they must wait; the host sees actionable start controls when the minimum is met.

**Why this priority**: Starting transitions the room out of lobby state and gates later scenarios. Preconditions (host + headcount) must be enforced here.

**Independent Test**: In a one-player lobby, confirm start is blocked for the host. Add a second player via tab B, confirm only the host can start and non-host cannot. Successful start moves all participants out of lobby (exact game behavior is owned by Scenario 2).

**Acceptance Scenarios**:

1. **Given** a lobby with only the host (one participant), **When** the host attempts to start the game, **Then** the start is rejected and feedback explains at least two players are required.
2. **Given** a lobby with two or more participants, **When** a non-host player attempts to start the game, **Then** the start is rejected and the UI indicates only the host may start.
3. **Given** a lobby with two or more participants, **When** the host starts the game, **Then** the room leaves lobby status and all participants in that room transition together (round setup details belong to Scenario 2).
4. **Given** a non-host in a lobby with two or more participants, **When** they view the lobby, **Then** the start control is absent or disabled and messaging indicates they are waiting for the host.

---

### Edge Cases

- **Empty join code**: Submitting no code (or only whitespace) must not call the server with a blank identifier; user sees a validation message immediately.
- **Unknown room code**: Joining a well-formed code that does not exist returns a not-found style error with plain language (e.g., unable to join / room not found).
- **Case normalization**: Codes entered as lowercase must match uppercase stored codes without requiring the user to re-type.
- **Concurrent joins**: Two players joining the same room at nearly the same time both appear in the participant list after the next poll without duplicate host assignment.
- **Cross-room leakage**: Polling or joining with room A's code never returns participants from room B; participant identifiers from one room are not valid in another room's context.
- **Solo host start attempt**: Host with one participant cannot bypass the two-player minimum via UI or direct action.
- **Non-host start attempt**: A guesser/joiner cannot start even when the two-player minimum is satisfied.
- **Stale client after room loss**: If a room no longer exists (e.g., server restart clears memory), clients receive a clear error rather than hanging silently.
- **Host identity persistence**: The participant who created the room remains host for the lobby phase; joining players never become host.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room by providing a player name, assigning them a unique room code, and designating them as the room host.
- **FR-002**: System MUST place a newly created room in `lobby` status with exactly one initial participant (the host).
- **FR-003**: System MUST allow a player to join an existing room by submitting a room code and player name when the code matches an active room.
- **FR-004**: System MUST reject join attempts with empty or whitespace-only room codes before server lookup and display a clear, user-visible validation message.
- **FR-005**: System MUST reject join attempts for codes that do not match any active room and display a clear, user-visible not-found message.
- **FR-006**: System MUST treat room codes as case-insensitive for matching purposes.
- **FR-007**: System MUST keep room state fully isolated in memory so participants, host, and lobby data in one room never appear in another room.
- **FR-008**: System MUST expose a shareable room code in the lobby view for the host to distribute to joiners.
- **FR-009**: System MUST list all current participants (display name and host indicator) in the lobby for every client viewing that room.
- **FR-010**: System MUST automatically refresh lobby state for connected clients on an interval of approximately 2 seconds while the room remains in lobby status.
- **FR-011**: System MUST allow manual lobby refresh as a fallback without breaking automatic polling.
- **FR-012**: System MUST permit only the designated host to initiate a game start from the lobby.
- **FR-013**: System MUST reject game start when fewer than two participants are present and provide clear feedback to the host.
- **FR-014**: System MUST reject game start attempts from non-host participants regardless of headcount.
- **FR-015**: System MUST transition the room out of lobby status when the host successfully starts the game with at least two participants present.
- **FR-016**: System MUST surface API and validation errors in the UI without crashing the client.

### Key Entities

- **Room**: An in-memory game session identified by a unique short code; has lobby (or later) status, creation/update timestamps, a host reference, and an ordered list of participants. Rooms are independent containers with no shared mutable state across codes.
- **Participant**: A player instance within exactly one room; has a stable identifier, display name, join time, and an implicit or explicit host flag (exactly one host per room, set at creation).
- **Lobby snapshot**: The client-visible view of a room while in lobby status—code, status, participant list, and enough metadata for the viewer to know whether they are the host and whether start is permitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the lobby with a visible shareable code in under 30 seconds on a typical local setup.
- **SC-002**: 100% of join attempts with empty codes are blocked client- or server-side with an explicit error message (no silent failure, no entry to lobby).
- **SC-003**: 100% of join attempts with non-existent codes fail with an explicit not-found message and do not create or mutate room state.
- **SC-004**: When a second player joins an existing lobby, the host sees the updated participant list within 3 seconds without manual refresh under normal network conditions.
- **SC-005**: Zero cross-room participant leakage in two-tab tests involving two simultaneous active rooms.
- **SC-006**: Non-host clients cannot start the game in 100% of attempted interactions when two or more players are present.
- **SC-007**: Host cannot start the game with fewer than two participants in 100% of attempted interactions.
- **SC-008**: When the host successfully starts with two or more players, all participants in that room leave lobby status together within one poll cycle.

## Assumptions

- **Constitution alignment**: This scenario adheres to `.specify/memory/constitution.md` — HTTP polling only (~2s) for sync (Principle III), in-memory isolated rooms with no durable storage (Principles II–III), Zod-validated inputs on the server with clear UI errors (Principles III & VII), and two-tab manual validation before marking complete (Principle VI).
- Players access the app through a web browser on the same backend instance (local lab environment); no authentication or accounts are required to create or join.
- Room codes are short alphanumeric strings generated by the system; users do not choose custom codes.
- Player name trimming and rejection of empty/whitespace-only names are specified in Scenario 2; Scenario 1 accepts names as provided by the starter forms without additional validation beyond join-code checks.
- A successful "start game" in Scenario 1 only requires leaving lobby status with preconditions met; drawer assignment, secret word visibility, and round setup are owned by Scenario 2.
- If the backend process restarts, all in-memory rooms are lost; clients handle missing rooms with clear errors rather than expecting durability.
- One host per room, fixed at creation time; host transfer on disconnect is out of scope.
- Automatic polling runs only while the client is on the lobby view (or equivalent in-session lobby state); exact navigation after start is covered by later scenarios.
- Maximum practical room size is small (lab-scale, roughly 2–8 players); explicit capacity limits are out of scope unless needed for memory safety.

## Out of Scope (Explicit Reminders)

The following MUST NOT appear in implementation work for this scenario:

- **Transport**: WebSockets, Socket.io, Server-Sent Events, or any real-time push protocol — HTTP polling only (~2s in lobby).
- **Persistence**: Databases, file storage, or any durable room/participant records across server restarts.
- **Identity**: Authentication, accounts, sessions, JWT, or OAuth.
- **Gameplay beyond lobby gate**: Drawing canvas, guesses, scoring, secret word selection, drawer assignment, and guess history (Scenarios 2–3).
- **Round lifecycle**: Multiple rounds, drawer rotation, timers, countdowns, speed bonuses, or drawer bonuses.
- **Content**: Custom or random word packs beyond the starter list (used only after start in later scenarios).
- **Social/moderation**: Spectator mode, kick, mute, room passwords, or invite links.
- **Infrastructure**: Deployment, hosting, CI, Docker, or new top-level dependencies without plan justification.
- **Platform expansion**: New state-management or routing libraries beyond what the starter ships.

**Boundary note**: Scenario 1 ends at a successful, authorized transition out of lobby when the host starts with ≥2 players. Scenario 2 owns everything that happens immediately after that transition.
