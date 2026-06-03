# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow. Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host starts the game; drawer and secret word are assigned (Priority: P1)

A host with at least one other player in the lobby presses Start. All
participants' screens transition from the lobby view to the game view. On the
game view, every participant can see who the drawer is (the host). The drawer
can see the room's secret word for the round; every other participant sees a
placeholder that does not reveal the word's content or length.

**Why this priority**: This is the entire deliverable of Scenario 2. The
remaining stories (US2) only polish a precondition (clean names). Without US1
the scenario is not satisfied.

**Independent Test**: With Scenario 1 working (two browser tabs in a lobby
with at least 2 players, host in Tab A, guest in Tab B), press Start in Tab A.
Within ~3 seconds both tabs leave the lobby. Tab A shows the drawer as the
host's name and a visible secret word from the starter list. Tab B shows the
drawer as the host's name and a placeholder where the word would be. Reloading
either tab keeps the same word and the same placeholder, respectively.

**Acceptance Scenarios**:

1. **Given** the host is on the lobby with 2+ players, **When** the host
   presses Start, **Then** within ~3 seconds all participants' screens leave
   the lobby and show the game view.
2. **Given** the game view is showing, **When** any participant looks at the
   drawer indicator, **Then** they see the host's display name clearly
   labelled as the drawer.
3. **Given** the game view is showing, **When** the drawer looks at the
   secret-word area, **Then** they see one of the starter words (`rocket`,
   `pizza`, `castle`, `guitar`, `sunflower`).
4. **Given** the game view is showing, **When** a non-drawer participant
   looks at the secret-word area, **Then** they see a placeholder that does
   not reveal the word's text, length, or any letters.
5. **Given** the game has started in a room, **When** the same room is
   re-fetched any number of times by any participant, **Then** the displayed
   word for the drawer is the same word every time and the displayed drawer
   identity is the same participant.
6. **Given** the host has already pressed Start, **When** the host (or any
   non-host attempting to abuse the control) presses Start again, **Then**
   the room remains in the same active state with the same drawer and the
   same word — no second transition occurs.
7. **Given** the drawer's browser tab is refreshed mid-round, **When** the
   tab finishes reloading, **Then** the same participant is still the drawer
   and the same word is again visible to them.
8. **Given** a non-drawer's browser tab is refreshed mid-round, **When** the
   tab finishes reloading, **Then** the same participant is still a guesser
   and the word is still hidden behind the placeholder.

---

### User Story 2 - Player names are validated at room creation and join (Priority: P2)

A player who tries to create or join a room with an empty or whitespace-only
name is rejected with a clear, user-visible message. A name with surrounding
whitespace is accepted but recorded trimmed, so participant lists never show
ragged spacing or empty rows.

**Why this priority**: Scenario 2 requires the drawer to be "clearly
identified". An empty or `"Player"`-fallback name makes that identification
ambiguous. This story removes that ambiguity. It is lower priority than US1
because Scenario 1's lobby already tolerates loose names today; this story
tightens that behavior without changing the game-start mechanics.

**Independent Test**: From the Start screen, submit Create Room with name
empty → expect a visible error and no navigation. Submit again with name
`"   "` (three spaces) → expect the same. Submit with `"  Alice  "` → expect
acceptance, and the lobby shows the participant as `Alice` (no leading or
trailing spaces). Repeat for Join Room.

**Acceptance Scenarios**:

1. **Given** the Create Room form is open, **When** the player submits with
   an empty name, **Then** a visible error message is shown and no room is
   created.
2. **Given** the Create Room form is open, **When** the player submits with
   a name consisting only of whitespace, **Then** a visible error message is
   shown and no room is created.
3. **Given** the Create Room form is open, **When** the player submits with
   `"  Alice  "`, **Then** a room is created and the lobby lists the
   participant as `Alice`.
4. **Given** the Join Room form is open, **When** the player submits with an
   empty or whitespace-only name, **Then** the join is rejected with a
   visible error message and no participant is added to the room.
5. **Given** the Join Room form is open, **When** the player submits with
   `"  Bob  "`, **Then** the participant appears in the lobby as `Bob`.

---

### Edge Cases

- Host presses Start with exactly 2 players → accepted; the host is the
  drawer; a deterministic word is selected.
- Host presses Start with 1 player → blocked (Scenario 1 FR-012); not a
  Scenario 2 concern.
- Non-host attempts to start (e.g., a guest tab manipulated to surface the
  control or to issue the start request directly) → rejected by the server
  with a clear "Only the host can start the game" message; no transition.
- Host presses Start twice rapidly → the second attempt is a no-op; the room
  state, drawer, and word are unchanged.
- Drawer refreshes mid-round → drawer identity reclaimed from localStorage
  (Scenario 1 Q1); word remains visible to them.
- Non-drawer refreshes mid-round → identity reclaimed; word remains hidden.
- A new player attempts to join a room that has already started → rejected
  with a visible message; participants list is unchanged. (Late joiners
  would have no drawer/guesser assignment path within the lab's no-rotation
  scope.)
- Player submits a name like `"  Alice  Smith  "` → trimmed to
  `"Alice  Smith"` (internal whitespace preserved; only outer whitespace
  removed).
- Two players join with the same display name after trim → both accepted;
  the lobby shows two rows with the same name. Disambiguation is out of
  scope for this scenario.
- Backend process restarts during an active round → the room is wiped
  (existing behavior); clients on the game screen see a "Room not found"
  style message on next poll.
- Drawer's poll request fails transiently → the UI does not crash; on the
  next successful poll, the same word is rendered again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Create Room and Join Room flows MUST trim leading and
  trailing whitespace from the submitted player name before recording it.
