# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 1 — Room Setup & Lobby. Given a player wants to host or join a drawing game, When they create or join a room via a unique code, Then the creator is automatically the host; invalid/empty codes are rejected with clear feedback; rooms are fully isolated; the lobby refreshes via polling (~2s); and only the host can start the game once at least 2 players are present."

## Clarifications

### Session 2026-06-02

- Q: When the host's browser tab is refreshed, what should happen to host status? → A: Host identity persists via browser-local storage keyed by room code; on refresh, the same browser reclaims its participant and host role (not authentication — no credentials, no server-side session).
- Q: Should joining be capped at a maximum number of players per room? → A: No cap; any number of players may join. There is no "room is full" rejection path.
- Q: What should the room code format be? → A: 4-character uppercase letters (A–Z), e.g., `ABCD`. The Join screen normalizes input to uppercase before comparison, so typing `abcd` matches `ABCD`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room and lands in the lobby (Priority: P1)

A player who wants to run a game opens the app, chooses Create Room, and is taken to a
lobby for a newly created room where they are clearly identified as the host. The room
has a unique code they can share with friends.

**Why this priority**: Without a created room there is nothing else to test. This story
is the minimum viable slice that proves the room lifecycle is wired end-to-end and that
host designation exists.

**Independent Test**: Open the app in a single browser tab, choose Create Room, supply a
player name, submit. Confirm the lobby loads, the room code is displayed, and the current
player is visibly marked as the host.

**Acceptance Scenarios**:

1. **Given** the Start screen is open, **When** the player chooses Create Room and
   submits a non-empty name, **Then** the lobby for a freshly created room opens, a
   room code is displayed, and the player appears in the lobby labeled as host.
2. **Given** two players have each created their own room, **When** their lobbies are
   compared, **Then** the two rooms have different codes and neither lobby lists the
   other room's participants.

---

### User Story 2 - Player joins an existing room by code, with validation (Priority: P2)

A second player wants to join a friend's room. They enter the room code shared with them
and land in the same lobby as the host. If they enter an empty, whitespace-only, or
unknown code, the app rejects the attempt with a clear, user-visible message and does
not move them out of the join screen.

**Why this priority**: Joining is what turns the room from a single-player container
into a multiplayer one; it is the prerequisite for every later scenario but depends on
US1 already existing.

**Independent Test**: With a host's room already created in one tab, open a second
browser tab, choose Join Room, enter the host's room code, supply a name, submit.
Confirm the second player appears in the same lobby. Then repeat with (a) an empty code,
(b) a code that is only spaces, and (c) a code that does not match any room — each must
be rejected with a visible message and must not create a lobby entry.

**Acceptance Scenarios**:

1. **Given** a host has created a room with code `ABCD`, **When** a second player on a
   different tab submits the join form with code `ABCD` and a non-empty name, **Then**
   the second player lands in the same lobby and the participant list shows both
   players.
2. **Given** the Join Room form is open, **When** the player submits an empty code,
   **Then** the form shows a visible error message and the player remains on the Join
   screen.
3. **Given** the Join Room form is open, **When** the player submits a code consisting
   only of whitespace, **Then** the form shows a visible error message and the player
   remains on the Join screen.
4. **Given** the Join Room form is open, **When** the player submits a code that does
   not match any active room, **Then** the form shows a visible "room not found" style
   message and the player remains on the Join screen.

---

### User Story 3 - Lobby reflects participants automatically within ~2 seconds (Priority: P2)

Players already on the lobby screen see new joiners (and updated participant ordering)
without having to press a refresh button. The lobby refreshes itself roughly every two
seconds.

**Why this priority**: Without auto-refresh, the lobby cannot serve its purpose during
two-tab validation; manual refresh hides race conditions that later scenarios depend on.

**Independent Test**: With a host on the lobby in tab A and a second player joining in
tab B, verify tab A shows the new player appear within approximately two seconds of the
join completing, without anyone clicking refresh. When the lobby view is closed (back to
Start, or browser tab closed), confirm polling stops and no further requests are issued.

