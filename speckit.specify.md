# Feature Specification: Room Setup, Game Start, Gameplay Interaction, & Results

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Scenario 1, 2, 3 & 4"

## User Scenarios & Testing

### User Story 1 - Create Room and Host Assignment (Priority: P1)
As a player, I want to create a room so that I can host a drawing game.

**Why this priority**: Core entry point of the game. Without creating a room, multiplayer cannot start.

**Independent Test**: Create a room from the landing page. Verify that the player is successfully redirected to `/lobby`, a unique code is generated, and the player is marked as the host.

**Acceptance Scenarios**:
1. **Given** the player is on the Start screen, **When** they enter a name and click "Create Room", **Then** a new room is created with a unique 4-character code, the player is added as a participant, and they are designated as the host.

---

### User Story 2 - Join Room and Validation (Priority: P1)
As a player, I want to join an existing room via a unique code, with validation to reject invalid or empty codes.

**Why this priority**: Crucial for connecting players. Validation prevents entering non-existent or empty rooms.

**Independent Test**: Try to join with a non-existent or empty code. Verify a clear error message is shown. Then try to join with a valid code.

**Acceptance Scenarios**:
1. **Given** the player is on the Join Room screen, **When** they leave the room code empty and click "Join Lobby", **Then** the UI shows a clear error message "Room code is required".
2. **Given** the player is on the Join Room screen, **When** they enter a code of invalid format (e.g. not 4 characters), **Then** the request is rejected with feedback "Invalid room code format".
3. **Given** a room code does not exist in backend memory, **When** a player tries to join, **Then** they see a "Room not found" error.

---

### User Story 3 - Lobby Sync via Polling (Priority: P1)
As a participant in a lobby, I want the list of participants to update automatically.

**Why this priority**: Without polling, players would have to manually refresh to see other players join.

**Independent Test**: Open two browser tabs. Let Tab A create a room and join. Let Tab B join the room. Tab A should automatically update the participant list within 2 seconds.

**Acceptance Scenarios**:
1. **Given** a player is waiting in the Lobby screen, **When** another player joins the same room code, **Then** the first player's lobby participant list automatically updates within ~2 seconds without manual refresh.

---

### User Story 4 - Host-Only Start Game Permissions (Priority: P2)
As a host, I want to be the only person who can start the game, and only when there are at least 2 players in the room.

**Why this priority**: Prevents non-hosts or single-player starts from breaking game rules.

**Independent Test**: Open two tabs. In the host tab (Tab A), the "Start Game" button should be disabled until Tab B joins. In Tab B (non-host), the "Start Game" button should not be clickable or visible.

**Acceptance Scenarios**:
1. **Given** the host is in the lobby alone, **When** looking at the "Start Game" button, **Then** the button is disabled.
2. **Given** the host is in the lobby with another player, **When** the player count is >= 2, **Then** the "Start Game" button is enabled.
3. **Given** a non-host player is in the lobby, **When** looking at the Lobby page, **Then** they cannot start the game (button is disabled or hidden, showing "Waiting for host to start").

---

### User Story 5 - Game Start and Drawer Assignment (Priority: P1)
As a player in a lobby, I want the game to start and roles to be assigned so that gameplay can begin.

**Why this priority**: Core game start transition. Without it, gameplay cannot be entered.

**Independent Test**: The host clicks "Start Game". Verify both Host and other players are automatically routed to `/game`. Verify the Host is assigned as the Drawer.

**Acceptance Scenarios**:
1. **Given** a lobby has at least 2 players, **When** the host clicks "Start Game", **Then** the room status transitions to `"game"`, the host is assigned as the `drawer`, and a secret word is selected.
2. **Given** a player is polling the lobby status, **When** the room status updates to `"game"`, **Then** the client automatically navigates the player to the `/game` screen.

---

### User Story 6 - Role-Based Secret Word Visibility (Priority: P1)
As the designated drawer, I want to see the secret word so that I know what to draw, and I want to ensure guessers cannot see it.

