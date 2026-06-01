# Feature Specification: Round Results and Lobby Restart

**Feature Branch**: `004-result-restart-lobby`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-01

- Q: What should trigger the room to enter result state? → A: First correct guess — any guesser’s correct answer ends the round and shows results.
- Q: If someone joins with a valid room code while the room is on the result screen, what should happen? → A: Show results — they see the same result summary (word, scores, history).
- Q: On the result screen, should final scores show session totals or round-only points? → A: Session totals — each player’s current game total (all rounds so far).
- Q: When the first correct guess ends the round, how should participants reach the result screen? → A: Auto-navigate — all participants are taken to a dedicated result screen within ~2 seconds.
- Q: When the host restarts from the result screen, how should participants return to the lobby? → A: Auto-navigate — all participants are taken to the lobby screen within ~2 seconds.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared Round Results (Priority: P1)

After a round ends, every participant sees the same outcome summary: the secret word revealed, final scores, and the complete list of guesses from that round.

**Why this priority**: Players need a fair, transparent end-of-round view before deciding to play again.

**Independent Test**: End a round with known word, scores, and multiple guesses; open result view as drawer and guesser—both see identical word, scores, and history.

**Acceptance Scenarios**:

1. **Given** a guesser has submitted the first correct guess for the round, **When** the room transitions to result state, **Then** any participant viewing results sees the correct secret word for that round.
2. **Given** a round has ended, **When** any participant views the result state, **Then** they see each player’s session total score (sum of all rounds in the current game before restart).
3. **Given** a round has ended with multiple guesses, **When** any participant views the result state, **Then** they see the full guess history for that round (every valid guess with enough detail to understand who guessed and the outcome).
4. **Given** two participants in the same room, **When** the result state is shown, **Then** both see the same word, scores, and guess history without contradictory information.
5. **Given** the room is in result state, **When** a new player joins with a valid room code, **Then** they see the same result summary (secret word, scores, and guess history) as existing participants.

---

### User Story 2 - Result State Stays in Sync (Priority: P2)

Participants who did not trigger the end of the round still reach the result view and see up-to-date summary information without manual action.

**Why this priority**: Multiplayer requires everyone to land on results together, not only the player who ended the round.

**Independent Test**: End a round from the drawer’s session; within the normal refresh interval the guesser’s client shows the same result content.

**Acceptance Scenarios**:

1. **Given** the first correct guess has ended the round, **When** a participant waits without manually refreshing, **Then** they are automatically navigated to the dedicated result screen within approximately 2 seconds.
2. **Given** the result state is active, **When** participants view scores or history, **Then** content remains consistent across clients on subsequent automatic updates.

---

### User Story 3 - Host Restarts to a Clean Lobby (Priority: P1)

The host can start a new cycle from the result screen; all players return to the waiting lobby with the same roster, but without carryover of round-specific play data.

**Why this priority**: Restart is the bridge back to another game without forcing players to rejoin the room.

**Independent Test**: From result state with two players, host restarts; both land in lobby with same names/participants, no secret word, canvas, or prior-round guess history visible.

**Acceptance Scenarios**:

1. **Given** the room is in the result state and the acting user is the host, **When** they choose to restart, **Then** the room transitions to the waiting lobby and all participants are automatically navigated to the lobby screen within approximately 2 seconds.
2. **Given** the room is in the result state and the acting user is not the host, **When** they attempt to restart, **Then** they cannot restart and understand that only the host may do so.
3. **Given** the host has restarted from results, **When** any participant views the lobby, **Then** all previous participants are still present (no roster loss).
4. **Given** the host has restarted from results, **When** any participant views the lobby, **Then** round-specific state is cleared: secret word hidden, drawing canvas empty or absent, guess history for the ended round not shown in lobby, drawer role unset for the new cycle.
5. **Given** the host has restarted after viewing session totals on the result screen, **When** any participant views the lobby, **Then** all scores are reset to 0 for the new game cycle.

---

### Edge Cases

