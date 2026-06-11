# Feature Specification: Round Start Setup

**Feature Branch**: `002-round-start-setup`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "When a game begins, player names must be validated by trimming whitespace; empty or whitespace-only names are rejected with clear feedback. At the start of each round, the system assigns a drawer-typically the host or first eligible player-who is clearly marked in the UI. A secret word is selected deterministically from the provided starter word list, ensuring consistent behavior across clients. The word is visible only to the assigned drawer, while all other players see a blank or waiting state."

## Clarifications

### Session 2026-06-10

- Q: How should drawer assignment work across rounds? → A: Host first, then rotate by stable join order.
- Q: Should non-drawers receive the secret word in synced round state? → A: Only the assigned drawer receives the secret word; non-drawers receive no secret word value.
- Q: Are later rounds in scope for this feature? → A: Only first-round setup is in scope now; later rotation is documented for future work.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Player Names Before Play (Priority: P1)

A player can enter a display name with accidental surrounding whitespace and
still appear in the game under the cleaned name. Empty or whitespace-only names
are rejected with clear feedback before the player can participate.

**Why this priority**: Every round depends on a trustworthy player list. Invalid
or blank names make drawer assignment and game state unclear.

**Independent Test**: Attempt to create or join a game with names containing
leading and trailing whitespace, then with whitespace-only names. Confirm valid
names are trimmed and invalid names are rejected without adding the player.

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading or trailing whitespace, **When**
   the player creates or joins a room, **Then** the player appears everywhere
   under the trimmed name.
2. **Given** a player enters an empty or whitespace-only name, **When** the
   player attempts to create or join a room, **Then** the action is rejected with
   clear feedback that a player name is required.
3. **Given** a game is about to begin, **When** the player list is used for
   round setup, **Then** only valid trimmed names are present in the round state.

---

### User Story 2 - Assign and Mark the First Drawer (Priority: P1)

At the start of the first round, players can immediately tell who is responsible
for drawing. The Host draws first when eligible; if the Host is not eligible,
the first eligible player by stable join order draws.

**Why this priority**: The game cannot proceed unless one player is clearly
assigned to draw and everyone shares the same understanding of that assignment.

**Independent Test**: Start the first round with a Host and at least one other
eligible player. Confirm exactly one drawer is assigned, the first drawer is the
Host when eligible, fallback assignment uses stable join order, and every player
can see who the drawer is.

**Acceptance Scenarios**:

1. **Given** the Host is eligible when a round starts, **When** drawer assignment
   occurs for the first round, **Then** the Host is assigned as the drawer.
2. **Given** the Host is not eligible and another player is eligible, **When**
   the first round starts, **Then** the first eligible player by stable join
   order is assigned as the drawer.
3. **Given** a drawer has been assigned, **When** any player views the game
   screen, **Then** the assigned drawer is clearly marked.

---

### User Story 3 - Reveal the Secret Word Only to the Drawer (Priority: P1)

The drawer receives and sees the selected secret word for the first round,
while all other players receive no secret word value and see only a blank or
waiting state.

**Why this priority**: Hidden-word visibility is central to fair play. Non-drawer
players must not receive the answer before guessing.

**Independent Test**: Start the same first round in multiple clients for the
same room. Confirm all clients agree on the assigned drawer, only that drawer
receives and sees the word, and non-drawers see a waiting state without
receiving the word.

**Acceptance Scenarios**:

1. **Given** a starter word list is available, **When** the first round starts,
   **Then** one secret word is selected deterministically for that round.
2. **Given** the assigned drawer views the first round, **When** the secret word is
   available, **Then** the drawer can see the word.
3. **Given** any non-drawer views the same first round, **When** the secret word is
   available to the drawer, **Then** the non-drawer sees a blank or waiting state
   and receives no secret word value.
4. **Given** multiple clients are viewing the same room and first round, **When**
   they refresh or sync state, **Then** they continue to agree on the same drawer
   and selected word visibility.

### Edge Cases

- Player names containing spaces, tabs, or line breaks at the beginning or end
  are trimmed before validation and display.
- Empty and whitespace-only player names are rejected with a clear message and
  do not create or join a playable participant.
- If no eligible player exists when the first round starts, the round does not
  begin and players receive clear feedback.
