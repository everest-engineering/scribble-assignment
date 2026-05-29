# Feature Specification: Scenario 2 Game Start & Drawer Flow

**Feature Branch**: `assignment`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Scenario 2 game start and drawer flow with trimmed
player names, whitespace-only name rejection, deterministic drawer assignment to
the host or first player, deterministic secret word selection from the starter
list, and drawer-only secret word visibility. Keep this limited to Scenario 2
only. Exclude drawing interactions, clear canvas, guess submission, scoring,
result state, and restart."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Round with a Deterministic Drawer (Priority: P1)

When a lobby is ready to begin, the game starts with a clearly assigned drawer
chosen by a deterministic rule so all players enter the same round state.

**Why this priority**: Scenario 2 exists to move the room out of the lobby and
establish a stable first-round state before later gameplay interactions are
added.

**Independent Test**: Create a room, add a second player, start the game, and
confirm the same player is identified as the drawer every time the same room
state is used.

**Acceptance Scenarios**:

1. **Given** a room host starts a game with enough players, **When** the round
   begins, **Then** the host becomes the drawer for that round.
2. **Given** a room enters the round without a usable host designation,
   **When** the drawer must still be chosen deterministically, **Then** the
   first player in room order becomes the drawer.
3. **Given** the same room membership and word source are used repeatedly,
   **When** the round starts, **Then** the same drawer assignment rule produces
   the same drawer outcome every time.

---

### User Story 2 - Validate and Preserve Player Names (Priority: P2)

Players enter the game with names that are trimmed for display, while
whitespace-only names are rejected with clear feedback before they can
participate.

**Why this priority**: Drawer identification and player-facing round state are
not trustworthy if player names are blank or inconsistently formatted.

**Independent Test**: Try creating and joining a room with leading/trailing
spaces and with whitespace-only names, then confirm only trimmed valid names
enter the game.

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading or trailing spaces, **When**
   the room session is created or joined, **Then** the stored player name is
   trimmed before it appears in the lobby or game.
2. **Given** a player submits a whitespace-only name, **When** the request is
   made to create or join a room, **Then** the request is rejected and a clear
   validation message is shown.
3. **Given** a room starts a round, **When** player information is shown,
   **Then** every displayed name uses the trimmed value that was accepted
   earlier.

---

### User Story 3 - Reveal the Secret Word Only to the Drawer (Priority: P3)

The game selects a deterministic secret word from the starter list and reveals
it only to the assigned drawer, while all other players stay unaware of the
actual word.

**Why this priority**: Scenario 2 must establish the asymmetric information
needed for later guessing without yet implementing drawing or scoring.

**Independent Test**: Start the same room in two tabs, confirm the drawer sees
the chosen word, and confirm the non-drawer does not see the actual word value.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** the secret word is chosen, **Then** it is
   selected deterministically from the existing starter word list.
2. **Given** the drawer opens the game screen, **When** the round is active,
   **Then** the drawer sees the actual secret word.
3. **Given** any non-drawer player opens the same round, **When** the round is
   active, **Then** the actual secret word is hidden from that player.

### Edge Cases

- A player enters only spaces as a name while creating a room.
- A player enters only spaces as a name while joining a room.
- A player enters a name with extra spaces around otherwise valid text.
- A room starts after the host record is missing or unusable and the drawer must
  still be assigned deterministically.
- The same room is loaded by both drawer and non-drawer at the same time and
  they must receive different word visibility outcomes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from player
  names before accepting them into a room.
- **FR-002**: The system MUST reject whitespace-only player names with clear
  feedback and MUST keep the player out of the room when that happens.
- **FR-003**: When a host starts a valid room, the system MUST assign the round's
  drawer deterministically.
- **FR-004**: The deterministic drawer rule MUST assign the room host as the
  drawer when a valid host is present.
- **FR-005**: If a valid host is not available when the round starts, the system
  MUST assign the first player in room order as the drawer.
- **FR-006**: The system MUST choose the secret word deterministically from the
  existing starter word list when the round begins.
- **FR-007**: The system MUST reveal the actual secret word to the drawer while
  the round is active.
- **FR-008**: The system MUST hide the actual secret word from every non-drawer
  player while the round is active.
- **FR-009**: All players in the same room MUST receive the same round identity,
  drawer assignment, and selected word for that round.
- **FR-010**: This feature MUST exclude drawing interactions, clear canvas,
  guess submission, scoring, result state, and restart behavior.

### Key Entities *(include if feature involves data)*

- **Round State**: The shared in-room game state created when a lobby begins a
  round, including the selected drawer and the selected secret word.
- **Drawer Assignment**: The deterministic association between the current round
  and the player who is allowed to see the actual secret word.
- **Player Display Name**: The trimmed player identity shown across the lobby and
  round views after validation succeeds.

## Constraints & Non-Goals *(mandatory)*

- **CN-001**: Room updates in this scenario MUST continue using scheduled
  refreshes rather than instant push-based updates.
- **CN-002**: Round and room data for this scenario MUST remain temporary for
  the current runtime only and are not expected to survive a service restart.
- **CN-003**: Players MUST continue to access rooms without sign-in, account
  creation, or identity verification features.
- **CN-004**: This feature MUST build on the existing starter and Scenario 1
  flow without expanding into unrelated product areas.
- **CN-005**: Drawer assignment and secret word selection MUST be deterministic
  for the same underlying room state.
- **CN-006**: The scope is limited to Scenario 2 game start and drawer flow
  only.
- **CN-007**: Drawing interactions, clear canvas, guess submission, scoring,
  result handling, and restart flows are explicit non-goals for this
  specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In repeated manual validation with the same room membership, the
  same player is chosen as drawer every time for that room state.
- **SC-002**: In manual validation, 100% of whitespace-only name submissions are
  rejected before the player enters the room.
- **SC-003**: In manual validation, accepted player names appear trimmed in both
  lobby and game views every time.
- **SC-004**: In a two-tab validation session, the drawer sees the actual secret
  word while the non-drawer does not see the actual word value.

## Assumptions

- Scenario 1 host tracking and host-only start behavior already exist and remain
  the source of truth when a valid host is available.
- The starter word list remains the only word source for this scenario.
- One round is sufficient for Scenario 2; multiple rounds and rotation rules are
  deferred to later scenarios.
- Non-drawer players may see generic round status messaging, but not the actual
  selected word value.

## Verification Plan *(mandatory)*

- Validate trimmed and whitespace-only player-name behavior for both room
  creation and room joining.
- Validate deterministic drawer assignment when a valid host is present.
- Validate the fallback drawer rule when host designation is unavailable.
- Validate deterministic word selection from the starter list across repeated
  starts with the same room state.
- Validate drawer-only word visibility across at least two tabs in the same
  room.
