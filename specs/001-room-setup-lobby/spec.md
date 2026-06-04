# Feature Specification: Room Setup, Lobby & Drawer Flow

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Advance Feature Group 2 (Game Start & Drawer Flow) based on Scenario 2, while preserving Feature Group 1: name trimming, host tracking, duplicate blocking, multi-room isolation, 2s lobby polling, and host-only start with a 2-player minimum. Add drawer assignment and drawer-only word visibility requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room (Priority: P1)

A user (the host) creates a new game room and receives a unique room code and a participant id identifying them as the host.

**Why this priority**: Room creation is the entry point for all other flows; must be reliable and deterministic.

**Independent Test**: Call the room creation endpoint; verify response includes `participantId`, `room.code`, and that the returned participant is flagged as the host in the room snapshot.

**Acceptance Scenarios**:
1. Given a valid `playerName`, When the client requests room creation, Then the server responds with status 201 and a JSON body containing `participantId` and `room` with the host included in `participants` and a `hostId` matching `participantId`.
2. Given an empty or whitespace-only `playerName`, When the client requests room creation, Then the server rejects the request with a validation error (400).

---

### User Story 2 - Join Room and Name Validation (Priority: P1)

Players join an existing room by code and provide a display name. The system trims whitespace and prevents duplicate names within the same room.

**Independent Test**: Create a room, then attempt to join with names that include leading/trailing spaces and duplicate names; verify trimming and duplicate detection.

**Acceptance Scenarios**:
1. Given a room and a `playerName` of "  Alice  ", When `POST /rooms/:code/join` is called, Then the server stores and returns the name as "Alice".
2. Given a room with an existing participant named "Bob", When another client attempts to join with `playerName` "  bob  ", Then the server rejects the join with a 400 and error message indicating duplicate name (case-insensitive match after trimming).
3. Given invalid or empty names after trimming, When join is attempted, Then the server rejects the request with a validation error (400).

---

### User Story 3 - Multi-Room Isolation (Priority: P1)

Multiple rooms operate independently; actions or participants in one room do not affect others.

**Independent Test**: Create two rooms, add participants to each, and confirm each room's snapshot contains only its own participants and available words.

**Acceptance Scenarios**:
1. Given two active rooms A and B, When a participant joins A, Then B's participant list remains unchanged.
2. Given a game action in room A (e.g., a guess or host start), When observed from room B, Then the state is unaffected.

---

### User Story 4 - Lobby Polling (Priority: P1)

Clients in the lobby automatically poll the server to refresh the room snapshot; updates should be visible quickly (about 2 seconds).

**Independent Test**: With one client in LobbyPage, join another player; verify the first client sees the new participant within ~2 seconds.

**Acceptance Scenarios**:
1. Given a host in the lobby, When another player joins, Then clients observing the lobby see the updated participant list within 2 seconds.
2. Polling must be tolerant of transient failures and back off safely if repeated errors occur.

---

### User Story 5 - Host-only Game Start & Minimum Players (Priority: P1)

Only the host may start the game; the start action requires at least two participants (host + one more).

**Independent Test**: Create a room (host only) and attempt `start` action — expect rejection; add a second player and attempt start as host — expect success.

**Acceptance Scenarios**:
1. Given only the host is present, When the host attempts to start the game, Then server responds with 400 and message indicating insufficient players.
2. Given at least two participants and the host issues the start command, When processed, Then the room status transitions out of `lobby` and participants receive the updated snapshot.
3. Given a non-host participant attempts to start the game, When the request is made, Then the server rejects with 403 Forbidden or appropriate error indicating only host may start.

---

### User Story 6 - Drawer Assignment & Secret Word Visibility (Priority: P2)

When the host starts the game, they become the current drawer and receive a secret word that is visible only to them.

**Independent Test**: Start a game as the host and verify the host receives a `secretWord` while other participants receive the same room snapshot without the secret.

