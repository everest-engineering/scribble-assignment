# Feature Specification: Room setup, lobby, and game flow

**Feature Branch**: `001-room-lobby-game-flow`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Create a feature specification file for the Scribble starter project covering room setup, the lobby experience, and the game flow."

## User Scenarios & Testing *(mandatory)*

## Specify Iterations

### Iteration 1 - Room setup and lobby

Host tracking is created with the room. Player names are trimmed and empty names are rejected with clear validation messages. Invalid joins return clear errors without losing form values. Rooms remain isolated from one another. Lobby state refreshes automatically by HTTP polling within about 2 seconds. Only the current host can start the game, and start requires at least two players.

### Iteration 2 - Game start and drawer flow

Starting a game assigns one deterministic drawer and one deterministic secret word. The drawer sees the secret word. Guessers do not see the secret word during active play.

### Iteration 3 - Gameplay interaction

The active game includes an interactive drawing canvas, drawer-only clear canvas, validated guess submission, guess history synced by polling, and deterministic scoring.

### Iteration 4 - Result, restart, and final validation

All players see the shared result state after the correct word is guessed. Host-only restart returns the same players to the lobby, clears round state, clears drawing and guesses, and resets scores.

### User Story 1 - Create room and enter lobby (Priority: P1)

A player lands on the app, creates a new room with a display name, and enters the lobby where the room code and current participants are shown.

**Why this priority**: This is the primary onboarding flow and the baseline value for any multiplayer game.

**Independent Test**: Verify that a new room can be created, the app navigates to the lobby, the room code is visible, and the creating player appears in the participants list.

**Acceptance Scenarios**:

1. **Given** the user is on the start page, **When** they enter a valid player name and submit "Create Room", **Then** a new room is created and the user is taken to the lobby page.
2. **Given** the user is in the lobby after room creation, **When** the page renders, **Then** the lobby shows the room code and the creating player as a participant.

---

### User Story 2 - Join an existing room (Priority: P2)

A second player enters the existing room by entering a player name and room code and is then taken to the same lobby view with both participants.

**Why this priority**: Supporting another player joining is necessary for multiplayer behavior and validates the room join flow.

**Independent Test**: Verify that a player can join with a valid room code, and the lobby updates to show both players.

**Acceptance Scenarios**:

1. **Given** a valid room code exists, **When** a player submits a display name and that code on the Join Room page, **Then** they are taken to the lobby page and see themselves listed.
2. **Given** the room already has participants, **When** the new player joins successfully, **Then** the lobby participant list includes the existing and new players.
3. **Given** a valid room code exists, **When** a player submits the code in lowercase, **Then** the join succeeds and the player is taken to the lobby page.

---

### User Story 3 - Refresh lobby and start game (Priority: P3)

A player in the lobby refreshes the room state to get the latest participant list, then the room host starts the game and reaches the game page.

**Why this priority**: The lobby must stay in sync while waiting for players, and the game entry point should be restricted to the host once the room is ready.

**Independent Test**: Verify that pressing "Refresh Room" updates the lobby state and that pressing "Start Game" as the host navigates to the game page only when at least two players are present.

**Acceptance Scenarios**:

1. **Given** the user is in the lobby, **When** they press "Refresh Room", **Then** the app requests the latest room snapshot and updates the participant list.
2. **Given** the host is in the lobby and the room has at least two players, **When** the host presses "Start Game", **Then** the host is taken to the game page with the same room context.
3. **Given** a non-host participant is in the lobby, **When** they attempt to start the game, **Then** they are not allowed to start until the host does.

---

### User Story 4 - Recover from invalid join / missing room (Priority: P4)

If a player enters an invalid room code or the room no longer exists, the UI shows a clear error and allows correction without losing entered values.

**Why this priority**: Error handling prevents user frustration and keeps join flow recoverable.

**Independent Test**: Verify that invalid join attempts return a visible error and preserve form state.

**Acceptance Scenarios**:

1. **Given** the player enters an invalid or expired room code, **When** they submit the Join Room form, **Then** an inline error message is displayed, the user stays on the join page, and the entered name and room code remain in the form.
2. **Given** the room was deleted or cannot be loaded, **When** the lobby or game page is reached without a valid room, **Then** the app should redirect to the start page or show an error before navigating.

