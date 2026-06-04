# Feature Specification: Scribble Multiplayer Game

**Feature Branch**: `assignment`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scribble assignment business scenarios

## User Scenarios & Testing

### User Story 1 - Room Setup & Lobby (Priority: P1)

As a player, I want to create or join a room so that I can participate in a Scribble game with other players.

**Why this priority**: Multiplayer gameplay cannot begin without room creation and lobby synchronization.

**Independent Test**: Create a room, join from a second browser session, verify polling updates participants, and verify only the host can start the game.

#### Acceptance Scenarios

1. **Given** a player creates a room, **When** the room is successfully created, **Then** the creator becomes the host.
2. **Given** a player enters an invalid room code, **When** they attempt to join, **Then** the system displays a clear validation error.
3. **Given** two players are in the same room, **When** participant data changes, **Then** the lobby updates through polling within approximately two seconds.
4. **Given** fewer than two players are present, **When** the host attempts to start the game, **Then** the system prevents game start and displays feedback.
5. **Given** a non-host player is in the lobby, **When** viewing room controls, **Then** they cannot start the game.

---

### User Story 2 - Game Start & Drawer Flow (Priority: P2)

As a player, I want a clearly identified drawer and secret word so that gameplay begins consistently.

**Why this priority**: A round cannot begin without role assignment and word selection.

**Independent Test**: Start a game and verify drawer assignment and drawer-only word visibility.

#### Acceptance Scenarios

1. **Given** a game starts, **When** the first round begins, **Then** the host becomes the drawer.
2. **Given** a drawer is assigned, **When** the game screen loads, **Then** the drawer is clearly identified.
3. **Given** a secret word is selected, **When** a drawer views the game, **Then** the word is visible only to the drawer.
4. **Given** a guesser views the game, **When** the round is active, **Then** the secret word is hidden.

---

### User Story 3 - Gameplay Interaction (Priority: P3)

As a player, I want drawing, guessing, and scoring so that I can participate in gameplay.

**Why this priority**: This is the core game interaction.

**Independent Test**: Draw, submit guesses, verify synchronized history, and validate scoring.

#### Acceptance Scenarios

1. **Given** a drawer interacts with the canvas, **When** drawing occurs, **Then** drawing data is stored and visible on the drawer screen.
2. **Given** a drawer clears the canvas, **When** the clear action completes, **Then** the canvas resets.
3. **Given** a guesser submits a guess, **When** the guess is valid, **Then** it appears in shared guess history.
4. **Given** a guess matches the secret word ignoring case, **When** the guess is processed, **Then** the player receives 100 points.
5. **Given** a guess does not match the secret word, **When** the guess is processed, **Then** the score remains unchanged.

---

### User Story 4 - Result & Restart (Priority: P4)

As a player, I want to view results and restart the game so that another round can be prepared.

**Why this priority**: Results and restart complete the gameplay cycle.

**Independent Test**: Finish a round, verify results, restart, and return all players to the lobby.

#### Acceptance Scenarios

1. **Given** a round ends, **When** results are displayed, **Then** all players see final scores.
2. **Given** a round ends, **When** results are displayed, **Then** all players see the correct word.
3. **Given** a round ends, **When** results are displayed, **Then** all players see complete guess history.
4. **Given** the host restarts the game, **When** restart completes, **Then** players return to the lobby.
5. **Given** restart completes, **When** players return to the lobby, **Then** participants are preserved and round state is cleared.

## Edge Cases

* Empty room codes
* Invalid room codes
* Empty player names
* Whitespace-only player names
* Empty guesses
* Whitespace-only guesses
* Starting with fewer than two players
* Multiple rooms existing simultaneously
* Backend restart clearing room state

## Functional Requirements

* FR-001: System MUST assign the room creator as host.
* FR-002: System MUST reject invalid room codes.
* FR-003: System MUST synchronize lobby state through polling.
* FR-004: System MUST restrict game start to the host.
* FR-005: System MUST require at least two players before game start.
* FR-006: System MUST assign the host as drawer.
* FR-007: System MUST select a deterministic secret word.
* FR-008: System MUST hide the secret word from guessers.
* FR-009: System MUST support drawing and canvas clearing.
* FR-010: System MUST support guess submission.
* FR-011: System MUST synchronize guess history through polling.
* FR-012: System MUST award 100 points for correct guesses.
* FR-013: System MUST display results after round completion.
* FR-014: System MUST support restart while preserving participants.

## Success Criteria

* SC-001: Two browser sessions can successfully join the same room.
* SC-002: Lobby participant updates appear within approximately two seconds.
* SC-003: Correct guesses consistently award 100 points.
* SC-004: Results display scores, word, and guess history.
* SC-005: Restart returns all players to the lobby without losing participants.

## Assumptions

* Room data remains in memory only.
* Polling is the only synchronization mechanism.
* The host acts as the drawer for the single supported round.
* The starter word list is the source for secret word selection.