- **FR-002**: The Create Room and Join Room flows MUST reject an empty or
  whitespace-only player name (after trim) with a visible user-facing
  message; no room creation or join MUST occur in those cases.
- **FR-003**: When the host presses Start with the room in lobby state and
  at least 2 players present, the system MUST transition the room to an
  active "game in progress" state that all participants observe within
  approximately 3 seconds of the press.
- **FR-004**: Once the room is active, the system MUST identify exactly one
  drawer for the round — the first participant in the room's join order
  (i.e., the host).
- **FR-005**: The game view MUST clearly label the drawer to every
  participant so any non-drawer can identify who is drawing at a glance.
- **FR-006**: The drawer MUST be able to see the room's secret word for the
  current round on their game view.
- **FR-007**: Every non-drawer participant MUST NOT be able to see the
  secret word — neither the word's text, nor its length, nor any letter
  count — anywhere in the UI or in any data exposed to their client.
- **FR-008**: The secret word for a room's round MUST be deterministic from
  the room's identity, so that every snapshot of the same room reports the
  same word for the same round, regardless of which client requests it or
  how many times.
- **FR-009**: The secret word MUST be drawn from the starter word list
  (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`).
- **FR-010**: A Start action issued against a room that has already
  transitioned MUST be a no-op — the room state, drawer assignment, and
  secret word MUST remain unchanged.
- **FR-011**: A Start action issued by anyone other than the room's host
  MUST be rejected; the room MUST remain in lobby state and the rejection
  MUST produce a user-visible message on the requester's screen.
- **FR-012**: Once a room has transitioned out of lobby state, Join requests
  for that room MUST be rejected with a visible message; the existing
  participant list MUST be unchanged.
- **FR-013**: Polling cadence carried forward from Scenario 1 (~2 seconds)
  MUST continue to apply on the game view so that any state changes — drawer
  identity, the placeholder/word display, status text — remain in sync.
- **FR-014**: All user-visible error messages introduced by this feature
  MUST be plain-language strings (e.g., "Enter your name", "Only the host
  can start the game", "Room is no longer open to new players"); raw error
  codes, stack traces, or framework names MUST NOT surface to the user.

### Key Entities

- **Room**: Extended from Scenario 1 to include a status that distinguishes
  the lobby phase from an in-progress game; a drawer designation for the
  current round; and a secret-word value associated with the current round.
- **Round**: A logical grouping that bundles the drawer designation and the
  secret word together. Scenario 2 introduces exactly one round per room
  (multi-round play is out of scope for this lab). The round is created at
  the moment of Start and lives for the rest of the room's life.
- **Drawer designation**: A property of the current round naming exactly one
  participant by id; stable for the lifetime of the round.
- **Secret word**: A string associated with the current round, drawn from
  the starter word list; deterministically chosen at round creation time
  from the room's identity; visible only to the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the host presses Start with at least 2 players in the
  room, every connected participant's screen reflects the active state and
  the drawer designation within 3 seconds in 100% of observed runs.
- **SC-002**: Across the entire round, 0 non-drawer participants see any
  portion of the secret word in any UI region, network payload, or browser
  developer-tools panel.
- **SC-003**: Across 5 repeated fetches of the same room's snapshot from
  any combination of clients, the reported drawer id and the secret word
  (as observed by the drawer) are identical in 100% of fetches.
- **SC-004**: 100% of Create or Join attempts with an empty or
  whitespace-only name are rejected with a user-visible message and create
  no participant record.
- **SC-005**: 100% of names submitted with surrounding whitespace are
  recorded and displayed with that whitespace removed; no participant row
  ever shows leading or trailing spaces.
- **SC-006**: 0% of Start attempts from non-host participants succeed.
- **SC-007**: 0% of Join attempts against an active (post-start) room
  succeed; existing participants are unchanged in 100% of those attempts.
- **SC-008**: After a browser tab refresh, the same role (drawer vs
  non-drawer) is restored on the same participant's tab in 100% of
  observed runs, with the word visibility unchanged.

## Assumptions

- The drawer is the room's host for the round. The README phrasing "host
  (or first player)" treats these as equivalent because Scenario 1 makes the
  host always equal `participants[0]`. This spec adopts the same equivalence.
  Future scenarios that introduce drawer rotation will revisit the drawer
  selection, but rotation is explicitly out of scope here.
- The "deterministic from room identity" rule is satisfied if the algorithm
  uses only inputs that are stable for the room's lifetime (for example,
  the room code, or a hash thereof, modulo the starter-words length). The
  spec deliberately does not prescribe the algorithm; the plan picks one
  and locks it in.
- Player name trimming removes only leading and trailing whitespace.
  Internal whitespace, mixed casing, emoji, and any other characters pass
  through unchanged. There is no maximum length constraint, and there is
  no uniqueness constraint — two participants may share the same display
  name. These looseness choices match the lab's "fast iteration" posture.
- "Visible only to the drawer" is enforced at the data boundary, not only
  in the UI. The server's snapshot for a non-drawer participant MUST NOT
  contain the word in any field; the drawer-only word is delivered only to
  requests that identify the requester as the drawer for that room.
- Late joiners (Join requests after Start) are rejected with a visible
  message rather than silently dropped, so the joining player understands
  why their attempt failed.
- Backend restarts wipe the room (existing in-memory behavior). Clients
  whose room is wiped see a visible "Room not found" style message rather
  than a silent crash.
- The game view is the destination already named in the starter (`/game`).
  This scenario fills it with the drawer indicator and the word/placeholder;
  the canvas, guesses, scoreboard, and result remain Scenario-3 and
  Scenario-4 territory.
