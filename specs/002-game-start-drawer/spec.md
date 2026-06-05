# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-05

**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — Drawer Assignment on Game Start (Priority: P1)

When the host starts the game, one player is clearly identified as the drawer. The
drawer role is assigned to the first player in the room (the host). All players can see
who the drawer is on the game screen.

**Why this priority**: Drawer assignment is the prerequisite for all other game logic.
Word selection and word visibility both depend on knowing who the drawer is.

**Independent Test**: Start a game with two players. Confirm the game screen for both
players shows the same player identified as the drawer. Confirm it is always the host
(first player to create the room).

**Acceptance Scenarios**:

1. **Given** the host has started the game and two players are present, **When** the
   game screen loads for any player, **Then** exactly one player is displayed as the
   drawer and that player is the one who created the room (the host).

2. **Given** the game has started, **When** the drawer views the game screen, **Then**
   they are clearly identified as the drawer (e.g. a visible label or badge).

3. **Given** the game has started, **When** a non-drawer player views the game screen,
   **Then** they can see who the designated drawer is.

---

### User Story 2 — Deterministic Secret Word Selection (Priority: P1)

When the game starts, a secret word is selected for the round. The word is always the
first entry from the starter word list, making it fully deterministic and reproducible
across sessions.

**Why this priority**: The secret word must be known before visibility rules can be
applied. Deterministic selection ensures acceptance criteria can be verified without
any randomness.

**Independent Test**: Start a game. Confirm the drawer sees the word "rocket". Restart
and start again — confirm the word is still "rocket".

**Acceptance Scenarios**:

1. **Given** the game has started, **When** the secret word is selected, **Then** it is
   always `rocket` — the first entry in the starter word list — with no randomness.

2. **Given** a game is restarted and a new game is started, **When** the word is
   selected, **Then** it is `rocket` again (selection is stateless and positional, not
   sequential).

---

### User Story 3 — Drawer-Only Word Visibility (Priority: P1)

The secret word is visible on the game screen only to the drawer. All other players see
the canvas and guess input but do not see the word.

**Why this priority**: Correct visibility rules are the core fairness mechanism of the
game. Without them, guessers could see the answer before guessing.

**Independent Test**: Start a game with two browser tabs. Confirm the drawer tab shows
the secret word. Confirm the guesser tab does not show the secret word anywhere on
the game screen.

**Acceptance Scenarios**:

1. **Given** the game has started and a player is the drawer, **When** that player views
   the game screen, **Then** the secret word is displayed visibly to them.

2. **Given** the game has started and a player is a guesser, **When** that player views
   the game screen, **Then** the secret word is not displayed anywhere on their screen.

3. **Given** the game has started, **When** any player views the game screen, **Then**
   the drawer's identity is visible to all players.

---

### Edge Cases

- A room with exactly 2 players starts: the host is the drawer, the other player is the
  only guesser.
- The host refreshes the game screen mid-round: they are still shown as the drawer and
  the secret word is still visible to them (the assignment persists in server state).
- A player who is a guesser inspects the page source or network responses: the word must
  not be present in any response sent to a guesser's client. The server must filter it.
- The game is restarted (Scenario 4) and started again: the same word "rocket" is
  selected and the same drawer assignment logic applies (host = drawer).

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST assign the drawer role to the first participant in the room
  (the host) when the game starts.
- **FR-002**: Drawer assignment MUST be stored on the server and returned in the room
  snapshot so all players see the same drawer.
- **FR-003**: The game screen MUST display the drawer's identity to all players.
- **FR-004**: The secret word MUST be selected as the first entry in the starter word
  list (`rocket`) when a game starts; this selection MUST be deterministic.
- **FR-005**: The secret word MUST be stored on the server as part of the active round
  state and returned only to the drawer in the room snapshot.
- **FR-006**: The room snapshot returned to a guesser MUST NOT include the secret word.
- **FR-007**: The game screen MUST display the secret word to the drawer only.
- **FR-008**: The game screen MUST NOT display the secret word to guessers.
- **FR-009**: Player names MUST be trimmed and non-empty before a room can be created
  or joined (carried forward from Scenario 1; no new work required).

### Key Entities

- **Room** (extended): Adds `drawerId: string` and `currentWord: string` to the active
  round state alongside existing fields (code, status, hostId, participants).
- **RoomSnapshot** (role-aware): The `currentWord` field is included only when the
  requesting participant is the drawer; omitted for guessers. The `drawerId` field is
  always included.
- **Participant**: Unchanged — id, display name (trimmed), join timestamp.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Starting a game with two players always results in exactly one drawer
  being assigned; 100% of manual test runs confirm the host is the drawer.
- **SC-002**: The secret word shown to the drawer in a two-browser test is always
  "rocket" across 100% of test runs, with no variation.
- **SC-003**: In a two-browser test, the secret word is visible on the drawer's game
  screen and absent from the guesser's game screen on every run.
- **SC-004**: 100% of the acceptance scenarios in this spec pass when tested manually
  with two browser tabs.

---

## Assumptions

- Scenario 1 is fully implemented and passing: room creation, host tracking, polling,
  and the Start Game flow are all working.
- The drawer is always the host (participants[0], the room creator). Multi-round drawer
  rotation is out of scope.
- Word selection is positional (always index 0 of the starter list = "rocket"). There
  is no round counter or word advancement in this scenario.
- The server is responsible for filtering the secret word out of snapshots sent to
  guessers; the client does not apply any additional filtering.
- The `viewerParticipantId` already passed as a query parameter to `GET /rooms/:code`
  is the mechanism used to determine whether to include the secret word in the response.
- The game screen already exists as a placeholder in the starter; this spec covers
  adding drawer identification and word display to it, not rebuilding the screen.
- Multiple rounds, drawer rotation, and timers are explicitly out of scope per the README.
