# Feature Specification: Game start and drawer flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-31

**Status**: Draft

**Input**: Scenario 2 from the Scribble lab: start a game, validate names, assign a drawer, select a deterministic word, and reveal that word only to the drawer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a ready game (Priority: P1)

The room host starts the game after at least two players are in the lobby.

**Why this priority**: The game cannot proceed to drawing or guessing until a valid start transition exists.

**Independent Test**: Create a room, join with a second player, start as host, and verify the room status changes from lobby to playing.

**Acceptance Scenarios**:

1. **Given** a lobby has a host and at least one guest, **When** the host starts the game, **Then** the room enters the playing state.
2. **Given** a lobby has fewer than two players, **When** the host attempts to start the game, **Then** start is rejected with a clear message.
3. **Given** a non-host is in the lobby, **When** they attempt to start the game, **Then** start is rejected.

---

### User Story 2 - Assign drawer and word (Priority: P2)

When the game starts, one drawer and one secret word are selected deterministically.

**Why this priority**: Deterministic assignment makes behavior predictable, testable, and simple for the lab scope.

**Independent Test**: Start the same valid room flow and verify the first participant is the drawer and the first starter word is selected.

**Acceptance Scenarios**:

1. **Given** the host starts a valid game, **When** the round is initialized, **Then** exactly one drawer is assigned.
2. **Given** the round is initialized, **When** the secret word is selected, **Then** the selected word comes from the starter word list using a deterministic rule.

---

### User Story 3 - Reveal word only to drawer (Priority: P3)

The drawer can see the secret word during active play, while guessers cannot.

**Why this priority**: Guessers seeing the word would break the core drawing game.

**Independent Test**: Fetch the same playing room as drawer and guesser and verify only the drawer snapshot includes the secret word.

**Acceptance Scenarios**:

1. **Given** a player is the drawer, **When** they view the active game, **Then** the secret word is visible.
2. **Given** a player is a guesser, **When** they view the active game, **Then** the secret word is hidden.

### Edge Cases

- Empty or whitespace-only player names are rejected before room creation or join.
- Starting the game from a missing room returns a clear not-found error.
- Starting an already-started room does not create extra drawers or words.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim player names and reject empty names.
- **FR-002**: System MUST allow only the current host to start the game.
- **FR-003**: System MUST require at least two players before start.
- **FR-004**: System MUST assign exactly one drawer when the game starts.
- **FR-005**: System MUST choose the secret word deterministically from the starter word list.
- **FR-006**: System MUST expose the secret word to the drawer during active play.
- **FR-007**: System MUST hide the secret word from guessers during active play.

### Key Entities

- **Room**: Holds status, host, participants, and current round state.
- **Participant**: Represents a player who can be host, drawer, or guesser.
- **Round State**: Holds drawer identity and secret word.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host can start a valid two-player room.
- **SC-002**: Non-host start attempts are rejected.
- **SC-003**: One drawer is assigned per started game.
- **SC-004**: Drawer sees the word and guessers do not during active play.

## Clarifications

- No multiple rounds, drawer rotation, timers, or bonus scoring are included.
- Word selection is deterministic for testability.