- What happens when a second guesser submits a correct answer after the first correct guess already ended the round? The round is already in result state; additional submissions are not accepted or do not change outcomes.
- What happens if a participant joins the room while others are on the result screen? They join successfully and see the current result summary (same word, scores, and history as everyone else).
- What happens if the host disconnects on the result screen? Guests remain on results; restart remains unavailable to non-hosts until the host returns (host transfer out of scope).
- What happens if the host restarts while a guest’s client is slow to update? Within approximately 2 seconds the guest is auto-navigated to the lobby with cleared round state, not stuck on results indefinitely.
- What happens when a round ended with zero guesses? Result still shows the word and scores (e.g., all zero); guess history is empty but present as a section.
- What happens on refresh during result state? Participant is returned to the result screen and sees the same result content for that room while it remains in result state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST transition a room to a dedicated result state immediately when any guesser submits the first correct guess for the active round; incorrect guesses, timeouts, or host-only actions alone do not trigger result state.
- **FR-002**: In the result state, the system MUST reveal the correct secret word for the ended round to all participants.
- **FR-003**: In the result state, the system MUST display each participant’s session total score (cumulative points from all rounds in the current game before restart).
- **FR-004**: In the result state, the system MUST display the complete guess history for the ended round to all participants.
- **FR-005**: The system MUST present the same word, scores, and guess history to every participant in the room while in result state.
- **FR-006**: The system MUST synchronize result state to all participants within approximately 2 seconds without requiring manual refresh.
- **FR-007**: The system MUST allow only the host to initiate restart from the result state.
- **FR-008**: The system MUST prevent non-host participants from restarting the game from the result state.
- **FR-009**: Upon host restart, the system MUST move all participants to the waiting lobby and automatically navigate every participant to the lobby screen within approximately 2 seconds.
- **FR-010**: Upon host restart, the system MUST preserve the participant roster (no removal of players who were in the room unless they disconnected per room lifecycle rules).
- **FR-011**: Upon host restart, the system MUST clear round-specific state, including secret word visibility, canvas drawing, active drawer assignment, and guess history from the ended round.
- **FR-012**: Upon host restart, the system MUST reset all participant scores to 0 for the new lobby cycle.
- **FR-013**: After restart, the system MUST allow the host to start a new game again when lobby start conditions are met (e.g., minimum player count).
- **FR-014**: When the room is in result state, the system MUST allow new players who join with a valid room code to view the same result summary (secret word, scores, and guess history) as existing participants.
- **FR-015**: When the room enters result state, the system MUST automatically navigate every participant to the dedicated result screen within approximately 2 seconds without requiring manual navigation.

### Key Entities

- **Result state**: A room phase after a round ends where outcomes are read-only and fully visible to all participants.
- **Final scores**: Each participant’s session total points at result time (sum across all rounds in the current game before restart).
- **Round guess history**: The immutable record of guesses for the ended round, shown in full on the result screen.
- **Restart**: A host action that ends result state and returns the room to lobby with preserved players and cleared round data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-client tests after a round ends, 100% of participants see the same secret word on the result screen.
- **SC-002**: In two-client tests, 100% of participants see matching final scores and matching guess history entries on the result screen.
- **SC-003**: At least 95% of participants reach the result view within 3 seconds of round end under normal network conditions without manual refresh.
- **SC-004**: In tests, 100% of non-host restart attempts from result state are blocked.
- **SC-005**: After host restart in two-client tests, 100% of participants are auto-navigated to the lobby within 3 seconds with the same participant count as before restart.
- **SC-006**: After host restart, 100% of verification checks confirm no secret word, canvas marks, or prior-round guess list in the lobby, and all scores show 0.
- **SC-007**: After host restart, the host can start a new game when minimum players are present, in 100% of structured test runs.

## Assumptions

- A round ends and result state begins when any guesser submits the first correct guess for that round (case-insensitive, trimmed comparison per gameplay rules).
- Room create/join, host role, and lobby start rules come from the room feature.
- Drawing, guessing, and scoring during the round come from the gameplay feature; this feature consumes their outputs for display.
- Result screen shows session total scores; host restart resets all scores to 0 for a fresh game. Preserving totals across restarts is out of scope.
- Result and lobby transitions follow the product lifecycle: waiting → active round → result → waiting (after restart).
- Automatic sync about every 2 seconds applies to result and post-restart lobby views, consistent with other multiplayer screens.
- Join during result state is allowed; late joiners see outcomes but cannot restart (host only). This does not conflict with `001-host-join-rooms` FR-015, which blocks join only during an active **drawing** round, not during **result**.
