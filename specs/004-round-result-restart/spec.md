# Feature Specification: Round Result, Restart & Final Validation

**Feature Branch**: `004-round-result-restart`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Round Result, Restart & Final Validation — Brownfield enhancement of the Scribble starter. Scenario: Given a round ends (triggered when any guesser submits a correct guess or the host manually ends the round), When the result state is displayed, Then all players see the correct word revealed (no longer viewer-gated), the final scores for all participants, and the complete guess history in the RoomSnapshot. The host sees a 'Restart Game' button in the result view. When the host clicks restart, Then the room status transitions from 'playing' back to 'lobby', all round-scoped state is cleared (strokes reset to [], guesses reset to [], drawerId reset to null, currentWord reset to null, scores reset to 0 for all participants), but the participant list (names and IDs) is preserved. All players see the lobby screen on their next poll without any manual action. Non-host players in the result view see a waiting message such as 'Waiting for host to restart...'. On restart, the existing hostId is preserved. The room code is unchanged. The restart is initiated by a new POST /rooms/:code/restart endpoint that checks participantId === hostId (403 otherwise) and room.status === 'playing' or 'finished' (400 otherwise). The response returns the updated RoomSnapshot with status 'lobby' and all cleared fields."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Round End Trigger (Priority: P1)

A round ends when either (a) any guesser submits a correct guess, or (b) the host manually
ends the round. In both cases, `room.status` transitions from `"playing"` to `"finished"`,
and the correct word becomes visible to all players (viewer-gating is lifted in the result
state).

**Why this priority**: The round-end transition is the prerequisite for every other
scenario-4 behaviour. Without it, there is no result state to display and no restart
capability.

**Independent Test**: Submit a correct guess and confirm the next poll returns
`status: "finished"` with `currentWord` visible to the non-drawer. Then call the manual
end endpoint as the host and confirm the same transition.

**Acceptance Scenarios**:

1. **Given** the game is `playing`, **When** a guesser submits a correct guess, **Then**
   the server responds with `correct: true`, updates the score, appends the guess to
   history, and atomically sets `room.status = "finished"` so the round ends immediately.
2. **Given** the game is `playing`, **When** the host calls `POST /rooms/:code/end` with
   their `participantId`, **Then** `room.status` transitions to `"finished"` without any
   score or guess changes.
3. **Given** the game is already `finished`, **When** any player polls `GET /rooms/:code`,
   **Then** `currentWord` is included in the snapshot for ALL viewers (no viewer-gating).
4. **Given** the game is NOT `playing` (already `finished` or `lobby`), **When** the host
   calls `POST /rooms/:code/end`, **Then** the server responds with 400.
5. **Given** a non-host calls `POST /rooms/:code/end`, **Then** the server responds with 403.

---

### User Story 2 — Result Display (Priority: P1)

When `room.status === "finished"`, all players see a result view that reveals the correct
word, shows the final scoreboard, and displays the complete guess history. The host sees a
"Restart Game" button. Non-hosts see a waiting message.

**Why this priority**: The result view is the payoff moment of the round — it confirms
who won, what the word was, and validates the game outcome. It is the primary deliverable
of the round-end transition.

**Independent Test**: End a round (via correct guess or manual end). Open two tabs.
Confirm both tabs show the correct word, sorted scores, and full guess history. Confirm
Tab A (host) shows a "Restart Game" button. Confirm Tab B (non-host) shows
"Waiting for host to restart...".

**Acceptance Scenarios**:

1. **Given** `room.status === "finished"`, **When** any player views the game/result screen,
   **Then** the correct word is displayed (no longer hidden from non-drawers).
2. **Given** `room.status === "finished"`, **When** the current player is the host, **Then**
   a "Restart Game" button is visible and actionable.
3. **Given** `room.status === "finished"`, **When** the current player is NOT the host,
   **Then** a waiting message such as "Waiting for host to restart..." is shown and no
   restart button is present.
4. **Given** `room.status === "finished"`, **When** any player views the screen, **Then**
   the scoreboard shows final scores sorted highest-to-lowest.
5. **Given** `room.status === "finished"`, **When** any player views the screen, **Then**
   the complete guess history is displayed in submission order.

---

### User Story 3 — Host Restart (Priority: P2)

The host clicks "Restart Game" and the room returns to the lobby state. All round-scoped
state is wiped but the participant list, `hostId`, and room code are preserved. All
players transition to the lobby view on their next poll.

**Why this priority**: Restart enables consecutive rounds without re-creating the room.
It is a convenience feature layered on top of the round-end core (P1).

**Independent Test**: Host clicks "Restart Game". Confirm the response has
`status: "lobby"`, `strokes: []`, `guesses: []`, `drawerId: null`, `currentWord: null`,
and all participant scores are `0`. Confirm both tabs show the lobby view within one poll
cycle.

**Acceptance Scenarios**:

1. **Given** the room is `finished` and the caller is the host, **When**
   `POST /rooms/:code/restart` is called, **Then** `room.status` becomes `"lobby"`,
   `strokes` and `guesses` are emptied, `drawerId` and `currentWord` are set to `null`,
   all participant `score` values are reset to `0`, and `hostId` and the participant list
   are preserved unchanged.
2. **Given** the room is `finished`, **When** a non-host calls restart, **Then** the server
   responds with 403.
