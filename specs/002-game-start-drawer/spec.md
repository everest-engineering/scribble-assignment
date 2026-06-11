# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Game and See Game Screen (Priority: P1)

A host starts a game from the lobby and all participants immediately see the game screen with their role (drawer or guesser) clearly identified.

**Why this priority**: This is the entry point for gameplay. Without the transition from lobby to game, no drawing or guessing can happen.

**Independent Test**: Can be fully tested by creating a room with two browser tabs (host + one other), having the host click "Start Game", and verifying both tabs show the game screen with correct role indicators.

**Acceptance Scenarios**:

1. **Given** a host in the lobby with at least 2 participants, **When** they click "Start Game", **Then** all participants see the game screen within 3 seconds, with each participant's role (drawer or guesser) displayed.
2. **Given** a participant who is not the host, **When** the game starts, **Then** they see the game screen identifying them as a guesser and showing who the drawer is.
3. **Given** a participant in the lobby, **When** the game screen loads, **Then** the drawer sees the drawing canvas with drawing tools, and guessers see the canvas in view-only mode.

---

### User Story 2 - Drawer Word Visibility (Priority: P1)

The secret word is visible to the drawer only. Guessers cannot see the word at any point during the round.

**Why this priority**: Word secrecy is fundamental to the game. If guessers can see the word, there is no game.

**Independent Test**: Can be tested by creating a room with two browser tabs and verifying the drawer tab shows the word while the guesser tab does not.

**Acceptance Scenarios**:

1. **Given** a game has started and a drawer has been assigned, **When** the drawer views the game screen, **Then** the secret word is displayed prominently on their screen.
2. **Given** a game has started and a guesser is in the room, **When** the guesser views the game screen, **Then** the secret word is not visible anywhere on their screen.
3. **Given** a game has started with multiple guessers, **When** any guesser polls for the game state, **Then** the response does not include the secret word for guessers.

---

### User Story 3 - Deterministic Drawer Assignment (Priority: P2)

The host (first participant who created the room) is deterministically assigned as the first drawer when the game starts.

**Why this priority**: Deterministic assignment ensures predictable behavior for testing and prevents ambiguity about who draws first.

**Independent Test**: Can be tested by creating a room and joining with additional players, then starting the game and verifying the host is always the drawer.

**Acceptance Scenarios**:

1. **Given** a room with 3 participants (host, player B, player C), **When** the game starts, **Then** the host is assigned as the drawer.
2. **Given** a room where the host has left and a new host was assigned, **When** the game starts, **Then** the current host (earliest-joined remaining participant) is assigned as the drawer.

---

### User Story 4 - Deterministic Word Selection (Priority: P2)

A secret word is deterministically selected from the starter word list when the game starts.

**Why this priority**: Deterministic word selection enables reproducible testing and ensures consistent behavior across game starts.

**Independent Test**: Can be tested by starting multiple games with the same room configuration and verifying the same word is selected.

**Acceptance Scenarios**:

1. **Given** a game is starting, **When** the game transitions from lobby to playing, **Then** a word is selected from the starter list: rocket, pizza, castle, guitar, sunflower.
2. **Given** the same room state and participants, **When** the game starts multiple times, **Then** the same word is always selected (deterministic selection algorithm).

---

### Edge Cases

- What should happen when the drawer's display name contains leading or trailing whitespace? Display names should be trimmed before being shown in the game UI.
- What should happen if a participant refreshes their browser during the game start transition? They should see the current game state on reload (drawer, their role, word if applicable).
- What should happen if a player who is not the drawer attempts to draw? The system should reject draw actions from non-drawer participants.
- What should happen if there are exactly 2 participants (host + 1)? The host is the drawer and the other participant is the guesser.
- What should happen if the word list is empty or corrupted? The game should not start; show an error message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assign the host as the drawer when the game starts. If the original host has left, the current host (earliest-joined remaining participant) is assigned.
- **FR-002**: System MUST select a secret word deterministically from the starter word list (rocket, pizza, castle, guitar, sunflower) when the game starts.
- **FR-003**: System MUST display the secret word only to the drawer participant. Guessers MUST NOT see the word in the UI or in API responses.
- **FR-004**: System MUST indicate the current drawer to all participants (e.g., via a badge or label on the participant's name).
- **FR-005**: System MUST identify each participant's own role (drawer or guesser) on the game screen.
- **FR-006**: System MUST trim leading and trailing whitespace from display names when displaying them in-game.
- **FR-007**: System MUST make the game state (roles, drawer identity) available via polling so all clients can load the correct view after game start.
- **FR-008**: System MUST reject draw actions from participants who are not the assigned drawer.
- **FR-009**: When the game starts, the room status MUST transition to "playing" and the lobby page MUST no longer be accessible for that room.

### Key Entities *(include if feature involves data)*

- **Game Round**: A single drawing round within a room. Contains the assigned drawer participant ID, the secret word, and a round status (active). The round is created when the game transitions from lobby to playing.
- **Drawer Role**: A participant role assigned when the game starts. The drawer sees the secret word and has permission to draw on the canvas.
- **Guesser Role**: A participant role assigned to all non-drawer participants. Guessers see the canvas but not the secret word, and can submit guesses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All participants see the game screen with correct role identification within 3 seconds of the host starting the game.
- **SC-002**: The drawer sees the secret word on their screen; no guesser can see the word at any point.
- **SC-003**: The host is always the first drawer when the game starts.
- **SC-004**: The same word is selected for identical room and game configurations (deterministic).
- **SC-005**: Display names are shown without leading/trailing whitespace in the game UI.
- **SC-006**: Draw actions from guessers are rejected without crashing the UI.
- **SC-007**: A page refresh during the game returns the player to the correct game state.

## Assumptions

- Only one round (the first round) is within scope. Drawer rotation and multi-round gameplay are deferred.
- The starter word list contains exactly 5 words: rocket, pizza, castle, guitar, sunflower.
- The drawer is the host (first participant). This is the simplest deterministic rule.
- No timer or countdown is part of this feature; the round continues until the host ends it (deferred to gameplay interaction scenario).
- Participants remain in the room throughout the round; disconnect handling is deferred.
- Backend determines drawer assignment and word selection at game start time; clients receive these via polling.
