# Feature Specification: Scribble Game Completion

**Feature Branch**: `sdd-scribble-assignment`
**Created**: 2026-06-03
**Status**: Draft
**Input**: Complete the Scribble brownfield assignment by extending the starter room flow into a one-round drawing and guessing game while maintaining Spec Kit discipline.

## Specification Iterations

This specification intentionally represents the minimum four assignment specify iterations:

1. **Iteration 1 - Room setup and lobby**: host tracking, validation, room isolation, polling, and start-game preconditions.
2. **Iteration 2 - Game start and drawer flow**: player name validation, drawer assignment, deterministic word selection, and drawer-only word visibility.
3. **Iteration 3 - Gameplay interaction**: drawing, clear canvas, guess submission, synced history, and scoring.
4. **Iteration 4 - Result, restart, and final validation**: shared result state, restart to lobby, validation notes, and reflection readiness.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host and Join a Lobby (Priority: P1)

As a player, I want to create or join a room with a valid name and code so that a group can gather in a shared lobby before playing.

**Why this priority**: The rest of the game depends on a reliable room and participant model.

**Independent Test**: Two browser sessions can create and join the same room, see the same participant list through polling, and confirm that a different room remains isolated.

**Acceptance Scenarios**:

1. **Given** a player enters a non-empty name, **When** they create a room, **Then** the room is created with a unique code, the player is added as the host, and the lobby shows that participant.
2. **Given** a second player enters a valid name and existing room code, **When** they join the room, **Then** they are added to that room and the host sees them after polling without using manual refresh.
3. **Given** a player submits an empty or whitespace-only name, **When** they create or join a room, **Then** the action is rejected with clear feedback and no participant is added.
4. **Given** a player enters an empty, malformed, or unknown room code, **When** they try to join, **Then** the action is rejected with clear feedback.
5. **Given** two separate rooms exist, **When** participants join each room, **Then** each room shows only its own participants.
6. **Given** a lobby has fewer than two players, **When** the host tries to start, **Then** the start action is unavailable or rejected with clear feedback.
7. **Given** a lobby has at least two players, **When** a non-host tries to start, **Then** the action is unavailable or rejected and the room remains in the lobby.

---

### User Story 2 - Start the Game and Assign Drawer (Priority: P2)

As the host, I want to start a one-round game so that one player becomes the drawer and the other players can guess without seeing the secret word.

**Why this priority**: The game cannot proceed until roles, word selection, and viewer-specific visibility are correct.

**Independent Test**: With two players in a lobby, the host starts the game; all players enter the active game state; the drawer is clearly identified; only the drawer sees the secret word.

**Acceptance Scenarios**:

1. **Given** a lobby with at least two players, **When** the host starts the game, **Then** the room becomes active and all current players have score 0.
2. **Given** the game starts, **When** drawer assignment occurs, **Then** the host or first player is assigned as the drawer for this single round.
3. **Given** the game starts, **When** the secret word is selected, **Then** it is selected deterministically from the starter word list.
4. **Given** the active room is viewed by the drawer, **When** the drawer loads the game screen, **Then** the secret word is visible to that drawer.
5. **Given** the active room is viewed by a guesser, **When** the guesser loads the game screen, **Then** the secret word is not visible to that guesser.

---

### User Story 3 - Draw and Guess During Gameplay (Priority: P3)

As players in an active round, I want the drawer to draw and guessers to submit guesses so that the group can play one round and produce scores.

**Why this priority**: Drawing, guessing, history, and scoring are the core interactive game loop.

**Independent Test**: The drawer can draw and clear; guessers can submit invalid, incorrect, and correct guesses; all players see synced drawing, guess history, and score updates through polling.

**Acceptance Scenarios**:

1. **Given** a room is active and the viewer is the drawer, **When** the drawer draws on the canvas, **Then** the drawing is visible on the drawer screen and becomes visible to guessers after polling.
2. **Given** a room is active and the viewer is the drawer, **When** the drawer clears the canvas, **Then** the drawing is cleared for all players after polling.
3. **Given** a room is active and the viewer is a guesser, **When** the guesser submits an empty or whitespace-only guess, **Then** the guess is rejected with clear feedback and no history entry is added.
4. **Given** a room is active and the viewer is a guesser, **When** the guesser submits an incorrect trimmed guess, **Then** the guess is added to shared history and the guesser's score remains unchanged.
5. **Given** a room is active and the viewer is a guesser, **When** the guesser submits the correct word using any letter casing, **Then** the guess is marked correct and the guesser's score increases by 100.
6. **Given** the viewer is the drawer, **When** they try to submit a guess, **Then** the action is unavailable or rejected.

---

### User Story 4 - Show Results and Restart (Priority: P4)

As players after a round ends, I want to see the final result and let the host restart to the lobby so that the game can be reviewed and reset cleanly.

**Why this priority**: The assignment requires a complete one-round flow with result and restart validation.

**Independent Test**: After a correct guess ends the round, all players see the correct word, final scores, and full guess history; host restart returns everyone to the lobby with players preserved and round state cleared.

**Acceptance Scenarios**:

1. **Given** a guesser submits the correct word, **When** the round ends, **Then** the room enters result state.
2. **Given** the room is in result state, **When** any player views the result, **Then** they see the correct word, final scores, and full guess history.
3. **Given** the room is in result state, **When** a non-host tries to restart, **Then** the action is unavailable or rejected.
4. **Given** the room is in result state, **When** the host restarts, **Then** all players return to the lobby, participants remain, and drawer, secret word, drawing, guesses, scores, and result state are cleared.
5. **Given** the host has restarted, **When** players view the lobby, **Then** the room is ready to start another single-round game under the same start preconditions.

