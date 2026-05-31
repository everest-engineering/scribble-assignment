# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Feature Group 2: Game Start & Drawer Flow\n\nRequirements:\n- Trim player names\n- Reject empty or whitespace-only names\n- Host becomes drawer\n- Deterministic word selection\n- Drawer sees secret word\n- Guessers do not see secret word\n\nOut of scope:\n- Drawing interaction\n- Guess submission\n- Scoring\n- Results"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation (Priority: P1)

Players must provide valid, non-empty names when joining or creating a room, with leading/trailing whitespace removed.

**Why this priority**: Valid display names are required to identify the drawer and guessers accurately in the game UI.

**Independent Test**: Attempt to join with a blank name or spaces-only name and verify it's rejected with a clear message. Attempt to join with spaces around a name and verify it's trimmed in the lobby.

**Acceptance Scenarios**:

1. **Given** a player enters an empty or whitespace-only name, **When** they attempt to join or create a room, **Then** they see a clear error message and remain on the entry screen.
2. **Given** a player enters a name with leading or trailing spaces, **When** they join or create a room, **Then** their name is trimmed of spaces in the lobby.

---

### User Story 2 - Game Start and Drawer Assignment (Priority: P1)

When the host starts the game, the host (or first player) is assigned the role of the drawer for the first round, and all other players become guessers.

**Why this priority**: The game cannot function without assigning the critical role of drawer.

**Independent Test**: Start a game as host with one other player. Verify the host's screen clearly identifies them as the drawer, and the other player's screen identifies them as a guesser.

**Acceptance Scenarios**:

1. **Given** a lobby with at least two players, **When** the host starts the game, **Then** the host is designated as the drawer.
2. **Given** a game has started, **When** participants view the game screen, **Then** the UI clearly identifies who the drawer is to all players.

---

### User Story 3 - Secret Word Selection & Visibility (Priority: P1)

A secret word is deterministically chosen from the starter list when the game starts. Only the assigned drawer can see this word, while guessers do not see it.

**Why this priority**: Word secrecy is the core mechanic of the guessing game.

**Independent Test**: Start a game, observe that the drawer's UI displays the chosen secret word, and the guessers' UI either hides it completely or shows a masked version.

**Acceptance Scenarios**:

1. **Given** the game has started, **When** the game state is initialized, **Then** a word is deterministically selected from the starter list.
2. **Given** a selected secret word, **When** the drawer views the game screen, **Then** the actual secret word is visible to them.
3. **Given** a selected secret word, **When** a guesser views the game screen, **Then** the actual secret word is hidden from them.

### Edge Cases

- Host disconnection handling is out of scope for this feature.
- Concurrent joins during game-start transition follow existing room behavior and are not specifically handled in this feature.
- Empty or whitespace-only names are rejected before room creation or join.
- Secret words are never included in guesser-visible room state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from player names upon room creation or join.
- **FR-002**: System MUST reject room creation or join requests if the provided player name is empty or contains only whitespace, providing a clear error message.
- **FR-003**: The room host MUST be assigned the drawer role when the first round begins.
- **FR-004**: System MUST assign the "guesser" role to all other participants in the room.
- **FR-005**: System MUST deterministically select a secret word from the predefined starter list when the game starts.
- **FR-006**: System MUST expose the selected secret word in the state provided to the drawer.
- **FR-007**: System MUST NOT expose the selected secret word in the state provided to guessers.
- **FR-008**: The system MUST select the first word from the starter word list when the game starts.
- **FR-009**: When a room enters the in-game state, the system MUST initialize round state containing the drawer assignment, participant roles, and selected secret word.
- **FR-010**: The game screen MUST clearly identify the drawer to all participants.

### Key Entities

- **Player Name**: The trimmed string used to identify a participant.
- **Role**: The assignment of either `drawer` or `guesser` for a participant in the current round.
- **Secret Word**: The string selected from the predefined list that the drawer must draw and guessers must guess.
- **Round State**: The active game state containing the current drawer, the secret word (for the drawer only), and participants' roles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of player names stored in the room state have no leading or trailing whitespace.
- **SC-002**: 100% of attempts to use empty or whitespace-only names result in a clear, visible error message without state corruption.
- **SC-003**: Upon game start, exactly one participant (the host) is designated as the drawer in the game state.
- **SC-004**: The drawer's API response includes the secret word, while the guessers' API responses do not contain the secret word.

## Assumptions

- The predefined starter list of words is hardcoded or available in the starter repository.
- "Deterministic word selection" means the first word in the list is always chosen, or the selection is based on a non-random factor like room code, to ensure consistent testing. We will assume it always picks the first word from the predefined list for simplicity, unless otherwise specified.
- Drawing interaction, guess submission, scoring, and results are out of scope for this feature and will be implemented in subsequent features. Placeholders may be used in the UI for these out-of-scope elements.
- Name validation happens at the API boundary, with errors returned and displayed by the UI.
- The room host is always the first player and drawer for the single round supported by this assignment.