**Why this priority**: Crucial game rule. If guessers see the secret word via API or UI, the game is compromised.

**Independent Test**: Start a game. Inspect the API response on the Guessing player's browser. Verify that `secretWord` is null/empty in their response and not displayed in their UI. Verify the Drawer sees the word in the UI.

**Acceptance Scenarios**:
1. **Given** the game has started and a player is assigned the `drawer` role, **When** they view their game screen, **Then** the secret word is displayed.
2. **Given** the game has started and a player is assigned the `guesser` role, **When** they view their game screen, **Then** they see "You are a Guesser" and the secret word is hidden.

---

### User Story 7 - Drawer Drawing and Clear Canvas (Priority: P1)
As the drawer, I want to draw on the canvas and clear it so that I can communicate the secret word during the round.

**Why this priority**: Drawing is the central gameplay interaction. Without it, guessers cannot play the round.

**Independent Test**: Start a game as the host/drawer. Draw on the canvas and verify the drawing remains visible on the drawer's screen. Click Clear and verify the canvas resets.

**Acceptance Scenarios**:
1. **Given** the game is active and the viewer is the drawer, **When** they draw on the canvas, **Then** the drawing appears immediately on their screen and the backend stores the updated drawing state.
2. **Given** the game is active and the viewer is the drawer, **When** they click "Clear Canvas", **Then** the canvas is cleared for the drawer and the cleared state is stored for the room.
3. **Given** the game is active and the viewer is a guesser, **When** they view the game screen, **Then** they cannot draw or clear the canvas.

---

### User Story 8 - Guess Submission and Synced History (Priority: P1)
As a guesser, I want to submit guesses and see the guess history update so that the round feels shared across players.

**Why this priority**: Guessing is the second half of the drawing game loop and must be visible to all players through polling.

**Independent Test**: In a two-tab game, submit a guess as the guesser. Verify empty guesses are rejected, valid guesses are recorded, and both tabs show the guess in history within the polling interval.

**Acceptance Scenarios**:
1. **Given** the game is active and the viewer is a guesser, **When** they submit an empty or whitespace-only guess, **Then** the UI rejects it with a clear validation message and no backend guess is recorded.
2. **Given** the game is active and the viewer is a guesser, **When** they submit a non-empty guess, **Then** the backend stores the trimmed guess with the participant ID, participant name, timestamp, correctness, and awarded points.
3. **Given** either the drawer or a guesser is polling the room snapshot, **When** a guess is submitted, **Then** the guess history appears for all players within ~2 seconds.
4. **Given** the viewer is the drawer, **When** they view the guess form area, **Then** they cannot submit guesses for their own word.

---

### User Story 9 - Deterministic Scoring (Priority: P1)
As a player, I want correct guesses to update scores predictably so that everyone can see who guessed the word.

**Why this priority**: Scoring is required for Scenario 3 validation and establishes state needed by result screens in Scenario 4.

**Independent Test**: Submit an incorrect guess and then a correctly cased or differently cased correct guess. Verify incorrect guesses award 0, correct guesses award 100, and the scoreboard updates for all players.

**Acceptance Scenarios**:
1. **Given** the game has a secret word, **When** a guesser submits a guess that does not match the word after trimming and case normalization, **Then** the guess is recorded as incorrect and the guesser receives 0 points.
2. **Given** the game has a secret word, **When** a guesser submits a guess that matches the word regardless of letter casing, **Then** the guess is recorded as correct and the guesser receives 100 points.
3. **Given** a guesser has already earned points for a correct guess in the active round, **When** they submit the correct word again, **Then** the later guess is recorded but no additional points are awarded.
4. **Given** scores have changed, **When** any player polls the room snapshot, **Then** the scoreboard displays each participant with the current score.

---

### User Story 10 - Result State Visibility (Priority: P1)
As a participant, I want the result state to show the correct word, final scores, and full guess history so that the round has a clear conclusion.

