# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Feature Group 4: Result, Restart & Final Validation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round Results and Word Reveal (Priority: P1)

As a participant (drawer or guesser) in a Scribble room, when a guesser submits the correct guess, I want the game to immediately transition to a result screen. On this screen, I want to see the secret word revealed, the participant who guessed the word correctly clearly highlighted, the final scoreboard, and the complete log of all guess submissions.

**Why this priority**: It provides immediate feedback to players that the game has ended, reveals the answer, and displays final standings. It is the core feedback loop for the end of a round.

**Independent Test**:
1. Join a room as Alice (host/drawer) and Bob (guesser).
2. Start the game.
3. Bob submits the correct guess.
4. Verify both screens immediately transition to the results state within 2 seconds via polling.
5. Verify both screens display the revealed secret word, highlight Bob as the correct guesser, show Bob's score as 100, and show the full guess history log.

**Acceptance Scenarios**:

1. **Given** a room in the `in-game` status, **When** a guesser submits the correct word, **Then** the room status transitions to `result`, the round ends, and the secret word is revealed.
2. **Given** a room in the `result` status, **When** any participant polls for room updates, **Then** they receive the updated room snapshot containing the revealed secret word and the name of the correct guesser.
3. **Given** a room in the `result` status, **When** any player views the screen, **Then** they see a scoreboard sorted by scores descending, the complete guess history in chronological order, and the correct guesser's identity.

---

### User Story 2 - Host-Initiated Game Restart (Priority: P2)

As the host of the Scribble room, after a game has ended and results are displayed, I want to click a "Restart" button to return all connected players to the lobby so we can start another game with the same group of players. As a non-host participant, I should not see the "Restart" button, but I should be redirected back to the lobby automatically once the host restarts the game.

**Why this priority**: It enables players to play multiple times without having to leave, recreate, and rejoin a new room, facilitating a continuous play experience.

**Independent Test**:
1. With the game in the `result` state, verify Alice (host) sees a "Restart Game" button.
2. Verify Bob (non-host) does not see any restart button, only a message indicating they are waiting for the host.
3. Alice clicks **Restart Game**.
4. Verify both Alice and Bob are redirected back to the room lobby screen (`/lobby`).
5. Verify the participant list is preserved, but all scores are reset to 0, and round-specific states (drawer, secret word, guess history) are cleared.

**Acceptance Scenarios**:

1. **Given** a room in the `result` status, **When** the host sends a restart request, **Then** the room status transitions to `lobby`, scores are reset, and round-specific state is cleared.
2. **Given** a room in the `result` status, **When** a non-host player attempts to call the restart API endpoint, **Then** the request is rejected with a forbidden error.
3. **Given** a non-host player in the `result` status page, **When** the room polls and detects status is back to `lobby`, **Then** the client automatically redirects the player to the lobby page.

---

### Edge Cases

- **Host Disconnection**: If the host disconnects while the room is on the result screen, the remaining players should still be able to view the final results. Since host migration is not part of the active scope, the room remains in the result state until closed or when a player leaves.
- **Late Submissions**: If a guesser submits a guess exactly as another guesser's correct guess is being processed, the first correct guess processed by the server transitions the state to `result`. Subsequent guesses submitted after the state transition MUST be rejected with a guard indicating the game has ended.
- **Preservation of Participants**: Any players who were in the room when the round ended must remain in the room in the lobby after restart, unless they manually click "Exit Game" or leave the lobby.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-016 (Single Game Termination & Race Safety)**: The ONLY transition from `"in-game"` to `"result"` status occurs on the first processed correct guess in backend `submitGuess` service function inside `roomStore.ts`. Once the room status transitions to `"result"`, the backend MUST lock state updates and reject any further guess submissions with a `400` status code and error code `"GAME_ALREADY_ENDED"`. This prevents race conditions from concurrent correct guesses and ensures subsequent guesses are not silently ignored but return explicit API failures.
- **FR-017 (Winner Uniqueness)**: The backend MUST set `correctGuesserId` ONLY on the first processed correct guess. Subsequent correct guesses arriving concurrently or after the state transition MUST NOT change the `correctGuesserId` or award any score.
- **FR-018 (Snapshot Consistency)**: In the `RoomSnapshot` returned by the backend:
  - If `status === "result"`, the secret word MUST be unmasked and visible to all participants, and `correctGuesserId` MUST be included for everyone.
  - If `status === "lobby"`, the `correctGuesserId` MUST be returned as `null` or `undefined`.
- **FR-019**: The system MUST display the final scoreboard (sorted by score descending) and the chronological guess history of the completed round to all participants on the result screen.
- **FR-020**: The system MUST only permit the host of the room to trigger a restart. Restart requests from non-host participants MUST be rejected.
- **FR-021 (Atomic Hard Reset & Idempotent Restart)**: Game restart MUST happen atomically in a single backend function `restartRoom()` in `roomStore.ts`. The restart action MUST be idempotent:
  - If the room status is NOT `"result"`, the backend MUST reject the request with error code `"GAME_NOT_IN_RESULT"` and perform no mutations.
  - If the status is `"result"`, the backend resets all round-scoped fields: `status` set to `"lobby"`, `roundState` set to `undefined`, `guessHistory` set to `[]`, `correctGuesserId` set to `null`, and each `participant.score` reset to `0`.
- **FR-022**: Upon restart, the system MUST preserve all current room participants.
- **FR-023**: The system MUST synchronize the result and restart state transitions to all participants through the existing HTTP polling mechanism.
- **FR-024 (Frontend Polling Reactivity)**: The frontend client MUST NOT compute or decide the game results locally. It MUST poll the backend at a 2-second interval and dynamically render the Results UI or redirect to `/lobby` solely in reaction to the `status` changes returned in the `RoomSnapshot`.
- **FR-025**: The `Room` and `RoomSnapshot` backend model definitions and their corresponding Zod schemas MUST be updated to support the new `"result"` status, include the optional/nullable `correctGuesserId` property, and support the `"GAME_ALREADY_ENDED"` error code to prevent data from being stripped at the API boundary.
- **FR-026**: All API endpoint schemas for room queries, guess submissions, and restart requests MUST validate the updated room snapshot payload structure containing the new status and correct guesser properties.

### Key Entities *(include if feature involves data)*

- **Room**: Represents the game room. Expanded with:
  - `status`: Transitioned to `"result"` at the end of a round.
  - `correctGuesserId`: Stores the ID of the participant who guessed the word correctly (null if none).
- **Participant**:
  - `score`: Persisted on the participant object, but reset to `0` upon restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-006**: 100% of participants receive the result screen update showing the revealed secret word and final scores within 2 seconds of the correct guess.
- **SC-007**: 100% of connected participants are successfully returned to the lobby screen within 2 seconds of the host clicking the restart button.
- **SC-008**: 100% of non-host restart requests are rejected by the backend API and do not alter the room state.
- **SC-009**: All round-specific states (scores reset to 0, empty guess history, no drawer assigned, no secret word) are verified as successfully cleared on the backend after a restart action.

## Assumptions

- **Single Round Scope**: A game session consists of only a single round of drawing and guessing. Once the word is guessed, the game is over until restarted.
- **Lobby Redirection**: The frontend client will detect the transition from `result` status back to `lobby` status via HTTP polling and automatically perform a route change/redirect back to `/lobby`.
- **In-Memory Volatility**: Since there is no persistent database, all scores and status changes are stored in memory and cleared if the Node process restarts.