- If the starter word list is unavailable or empty, the round does not begin and
  players receive clear feedback.
- Refreshing or reopening the round view preserves drawer-only word visibility:
  the drawer still receives and sees the word, and non-drawers still receive no
  secret word value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names
  before accepting, storing, displaying, or using those names in round setup.
- **FR-002**: System MUST reject empty or whitespace-only player names with clear
  user-facing feedback and prevent those players from being added to a room.
- **FR-003**: System MUST use the trimmed player name consistently anywhere the
  player appears in the lobby or active game.
- **FR-004**: System MUST assign exactly one drawer at the start of the first
  round when at least one eligible player exists.
- **FR-005**: System MUST assign the Host as drawer for the first round when the
  Host is eligible.
- **FR-006**: System MUST assign the first eligible player by stable join order
  when the Host is not eligible for the first round.
- **FR-007**: System MUST clearly mark the assigned drawer in the game UI for all
  players in the room.
- **FR-008**: System MUST select exactly one secret word for the first round from
  the provided starter word list.
- **FR-009**: System MUST select the first-round secret word deterministically as
  the first word from the ordered starter word list.
- **FR-010**: System MUST ensure all clients viewing the same room and first round
  agree on the same assigned drawer and selected secret word.
- **FR-011**: System MUST make the secret word visible to the assigned drawer for
  the first round.
- **FR-012**: System MUST provide no secret word value to every non-drawer,
  showing a blank or waiting state instead.
- **FR-013**: System MUST preserve drawer-only word visibility across normal
  refreshes or room-state updates during the first round.
- **FR-014**: System MUST fail gracefully with clear feedback when the first round
  cannot start because no eligible drawer exists or no starter word is available.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST use TypeScript and ES Modules in both `frontend/` and `backend/`.
- **CC-002**: Feature MUST use HTTP REST requests and polling for synchronization.
- **CC-003**: Feature MUST keep all room/game state in memory only; databases and persistent storage are out of scope.
- **CC-004**: Feature MUST NOT add WebSockets, Socket.io, server-sent events, authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated dependencies.
- **CC-005**: Backend request and response boundaries MUST use Zod validation.

### Key Entities *(include if feature involves data)*

- **Player**: A participant in a room with a valid trimmed display name and a
  stable room join order.
- **Round**: The first playable drawing turn within a started game for this
  feature. The round has a number, exactly one assigned drawer, and one selected
  secret word.
- **Drawer**: The player assigned to draw for the first round. The drawer is
  visible to every player, but only the drawer can see the secret word.
- **Starter Word List**: The ordered list of candidate words used to choose each
  first-round secret word.
- **Secret Word**: The word selected for the first round and visible only to
  the assigned drawer. Non-drawers receive no secret word value for the round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested create and join attempts, leading and trailing
  whitespace is removed from accepted player names before the player appears in
  the lobby or game.
- **SC-002**: In 100% of tested create and join attempts, empty or
  whitespace-only names are rejected with clear feedback and no player is added.
- **SC-003**: In 100% of tested first-round starts with eligible players, exactly
  one drawer is assigned and visibly marked to all players within 3 seconds
  under normal conditions.
- **SC-004**: In 100% of repeated tests using the same room and starter word
  list, all clients observe the same first-round drawer and same selected word
  visibility outcome.
- **SC-005**: In 100% of tested first-round views, the assigned drawer can see
  the secret word within 3 seconds under normal conditions, while non-drawers
  receive no secret word value.
- **SC-006**: At least 90% of playtest participants can identify who is drawing
  and whether they are waiting within 5 seconds of the first round starting.

## Assumptions

- This feature begins after the existing room lobby flow has transitioned a room
  into an active game state.
- The existing room Host and stable player join order are available when the
  first round starts.
- Eligible players are current room participants with valid trimmed names.
- The starter word list is ordered and non-empty during normal play.
- Later-round drawer rotation should follow stable join order after the Host's
  first turn, but starting or managing later rounds is out of scope for this
  feature.
- This feature covers name validation, round drawer assignment, deterministic
  word selection, and drawer-only word visibility; drawing input, guessing,
  scoring, timers, later-round controls, and results are out of scope.
