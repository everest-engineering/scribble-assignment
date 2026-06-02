# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-06-02

**Status**: Implemented

**Input**: User description: "Enhance the Scribble starter so that a round starts predictably with deterministic drawer assignment, secret word selection, drawer-only word visibility, and zeroed scores."

## User Scenarios & Testing

### User Story 2 - Game start and drawer visibility (Priority: P2)

As a player, the system must start a round predictably so that one player becomes the drawer, the correct word is revealed only to that drawer, and all players see a consistent game state.

**Why this priority**: Once players can gather in a lobby, the next value slice is entering an actual game round with deterministic roles and correct information visibility.

**Independent Test**: Can be fully tested by starting a room with two players, verifying that the host becomes the drawer, confirming that only the drawer sees the selected word, and confirming that all scores begin at 0.

**Acceptance Scenarios**:

1. **Given** a host starts a valid room with at least two players, **When** the game begins, **Then** the room enters playing state and the drawer is assigned deterministically.
2. **Given** a room enters playing state, **When** the drawer opens the game screen, **Then** the secret word is visible to the drawer.
3. **Given** a room enters playing state, **When** a guesser opens the game screen, **Then** the secret word is hidden from the guesser.
4. **Given** a new round begins, **When** the scoreboard renders, **Then** all player scores are 0.

---

### Edge Cases

- What happens when a client refreshes during round start?
- How does the system handle duplicate player names in the same room?
- What happens when the first player in the room list is not the host?

## Requirements

### Functional Requirements

- **FR-011**: System MUST assign the drawer deterministically when the game starts.
- **FR-012**: System MUST select the secret word deterministically from the provided starter word list.
- **FR-013**: System MUST reveal the secret word only to the drawer.
- **FR-014**: System MUST initialize all player scores to 0 at round start.

### Key Entities

- **RoundState**: Represents the current phase, drawer identity, secret word, drawing state, guess history, and winner identity for the active round.
- **Player**: Represents a participant including id, name, host status, and score.

## Success Criteria

### Measurable Outcomes

- **SC-003**: A two-player room can complete one full round from lobby to result and return to lobby again without server restart.
- **SC-004**: Correct guesses award exactly 100 points and incorrect guesses award 0 during manual validation.

## Assumptions

- The host is always the drawer (deterministic rule).
- The secret word is `STARTER_WORDS[0]` ("rocket") — the first word in the starter list.
- Viewer-specific response filtering is done via `participantId` query parameter on room fetch.
