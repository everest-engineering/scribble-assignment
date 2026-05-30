# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `003-game-start-drawer`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow: Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-05-30

- Q: When a player's name is empty/whitespace-only at game start, how does that player correct it? → A: Game enters an "awaiting rename" state; the invalid player sees an inline text input on the game screen to enter a valid name; game proceeds once all names are valid.
- Q: How is the secret word communicated to clients — sent to everyone or only the drawer? → A: Server includes the word only in responses destined for the drawer's session; non-drawer players never receive the word payload (server-side filtering).
- Q: What should happen when a non-host player attempts to start the game? → A: Start button is hidden/disabled for non-host players (preventive UX).
- Q: What happens if a player joins after round 1 is in progress? → A: Late joiners can spectate but do not see the current round's word and do not participate in guessing in the active round.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game starts with validated player names (Priority: P1)

As a host, when I start the game from the lobby, I want all player names to be validated (trimmed of whitespace, empty/whitespace-only names rejected) so that every participant has a recognizable name before gameplay begins.

**Why this priority**: The game cannot begin without valid player names. This is the first gate that must pass before any round can start.

**Independent Test**: Can be tested by having a player with a whitespace-only name attempt to start a game, verifying they see a rejection message, then assigning them a valid name and confirming the game starts successfully.

**Acceptance Scenarios**:

1. **Given** a lobby with 2+ players where all names are non-empty after trimming, **When** the host clicks "Start Game", **Then** the game transitions to round 1 without any name validation errors.
2. **Given** a lobby where a player's display name is whitespace-only (e.g., "   "), **When** the host clicks "Start Game", **Then** the game enters an "awaiting rename" state — the game does not proceed, and the player with the invalid name sees an inline message and text input to enter a valid name.
3. **Given** a lobby where a player's display name is empty, **When** the host clicks "Start Game", **Then** the game enters an "awaiting rename" state, and that player sees an inline text input to provide a valid name before the game can proceed.
4. **Given** the game is in "awaiting rename" state due to one player's invalid name, **When** that player enters a valid non-empty name, **Then** the game transitions to round 1 without requiring the host to retry.

---

### User Story 2 - Drawer is clearly identified to all players (Priority: P1)

As a player in the game, when the first round begins, I want to know who the drawer is so that I can watch them draw and prepare to guess.

**Why this priority**: Without clear identification of the drawer, players cannot understand who is drawing and who should be guessing, making gameplay impossible.

**Independent Test**: Can be tested by starting a game with 3 players and verifying that all players see the same player designated as the drawer with a clear visual indicator.

**Acceptance Scenarios**:

1. **Given** the game has just started with 2+ players, **When** the first round begins, **Then** the host (the player who created the room) is designated as the drawer and all players see this designation.
2. **Given** the drawer has been assigned for round 1, **When** all players view the game screen, **Then** each player sees a visual indicator (e.g., badge, label, or highlighted name) identifying who the current drawer is.
3. **Given** the drawer is viewing the game screen, **When** the first round begins, **Then** the drawer sees the same drawer indicator as other players (confirming their role).

---

### User Story 3 - Secret word visible only to the drawer (Priority: P1)

As the drawer, I want to see the secret word I need to draw while ensuring no other player can see it, so that the game is fair and fun.

**Why this priority**: The core gameplay loop depends on the drawer knowing the word and other players not knowing it. Without this separation, the guessing mechanic is broken.

**Independent Test**: Can be tested by starting a game with 2+ players, then verifying the drawer sees a word while all non-drawer players do not see it.

**Acceptance Scenarios**:

1. **Given** the first round has begun, **When** the drawer views the game screen, **Then** the secret word (deterministically selected from the starter list) is displayed prominently to the drawer.
2. **Given** the first round has begun, **When** a non-drawer player views the game screen, **Then** they do not see the secret word — instead they see a placeholder or the drawing canvas area without the word.
3. **Given** the first round has begun, **When** the drawer sees the secret word, **Then** the word is one from the starter list (not randomly generated) and the same word is always chosen for round 1 of any game (deterministic selection).
4. **Given** the word has been assigned for round 1, **When** the drawer refreshes or reloads the page, **Then** the same word is still displayed to the drawer and not revealed to non-drawers.

