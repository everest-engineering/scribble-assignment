# Feature Specification: Round Results and Game Restart

**Feature Branch**: `004-round-results-restart`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round Ends and Results Are Displayed (Priority: P1)

After a round ends, the room enters a `results` state where every participant can see the secret word, each player's final score, and the full chronological guess history.

**Why this priority**: This is the payoff of the gameplay loop; players need to see the outcome of their guesses and the correct answer.

**Independent Test**: Can be tested by ending a round (either by the first correct guess or host action) and verifying all players see the results screen with word, scores, and history.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** any guesser submits the correct word, **Then** the room state transitions to `results` and all players see the secret word, final scores, and full guess history.
2. **Given** a round is active, **When** the host manually ends the round, **Then** the room state transitions to `results` and all players see the secret word, final scores, and full guess history.
3. **Given** the room is in `results` state, **When** a player views the screen, **Then** they see the secret word prominently displayed.
4. **Given** the room is in `results` state, **When** a player views the screen, **Then** they see a scoreboard showing every participant's score from the just-completed round.
5. **Given** the room is in `results` state, **When** a player views the screen, **Then** they see the complete guess history in chronological order, including each guess text and submitter.

---

### User Story 2 - Host Restarts Game (Priority: P2)

From the results screen, the host can restart the game, returning all players to the lobby while preserving the player list and host, and clearing all round-specific state.

**Why this priority**: Restart enables replayability without re-creating the room, but the game is technically complete after viewing results.

**Independent Test**: Can be tested by triggering restart from the results screen and verifying all clients transition to the lobby with players intact and round state cleared.

**Acceptance Scenarios**:

1. **Given** the room is in `results` state and the viewer is the host, **When** the host triggers restart, **Then** the room state transitions to `lobby` and all players are returned to the lobby screen.
2. **Given** the room has just been restarted, **When** a player views the lobby, **Then** they see the same player list and host as before the round started.
3. **Given** the room has just been restarted, **When** the system checks round state, **Then** all round-specific data (secret word, scores, guess history, canvas strokes, drawer assignment) has been cleared.
4. **Given** the room is in `results` state and the viewer is not the host, **When** they attempt to trigger a restart, **Then** the action is rejected with a clear error.

---

### Edge Cases

- What happens if the host leaves during the results screen? → Room is destroyed; remaining participants are returned to the home screen.
- What happens if a non-host attempts to end the round or restart? → Rejected with a clear error.
- What happens if a player refreshes during the results screen? → They must re-join the room; joining a room in `results` state is rejected (joining is only allowed in `lobby`).
- What happens if a player submits a guess while the round is ending or in results state? → Rejected because the room is not in `playing` state.
- What happens if the host restarts while a player is viewing results? → On the next poll, the player sees the lobby.
- What happens if all non-drawer participants have already left before the round ends? → The round can only be ended by the host manually; there are no guessers left to trigger the automatic end.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST transition the room to `results` state when any guesser submits the correct word.
- **FR-002**: The host MUST be able to manually end an active round at any time, transitioning the room to `results` state.
- **FR-003**: In `results` state, the system MUST reveal the secret word to all participants.
- **FR-004**: In `results` state, the system MUST display each participant's final score for the completed round.
- **FR-005**: In `results` state, the system MUST display the complete guess history in chronological order.
- **FR-006**: Only the host MUST be able to trigger a restart from the `results` state.
- **FR-007**: On restart, the system MUST transition the room to `lobby` state.
- **FR-008**: On restart, the system MUST preserve the participant list and host identity.
- **FR-009**: On restart, the system MUST clear all round-specific state: secret word, scores, guess history, canvas strokes, and drawer assignment.
- **FR-010**: The system MUST reject new player joins when the room is in `results` state.
- **FR-011**: The system MUST reject round-end or restart actions from non-host participants.

### Key Entities *(include if feature involves data)*

- **Room**: Updated attributes: `status` now supports `results` in addition to `lobby` and `playing`. In `results` state, existing fields `currentWord`, `scores`, and `guessHistory` collectively represent the round result snapshot.
- **Participant**: `score` is preserved through the results phase but reset to 0 on restart.
- **RoundResult**: Conceptual snapshot of a completed round. Attributes: `secretWord` (string), `scores` (map of participant ID to integer), `guessHistory` (ordered list of `GuessEntry`).
- **RoomSnapshot**: Updated attributes: `status` may be `results`; when `results`, additional fields `currentWord` (revealed to all), `scores`, and `guessHistory` are included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All participants see the secret word within 3 seconds of the round ending.
- **SC-002**: The scoreboard in results state accurately reflects every participant's score from the completed round.
- **SC-003**: The guess history is complete, ordered correctly, and visible to all participants in results state.
- **SC-004**: The host can restart the game from the results screen in one action.
- **SC-005**: After restart, all participants see the lobby with the same player list and host within 3 seconds.
- **SC-006**: After restart, all round-specific state (word, scores, history, canvas, drawer) is fully cleared.
- **SC-007**: 0% of non-host restart or round-end attempts succeed.

## Assumptions

- The room enters `results` state only from `playing` state.
- Participants do not gain or lose points after the room enters `results` state.
- The existing polling mechanism (~2 seconds) is used to sync the `results` state to all clients.
- There is no game-over screen beyond the results view; the results view serves as the end-of-round summary.
- Player reconnection (browser refresh) during `results` state requires re-joining, which is only allowed in `lobby`.
- The automatic round-end condition (first correct guess submitted by any guesser) is evaluated on each guess submission.

## Out of Scope

- Multiple rounds with automatic progression.
- Drawer rotation.
- Timers for round duration.
- Persistent leaderboard across multiple games.
- Animations or confetti for results screen.
- Allowing new players to join during the results phase.

## Clarification Q&A

| # | Category | Question | Answer |
|---|----------|----------|--------|
| 1 | Functional Scope & Behavior | How is the round end triggered if not all guessers guess correctly? | The host can manually end the round at any time. |
| 2 | Domain & Data Model | Should the results screen be a distinct `status` value or a flag within `playing`? | Distinct `status: "results"` to clearly separate game phases and enforce join/guess restrictions. |
| 3 | Integration & External Dependencies | Should the round-end and restart actions reuse the existing room snapshot polling endpoint? | Yes — extend the room snapshot with `status: "results"` and include result fields. Restart is triggered via a dedicated endpoint. |
| 4 | Edge Cases & Failure Handling | What happens if the last non-drawer participant leaves while the round is active? | The automatic end condition cannot be met; the host must manually end the round. |
| 5 | Domain & Data Model | In `results` state, should the revealed word be exposed via a new `secretWord` field or by reusing `currentWord`? | Reuse `currentWord` — populate it for all viewers when `status === "results"`. |
| 6 | Edge Cases & Failure Handling | Should idle cleanup also delete `results` rooms after inactivity? | Yes — apply the same 10-minute idle cleanup to `results` rooms for operational consistency. |
| 7 | Interaction & UX Flow | Should the results view use a new route or conditional rendering within the existing `/game` page? | Reuse the `/game` route — conditionally render results UI within `GamePage` when `status === "results"`. |
| 8 | Interaction & UX Flow | Should the drawing canvas remain visible during `results` state? | Yes — keep the canvas visible alongside the word, scores, and history. |
| 9 | Domain & Data Model | Should the backend add a dedicated `resultScreen` object or reuse existing round fields? | Reuse existing fields (`currentWord`, `scores`, `guessHistory`) with `status === "results"` as the guard. |