## Assignment Feature Group *(mandatory for Scribble lab)*

- **Primary groups**: All four assignment groups are covered in this feature spec.
- **Prior groups that must remain functional**: Each later group must preserve earlier room creation, joining, polling, host, drawer, and validation behavior.
- **Out-of-scope items intentionally excluded**: WebSockets, databases, authentication, sessions, deployment, Docker, new state-management libraries, new routing libraries, multiple rounds, drawer rotation, timers, countdowns, bonuses, custom word packs, spectator mode, room moderation, room passwords, invite links, and starter rewrites.

## Edge Cases

- A player submits a name containing only spaces.
- A player submits a room code containing spaces or lowercase letters.
- A player tries to join a room that does not exist.
- A player tries to start a room with one participant.
- A non-host tries to start or restart.
- A player views a room snapshot without a recognized participant id.
- A guesser submits a guess with leading/trailing spaces.
- A guesser submits the correct word with different letter casing.
- A drawer attempts to submit a guess.
- A guess arrives after the round is already in result state.
- Drawing is cleared when no drawing exists.
- Restart is requested while the room is not in result state.
- Two rooms have similar activity at the same time and must not share participants, guesses, drawings, scores, or result state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a room with a unique code and add the creator as the host participant.
- **FR-002**: The system MUST trim player names and reject empty or whitespace-only names with clear feedback.
- **FR-003**: The system MUST reject empty, malformed, or unknown room codes with clear feedback.
- **FR-004**: The system MUST keep rooms isolated so participants and game state from one room never appear in another room.
- **FR-005**: The lobby MUST refresh room snapshots by polling about every 2 seconds.
- **FR-006**: Only the host MUST be able to start a game, and only when at least two participants are present.
- **FR-007**: Starting a game MUST set the room to active state and initialize all participant scores to 0.
- **FR-008**: Starting a game MUST assign the host or first player as the drawer for the single round.
- **FR-009**: Starting a game MUST select the secret word deterministically from the starter word list.
- **FR-010**: The system MUST show the secret word only to the drawer and MUST hide it from guessers.
- **FR-011**: The drawer MUST be able to create drawing data that is synchronized to all players through polling.
- **FR-012**: The drawer MUST be able to clear the drawing, and the cleared state MUST synchronize to all players through polling.
- **FR-013**: Guessers MUST be able to submit guesses during an active round.
- **FR-014**: The system MUST trim guesses and reject empty or whitespace-only guesses with clear feedback.
- **FR-015**: Guess comparison MUST be case-insensitive.
- **FR-016**: Incorrect guesses MUST be added to shared guess history and score 0.
- **FR-017**: Correct guesses MUST be added to shared guess history, score 100 for the guessing participant, and end the round.
- **FR-018**: Result state MUST show the correct word, final scores, and full guess history to all players.
- **FR-019**: Only the host MUST be able to restart from result state.
- **FR-020**: Restart MUST return the room to lobby, preserve participants and host, and clear drawer, secret word, drawing, guess history, scores, and result state.
- **FR-021**: The app MUST provide manual validation notes for the full two-browser flow.

### Key Entities *(include if feature involves data)*

- **Room**: A shared in-memory game space identified by room code. Tracks status, host, participants, current round state, and timestamps.
- **Participant**: A player in a room. Tracks id, display name, joined time, host status through room host id, role during active game, and score.
- **Round State**: Single-round game data including drawer id, secret word, drawing data, guess history, scores, and result status.
- **Guess**: A submitted guess with participant id, participant name, displayed text, correctness flag, score delta, and timestamp.
- **Drawing**: Serializable drawing state for the current round, clearable by the drawer and viewable by all players.
- **Room Snapshot**: Viewer-specific room state returned to a participant; hides the secret word from non-drawers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two browser sessions can create and join one room, see both participants through polling within about 2 seconds, and verify a separate room remains isolated.
- **SC-002**: Empty or whitespace-only player names and invalid room codes are rejected without mutating room state.
- **SC-003**: A host can start a game only after at least two participants are present; non-hosts cannot start.
- **SC-004**: After game start, exactly one drawer is identified and only that drawer sees the secret word.
- **SC-005**: Drawer drawing and clear actions become visible to all players through polling.
- **SC-006**: Empty guesses are rejected; incorrect guesses add 0 points; correct guesses are case-insensitive and add 100 points.
- **SC-007**: A correct guess moves all players to result state showing the correct word, final scores, and full guess history.
- **SC-008**: Host restart returns all players to lobby with participants preserved and round state cleared.
- **SC-009**: Backend and frontend builds pass before submission.
- **SC-010**: Reflection notes explain starter behavior, added behavior, AI usage, tradeoffs, and validation.

## Assumptions

- The backend is allowed to lose all rooms on process restart because the assignment requires in-memory state only.
- The first starter word, `rocket`, is the deterministic secret word unless future approved spec updates define another deterministic rule.
- The room creator remains host for the life of the room.
- The first assignment version supports one active round before result/restart; multiple rounds and drawer rotation are out of scope.
- Polling every 2 seconds is acceptable for lobby, active gameplay, guess history, results, and restart synchronization.
- Drawing data can be represented as serializable stroke or point data rather than image upload or persistent storage.