---

### User Story 5 - Complete a single-round game and restart (Priority: P5)

Players complete one drawing-and-guessing round, see the correct word, winner, and all player scores, then the host restarts the room back to the lobby.

**Why this priority**: This completes the smallest useful game loop without adding multiple rounds, timers, drawer rotation, or bonus scoring.

**Independent Test**: Verify that a started game assigns one drawer, accepts guesses, detects the correct word, awards scores, shows results, and lets only the host restart the room.

**Acceptance Scenarios**:

1. **Given** the host has started a game with at least two players, **When** the game begins, **Then** one player is assigned as drawer and the remaining players can submit guesses.
2. **Given** a guesser submits the correct word, **When** the system evaluates the guess, **Then** the guess is marked correct and scoring is updated.
3. **Given** the single round has ended, **When** the results screen is shown, **Then** it displays the correct word, the winner or highest-scoring player, and all player scores.
4. **Given** the results screen is shown, **When** the host selects "Restart Game", **Then** the same players return to the lobby with drawing data, guesses, and scores reset.
5. **Given** a non-host player is on the results screen, **When** they view restart controls, **Then** they cannot restart the game.

---

### Edge Cases

- Empty display names are rejected after trimming on Create Room and Join Room.
- Only the current host can start the game, and the room must have at least two players before start is permitted.
- Direct navigation to `/lobby` or `/game` without room state redirects to the start page.
- Browser refresh loses frontend room session state, and the user must rejoin from scratch.
- Backend errors during room refresh display a retryable lobby error state.
- Lowercase room codes are normalized to uppercase.
- The Exit Game button returns the user to the lobby and preserves the current room snapshot in frontend state.
- If the host leaves or loses their session, host role transfers automatically to the oldest remaining player.
- Restart controls are shown on the results screen only.
- Rooms are isolated; actions in one room must not affect participants, drawing, guesses, scores, or status in another room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new room by providing a non-empty trimmed player name.
- **FR-002**: System MUST generate a room code and return a room session containing participant identity and room snapshot.
- **FR-003**: System MUST allow a second player to join an existing room using a room code and non-empty trimmed display name.
- **FR-004**: System MUST show the lobby page with the room code, current participant list, and room status.
- **FR-005**: System MUST allow the lobby to refresh room state so the participant list can update while waiting.
- **FR-006**: System MUST allow a lobby user to enter the game page while preserving the current room context.
- **FR-007**: System MUST handle invalid room join attempts with a clear user-facing error message.
- **FR-008**: System MUST redirect or block access to lobby/game pages when no valid room session exists.
- **FR-009**: System MUST preserve room session state in the frontend between lobby, game, and results pages during the current browser session.
- **FR-010**: System MUST keep the runtime scope limited to in-memory rooms and temporary session state; persistent storage is out of scope.
- **FR-011**: System MUST normalize room codes to uppercase and treat room code input as case-insensitive.
- **FR-012**: System MUST preserve the entered player name and room code when a join attempt fails due to an invalid room.
- **FR-013**: System MUST assign the room creator as the initial host and allow only the current host to start the game.
- **FR-014**: System MUST require at least two players in the room before the host may start the game.
- **FR-015**: System MUST include a single-round game lifecycle with drawer assignment, guess submission, correct word detection, scoring, results display, and restart.
- **FR-016**: System MUST NOT include multiple rounds, drawer rotation, timers, or bonus scoring in this feature.
- **FR-017**: System MUST reset drawing data, guesses, and scores to their initial values when the host restarts the game.
- **FR-018**: System MUST keep the same players in the room when the host restarts the game and return the room to the lobby state.
- **FR-019**: System MUST allow only the host to restart the game.
- **FR-020**: System MUST treat browser refresh as losing frontend room session state; the user must rejoin from scratch.
- **FR-021**: System MUST transfer host role to the oldest remaining player if the current host leaves or loses their session.
- **FR-022**: System MUST show the correct word, winner or highest-scoring player, and all player scores on the results screen.
- **FR-023**: System MUST show restart controls on the results screen only.
- **FR-024**: System MUST automatically poll lobby room state by HTTP within about 2 seconds while the user remains in the lobby.
- **FR-025**: System MUST keep room state isolated so participants, status, drawing, guesses, and scores in one room do not affect any other room.
- **FR-026**: System MUST select the drawer and secret word deterministically when the host starts the game.
- **FR-027**: System MUST reveal the active secret word only to the drawer during active play and to all players only after results are reached.
- **FR-028**: System MUST provide an interactive drawing canvas and allow only the drawer to update or clear the drawing.
- **FR-029**: System MUST validate guess submission by trimming text and rejecting empty guesses.
- **FR-030**: System MUST sync drawing, guess history, scores, and result state by HTTP polling.
- **FR-031**: System MUST use deterministic scoring when a correct guess is submitted.

