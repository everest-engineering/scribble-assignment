# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `assignment-Anusha`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Scenario 2 — Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Game Starts and Drawer Is Assigned (Priority: P1)

Once the host triggers game start from the lobby, the first round begins immediately.
The first player (the host) is designated as the drawer. All players see the game
screen with the drawer's identity clearly highlighted. The drawer alone sees the
secret word; all other players can see who is drawing but not what the word is.

**Why this priority**: This is the foundational game-start action — without drawer
assignment and word selection, no round can proceed. Everything else in the game
depends on this flow working correctly.

**Independent Test**: With at least one player in a room, the host triggers "Start
Game" and lands on a game screen that clearly labels the drawer and (as the drawer)
displays the secret word. Verifiable with a single browser tab.

**Acceptance Scenarios**:

1. **Given** a lobby with at least one player (the host),
   **When** the host triggers "Start Game",
   **Then** the game screen loads, the host is marked as the drawer for round 1,
   and the drawer's screen displays the secret word prominently.

2. **Given** a game in progress with multiple players,
   **When** the game screen loads for a non-drawer player,
   **Then** that player can see who the current drawer is but the secret word is
   not shown on their screen.

3. **Given** a game just started,
   **When** the secret word is selected,
   **Then** the word is drawn deterministically from the starter word list — the
   same round number and word list always produce the same word.

---

### User Story 2 — Player Name Validation Before Game (Priority: P2)

Before a player can enter the lobby or participate in a game, their display name
must be a non-empty, non-whitespace string. Names are trimmed of leading and
trailing whitespace before storage. Submitting a blank or whitespace-only name is
rejected immediately with a clear inline error message; no further action occurs.

**Why this priority**: Invalid or blank names corrupt the player list and make the
drawer identity display ambiguous or meaningless. Validation must gate entry to
prevent garbage data from entering the game state.

**Independent Test**: On the Create Room or Join Room screen, a player submits a
name consisting only of spaces. The form rejects it inline and does not proceed.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room or Join Room screen,
   **When** they submit a name consisting only of whitespace characters (spaces,
   tabs, etc.),
   **Then** the submission is blocked and an inline error message is displayed
   (e.g., "Name cannot be blank") without making any network request.

2. **Given** a player enters a name with leading or trailing whitespace
   (e.g., "  Alice  "),
   **When** they submit successfully,
   **Then** the name stored and displayed to all players is the trimmed version
   ("Alice") with no surrounding whitespace.

3. **Given** a player's name trims to an empty string (entered only whitespace),
   **When** the trim-and-validate check runs,
   **Then** it is treated as an empty name and the same rejection error is shown.

---

### Edge Cases

- What happens if the starter word list is empty? Word selection cannot proceed —
  game start must be blocked or the player notified before the round begins.
- What if the only player is the host (no other guessers)? The host still becomes
  the drawer; the game screen must load correctly even with a single participant.
- What if two players end up with the same trimmed name after whitespace removal?
  Out of scope for this scenario — duplicate-name handling is covered by the lobby
  spec (Scenario 1).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Player names MUST be trimmed of leading and trailing whitespace before
  being stored or displayed anywhere in the application.
- **FR-002**: Empty or whitespace-only player names MUST be rejected with a clear
  inline error message; the player MUST remain on the current screen with no
  state change.
- **FR-003**: When the host triggers "Start Game", the first player (the host) MUST
  be assigned as the drawer for round 1.
- **FR-004**: The current drawer MUST be visually distinguished from other players
  on the game screen (e.g., via a "Drawing" label or equivalent indicator).
- **FR-005**: A secret word MUST be selected from the starter word list when each
  round begins.
- **FR-006**: Word selection MUST be deterministic: given the same game state (round
  number and word list), the same word is always chosen — no random selection.
- **FR-007**: The secret word MUST be visible only to the current drawer on their
  screen.
- **FR-008**: Non-drawer players MUST NOT see the secret word on their screens; a
  placeholder or blank is acceptable.
- **FR-009**: The game screen MUST display all players' names with a clear indicator
  identifying who is the current drawer.

### Key Entities *(include if feature involves data)*

- **Player**: Has a display name (trimmed, non-empty), a join order, and a role per
  round (drawer or guesser).
- **Round**: Has a round number, a designated drawer (host for round 1), and a
  selected secret word.
- **Word List**: A predefined starter set of words bundled with the application;
  the source for deterministic word selection.
- **Game Session**: Aggregates all players, tracks the current round, and maintains
  current game state (in-memory only).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of whitespace-only name submissions are blocked before the player
  enters the lobby or a game starts.
- **SC-002**: The drawer is identified on-screen for all participants within 1 second
  of the game screen loading.
- **SC-003**: Zero instances in testing where a non-drawer player's screen reveals
  the secret word.
- **SC-004**: Word selection is repeatable — the same round number and word list
  always yields the same word, confirmed by manual re-test.
- **SC-005**: All connected players see the same drawer identity simultaneously;
  no player's screen shows a different drawer than any other's.

## Assumptions

- "Host" and "first player" are equivalent: the player who created the room is
  always the drawer for round 1.
- "Deterministically selected" means the word index is derived from a fixed,
  stateless formula (e.g., `roundNumber % wordList.length`) rather than a random
  number generator, making results predictable and testable.
- The starter word list is hardcoded and bundled with the application; no external
  word source or database is needed.
- Player name trimming applies to both the Create Room and Join Room entry points
  from Scenario 1 — this spec extends and reinforces that validation.
- The game can start with a single player (the host as sole drawer); additional
  guessers are additive but not required for this feature to be testable.
- Non-drawer players see a placeholder (e.g., blanked-out letters or "_ _ _ _")
  or simply no word at all — the exact UI treatment is an implementation detail
  as long as the actual word string is not exposed.
- There is no turn rotation in this scenario; round 2+ drawer assignment is out
  of scope here.
