# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Scenario 2 - Game Start & Drawer Flow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Player Names Before Game Start (Priority: P1)

Players need confidence that everyone in the room has a usable display name before a round begins. The system trims names and rejects empty or whitespace-only names with clear feedback before allowing a player into a room or an active round.

**Why this priority**: A drawer and guessers must be identifiable during gameplay. Empty names make the player list, drawer label, guesses, and results confusing.

**Independent Test**: A player attempts to enter with a blank or whitespace-only name and receives a clear message without being added to the room. A player entering a name with extra spaces is added under the trimmed name.

**Acceptance Scenarios**:

1. **Given** a player enters only spaces for their name, **When** they submit the name, **Then** the system rejects it with a clear message that a name is required.
2. **Given** a player enters a name with leading or trailing spaces, **When** they submit the name, **Then** the system stores and displays the trimmed name.
3. **Given** all players in a room have valid names, **When** the host starts the game, **Then** the game can proceed without requiring any additional name cleanup.

---

### User Story 2 - Start the First Round with a Clear Drawer (Priority: P1)

When a room moves from lobby to gameplay, every player needs to know who is drawing. The host becomes the first drawer. If the host cannot be identified, the first player in the room becomes the drawer.

**Why this priority**: The game cannot begin unless the drawing role is assigned consistently for all players.

**Independent Test**: A room with at least two valid players starts a game, and all players see the same player identified as the drawer.

**Acceptance Scenarios**:

1. **Given** a room has a host and at least one other player, **When** the host starts the game, **Then** the host is assigned as the drawer for the first round.
2. **Given** a room's host cannot be identified but the room has players, **When** the game starts, **Then** the first player in the room is assigned as the drawer.
3. **Given** the first round has started, **When** any player views the game screen, **Then** the drawer is clearly identified by name.

---

### User Story 3 - Show the Secret Word Only to the Drawer (Priority: P1)

The drawer needs to see the word they must draw, while guessers must not see it. The first secret word is selected deterministically from the starter word list so the round can be tested consistently.

**Why this priority**: Drawer-only word visibility is the core fairness rule for the drawing game. Deterministic selection makes the first round predictable and easy to validate.

**Independent Test**: Start a game with two players. The drawer sees the selected word, while every non-drawer sees only that they should guess from the drawing.

**Acceptance Scenarios**:

1. **Given** the first round begins, **When** the secret word is selected, **Then** it is the first word from the starter word list.
2. **Given** the drawer opens the game screen during the active round, **When** the game state is shown, **Then** the drawer can see the secret word.
3. **Given** a guesser opens the game screen during the active round, **When** the game state is shown, **Then** the guesser cannot see the secret word.
4. **Given** multiple guessers are in the same round, **When** each guesser views the game screen, **Then** none of them can see the secret word.

---

### Edge Cases

- A whitespace-only name is rejected before the player is added to a room.
- A name with leading or trailing spaces is trimmed consistently everywhere it is displayed.
- If the host cannot be identified at game start, the first player in the room becomes the drawer.
- If the starter word list is available, the first round always uses the first word for deterministic validation.
- If a non-drawer refreshes or re-enters the game screen during the active round, the secret word remains hidden from that player.
- If the drawer refreshes or re-enters the game screen during the active round, the secret word remains visible to that drawer.
- If a room has fewer than two valid players, the game does not start as part of the existing lobby start rule.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trim leading and trailing whitespace from player names before accepting or displaying them.
- **FR-002**: The system MUST reject empty or whitespace-only player names with a clear message that a name is required.
- **FR-003**: The system MUST prevent a game from starting if any active player in the room lacks a valid trimmed name.
- **FR-004**: When the first round starts, the system MUST assign the host as the drawer.
- **FR-005**: If the host cannot be identified at first-round start, the system MUST assign the first player in the room as the drawer.
- **FR-006**: The system MUST show the drawer's name clearly to all players during the active round.
- **FR-007**: The system MUST select the first round's secret word deterministically from the starter word list.
- **FR-008**: The system MUST make the secret word visible to the assigned drawer during the active round.
- **FR-009**: The system MUST hide the secret word from every non-drawer during the active round.
- **FR-010**: The system MUST preserve the same drawer and secret word for the duration of the active round, including after players refresh or re-enter the game screen.
- **FR-011**: The system MUST communicate game-start errors with user-friendly messages and keep players in the lobby when the game cannot start.

### Key Entities

- **Room**: A shared game space containing players, a host, and the current phase of play.
- **Player**: A participant with a trimmed display name and a role for the active round.
- **Round**: The active gameplay period with one drawer and one secret word.
- **Secret Word**: The word selected for the drawer to represent and for guessers to identify.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of whitespace-only player names are rejected with a clear message before the player can join or start play.
- **SC-002**: 100% of accepted player names are displayed without leading or trailing spaces.
- **SC-003**: In a valid two-player room, the first round starts with the same drawer shown to every player within one screen refresh cycle.
- **SC-004**: In 100% of first-round starts, the selected secret word matches the first word from the starter word list.
- **SC-005**: In 100% of active round views, the drawer can see the secret word and non-drawers cannot.
- **SC-006**: At least 90% of manual two-browser validation attempts can confirm drawer assignment and word visibility in under 2 minutes.

## Assumptions

- Scenario 1's room creation, joining, lobby, host tracking, and minimum two-player start rule are already available or planned as dependencies.
- The host is the intended first drawer because the README states "host (or first player)" and host tracking is part of Scenario 1.
- "Deterministically selected from the starter list" means the first round uses the first starter word.
- The starter word list remains `rocket`, `pizza`, `castle`, `guitar`, and `sunflower` for this scenario.
- The feature covers only the first round's start and role visibility; drawing, guessing, scoring, results, restart, multiple rounds, and drawer rotation remain out of scope for this scenario.
