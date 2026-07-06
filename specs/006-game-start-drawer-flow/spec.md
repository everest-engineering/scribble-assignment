# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `006-game-start-drawer-flow`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "1. Game start and drawer flow: Add Player name validation (trim, reject empty). When the first round begins, the host becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation on Create and Join (Priority: P1)

As a player, I want my name to be validated (trimmed of whitespace, rejected if empty) when creating or joining a room so that every player has a non-blank display name.

**Why this priority**: Names are the primary identifier in the game. Empty or whitespace-only names create confusion and violate the validation rigor principle.

**Independent Test**: Can be fully tested by submitting empty or whitespace-only names on the Create Room and Join Room pages — each must show an inline error and prevent submission.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room page, **When** they submit the form with an empty player name, **Then** an inline error message appears and the room is not created.
2. **Given** a player is on the Create Room page, **When** they submit the form with a whitespace-only player name ("   "), **Then** an inline error message appears and the room is not created.
3. **Given** a player is on the Join Room page, **When** they submit the form with an empty player name, **Then** an inline error message appears and the room is not joined.
4. **Given** a player submits a trimmed player name with leading/trailing whitespace ("  Alice  "), **When** the form is submitted, **Then** the whitespace is trimmed and the name "Alice" is used successfully.

---

### User Story 2 - Host Becomes First-Round Drawer (Priority: P1)

As the host, when the game starts I want to be clearly identified as the drawer for round 1 so that all participants know who is drawing.

**Why this priority**: The drawer role is the core gameplay mechanic. The first-round assignment must be unambiguous and visible to all participants.

**Independent Test**: Open two browser tabs. Tab 1 creates a room (host). Tab 2 joins. Host starts the game. Both tabs show the host labelled as "Drawer" for round 1.

**Acceptance Scenarios**:

1. **Given** the host starts a game with 2+ participants, **When** the first round begins, **Then** the host is assigned as the drawer.
2. **Given** the game has started, **When** any participant views the game screen, **Then** the current drawer (the host) is clearly identified with a visible label on all participants' screens.
3. **Given** the current drawer is the host, **When** a non-host participant views the game screen, **Then** they see who the drawer is but cannot take drawing actions.

---

### User Story 3 - Deterministic Secret Word Visible Only to Drawer (Priority: P1)

As the drawer, I want to see the secret word for the current round so I can draw it. As a non-drawer participant, I must not see the word.

**Why this priority**: The secret word is the core guessing mechanic. The drawer needs it to draw; guessers must not see it to preserve fair play.

**Independent Test**: Open two browser tabs. Tab 1 is the host/drawer. Tab 2 is a guesser. When the game starts and the first round begins, Tab 1 shows the secret word and Tab 2 does not.

**Acceptance Scenarios**:

1. **Given** the first round has begun, **When** the drawer views the game screen, **Then** they see the secret word displayed prominently.
2. **Given** the first round has begun, **When** a guesser views the game screen, **Then** they do not see the secret word anywhere on the screen.
3. **Given** the first round has begun, **When** any participant polls for room state, **Then** the API response includes the current secret word only for the drawer participant.
4. **Given** the same room, round number, and starter word list, **When** the word is selected, **Then** it is the same word every time (deterministic selection).
5. **Given** a round number that exceeds the starter word list length, **When** the word is selected, **Then** the selection wraps around (e.g., word list index = (round - 1) % list length) so every round always has a word.

---

### Edge Cases

- What happens when all participants leave mid-game and a new player joins? The game state and current round persist.
- What if the player name contains only special characters (e.g., "@@@")? It should be accepted as a valid non-empty trimmed string.
- What happens when there are more rounds than words in the starter list? Word selection wraps around deterministically.
- What if the host leaves the game after the first round? The drawer assignment for subsequent rounds is out of scope — only round 1 is specified.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from player names on both Create Room and Join Room forms before submission.
- **FR-002**: An empty or whitespace-only player name MUST be rejected with a clear inline error message on both the Create Room and Join Room pages.
- **FR-003**: The backend MUST reject requests with empty or whitespace-only player names with a 400 status and an appropriate error message.
- **FR-004**: When the game starts (room transitions from lobby to in-progress), the host MUST be assigned as the drawer for round 1.
- **FR-005**: The current drawer MUST be clearly identified on every participant's screen (both drawer and guessers) with a visible label.
- **FR-006**: A secret word MUST be selected deterministically from the starter word list when the first round begins.
- **FR-007**: The word selection formula MUST be: word index = (round number - 1) modulo (number of words in the starter list).
- **FR-008**: The secret word MUST be visible only to the drawer participant.
- **FR-009**: The word MUST NOT appear in the API response payload for non-drawer participants.
- **FR-010**: The word MUST remain the same for the entire round (it must not change between polls within the same round).

### Key Entities *(include if feature involves data)*

- **Room**: Game state entity. Gains `status` values beyond `"lobby"` (e.g., `"drawing"`), a `currentRound` (number), and a `currentDrawerId` (participant ID).
- **Round**: Logical unit of gameplay. Has a round number, a secret word, and a drawer participant. The secret word is derived deterministically from the round number and the starter word list.
- **Participant**: Player in the room. The `id` of the host participant is used as the round 1 drawer ID. Gains a visual label on the frontend when they are the current drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player with an empty or whitespace-only name cannot create or join a room — they see an inline error on every attempt.
- **SC-002**: When the game starts, every participant's screen clearly shows who the drawer is, and all participants agree on the identity of the drawer (verified across two browser tabs).
- **SC-003**: The drawer sees the secret word on their screen immediately when the first round loads.
- **SC-004**: A guesser never sees the secret word — verified by inspecting both the rendered UI and the API response payload in a non-drawer browser tab.
- **SC-005**: Starting the same room twice (with the same room code and round number) results in the same secret word being selected.
- **SC-006**: All existing creation/join/lobby/game flows continue to function unchanged.

## Assumptions

- The starter word list is fixed per game session and does not change between rounds.
- The host is always the drawer for round 1. Drawer rotation for subsequent rounds is out of scope.
- "Secret word visible only to the drawer" means the word in the current round, not the entire word list — the list of available words may still be visible as a hint context.
- Player names longer than a reasonable length (e.g., 50 characters) are truncated to prevent display issues, but this is a presentation concern not specified in detail here.
- The existing lobby polling mechanism (every ~2s) is sufficient to propagate game start and drawer assignment to all participants.