3. **Given** the room is `lobby`, **When** the host calls restart, **Then** the server
   responds with 400 (already in lobby — nothing to restart).
4. **Given** the host has restarted, **When** all players poll `GET /rooms/:code`, **Then**
   they see `status: "lobby"` and the lobby UI (player list, "Start Game" button for host)
   within one poll cycle.

---

### Edge Cases

- What if the host ends the round before any correct guesses? The result view shows the
  correct word, all scores at 0, and whatever guesses were submitted.
- What if a player refreshes their browser while in the result state? They lose their
  session (out of scope per constitution) but can re-join the room if the room code is
  known.
- What if the host restarts while another player is mid-guess submission? The guess
  handler validates `room.status === "playing"` (FR-009 from Scenario 3) and returns 400;
  the restart proceeds unaffected.
- What if there are no guesses at all when the round ends? The result view shows the
  correct word, all scores at 0, and an empty guess history — this is a valid state.
- What if `room.status` is already `"lobby"` and the host calls restart? Rejected with 400.
- What if `room.status` is `"playing"` and the host calls restart directly (skipping end)?
  The restart endpoint accepts `"playing"` OR `"finished"` (per spec), so this is allowed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When `POST /rooms/:code/guess` receives a correct guess, the handler MUST set
  `room.status = "finished"` atomically before `saveRoom()`.
- **FR-002**: `POST /rooms/:code/end` MUST be a new endpoint accessible only to the host
  (`participantId === hostId`); non-hosts receive 403. It MUST set `room.status = "finished"`
  and call `saveRoom()`. It MUST reject with 400 if `room.status` is already `"finished"` or
  `"lobby"`.
- **FR-003**: In `toRoomSnapshot()`, when `room.status === "finished"`, `currentWord` MUST
  be forwarded to ALL viewers regardless of `viewerParticipantId` (viewer-gating is lifted
  in the result state).
- **FR-004**: The frontend MUST render a result view when `room.status === "finished"`. This
  view MUST display: the correct word, the scoreboard (sorted by score descending), and
  the full guess history.
- **FR-005**: When `room.status === "finished"` and the current participant is the host,
  the frontend MUST render a "Restart Game" button.
- **FR-006**: When `room.status === "finished"` and the current participant is NOT the
  host, the frontend MUST render a waiting message (e.g., "Waiting for host to restart...")
  and MUST NOT show the restart button.
- **FR-007**: `POST /rooms/:code/restart` MUST be a new endpoint accessible only to the
  host (`participantId === hostId`); non-hosts receive 403. It MUST accept rooms with
  `status === "playing"` OR `"finished"`; `"lobby"` MUST be rejected with 400.
- **FR-008**: The restart handler MUST: set `room.status = "lobby"`; set `room.drawerId =
  null`; set `room.currentWord = null`; set `room.strokes = []`; set `room.guesses = []`;
  reset every participant's `score` to `0`. It MUST NOT modify `room.hostId`, `room.code`,
  or the participant list (names / IDs).
- **FR-009**: After restart, `toRoomSnapshot()` MUST return the room with `status:
  "lobby"`, all cleared fields, and preserved participants so the lobby UI renders
  correctly without any additional frontend changes.
- **FR-010**: A new Zod schema `endRoundSchema` MUST validate `{ participantId }`.
- **FR-011**: A new Zod schema `restartSchema` MUST validate `{ participantId }`.

### Key Entities

- **Room** (extended behaviour): `status` gains `"finished"` as a valid value. `currentWord`
  visibility in `toRoomSnapshot` depends on `status === "finished"` (all viewers) vs
  `"playing"` (viewer-gated).
- **RoomSnapshot** (extended behaviour): `currentWord` may be non-null for non-drawers
  when `status === "finished"`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A correct guess transitions the room to `"finished"` within the same HTTP
  response cycle — no additional polling step required for the status change.
- **SC-002**: After a round ends, all polling tabs show the correct word within one poll
  cycle (~2 seconds).
- **SC-003**: After the host clicks restart, all polling tabs show the lobby view within
  one poll cycle (~2 seconds).
- **SC-004**: A non-host restart attempt always returns 403 and never mutates room state.
- **SC-005**: After restart, all participant scores are exactly 0 and the scoreboard
  reflects this on the next poll.

## Assumptions

- `"finished"` is a new valid value for `RoomStatus` alongside `"lobby"` and `"playing"`.
- The existing `GamePage` component (from Scenario 3) will be extended to handle the
  `"finished"` status by rendering a result view instead of the active game canvas.
- The existing `LobbyPage` component (from Scenario 1) already handles `"lobby"` status;
  no changes are needed there. After restart, players will naturally see the lobby view
  because polling updates `RoomState` and the router or conditional rendering switches
  the display.
- The `POST /rooms/:code/guess` handler from Scenario 3 is the only place where a
  correct guess is processed; adding `room.status = "finished"` there is a single-line
  extension.
- Round-end by correct guess and manual end are both supported; the manual end endpoint
  exists for host discretion (e.g., giving up on a hard word).
- No persistence beyond the in-memory `Room` map; a server restart loses all rooms.
- No new npm dependencies are introduced.
- The room code is immutable across restarts; players re-enter the same room for the
  next round.