**Acceptance Scenarios**:

1. **Given** the host is on the lobby for room `ABCD` and no manual refresh is pressed,
   **When** a second player joins room `ABCD` from another tab, **Then** the host's
   lobby shows the new participant within approximately 2 seconds.
2. **Given** a lobby viewer leaves the lobby screen, **When** time passes, **Then** the
   app issues no further polling requests for that room from that viewer.

---

### User Story 4 - Host-only Start, gated by a 2-player minimum (Priority: P3)

The Start Game control is available only to the host. The host cannot start the game
while the room has fewer than two players; once two or more players are present, the
host can start.

**Why this priority**: Start is the gateway to Scenario 2; gating it incorrectly leaks
host privileges or lets one-player games begin. It builds on US1–US3 being in place.

**Independent Test**: As host with a single player in the room, verify Start is either
hidden or disabled. Have a second player join from another tab; within roughly two
seconds the host sees Start become available. From the joiner's tab, verify no Start
control is visible. Press Start from the host tab and confirm the room exits the lobby
state.

**Acceptance Scenarios**:

1. **Given** the host is alone in the lobby, **When** the host views the lobby, **Then**
   the Start control is not actionable (hidden or disabled with explanatory text).
2. **Given** a second player has joined the room, **When** the host views the lobby,
   **Then** the Start control becomes actionable within approximately 2 seconds.
3. **Given** a non-host player is in a lobby of any size, **When** the non-host views
   the lobby, **Then** no Start control is presented to them.

---

### Edge Cases

- Join form submitted with an empty code → rejected with a visible message; no lobby
  entry created.
- Join form submitted with a whitespace-only code → rejected with a visible message; no
  lobby entry created.
- Join form submitted with a code that does not match any active room → rejected with a
  visible "room not found" style message.
- Two players submit Join for the same valid code concurrently → both accepted; both
  appear in the lobby on the next poll cycle.
- Nth player joins a room that already has many participants → accepted; there is no
  upper bound on participants per room (no "room is full" rejection path).
- Two rooms operate concurrently → no participant, code, or future game state from one
  room ever appears in the other room's lobby.
- A lobby viewer's network briefly fails between polls → the UI does not crash and the
  next successful poll repopulates the participant list.
- Host's browser tab is refreshed → the same browser reclaims its participant and host
  role from a locally stored identity keyed by room code; the lobby continues uninterrupted
  for other participants. If the local identity store is unavailable or cleared, that
  browser is treated as a new joiner and host status is not transferred.
- Host clicks Start with exactly one player present → action is blocked; no transition
  out of the lobby occurs.
- Non-host attempts to start via UI manipulation → the room remains in the lobby state;
  no game starts.
- Backend process restarts → all rooms are cleared (consistent with starter behavior);
  clients on the lobby see their next poll fail to find the room and are presented with a
  visible message rather than a silent crash.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new room from the Start screen
  and immediately enter that room's lobby.
- **FR-002**: Every created room MUST have a 4-character code drawn from uppercase
  letters A–Z, and that code MUST be unique among the set of currently active rooms.
- **FR-003**: The player who creates a room MUST be designated host for that room
  automatically and visibly.
- **FR-004**: The system MUST allow a player to join an existing room by submitting its
  code from the Join Room screen. The Join screen MUST normalize the submitted code by
  trimming surrounding whitespace and upper-casing it before comparison, so that input
  `abcd` matches a stored code of `ABCD`. No upper bound on participant count MUST be
  enforced; valid join requests MUST NOT be rejected for capacity reasons.
- **FR-005**: The system MUST reject a join attempt with an empty room code and present
  a visible error message; no lobby entry MUST be created.
- **FR-006**: The system MUST reject a join attempt with a whitespace-only room code and
  present a visible error message; no lobby entry MUST be created.
- **FR-007**: The system MUST reject a join attempt whose code does not match any
  currently active room and present a visible "room not found" style message; no lobby
  entry MUST be created.
- **FR-008**: The system MUST keep every room's participant list, host designation,
  code, and future game state strictly isolated from every other room — no observable
  cross-room leakage at any point.
