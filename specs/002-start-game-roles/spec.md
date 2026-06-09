# Feature Specification: Game Start & Role Assignment

**Feature Branch**: `002-start-game-roles`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "The goal of this feature is allow host to start or begin the game. When the game begins, the system must assign roles to all participants - one player as drawer, and the other players becomes the persons who guess the words. A secret word must be selected by the drawer which is only visible to the drawer only"

## Clarifications

### Session 2026-06-09

- Q: How is the secret word "selected by the drawer"? Does the drawer choose from options or does the system assign a word? → A: The system presents the drawer with multiple word options (e.g., 3), from which the drawer picks one. The chosen word is visible only to the drawer.

## User Scenarios & Testing

### User Story 1 - Host Starts the Game (Priority: P1)

As a host of a room with 2+ players, I want to start the game so that all players can begin playing.

**Why this priority**: This is the core action that transitions the game from lobby to active play — without it, no gameplay can occur.

**Independent Test**: Create a room with 2+ players as host, click "Start Game", and verify all players receive role assignments and the game state changes to "in-progress".

**Acceptance Scenarios**:

1. **Given** a room with 2+ players, **When** the host clicks "Start Game", **Then** all players see their assigned roles (drawer or guesser) and the game status changes to "in-progress"
2. **Given** a room with only 1 player, **When** the host clicks "Start Game", **Then** an error is shown: "Need at least 2 players to start"
3. **Given** a room with 2+ players, **When** a non-host player clicks "Start Game", **Then** an error is shown: "Only the host can start the game"
4. **Given** the game is already in-progress, **When** any player attempts to start the game, **Then** an error is shown: "Game has already started"

---

### User Story 2 - Players See Their Roles (Priority: P1)

As a player in a room where the game has started, I want to see whether I am the drawer or a guesser so I know my role in the round.

**Why this priority**: Role visibility is essential for players to understand their responsibilities — without knowing their role, players cannot participate meaningfully.

**Independent Test**: Join a room with 2+ players, have the host start the game, and verify each player sees their correct role (exactly one drawer, all others guessers).

**Acceptance Scenarios**:

1. **Given** a game has just started, **When** a player views the game screen, **Then** they see their assigned role ("You are the Drawer" or "You are a Guesser")
2. **Given** a game has just started, **When** the drawer views the game screen, **Then** they also see the secret word displayed prominently
3. **Given** a game has just started, **When** a guesser views the game screen, **Then** the secret word is NOT visible to them

---

### User Story 3 - Drawer Views the Secret Word (Priority: P2)

As the assigned drawer, I want to see the secret word so I know what to draw.

**Why this priority**: The drawer needs the word to begin drawing; without seeing the word the game cannot proceed.

**Independent Test**: Start a game with 2+ players, verify the drawer sees a word on their screen while guessers see no word.

**Acceptance Scenarios**:

1. **Given** a game has started and roles are assigned, **When** the drawer looks at the game screen, **Then** they see a set of word options (exactly 3) from which they must select one
2. **Given** the drawer has selected a word from the presented options, **When** the drawer views the game screen, **Then** the selected secret word is displayed prominently to them
3. **Given** a game has started, **When** any guesser looks at the game screen, **Then** no word or hint about the word is visible

---

### Edge Cases

- What happens if a player disconnects while the game is starting? The remaining players should still receive role assignments and the game should proceed.
- How does the system handle exactly 2 players? One player is drawer, one is guesser — both roles are valid.
- What happens if the host leaves immediately after starting the game? The game continues independently of the host's presence.
- What if the word bank is empty or unavailable? The system should prevent game start with a clear error.

## Requirements

### Functional Requirements

- **FR-001**: The host MUST be able to start the game from the lobby when there are 2 or more players in the room.
- **FR-002**: The system MUST prevent game start when only 1 player is in the room, returning a clear error message.
- **FR-003**: The system MUST prevent non-host players from starting the game, returning a clear error message.
- **FR-004**: The system MUST prevent starting a game that is already in-progress, returning a clear error message.
- **FR-005**: Upon successful game start, the system MUST assign exactly one player as Drawer and all remaining players as Guessers.
- **FR-006**: The drawer role MUST be assigned uniformly at random among all participants.
- **FR-007**: Upon game start, the system MUST present the drawer with a set of word options (exactly 3) drawn from a predefined word bank. The drawer MUST select one word from these options.
- **FR-008**: The selected secret word MUST be revealed ONLY to the assigned drawer. The word options presented to the drawer MUST NOT be visible to guessers.
- **FR-009**: Guessers MUST NOT be able to see the secret word or the word options through any game interface.
- **FR-010**: All players MUST be able to see their assigned role (Drawer or Guesser) immediately after the game starts.
- **FR-011**: The game state MUST transition from "lobby" to "in-progress" atomically upon successful game start.

### Key Entities

- **Game Round**: Represents a single round of play. Contains the assigned drawer, the secret word, the list of guessers, and the round status. Created when the host starts the game.
- **Role**: The designation of a player as either Drawer or Guesser in a given round. Assigned randomly at game start and persists for the round duration.
- **Secret Word**: The word that the drawer must convey through drawing. Chosen by the drawer from a set of options presented by the system upon game start. Visible only to the drawer.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A room with 2+ players can transition from lobby to in-progress in under 2 seconds after the host triggers "Start Game".
- **SC-002**: 100% of players see their correct role (drawer or guesser) on their screen immediately after the game starts.
- **SC-003**: The secret word is visible to the assigned drawer and invisible to all guessers in 100% of game starts.
- **SC-004**: The system correctly rejects all invalid start attempts (1 player, non-host, already started) with specific, actionable error messages in every case.

## Assumptions

- A predefined word bank of age-appropriate words exists and is bundled with the game system. Word selection is random from this bank.
- The drawer role is selected uniformly at random from all players in the room.
- Role assignment and word selection happen atomically when the game starts — there is no intermediate "assigning" state visible to players.
- The game supports 2-8 players per room (standard party game size).
- The drawing interaction (canvas, timer, submission of guessing, etc.) is handled by subsequent features and is out of scope for this specification.
- Players who disconnect during game start will see the updated game state when they reconnect and poll again.
