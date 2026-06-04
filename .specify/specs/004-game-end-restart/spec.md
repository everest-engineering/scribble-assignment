# Feature Specification: Round End and Game Restart

**Feature Branch**: `004-game-end-restart`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round Results Visibility (Priority: P1)

All players view the final outcome of the round once it concludes.

**Why this priority**: Core feedback loop for the game; ensures fairness and closure for participants.

**Independent Test**: Can be tested by ending an active round and verifying that all participants (drawer and guessers) see the correct word, final scores, and full guess history.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the results are displayed, **Then** all players (including guessers) can see the secret word.
2. **Given** a round has ended, **When** the results are displayed, **Then** all players see the final scores of all participants.
3. **Given** a round has ended, **When** the results are displayed, **Then** all players can see the complete guess history for that round.

---

### User Story 2 - Host Game Restart (Priority: P1)

The host can transition the room back to the lobby state to start a new round.

**Why this priority**: Essential for game replayability without requiring players to join a new room.

**Independent Test**: Can be tested by having the host click a "Restart" button on the results screen and verifying that all players are returned to the lobby.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed, **When** the host clicks "Restart Game", **Then** the room status transitions back to "lobby".
2. **Given** a game restart, **When** players are returned to the lobby, **Then** the list of participants is preserved from the previous round.
3. **Given** a game restart, **When** players are returned to the lobby, **Then** all round-specific state (secret word, canvas data, guess history) is cleared.

---

### User Story 3 - Role-Based Result Actions (Priority: P2)

The UI provides appropriate actions based on the player's role at the end of a round.

**Why this priority**: Prevents unauthorized participants from restarting the game.

**Independent Test**: Can be tested by verifying that only the host sees the "Restart Game" button, while other players see a "Waiting for host..." message.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the host views the results, **Then** they see a "Restart Game" button.
2. **Given** a round has ended, **When** a non-host participant views the results, **Then** they do not see a "Restart Game" button.

---

### User Story 4 - Manual Round Termination (Priority: P2)

The host can manually end a round at any time.

**Why this priority**: Provides the host with control over the game flow, especially useful if players are stuck or if the drawer is inactive.

**Independent Test**: Can be tested by having the host click an "End Round" button during an active round and verifying the room status transitions to 'ended'.

**Acceptance Scenarios**:

1. **Given** an active round, **When** the host clicks "End Round", **Then** the round ends immediately and results are displayed for all players.
2. **Given** an active round, **When** a non-host participant views the UI, **Then** they do not see an "End Round" button.

---

### User Story 5 - Automatic Round Completion (Priority: P1)

The system automatically ends the round once all guessers have identified the secret word.

**Why this priority**: Ensures optimal game pace by skipping unnecessary waiting time once the objective is met by all participants.

**Independent Test**: Can be tested by having all guessers in a room submit the correct word and verifying the round status transitions to 'ended' immediately upon the final correct guess.

**Acceptance Scenarios**:

1. **Given** an active round with multiple guessers, **When** the final guesser submits the correct word, **Then** the round ends immediately.
2. **Given** an active round, **When** some but not all guessers have identified the word, **Then** the round remains active.

### Edge Cases

- What happens if a player leaves the room while the results screen is displayed? (Assumption: Participant list is updated as usual).
- What happens if the host leaves during the results screen? (Assumption: Existing logic handles room closure or host migration).
- **Conflict Resolution**: In the event of concurrent actions (e.g., host clicks "End Round" while a guess is processing), a "First to Server" strategy applies. The first request to successfully update the room status to 'ended' wins; subsequent requests will be handled as 400 Bad Request (invalid state transition) and ignored by the UI.
- **Player Churn**: If a player leaves during an active round, they are removed from the room, but the automatic round completion trigger (all guessers correct) is NOT recalculated until a new guess is submitted. If a round becomes "stuck" due to churn, the host MUST use the "End Round" action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition the room status to 'ended' when a round concludes. Triggers for conclusion:
  - All active guessers successfully guess the secret word.
  - The host manually triggers an "End Round" action.