---

### Edge Cases

- What happens if the host's name was valid when they joined but becomes empty due to a display name change before game start? (Covered by the "awaiting rename" state — the host would also see an inline rename prompt.)
- What happens if multiple players simultaneously have invalid names? (All invalid players see rename prompts independently; game proceeds once all names are valid.)
- What happens if a player in "awaiting rename" state never provides a valid name? (Game remains in awaiting state indefinitely; host could disband or timeout.)
- What happens when a non-host player tries to start the game? (Start control is hidden from non-host players; they cannot attempt it.)
- What happens if there is only 1 player in the room and the host tries to start?
- What happens if the starter word list is empty or corrupted?
- What happens if a player joins after the game has started? (They can spectate but do not see the current round's word and do not participate in guessing.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST validate all player display names when the host attempts to start the game, trimming leading/trailing whitespace from each name.
- **FR-002**: If any player's display name is empty or whitespace-only after trimming, the system MUST enter an "awaiting rename" state — the game does not proceed, and the player with the invalid name sees an inline message and text input to provide a valid non-empty name. The game transitions to round 1 once all names are valid, without requiring the host to retry.
- **FR-003**: The system MUST designate the host (the player who created the room) as the drawer for the first round of the game.
- **FR-004**: All players MUST see a clear visual indicator identifying who the current drawer is (e.g., a prominent label, badge, or highlight on the drawer's name).
- **FR-005**: The system MUST select the secret word for round 1 from a predefined starter word list using a deterministic method (e.g., first word in the list, or computed based on round/room identifier).
- **FR-006**: The secret word MUST be delivered only to the designated drawer via server-side filtering — the server MUST include the word exclusively in responses for the drawer's session and MUST NOT send it to non-drawer players at the network level.
- **FR-007**: If the drawer refreshes or reloads the page during round 1, the system MUST continue to display the same secret word to them and MUST NOT reveal it to non-drawer players.
- **FR-008**: Only the host MUST be able to trigger the game start — the start game control MUST be hidden from non-host players entirely.

### Key Entities *(include if feature involves data)*

- **Game Session**: Created when the host starts the game from the lobby. Contains the current round number, the word list, and the mapping of which player is drawing in each round. Transitions through states: in-progress, round-active, finished.
- **Player (in-game context)**: Extends the lobby player entity with a role for the current round (drawer or guesser). Each player's game view differs based on their role.
- **Round**: A period of gameplay where one player draws and others guess. Contains the assigned drawer, the secret word, the drawing data, and the guesses submitted. Round 1 is the starting round.
- **Word List**: A predefined, ordered collection of words stored in the system. Used as the source for deterministic word selection across rounds.
- **Secret Word Assignment**: The mapping of a specific word from the word list to a specific round. This assignment is deterministic (same word is always chosen for the same round in any game).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A game with 3+ players transitions from lobby to round 1 in under 2 seconds after the host clicks "Start Game", provided all names are valid.
- **SC-002**: A player with an empty or whitespace-only name sees an inline error message within 1 second of the host attempting to start the game.
- **SC-003**: Every player in the game can correctly identify who the drawer is within 3 seconds of round 1 starting, confirmed by visual inspection of the game screen.
- **SC-004**: The drawer sees the secret word displayed on their screen — no non-drawer player can see any portion of the word.
- **SC-005**: Starting the same game twice (same player names, same order) results in the same word being selected for round 1, confirming deterministic selection.
- **SC-006**: If the drawer reloads their page during round 1, the same word is re-displayed to them and remains hidden from non-drawers.

## Assumptions

- The starter word list contains at least 10 common, drawable words and is available server-side before any game starts.
- The "deterministic selection" method uses the first word from the starter list for round 1 (the simplest deterministic approach).
- Players cannot change their display name after the game has started.
- The host is the room creator and remains the host for the entire game session.
- A minimum of 2 players is required for the game to start (enforced by the lobby system from the Room Setup & Lobby feature).
- The host is always the first player in the participant list (they created the room).
- Player names at game start are taken from the lobby state — name changes in the lobby are reflected when the game starts.
