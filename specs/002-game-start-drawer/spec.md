# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-11

- Q1: Word selection — FR-004 vs AS-4 contradiction → A: Selection depends on the room code (deterministic hash of code+round). Different rooms get different words; same room code always produces the same word.
- Q2: Game page scope → C: Minimal game page — role info + word/word-length display only. No canvas, no guess input, no timer. Drawing and guessing elements are deferred to separate features.
- Q3: Game state API design → A: Extend existing `GET /rooms/:code` endpoint to include round fields (`roundNumber`, `drawerId`, `yourRole`, `wordForDrawer`/`wordLength` filtered per participant). Reuses existing polling mechanism.

## User Scenarios & Testing

### User Story 1 - First Round Begins with Drawer Assignment (Priority: P1)

When a game transitions from lobby to playing, the first round starts automatically. The host player is assigned as the drawer for the first round, and all other participants are assigned as guessers. All participants can see who the drawer is.

**Why this priority**: The drawer assignment is the core gameplay handoff — without it, no one knows who should draw. This unblocks all subsequent game activity.

**Independent Test**: Create a room with 2+ participants, start the game. Verify every participant's screen shows the same drawer identity within 3 seconds of the game starting.

**Acceptance Scenarios**:

1. **Given** a game with 2+ participants is starting, **When** the first round begins, **Then** the host player is assigned as the drawer
2. **Given** a game with 2+ participants is starting, **When** the first round begins, **Then** all non-host participants are assigned as guessers
3. **Given** a game has started, **When** a participant views the game screen, **Then** the drawer's identity is clearly displayed to all participants
4. **Given** a game has started with exactly 2 participants, **When** the first round begins, **Then** the host (the only non-guesser) is the drawer

---

### User Story 2 - Secret Word Selection and Visibility (Priority: P1)

When the first round begins, a secret word is selected deterministically from the starter list. The word is displayed to the drawer only, while non-drawer participants see only the word length.

**Why this priority**: The secret word is the core game content — the drawer needs it to draw, and guessers must not see it for the game to be fair.

**Independent Test**: Start a game as the host. Verify the host's screen shows a word from the starter list. Verify a second participant's screen does not show the word but does show its letter count.

**Acceptance Scenarios**:

1. **Given** a first round has started, **When** the drawer views the game screen, **Then** the secret word is displayed prominently
2. **Given** a first round has started, **When** a non-drawer participant views the game screen, **Then** the secret word is not visible
3. **Given** a first round has started, **When** a non-drawer participant views the game screen, **Then** the word's character count is displayed
4. **Given** two games with the same room code initiate the first round, **When** both rounds begin, **Then** the same word is selected for both
5. **Given** two games with different room codes initiate their first rounds, **When** both rounds begin, **Then** different words may be selected

---

### Edge Cases

- **Single player room**: If a host starts a game with only themselves (no other participants joined), what happens? The feature assumes 2+ players are required (enforced by previous lobby feature).
- **Game page scope**: The game page is minimal — role info and word/word-length display only. No drawing canvas, guess input, or timer. These elements are deferred.
- **Drawer disconnects**: If the drawer leaves mid-round, the system must handle this gracefully. For v1, the round continues with the same drawer; reconnection is handled separately.
- **Word list exhausted**: If rounds exceed the starter list length, word selection wraps around or reuses words. V1 assumes fewer rounds than list entries.

## Requirements

### Functional Requirements

- **FR-001**: System MUST assign the host player as the drawer for the first round when the game transitions to "playing" status
- **FR-002**: System MUST assign all non-host participants as guessers
- **FR-003**: System MUST return drawer identity in the game state response visible to all participants
- **FR-004**: System MUST select a secret word deterministically based on the room code and round number (hash of code+round) when the first round begins
- **FR-005**: System MUST display the secret word to the drawer on their game screen
- **FR-006**: System MUST NOT return the secret word in the game state response for non-drawer participants
- **FR-007**: System MUST display the secret word's character count to all non-drawer participants

### Key Entities

- **Round**: A single play cycle within a game. Belongs to a Room. Attributes: round number, assigned drawer, secret word (hidden from guessers). Created when game status transitions to "playing".
- **Drawer**: A participant role assigned per-round. For the first round, always the host. Marked prominently in the participant list.
- **Guesser**: A participant role assigned per-round for all non-drawer participants. Cannot see the secret word.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All participants see the correct drawer identity within 3 seconds of game start
- **SC-002**: The drawer can read and confirm their secret word on their game screen
- **SC-003**: Non-drawer participants cannot view the secret word through normal game interaction
- **SC-004**: The same room always selects the same first-round word (deterministic)
- **SC-005**: Non-drawer participants see the correct character count of the secret word

## Assumptions

- Player name trimming and empty/whitespace rejection is already implemented from the Room Setup & Lobby feature
- Word visibility is enforced by the backend returning participant-specific data in API responses
- The starter word list is a fixed, known set of words
- Drawer identity updates reach participants via the existing polling mechanism
- Only the first round is in scope; subsequent round rotation is a separate feature
- The word selection wraps around if the number of rounds exceeds the starter list length
- The game page displays role info and word/word-length only; drawing canvas, guess input, and timer are deferred to separate features
- Round data (drawerId, yourRole, word) is returned via the existing `GET /rooms/:code` endpoint, with participant-aware filtering of the secret word
