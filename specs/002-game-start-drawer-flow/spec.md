# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing

### User Story 1 — First Round Begins with Drawer Assignment (Priority: P1)

When the host starts the game and the first round begins, the host is assigned as the drawer. All players can see who the drawer is.

**Why this priority**: The entire gameplay loop depends on knowing who draws and who guesses — nothing else works without this.

**Independent Test**: Create a room as Alice, have Bob join, start the game — verify Alice is identified as the drawer and Bob is identified as a guesser.

**Acceptance Scenarios**:

1. **Given** a room with 2+ players where the game has started, **When** the first round begins, **Then** the host is assigned as the drawer and all other participants are guessers.
2. **Given** a player is the drawer, **When** they view the game screen, **Then** they see a clear indicator that they are the drawer.
3. **Given** a player is a guesser, **When** they view the game screen, **Then** they see who the drawer is.

---

### User Story 2 — Secret Word Visible Only to Drawer (Priority: P1)

The drawer can see the secret word they need to draw. Guessers cannot see the secret word.

**Why this priority**: The game fundamentally requires the drawer to know the word while guessers must figure it out — this is the core mechanic.

**Independent Test**: Start a game as the host, check that the drawer sees a secret word on their screen, then join as a second player and verify the word is NOT visible on the guesser's screen.

**Acceptance Scenarios**:

1. **Given** a round has started, **When** the drawer views the game screen, **Then** the secret word is displayed prominently.
2. **Given** a round has started, **When** a guesser views the game screen, **Then** the secret word is NOT visible.
3. **Given** a round has started, **When** the drawer views the game screen, **Then** the secret word is selected deterministically from the starter word list (based on round number).

---

### User Story 3 — Player Name Trimming (Priority: P2)

Player names are trimmed on input, and empty/whitespace-only names are rejected with a clear message.

**Why this priority**: Prevents anonymous or blank-named players from disrupting the game experience.

**Independent Test**: Submit a form with whitespace-only name and verify the error message "Player name is required" is displayed.

**Acceptance Scenarios**:

1. **Given** the create or join room form, **When** a user enters a name with leading/trailing whitespace, **Then** the name is trimmed before submission.
2. **Given** the create or join room form, **When** a user submits with a whitespace-only name, **Then** an error message "Player name is required" is displayed.

### Edge Cases

- What happens when the word list is exhausted after multiple rounds? (Deterministic selection wraps/repeats based on round number modulo word list length)
- What happens if the drawer disconnects? (Out of scope for this scenario — the round continues as-is)
- What happens when the room has exactly 2 players? (One drawer, one guesser — correct)

## Requirements

### Functional Requirements

- **FR-001**: When `startGame` is called, the system MUST assign the host as the drawer for the first round.
- **FR-002**: The system MUST identify the drawer and guessers in the room snapshot returned to all participants.
- **FR-003**: A round MUST track: round number, drawer participant ID, secret word, and status.
- **FR-004**: The secret word MUST be selected deterministically using the round number as an index into the starter word list (word = words[(roundNumber - 1) % wordList.length]).
- **FR-005**: The room snapshot for the drawer MUST include the secret word (in a `secretWord` field).
- **FR-006**: The room snapshot for guessers MUST NOT include the `secretWord` field (or it must be null).
- **FR-007**: Player names MUST be trimmed of leading/trailing whitespace on submission. Whitespace-only names MUST be rejected.
- **FR-008**: The frontend game page MUST display the drawer's identity to all players.
- **FR-009**: The frontend game page for the drawer MUST display the secret word prominently.

### Key Entities

- **Round**: A single drawing round within a game, with a round number, drawer ID, secret word, and status.
- **Game State**: The overall game state within a room, including current round number and all rounds.

## Success Criteria

- **SC-001**: Drawer assignment is visible to all players within one polling cycle after game start.
- **SC-002**: The secret word is visible to the drawer only — a guesser viewing the same room snapshot does not see it.
- **SC-003**: The secret word is deterministically selected from the starter list (same word for same round number regardless of timing).
- **SC-004**: Empty/whitespace-only player names are rejected with an error message.

## Assumptions

- The host is always the drawer for the first round (per scenario description).
- The game screen polls `GET /rooms/:code` to get the latest room snapshot including round state.
- Secret word list is the existing `STARTER_WORDS` array.
- Word selection wraps around if the word list is shorter than the round count.