**Why this priority**: Scenario 4 requires a shared result state before restart; without it, final validation cannot prove the round ended consistently for all players.

**Independent Test**: Start a game with two players, submit guesses, end the round, and verify both tabs show the same correct word, final scores, and full guess history.

**Acceptance Scenarios**:
1. **Given** a room is in active game state, **When** the host ends the round, **Then** the backend transitions the room status to `"results"`.
2. **Given** the room status is `"results"`, **When** any participant fetches the room snapshot, **Then** the correct word is visible to them.
3. **Given** the room status is `"results"`, **When** any participant views the game screen, **Then** they see final scores and full guess history in a read-only result view.
4. **Given** the room status is `"results"`, **When** participants continue polling, **Then** all players converge on the same result state within ~2 seconds.

---

### User Story 11 - Host Restart to Lobby (Priority: P1)
As the host, I want to restart from the result state so that the same players can return to the lobby for another game setup.

**Why this priority**: Restart is the final Scenario 4 behavior and validates that round state can be cleared without losing room membership.

**Independent Test**: From result state, click Restart as the host. Verify all tabs return to `/lobby`, players are preserved, and round state is cleared.

**Acceptance Scenarios**:
1. **Given** a room is in result state and the viewer is the host, **When** they click Restart, **Then** the backend transitions the room status to `"lobby"`.
2. **Given** a room is restarted, **When** any participant fetches the room snapshot, **Then** participants and host ID are preserved.
3. **Given** a room is restarted, **When** any participant fetches the room snapshot, **Then** `drawerId`, `secretWord`, drawing, guesses, and scores are cleared/reset for a new lobby.
4. **Given** non-host participants are in result state, **When** they view the restart controls, **Then** they cannot restart and see that they are waiting for the host.
5. **Given** a restarted room is polled by participants still on the game screen, **When** `status === "lobby"`, **Then** clients navigate back to `/lobby`.

### Edge Cases
- **Room Isolation:** Players in Room A must not see or sync state with Room B.
- **Lowercase Code Input:** The room code is case-insensitive. Entering `abcd` should resolve to `ABCD`.
- **Extra Whitespace:** Room codes and names should have leading/trailing whitespaces trimmed.
- **Securing Secret Word:** Under the hood, the backend MUST filter out the `secretWord` field from the API response unless the request matches the drawer's `participantId`.
- **Drawer Permissions:** Only the assigned drawer can update or clear drawing state.
- **Guesser Permissions:** Only non-drawer participants can submit guesses.
- **Guess Normalization:** Guess text must be trimmed before storage and compared case-insensitively against the selected secret word.
- **Repeated Correct Guesses:** A participant cannot repeatedly earn 100 points by resubmitting the correct word.
- **Result Word Visibility:** Guessers cannot see the secret word during active play, but every participant can see the correct word in result state.
- **Restart Permissions:** Only the host can restart from results.
- **Restart Reset:** Restart clears round-specific state while preserving room code, host, and participants.

## Requirements