- **FR-002**: System MUST reveal the `currentWord` to all participants when the room status is 'ended'.
- **FR-003**: System MUST display the final `scoreboard` to all participants on the results screen.
- **FR-004**: System MUST display the full `guessHistory` to all participants on the results screen.
- **FR-005**: System MUST provide a "Restart Game" action available ONLY to the host on the results screen.
- **FR-006**: System MUST transition the room status back to 'lobby' upon a successful "Restart Game" action.
- **FR-007**: System MUST preserve all existing participants when transitioning from 'ended' back to 'lobby'.
- **FR-008**: System MUST clear the following state upon restart: `currentWord`, `canvasData`, `guessHistory`, and `drawerId`.
- **FR-009**: System MUST reset all player scores in the scoreboard immediately upon transitioning back to the 'lobby' status.
- **FR-010**: System MUST provide an "End Round" action available ONLY to the host while a round is active. This button MUST be rendered beside the "Exit Game" button and styled consistently with it.
- **FR-011**: The "Round Ended" summary component MUST be a modal following a vertical stack layout:
  - **Header**: "Round Ended" title using `section-kicker` style.
  - **Revealed Word**: The secret word displayed prominently (reusing the existing `secret-word` CSS class).
  - **Final Scores**: A list showing the final scores of all participants (max-height: 200px, scrollable).
  - **Guess History**: A scrollable section showing all guesses made during the round (max-height: 200px, scrollable).
  - **Footer**: A "Restart Game" button (Host only) or a "Waiting for host to restart..." message (non-hosts).
  - **Styling**: MUST use existing `panel`, `card`, and `button` CSS variables and classes for visual consistency.

- **FR-012**: System MUST automatically navigate all participants from the `GamePage` back to the lobby page (`/lobby`) immediately upon detecting the room status has transitioned back to 'lobby'.
- **FR-013**: System MUST display a non-blocking toast error notification exclusively to the host if the "End Round" or "Restart Game" API calls fail.

### Key Entities

- **Room**: Now includes a transition from 'ended' back to 'lobby'.
- **Result State**: A UI state where final round data (word, scores, history) is presented to all players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of participants can see the secret word once the round status is 'ended'.
- **SC-002**: The "Restart Game" button is visible exclusively to the host when the round is 'ended'.
- **SC-003**: Returning to the lobby via "Restart Game" takes less than 1s for the host (API round-trip latency); non-host perception is bounded by the 2s polling interval.
- **SC-004**: All participants from the previous round are present in the lobby after restart.
- **SC-005**: Canvas and guess history are confirmed empty immediately after transitioning back to 'lobby'.

## Clarifications

### Session 2026-06-04
- Q: Does the Guess History show who made the guess? → A: Yes, it now displays the player name alongside the guessed word.
- Q: Where is the "End Round" and "Restart Game" buttons are rendered? → A: "End Round" in `GamePage.tsx` button row; "Restart Game" in `RoundEndedModal.tsx` footer. (Implementation: Always use `room.isHost` for host verification).
- Q: What does the "Round Ended" summary component show? → A: Revealed word, final scores, guess history, and action buttons.
- Q: Is the "Round Ended" summary component a modal or overlay? → A: Modal.
- Q: Where is the "End Round" button rendered? → A: Beside the "Exit Game" button with similar styling.
- Q: What is the layout and styling of the "Round Ended" modal? → A: Vertical stack (Title, Word, Scores, History, Footer) using existing app styles.
- Q: How should API failures for /end and /restart be handled? → A: Show toast error to host only.
- Q: How are concurrent "end" actions resolved? → A: Latest request wins (First to server).
- Q: How does player churn affect automatic round end? → A: Round only ends manually or if remaining guess.
- Q: What are the accessibility requirements for the modal? → A: Accessibility is out of scope.
- Q: What are the mobile/tablet requirements? → A: Desktop web only; others are out of scope.
- Q: What are the height constraints for modal sections? → A: Max-height 200px per section.
- Q: How should the revealed secret word be styled? → A: Reuse existing `secret-word` CSS class.
- Q: What happens if a player joins at the transition to 'ended'? → A: Impossible; joining is prevented once round starts.
- Q: What is the styling for the "End Round" button? → A: Reuse `button--secondary` CSS class.
- Q: What is the behavior for players who join after a round has ended? → A: Join directly into Results Modal.
- Q: Is the polling frequency sufficient for < 1s restart perception? → A: Perception bounded by polling. Acceptable.

## Assumptions

- The trigger for "round has ended" includes all players guessing correctly or host manual action.
- The "host" is correctly identified by the `hostId` property in the Room model.
- Scoreboard persistence in the lobby is desired for bragging rights until the next game starts.
- **Performance**: SC-003 (< 1s latency) applies to host perception; non-host perception is bounded by the 2s polling interval.