**Acceptance Scenarios**:
1. Given the host starts the game, When the start request succeeds, Then `currentDrawer` is assigned to the host participant id.
2. Given the host is the current drawer, When the room snapshot is returned to the host, Then the response includes the `secretWord` value.
3. Given a participant who is not the current drawer, When the room snapshot is returned, Then the response excludes the `secretWord` and only shows general room state.
4. Given a player joins after the game has started, When they fetch room state, Then they see the room state but not the drawer's secret word.

### Edge Cases

- Concurrent join attempts with the same display name must be serialized or otherwise deterministically resolved so no two participants end up with the same normalized name.
- Room codes are case-insensitive; the system must normalize codes on lookup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a new room and return a unique `room.code` and `participantId` for the creating client.
- **FR-002**: The creating participant MUST be identifiable as the host for that room (explicit `hostId` or equivalent in the snapshot).
- **FR-003**: System MUST accept `POST /rooms/:code/join` with a `playerName` and normalize the name by trimming whitespace and collapsing internal whitespace as a normalization step.
- **FR-004**: System MUST reject join attempts when the normalized name duplicates an existing participant's normalized name in that room (case-insensitive comparison).
- **FR-005**: System MUST ensure room isolation: operations in one room MUST not affect other rooms.
- **FR-006**: System MUST provide a `GET /rooms/:code` endpoint returning a `room` snapshot consumable by lobby clients.
- **FR-007**: System SHOULD allow clients to poll the `GET /rooms/:code` endpoint on an interval that enables visible updates within about 2 seconds.
- **FR-008**: System MUST enforce that only the host can trigger the game-start action; start request MUST validate the caller's `participantId` against the room's host.
- **FR-009**: System MUST enforce a minimum of 2 participants to transition from `lobby` to `game` state; otherwise reject the start request with a clear error.
- **FR-010**: System MUST assign `currentDrawer` to the host participant id when the game starts.
- **FR-011**: System MUST generate a `secretWord` when the game starts and expose it only to the current drawer.
- **FR-012**: System MUST exclude `secretWord` from room snapshots delivered to non-drawers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creating a room returns `participantId` and `room.code` in 95% of requests under normal test load.
- **SC-002**: The lobby snapshot reflects new participants within 2 seconds in 95% of observed join events under unit/integration test harness.
- **SC-003**: Duplicate name rejection validates case-insensitively and prevents duplicate participants in 100% of tested join sequences.
- **SC-004**: Only host-initiated start requests transition the room from `lobby` to `game` in 100% of tests where host and participant IDs are provided correctly.
- **SC-005**: The current drawer receives the `secretWord` in a room snapshot while all other participants do not, in 100% of drawer state tests.

## Assumptions

- Room code generation scheme produces short, human-friendly, case-insensitive codes.
- Clients will include the `participantId` they received on room creation in subsequent requests where identity is required.
- Polling frequency is controlled by client-side code and will default to approximately 2 seconds in the lobby.
- The system uses in-memory room state for this feature (no DB integration) and will be tested within that constraint.

**Notes**: Implementation details (transport, data store) are intentionally omitted from this spec; tests must validate behavior and outcomes described above.

## Feature Group 3 - Gameplay Interaction (New)

**Status**: Draft

### Overview

Extend the game flow so that, once a match has started, players may submit guesses and observe a synchronized guess history. The drawer receives the secret word and draws on a shared canvas; guessers submit text guesses that are validated and scored.

### User Stories *(Priority: P1)*

User Story 7 - Guess Submission & Scoring

A guesser submits a text guess which is trimmed and normalized (case-insensitive). Correct guesses award points (+100) to the guesser and are recorded in the room's guess history.

Independent Test: Submit a guess that matches the drawer's secret word in a case-insensitive way; verify the guess is marked correct, the guesser receives +100 points, and the event appears in the room guess history for all clients.

Acceptance Scenarios:
1. Given a drawer with secret word "APPLE", When a guesser submits "  apple  ", Then the server treats it as correct (case-insensitive, trimmed), awards +100 points to the guesser, and records the guess as correct in the guess history.
2. Given a guess that is incorrect, When submitted, Then the server records the guess in the history as incorrect and does not award points.

