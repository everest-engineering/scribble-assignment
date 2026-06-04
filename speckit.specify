# Feature Specification: Scribble Multiplayer Drawing Game

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Implement Scribble drawing game with Express backend, React frontend, in-memory room store, HTTP polling synchronization, host-only game start and restart, player name trimming, deterministic secret word selection, masked word visibility, interactive canvas, case-insensitive guess submission, scoring, and lobby redirection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scenario 1: Room Setup & Lobby (Priority: P1)

A player wants to host or join a drawing game by creating a room or joining an existing one. The first player to create a room becomes the host. The lobby displays all participants, which is automatically kept in sync via HTTP polling (~2 seconds). The host can start the game once at least 2 players have joined.

**Why this priority**: It is the baseline entry point. Without room creation, joining, and lobby synchronization, multiplayer gameplay cannot be initiated.

**Independent Test**: Can be tested by running the backend and frontend, creating a room in Tab 1, copying the code, joining in Tab 2, and verifying that the participant list updates automatically in Tab 1 without a page reload.

**Acceptance Scenarios**:

1. **Given** a player wants to create a room, **When** they submit a non-empty name, **Then** a new room is created with a unique 4-character code, they land in the lobby, and they are marked as the host.
2. **Given** a player wants to join a room, **When** they submit a non-empty name and an existing room code, **Then** they join the room and appear in the lobby.
3. **Given** a player submits an empty or whitespace-only name on create/join, **When** they submit the form, **Then** the request is rejected with a clear validation error.
4. **Given** a player submits an invalid or non-existent room code, **When** they submit the join form, **Then** the request is rejected with a clear "Room code not found" message.
5. **Given** two players are in the lobby, **When** a new participant joins, **Then** the lobby page automatically refreshes via 2s polling and shows the new participant.
6. **Given** players are in the lobby, **When** the host looks at the lobby, **Then** they see the "Start Game" button (disabled if < 2 players, active if >= 2 players). Other guests must not see the "Start Game" button.

---

### User Story 2 - Scenario 2: Game Start & Drawer Flow (Priority: P2)

When the host starts the game, the room status transitions to `"playing"`. The host (the room creator) is designated as the drawer, and a secret word is deterministically selected from the starter list (`["rocket", "pizza", "castle", "guitar", "sunflower"]`). The secret word is visible only to the drawer, and other players are designated as guessers.

**Why this priority**: Establishes player roles and the secret word state before drawing and guessing interactions begin.

**Independent Test**: Can be tested by starting a game with 2 players and verifying that the drawer's screen displays the secret word, while the guesser's screen shows the guess form and hides the secret word.

**Acceptance Scenarios**:

1. **Given** at least 2 players are in the lobby, **When** the host clicks "Start Game", **Then** the room status updates to `"playing"`.
2. **Given** the game starts, **When** the round begins, **Then** the host becomes the drawer, and guessers automatically redirect to `/game` via polling.
3. **Given** the game is active, **When** the drawer views their screen, **Then** they see the secret word.
4. **Given** the game is active, **When** a guesser views their screen, **Then** the secret word is hidden (null in API snapshot), and they only see the canvas and guess input form.

---

### User Story 3 - Scenario 3: Gameplay Interaction (Priority: P3)

The drawer paints on the canvas, which is synchronized to guessers via 2s polling. Guessers submit guesses which are validated by the backend. Correct guesses earn 100 points, and incorrect ones earn 0. The guess history is synchronized to all players.

**Why this priority**: Core gameplay loop where drawing, syncing, guessing, and scoring take place.

**Independent Test**: Can be tested by having the drawer paint a stroke and verifying it redraws on the guesser's screen after a poll, and submitting a correct guess from the guesser to verify it adds 100 points.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer paints on the canvas, **Then** the drawing is rendered immediately on their screen and saved to the backend.
2. **Given** a round is active, **When** the drawer clicks "Clear Canvas", **Then** the canvas is cleared locally and updated on the backend.
3. **Given** a round is active, **When** guessers poll for state, **Then** the latest drawing updates on their canvas.
4. **Given** a round is active, **When** guessers submit guesses, **Then** empty guesses are rejected; non-empty guesses are trimmed and compared case-insensitively against the secret word.
5. **Given** a guess is submitted, **When** the guess is incorrect, **Then** it is added to the guess list, synced to all players, and scores 0.
6. **Given** a guess is submitted, **When** the guess is correct, **Then** it scores 100, is synced to all players, and immediately transitions the room status to `"result"`.

