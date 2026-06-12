# Feature Specification: Game Rounds

**Feature Branch**: `002-game-rounds`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Implement game round lifecycle with drawer assignment, secret word selection, game state transitions, and role-based visibility"

## User Scenarios & Testing

### User Story 1 - Game Round Begins with Drawer Assignment (Priority: P1)

When the host starts the game, one player is assigned as the drawer and all other players become guessers. Each player sees their role clearly indicated.

**Why this priority**: Drawer assignment is the core mechanism that distinguishes the drawer from guessers. Without it, no round can proceed.

**Independent Test**: Can be tested by starting a game with 2+ players and verifying exactly one player is assigned drawer and the rest are guessers.

**Acceptance Scenarios**:

1. **Given** a room with 2 or more players in the lobby, **When** the host starts the game, **Then** exactly one participant is assigned the drawer role and all others are assigned the guesser role
2. **Given** a game round has started, **When** a player views their game screen, **Then** their role ("drawer" or "guesser") is displayed as a badge in the Player Info panel
3. **Given** a game round has started, **When** a player views their game screen, **Then** they can see who the drawer is

---

### User Story 2 - Secret Word is Assigned (Priority: P1)

Before the drawing phase begins, a secret word is selected for the round. Only the drawer can see the secret word.

**Why this priority**: The secret word is the central element of the game — it drives the drawing and guessing. Its visibility must be strictly controlled.

**Independent Test**: Can be tested by observing that the drawer sees a word on screen while guessers see no word or a placeholder.

**Acceptance Scenarios**:

1. **Given** a game round has started, **When** the drawer views their game screen, **Then** they see the secret word displayed
2. **Given** a game round has started, **When** a guesser views their game screen, **Then** they do not see the secret word
3. **Given** a game round has started, **When** a guesser views their game screen, **Then** they see an indicator that the drawer has received a word (e.g., "Drawer is drawing...")
4. **Given** the host has started the game, **When** a guesser polls the room before the role assignment propagates, **Then** they see `status: "lobby"` and `role: null` — the client must wait for `status: "playing"` before activating round-specific UI

---

### User Story 3 - Game State Transitions (Priority: P2)

The room moves through clear states: from lobby to playing (drawing phase), and later to finished.

**Why this priority**: State transitions define the game lifecycle. While the initial focus is on lobby-to-playing, the architecture must support future state changes.

**Independent Test**: Can be tested by verifying the room status changes from lobby to playing when the host starts the game.

**Acceptance Scenarios**:

1. **Given** a room is in lobby state, **When** the host starts the game, **Then** the room transitions to a playing state
2. **Given** a room is in playing state, **When** a player checks the room status, **Then** the status reflects that a game is in progress
3. **Given** a room is in playing state, **When** new players attempt to join, **Then** they are rejected with a message that a game is in progress

---

### Edge Cases

- What happens if the drawer disconnects during a round? The round is ended gracefully: the room transitions to "finished" status, and remaining players see a "Drawer disconnected" message
- What happens if only 1 player remains when the game starts? The host should not be able to start with fewer than 2 players (handled by lobby spec)
- What happens if the available words list is empty? The game should not start if no words are available
- What happens if a guesser disconnects during a round? The game continues normally — only drawer disconnection triggers round end

## Requirements

### Functional Requirements