### Key Entities *(include if feature involves data)*

- **Room**: Represents an active game room with a code, host identity, a list of participants, and a current status snapshot.
- **Participant**: Represents a connected player with an identifier, display name, and a current player role in the room.
- **Room Session**: Represents the current player's browser-local membership in a room, including `participantId` and the latest `room` snapshot; this session state is temporary and does not survive a full browser refresh.
- **Room Snapshot**: Represents the viewable room state for a participant, including participants, code, host identity, drawing, guesses, scores, result state, and progress metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a room and reach the lobby page with the room code visible within one attempt.
- **SC-002**: A second user can join the same room by code and see their name appear in the lobby participant list.
- **SC-003**: Lobby refresh updates the participant list without losing the current room or participant session.
- **SC-004**: A user can navigate from lobby to game page and return to lobby without losing the room context.
- **SC-005**: Invalid room joins display a clear error message and allow the user to correct the input.
- **SC-006**: Room codes entered in lowercase are accepted and normalized to uppercase on join.
- **SC-007**: Invalid join attempts preserve the entered player name and room code.
- **SC-008**: Only the current host can start the game when at least two players are present.
- **SC-009**: The single-round game flow includes drawer assignment, guess submission, correct word detection, scoring, result display, and restart controls.
- **SC-010**: A full browser refresh clears frontend room session state and requires the user to rejoin from scratch.
- **SC-011**: Restart returns the same players to the lobby with drawing data, guesses, and scores reset.
- **SC-012**: If the host leaves or loses their session, the oldest remaining player becomes host.
- **SC-013**: Lobby participant changes appear automatically within about 2 seconds without manual refresh.
- **SC-014**: The drawer can see the secret word during active play, and guessers cannot.
- **SC-015**: Drawing updates, cleared canvas state, guess history, scores, and results sync to all players by polling.
- **SC-016**: Separate rooms remain isolated throughout lobby, game, result, and restart flows.

## Clarifications

### Session 2026-05-30

- Q: Should blank player names be rejected client-side or normalized to "Player"? → A: Trim player names and reject empty values with clear validation messages.
- Q: Should game start require a minimum number of participants or host permission? → A: Only the room creator/host can start the game, and the room must have at least two players before starting.
- Q: Should lobby refresh be automatic or manual? → A: Lobby refresh is user-initiated via a "Refresh Room" action only; no background polling is required for this feature.
- Q: Is room membership state persisted across browser refreshes? → A: No. Browser refresh loses frontend room session state, and the user must rejoin from scratch.
- Q: Should drawer assignment, guessing evaluation, scoring, and result lifecycle be covered in this feature? → A: Partially. Include a single-round lifecycle with drawer assignment, guess submission, correct word detection, scoring, results, and restart; exclude multiple rounds, drawer rotation, timers, and bonus scoring.
- Q: What does restart behavior mean in the current flow? → A: Host-only restart returns the same players to the lobby, clears drawing data and guesses, and resets scores to zero.
- Q: What happens if the host refreshes, leaves, or loses their session? → A: Refresh loses the current client's room session. If the host leaves or loses their session, host role transfers automatically to the oldest remaining player.
- Q: What should the results screen show and where should restart controls appear? → A: Results show the correct word, winner or highest-scoring player, and all player scores. Restart controls appear on the results screen only.
- Q: How should the feature work be sequenced? → A: Use four specify iterations: room setup/lobby, game start/drawer flow, gameplay interaction, and results/restart/final validation.

## Relevant Files

- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/routes/index.tsx`