- **FR-009**: Each lobby viewer MUST see participant additions reflected automatically
  within approximately 2 seconds, without manual refresh.
- **FR-010**: Polling on the lobby MUST stop cleanly when the viewer leaves the lobby
  screen (navigation away, room exit, or view unmount).
- **FR-011**: The Start control MUST be presented only to the host.
- **FR-012**: The Start control MUST be blocked from initiating a game while the room
  has fewer than 2 players, regardless of UI state.
- **FR-013**: The Start control MUST become actionable for the host within approximately
  2 seconds of the room reaching 2 or more players.
- **FR-014**: Host designation MUST remain stable across lobby polling refreshes AND
  across the host's browser tab refresh. On browser refresh, the host's browser MUST
  reclaim its participant and host role using a locally stored identity keyed by the
  room code; no other player MUST be promoted to host as a result of any refresh.
- **FR-015**: All user-visible error messages introduced by this feature MUST be clear,
  plain-language strings that identify what went wrong (e.g., "Enter a room code",
  "Room not found"); raw error codes or stack-style messages MUST NOT surface to the
  user.

### Key Entities

- **Room**: A container for a single in-progress game session. Identified by a unique
  code among active rooms. Holds a list of participants, a designation of which
  participant is host, and (in later scenarios) game state. Lifetime begins at creation
  and ends when the backend process restarts.
- **Participant**: A player currently inside a single room. Holds a display name and a
  stable identity within their browser session so that the lobby and host designation
  can refer to them consistently across polls. A participant belongs to exactly one
  room.
- **Host designation**: A property of a single participant within a room, marking them
  as the only participant authorized to start the game. Assigned at room creation;
  stable across lobby polls within the original creator's session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the Start screen, a player can create a room and reach a lobby that
  shows them as host in under 10 seconds on a typical local development environment.
- **SC-002**: 100% of join submissions with an empty code, a whitespace-only code, or a
  code that does not match an active room are rejected with a visible message and create
  no lobby entry.
- **SC-003**: When a second player joins a room, the new participant appears in every
  other lobby viewer's list within 3 seconds (covering one ~2-second poll plus render).
- **SC-004**: Across two rooms operated in parallel, 0 participants from one room appear
  in the other room's lobby at any observed poll cycle over a 60-second test window.
- **SC-005**: Across observed sessions, the Start control is presented to non-hosts 0%
  of the time and is blocked from initiating a game with fewer than 2 players 100% of
  the time.
- **SC-006**: When a lobby viewer leaves the lobby screen, no further polling requests
  for that room are issued by that viewer's session.

## Assumptions

- Player names are accepted at face value in this scenario. Trimming and empty-name
  rejection are owned by Scenario 2 (Game Start & Drawer Flow) and will be tightened in
  that feature, not here.
- Room codes are stored as 4 uppercase letters A–Z. The Join form trims surrounding
  whitespace and upper-cases the input before comparison, so casing on the typed code
  does not matter to the joiner. The server compares the normalized input against
  stored codes as plain string equality.
- A participant's identity is established at create-time or join-time and is held in
  the originating browser's local storage, keyed by room code. This is a client-side
  "remember which participant I am in which room" key, not authentication: there are no
  credentials, no server-side session, and the server does not trust the key — it only
  recognizes participant IDs it previously issued. Clearing browser storage or opening
  the room in a different browser counts as a new joiner.
- Polling cadence of "approximately 2 seconds" means the interval target is 2 seconds.
  Network jitter that causes occasional ~3-second gaps is acceptable; sustained gaps
  longer than 3 seconds are a regression.
- Backend restarts wipe all rooms (in-memory only). Lobby viewers whose room has been
  wiped see a visible "room no longer exists" style message rather than a silent crash
  or a stale lobby.
- The 4-letter A–Z keyspace yields 456,976 codes, which is more than sufficient for the
  lab's concurrent-room counts. Codes SHOULD be generated randomly rather than as a
  predictable counter; strong unguessability is not a goal.