- **FR-001**: System MUST assign exactly one participant as the drawer when a game round starts
- **FR-002**: System MUST assign all other participants as guessers when a game round starts
- **FR-003**: System MUST display each player's role ("drawer" or "guesser") in the Player Info panel, shown as a labeled badge next to the player name. Unauthenticated viewers (no participantId) see no role information.
- **FR-004**: System MUST select a secret word from the available word list when a round starts
- **FR-005**: System MUST display the secret word to the drawer only during `playing` state, and continue to show it after the round ends (`finished` state)
- **FR-006**: System MUST NOT reveal the secret word to guessers
- **FR-007**: System MUST show guessers a "Drawer is drawing..." message in the canvas area during `playing` state
- **FR-008**: System MUST transition room status from lobby to playing upon game start
- **FR-009**: System MUST reject join attempts for rooms with status playing or finished
- **FR-010**: System MUST persist the secret word for the duration of the round
- **FR-011**: System MUST inform all participants of the drawer's identity during `playing` and `finished` states
- **FR-012**: System MUST select the secret word from the starter word list (the list is a fixed, deterministic set of candidate words; selection may be random)
- **FR-013**: System MUST show guessers a "Round ended" message in the canvas area after the round transitions to `finished`
- **FR-014**: System MUST return a 400 response with error code `EMPTY_WORD_LIST` when attempting to start a game with no available words
- **FR-015**: System MUST omit the `word` field from `GET /rooms/:code` responses when `participantId` is missing or does not match any participant in the room
- **FR-016**: System MUST apply word-visibility filtering per request — there is no shared-state race window where a guesser can observe the word

### Key Entities

- **Round**: Represents a single game round. Contains the secret word, drawer participant ID, list of guessers, and start time.
- **ParticipantRole**: An enum or discriminated type with values "drawer" or "guesser" assigned to each participant for a round.
- **RoomStatus**: Represents the lifecycle state of a room. Values include lobby (existing), playing (active round), and finished (round complete).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Game round starts within 2 seconds of the host clicking "Start Game" (measured server-side: time between POST /rooms/:code/start and room.status === "playing")
- **SC-002**: All participants see their correct role (drawer/guesser) within 2 seconds of round start (measured server-side: time between room.status === "playing" and GET /rooms/:code returns role populated)
- **SC-003**: The drawer sees the secret word within 2 seconds of round start (requires client poll interval ≤ 1 second)
- **SC-004**: No guesser ever sees the secret word during the round
- **SC-005**: Join attempts during a game are rejected 100% of the time with an informative message

## Assumptions

- The host (room creator) is assigned as the drawer for the first round (out of scope for multi-round or rotation for v1)
- The secret word is selected from the existing starter word list available in the room
- The drawer assignment and word selection happen atomically when the game starts
- Players are expected to behave honestly — no technical measures to prevent guessers from seeing the drawer's screen (physical world constraint)
- Only one round is supported for v1 (multi-round and drawer rotation are explicitly out of scope per project constraints)
- The secret word is not populated during the lobby state — Room.word is set only when the game starts (status transitions to "playing")

## Clarifications

### Session 2026-06-08

- **Q**: What happens when the drawer disconnects during a round? → **A**: Gracefully end the round — auto-transition room to `"finished"`, show "Drawer disconnected" message to all remaining players
- **Q**: Where should the secret word be displayed to the drawer? → **A**: Banner above the canvas area
- **Q**: What should guessers see in the canvas area during the round? → **A**: "Drawer is drawing..." placeholder message
- **Q**: Does FR-012 require deterministic (predictable/reproducible) word selection, or does "deterministically" refer to the fixed source list? → **A**: Refers to the fixed source list; selection may be random (keep `Math.random()`)
- **Q**: What happens when a guesser disconnects during a round? → **A**: Game continues normally — only drawer disconnection triggers round end

### Session 2026-06-09

- **Q**: What does "clearly indicate" mean in FR-003? → **A**: Each participant's role is shown as a "Drawer" or "Guesser" badge in the Player Info panel on the game screen.
- **Q**: What are the exact dimensions of the secret word banner? → **A**: Full-width bar positioned at the top of the canvas area with 8px padding on all sides.
- **Q**: Are the UI strings internationalized? → **A**: The English strings ("Drawer is drawing...", "Drawer disconnected", "Round ended") are defaults. The architecture allows for localization but does not mandate it.
- **Q**: How is word leakage prevented during race conditions? → **A**: Word filtering is applied per-request in `toRoomSnapshot`. Since each GET request independently resolves the viewer's role, there is no shared-state race window.
- **Q**: What poll interval should the client use? → **A**: Clients should poll at ≤ 1 second intervals to meet the 2-second visibility requirements (SC-001–SC-003).