User Story 8 - Guess History Sync (Polling)

Clients must see recent guesses and scoring updates quickly; the lobby-style short-polling approach (2s) continues to be used during gameplay to keep guess history and scores in sync.

Independent Test: Submit a guess from one client; verify another client's UI sees the guess appear via the next polling update (within ~2 seconds).

Acceptance Scenarios:
1. Given an active game, When a guess is submitted by a participant, Then all participants observing the room via the `GET /rooms/:code` snapshot see the new guess in the `guesses` array within ~2 seconds.
2. Given a correct guess, When processed, Then the guess is recorded and the `scores` map reflects the +100 awarded to the correct guesser and is visible to all participants via subsequent polls.

### Functional Requirements (additions)

- **FR-013**: System MUST accept `POST /rooms/:code/guesses` with `{ participantId, text }` and validate `text` by trimming and rejecting empty or whitespace-only submissions.
- **FR-014**: System MUST compare guesses to the room's `secretWord` using case-insensitive comparison and mark `correct: true` when matching.
- **FR-015**: System MUST append each guess to a `guesses` array on the room with metadata `{ participantId, text, timestamp, correct }` and include the array in `GET /rooms/:code` snapshots.
- **FR-016**: System MUST maintain a `scores` map in the room state mapping `participantId -> number` and increase the guesser's score by +100 on a correct guess.

### Success Criteria (additions)

- **SC-006**: Guess submissions that match the secret are recognized as correct and award +100 points in 100% of tests for normalized matches (trim + case-insensitive).
- **SC-007**: Guess history entries and updated scores propagate to observing clients within ~2 seconds in 95% of polling observations in the test harness.

### Out of Scope (explicit)

- Multi-round mechanics (drawer rotation across multiple rounds) are OUT OF SCOPE for this feature group.
- Countdown timers, round clocks, and automated turn transitions are OUT OF SCOPE for this feature group.

## Feature Group 4 - Result, Restart & Final Validation (New)

**Status**: Draft

### Overview

Provide an end-of-round result view that summarizes scores and allows the room host to restart the round. Restarting should wipe round-specific data (guesses, secret word, current drawer, and canvas state) while preserving the room participants list and their identities. Restart is host-only and must return a fresh room snapshot suitable for re-entering the lobby or starting the next round.

### User Stories *(Priority: P2)*

User Story 9 - End-of-Round Results

At the end of a round, all clients should be able to view the aggregated `scores` map and recent `guesses` history, with a clear indication of the winner(s). This view is read-only for guessers and drawers.

Acceptance Scenarios:
1. Given a finished round, When a client requests the room snapshot, Then the response includes the `scores` map and `guesses` array showing accumulated events for the round.

User Story 10 - Host-only Restart

The host may trigger a restart which wipes round state but keeps players in the room so a new round can start.

Acceptance Scenarios:
1. Given a room with players and completed round data, When the host calls `POST /rooms/:code/restart?participantId=...`, Then the server clears `guesses`, `secretWord`, and `currentDrawer`, resets `scores` to 0 for all participants, and returns the sanitized room snapshot.
2. Given a non-host attempts to call restart, When the request is made, Then the server responds with 403 Forbidden.

### Functional Requirements (additions)

- **FR-017**: System MUST expose `POST /rooms/:code/restart` which only the host may call (requires `participantId`) and which wipes round-specific state while preserving `participants`.
- **FR-018**: System MUST reset `guesses` to an empty array and `scores` entries to `0` for all current participants when restart is called.
- **FR-019**: System MUST clear `secretWord` and `currentDrawer` on restart so the next start assigns a fresh drawer/word.

### Success Criteria (additions)

- **SC-008**: Restart correctly resets round state and leaves the `participants` array unchanged in 100% of restart tests.

### Out of Scope (clarified)

- Automated round sequencing and timers remain OUT OF SCOPE; restart is a manual host action for this feature group.