# Feature Specification: Scribble Gameplay Core

**Feature Branch**: `001-scribble-gameplay`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "check readme and generate" plus the Scribble lab business scenarios from the repository README.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Room setup, lobby, and host control (Priority: P1)

Players need a reliable room lifecycle before the game begins.

**Why this priority**: Without isolated room creation and a host-controlled lobby, multiplayer gameplay cannot start safely or consistently.

**Independent Test**: Create a room, join from a second session, confirm lobby state refreshes, and verify the host can only start when two or more players are present.

**Acceptance Scenarios**:

1. **Given** a player creates a new room, **When** the room is created successfully, **Then** the creator is identified as the host and lands in a lobby showing the room code and participant list.
2. **Given** another player enters a valid room code, **When** they join, **Then** the lobby updates to show the new player alongside the host.
3. **Given** a player enters an invalid or empty room code, **When** they attempt to join, **Then** the system rejects the request and shows a clear error message.
4. **Given** fewer than two participants are present, **When** the host attempts to start the game, **Then** the system prevents the start and displays a message explaining that at least two players are required.
5. **Given** the room exists, **When** either player refreshes the lobby state, **Then** the latest participant list is reloaded within the polling cadence.

---

### User Story 2 - Game start, drawer assignment, and secret word visibility (Priority: P1)

The game must begin with a single drawer, a deterministic word choice, and role-specific visibility.

**Why this priority**: The first round’s role assignment and secret word visibility define the core gameplay experience and prevent confusion.

**Independent Test**: Start a room with two valid players, verify the drawer is assigned clearly, and confirm only the drawer sees the secret word.

**Acceptance Scenarios**:

1. **Given** the host starts the game with at least two players and both names are valid, **When** the game begins, **Then** the host or the first joined player is assigned as the drawer and the drawer sees a secret word.
2. **Given** a player enters a name that is empty or only whitespace, **When** they submit the name, **Then** the system rejects it and shows a validation error.
3. **Given** the game has started, **When** a guesser views their screen, **Then** the secret word remains hidden from them.
4. **Given** the game begins, **When** the system selects the secret word, **Then** it is chosen deterministically from the starter list provided by the repository.

---

### User Story 3 - Drawing interaction, guess submission, and synced history (Priority: P2)

Active gameplay must allow drawing, guessing, and shared game state updates.

**Why this priority**: Guessers and the drawer need synchronized interactions for the round to feel playable and fair.

**Independent Test**: Submit valid and invalid guesses, confirm guess history syncs, and verify correct guesses score 100 points.

**Acceptance Scenarios**:

1. **Given** a round is active and the drawer is drawing, **When** the drawer clears the canvas, **Then** the canvas resets and the cleared state is reflected in the current round.
2. **Given** a guesser submits a guess with extra spaces or different casing, **When** the guess is processed, **Then** the system trims whitespace, compares case-insensitively, and records the normalized guess.
3. **Given** a guess is empty after trimming, **When** it is submitted, **Then** the system rejects it with a validation message.
4. **Given** guesses are submitted, **When** the lobby or game state refreshes, **Then** all players see the same guess history within the polling cadence.
5. **Given** a guess matches the secret word, **When** it is recognized as correct, **Then** that guess is scored 100 points and shown as correct to all players.
6. **Given** a guess is incorrect, **When** it is processed, **Then** it is preserved in history but scores 0 points.

---

### User Story 4 - Round results and restart flow (Priority: P3)

Players must see the final outcome and be able to restart cleanly while preserving the room and participants.

**Why this priority**: A complete game experience requires visible results and a restart path for the next round.

**Independent Test**: End a round, verify result state for all players, restart as host, and confirm the room returns to the lobby with players preserved.

**Acceptance Scenarios**:

1. **Given** the round has ended, **When** results are displayed, **Then** all players see the correct secret word, final scores, and complete guess history.
2. **Given** the host restarts the game from the result state, **When** restart is confirmed, **Then** the room returns to the lobby and all round-specific state is cleared while players remain in the room.
3. **Given** a restarted room returns to the lobby, **When** the host prepares the next round, **Then** no previous round guesses or scores persist beyond the displayed final result.

---

### Edge Cases

- A player tries to join with a room code after the backend has restarted and all in-memory rooms were cleared.
- Two players choose the same display name; the system preserves both participants but may display them distinctly by join order.
- A host leaves before the game starts; the room remains in-memory and joiners can still use the existing code, but host reassignment is not the core flow.
- Network errors occur during lobby polling or guess submission; the UI presents an error and retries the room snapshot refresh.
- A guesser submits the correct word after it has already been guessed; the system records the attempt but does not award duplicate points.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to create a new game room and become the host.
- **FR-002**: The system MUST allow another player to join an existing room using a room code.
- **FR-003**: The system MUST reject invalid or empty room codes when joining.
- **FR-004**: The system MUST refresh lobby state via polling so the participant list stays current.
- **FR-005**: The system MUST only allow the host to start the game.
- **FR-006**: The system MUST prevent game start until at least two players are present.
- **FR-007**: The system MUST validate player names by trimming whitespace and rejecting empty values.
- **FR-008**: The system MUST assign one drawer at game start and display the secret word only to that drawer.
- **FR-009**: The system MUST choose the secret word deterministically from the starter word list.
- **FR-010**: The system MUST allow the drawer to clear the current drawing canvas during an active round.
- **FR-011**: The system MUST accept guess submissions, normalize them, and reject empty guesses.
- **FR-012**: The system MUST sync guess history to all players through periodic state refresh.
- **FR-013**: The system MUST score correct guesses as 100 points and incorrect guesses as 0 points.
- **FR-014**: The system MUST show round results and allow the host to restart the room while preserving players and clearing round state.

### Key Entities

- **Room**: A temporary multiplayer session with a unique room code, host identity, participant list, current game status, and round state.
- **Player**: A room participant with a display name, role (host, drawer, guesser), and accumulated score.
- **Game Round**: The active round state that includes the drawer assignment, selected secret word, drawing canvas state, guess history, and round completion status.
- **Guess**: A submitted player attempt with normalized text, correctness flag, timestamp, and score value.
- **Scoreboard**: The aggregated player scores for the current room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can create or join a room and reach the lobby in under 2 minutes from the start of the flow.
- **SC-002**: The host can only start the game when at least two participants are present, and any invalid start attempt returns a clear rejection.
- **SC-003**: The drawer sees the secret word immediately on game start and guessers do not see it at any point during the round.
- **SC-004**: Guess submissions are normalized automatically and empty guesses are rejected consistently.
- **SC-005**: Correct guesses are scored as 100 points and incorrect guesses are scored as 0 points.
- **SC-006**: Lobby and guess history updates are visible to all players within the polling cadence, enabling shared state across two browser sessions.
- **SC-007**: After a round ends and the host restarts, the room returns to the lobby with players preserved and no active round state remaining.

## Assumptions

- The feature extends the existing starter app without adding persistence, authentication, or external services.
- The host is the player who creates the room and retains exclusive permissions to start and restart rounds.
- Lobby updates and game state sync use periodic polling rather than realtime push mechanisms.
- The in-memory backend is ephemeral; rooms are cleared if the server restarts.
- Only a single round flow is required for this feature set; multi-round rotation and timers are out of scope.