---

### User Story 4 - Scenario 4: Result, Restart & Final Validation (Priority: P4)

Once a correct guess is made, the game moves to `"result"` status. Everyone sees the secret word, final scores, and complete guess history. The host can restart the game, returning everyone back to the lobby while preserving the player list and resetting round state.

**Why this priority**: Resolves the round and allows replayability.

**Independent Test**: Can be tested by submitting a correct guess, verifying that both players see the revealed word and scores, having the host click "Restart", and verifying that both screens return to the lobby with players preserved.

**Acceptance Scenarios**:

1. **Given** the game is in `"result"` status, **When** players view the screen, **Then** the secret word is revealed to all, and the final scoreboard displays the scores.
2. **Given** the game is in `"result"` status, **When** the host clicks "Restart Game", **Then** the room status transitions back to `"lobby"`, all scores, guesses, and canvas are cleared, and players are preserved.
3. **Given** the host restarts the game, **When** guessers poll the status, **Then** they are automatically redirected back to `/lobby`.

---

### Edge Cases

- **Empty Inputs**: Attempting to create a room, join a room, or submit a guess with empty or whitespace-only text must be rejected with validation errors.
- **Room Code Case Sensitivity**: Room codes are case-insensitive on join (e.g. `abcd` is auto-capitalized to `ABCD` and works).
- **Multi-room Isolation**: Actions in one room (e.g. drawing, guessing, starting) must have absolutely zero effect on any other active room.
- **Viewer Role Determination**: If a participant fetches a room snapshot, their role (`viewerRole`) must be resolved correctly as `"drawer"` or `"guesser"`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend MUST trim and validate `playerName` on room creation and joining, rejecting empty or whitespace-only values.
- **FR-002**: Backend MUST store the room creator's participant ID as `hostId` in the room object.
- **FR-003**: Backend MUST validate room codes on join, upper-casing inputs, and returning a 404 error if the room does not exist.
- **FR-004**: Frontend MUST poll backend room state every 2 seconds on the lobby and gameplay pages.
- **FR-005**: Frontend MUST restrict "Start Game" and "Restart Game" buttons to the host.
- **FR-006**: Frontend MUST only enable "Start Game" when there are at least 2 players in the lobby.
- **FR-007**: Backend MUST support transition to playing status, assigning `drawerId` to the host and picking the secret word deterministically using `sum(ASCII(code)) % starterWords.length`.
- **FR-008**: Backend MUST hide the secret word from guessers in the snapshot.
- **FR-009**: Backend MUST support canvas drawing updates (`POST /rooms/:code/draw`) and guess submissions (`POST /rooms/:code/guess`).
- **FR-010**: Backend MUST score correct guesses with 100 points and immediately transition room status to `"result"`.
- **FR-011**: Backend MUST support host-only room restarts (`POST /rooms/:code/restart`), resetting game state back to `"lobby"` while preserving player lists and resetting scores/guesses/canvas.
- **FR-012**: Frontend MUST automatically redirect players based on room status transitions:
  - Lobby → Game when status becomes `"playing"`.
  - Game → Lobby when status becomes `"lobby"`.

### Key Entities

- **Room**: Represents a game session. Key attributes: `code` (string), `status` (string), `hostId` (string), `participants` (list of Participants), `drawerId` (string/null), `secretWord` (string/null), `canvasData` (string), `guesses` (list of Guesses), `scores` (map of participantId to number).
- **Participant**: A player connected to a room. Key attributes: `id` (string), `name` (string), `joinedAt` (string).
- **Guess**: A submitted guess. Key attributes: `participantId` (string), `participantName` (string), `text` (string), `isCorrect` (boolean), `timestamp` (string).
- **Line**: A single vector line drawn on the canvas. Key attributes: `color` (string), `width` (number), `points` (list of `{x, y}` coordinates).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 2 players can connect, join the same lobby, and start a game in under 1 minute.
- **SC-002**: Drawings update on guesser screens within 2.5 seconds of the drawer painting (limited by the 2s polling interval).
- **SC-003**: 100% of empty or whitespace player names and guesses are rejected.
- **SC-004**: 100% of non-host players are successfully restricted from starting or restarting a game.

## Assumptions

- **A-001**: Users have a stable internet connection capable of making HTTP requests every 2 seconds.
- **A-002**: The backend runs in-memory only; restarting the backend service resets all active rooms and players.
- **A-003**: A single round is played per game session. Drawer rotation and multiple rounds are out of scope.