### Functional Requirements
- **FR-001**: The backend MUST store a `hostId` for each created room, mapping it to the creator's participant ID.
- **FR-002**: The backend API `GET /rooms/:code` MUST return the `hostId` as part of the room snapshot payload.
- **FR-003**: The backend MUST validate room codes on `POST /rooms/:code/join` and `GET /rooms/:code` to ensure they are 4-character alphanumeric strings.
- **FR-004**: The frontend MUST run a repeating interval timer (~2s cadence) on the `/lobby` route to fetch the latest room snapshot.
- **FR-005**: The frontend MUST disable/hide the "Start Game" button for any participant whose `participantId` does not match the room's `hostId`.
- **FR-006**: The frontend/backend MUST enforce that starting the game requires `participants.length >= 2`.
- **FR-007**: The backend MUST expose a `POST /rooms/:code/start` route to start the game.
- **FR-008**: The backend MUST transition the room status to `"game"`, assign `drawerId` to the host's participant ID, and choose a deterministic secret word when game starts.
- **FR-009**: The backend MUST mask/omit the `secretWord` in the returned room snapshot unless `viewerParticipantId` is the `drawerId`.
- **FR-010**: The frontend MUST poll the room status while on `/game` and automatically redirect to `/lobby` if status transitions back to lobby.
- **FR-011**: The backend MUST store active round drawing state in memory as part of the room.
- **FR-012**: The backend MUST expose a drawer-only drawing update endpoint and reject drawing updates from non-drawers.
- **FR-013**: The backend MUST expose a drawer-only clear canvas endpoint that resets the room drawing state.
- **FR-014**: The backend MUST expose a guess submission endpoint that validates participant ID and trimmed guess text.
- **FR-015**: The backend MUST compare guesses with the secret word case-insensitively after trimming.
- **FR-016**: The backend MUST store guess history with participant identity, text, timestamp, correctness, and awarded points.
- **FR-017**: The backend MUST maintain participant scores in the room snapshot; all active-round scores start at 0.
- **FR-018**: The frontend MUST render an interactive canvas for the drawer and a read-only drawing view for guessers.
- **FR-019**: The frontend MUST render synced guess history and scoreboard from the polled room snapshot.
- **FR-020**: The backend MUST expose a host-only endpoint to end the active round and transition room status to `"results"`.
- **FR-021**: The backend MUST expose the correct word to all participants when room status is `"results"`.
- **FR-022**: The frontend MUST render a read-only result view with correct word, final scores, and full guess history.
- **FR-023**: The backend MUST expose a host-only restart endpoint that transitions room status to `"lobby"`.
- **FR-024**: Restart MUST preserve room code, host ID, and participants.
- **FR-025**: Restart MUST clear `drawerId`, `secretWord`, drawing state, guess history, and active-round scores.
- **FR-026**: The frontend MUST navigate participants back to `/lobby` when polling observes restarted lobby status.

## Success Criteria

### Measurable Outcomes
- **SC-001**: 100% of room creations assign the creator's ID as the `hostId`.
- **SC-002**: Automatic lobby refreshes occur within 2000ms ± 200ms of any participant joining.
- **SC-003**: A non-host participant is programmatically blocked from triggering the start game endpoint or navigating past lobby unilaterally.
- **SC-004**: Entering a blank room code returns immediate validation feedback.
- **SC-005**: The secret word is 100% hidden from the network responses returned to guessing players.
- **SC-006**: Transition from lobby to game screen happens automatically for all players within 2 seconds of the host starting the game.
- **SC-007**: Empty or whitespace-only guesses are rejected before they create guess history entries.
- **SC-008**: Correct guesses award exactly 100 points and incorrect guesses award 0 points.
- **SC-009**: Guess history and scores appear for all players within the existing polling interval.
- **SC-010**: Guessers cannot update or clear the room drawing state through the UI or API.
- **SC-011**: Result state shows the same correct word, final scores, and full guess history to every participant.
- **SC-012**: Non-host restart attempts are rejected by the backend and unavailable from the UI.
- **SC-013**: Restart returns all polling participants to lobby within the existing polling interval.
- **SC-014**: Restart preserves players and clears all round state deterministically.

## Assumptions
- **Host Persistence:** Once a host is assigned, they remain the host for the duration of that lobby session.
- **In-Memory Store:** The server retains the lobby state in memory; any server restart resets all active rooms.
- **Deterministic Word Choice:** Choosing words deterministically via a hash of the room code guarantees that multiple players in the room agree on the word without storing random state changes.
- **Canvas State Shape:** Drawing can be represented as serializable path/stroke data rather than binary image uploads.
- **Single Correct Score:** A player receives the 100-point award once per round, even if they submit the correct word multiple times.
- **Host Ends Round:** The host explicitly ends the round for Scenario 4; no timers or automatic round-end logic are introduced.
- **Scores Reset on Restart:** Scores are considered active-round state and return to 0/empty when the room returns to lobby.
