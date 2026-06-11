# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation"

## Clarifications

### Session 2026-06-11

- Q: What is the room state lifecycle for multi-round play? → A: Two-phase finish: `playing` → `round_end` (results view) → `lobby` (host clicks Back to Lobby) → `playing` (new round). Each state has its own view.
- Q: How should network failures during host-initiated transitions (Back to Lobby / Start New Round) be handled? → A: Inline error on host screen, host retries. Other participants stay on current view until transition succeeds.
- Q: What is the maximum number of rounds per game session? → A: Max rounds = number of participants in the room. Each participant gets to draw exactly once. After the final round, the game ends with a final standings view.
- Q: Can new participants join mid-session? → A: Pre-game only. New participants can only join in the `lobby` state before the first round starts. Once the first round begins, the participant list is locked for the session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

After a round ends (by any means — all guessers guessed correctly, host ended early), the room transitions to `round_end` state and all participants see a results screen showing the secret word, each participant's score, and which guessers guessed correctly.

**Why this priority**: Without a results view, players have no closure or feedback after a round ends. This is the immediate next step after the round transition to "finished" status.

**Independent Test**: Can be tested by completing a round (all guessers guess correctly) and verifying all participants see the results screen with the secret word and final scores displayed.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** a participant views their screen, **Then** they see a results screen showing the secret word.
2. **Given** a round has ended, **When** a participant views their screen, **Then** they see each participant's name and their score.
3. **Given** a round has ended, **When** a guesser views the results, **Then** guessers who answered correctly are visually distinguished from those who did not.
4. **Given** a round that ended because all guessers guessed correctly, **When** participants view results, **Then** the results show that all guessers guessed correctly.
5. **Given** a round that ended early by the host, **When** participants view results, **Then** the results indicate the round was ended early and show which guessers (if any) had already guessed correctly.

---

### User Story 2 - Return to Lobby After Round (Priority: P1)

From the results screen (`round_end` state), the host can transition everyone back to the lobby. The host has a button to take everyone back; non-host participants see a "waiting for host" message until the host acts.

**Why this priority**: Players need a way to move on after seeing results. The lobby is the natural staging area for starting a new round or disbanding.

**Independent Test**: Can be tested by completing a round, having the host click "Back to Lobby", and verifying all participants see the lobby screen with the same participant list.

**Acceptance Scenarios**:

1. **Given** a completed round with results displayed, **When** the host clicks "Back to Lobby", **Then** all participants navigate to the lobby screen.
2. **Given** a completed round with results displayed, **When** a non-host participant views their screen, **Then** they see a message that the host will return them to the lobby, with no action available to them.
3. **Given** participants are in the lobby after a round, **When** they view the lobby, **Then** the participant list still shows all current members of the room.

---

### User Story 3 - Start a New Round from Lobby (Priority: P2)

From the lobby, the host can start a new round (up to a maximum of N rounds, where N = number of participants). A new drawer is assigned (rotating through participants), a new secret word is selected, and the game state resets for the new round. Cumulative scores are preserved across rounds.

**Why this priority**: Multi-round gameplay is essential for a complete game experience. Without it, each round is a one-off with no progression.

**Independent Test**: Can be tested by completing a round, returning to lobby, and starting a new round — verifying a different drawer is assigned, a different word is shown to the drawer, and scores from the previous round are preserved.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby after a completed round, **When** they click "Start New Round", **Then** a new round begins with a new secret word.
2. **Given** a new round starts, **When** participants view the game screen, **Then** the drawer is different from the previous round (or rotates if there are only two participants).
3. **Given** a new round starts, **When** participants view their scores, **Then** scores from the previous round are still present and cumulative.
4. **Given** a new round starts, **When** the drawer views their screen, **Then** they see the new secret word (different from the previous round's word).
5. **Given** a new round starts, **When** participants view the canvas, **Then** the canvas is blank (cleared from the previous round).
6. **Given** N participants in the room and N rounds have been completed, **When** the host views the lobby after the Nth round, **Then** the "Start New Round" action is not available and a message indicates the game is complete.

---

### User Story 5 - End-of-Game Standings (Priority: P2)

After the final round (round N, where N = number of participants), the last round's results screen shows the game is complete. Instead of returning to lobby, all participants see a final standings view ranking participants by cumulative score across all rounds.

**Why this priority**: A game with a defined end point and winner creates closure and competitive motivation.

**Independent Test**: Can be tested by playing through all rounds (N rounds for N participants). After the last round ends, verify all participants see a final standings screen showing cumulative scores ranked highest to lowest.

**Acceptance Scenarios**:

1. **Given** all N rounds have been completed in a game session, **When** the last round ends, **Then** participants see a final standings screen instead of the results screen.
2. **Given** the final standings screen is displayed, **When** a participant views it, **Then** they see all participants ranked by cumulative score (highest to lowest).
3. **Given** the final standings screen is displayed, **When** a participant views it, **Then** the participant with the highest cumulative score is visually distinguished as the winner.
4. **Given** the final standings screen is displayed, **When** a participant views it, **Then** the "Back to Lobby" and "Start New Round" actions are not available.

---

### User Story 4 - Leave Room After Completion (Priority: P3)

A participant can leave the room from the results screen or lobby after a round is complete. Other participants see that the participant has left.

**Why this priority**: Players need a graceful exit without disrupting the game experience for others.

**Independent Test**: Can be tested by a participant clicking "Leave Room" from the results screen and verifying other participants see the updated participant list.

**Acceptance Scenarios**:

1. **Given** a participant is on the results screen or lobby, **When** they click "Leave Room", **Then** they are redirected away from the room and their name is removed from the participant list for all others.
2. **Given** a participant leaves the room, **When** other participants view the results/lobby, **Then** the leaving participant's name no longer appears.

---

### Edge Cases

- What happens if there is only one participant in the room after others leave? The host cannot start a new round with fewer than 2 participants. A message should inform them that more players are needed.
- What happens when all N rounds (where N = number of participants) are completed? The game ends. Participants see a final standings screen ranking cumulative scores. No further rounds can be started. Participants can leave the room.
- What happens when all 5 starter words have been used in consecutive rounds? The system should reuse words (cycle through the list), ensuring no word is repeated in back-to-back rounds.
- What happens if the host leaves the room? If the host leaves, a new host should be assigned (the next participant in join order) so the remaining players can continue.
- What happens if a participant refreshes the results page? The results should still be visible on reload (server maintains round results until a new round starts or the room is disbanded).
- What happens if only 2 participants are in the room and a new round starts? Drawer assignment alternates between the two players each round.
- What happens if the host clicks "Back to Lobby" or "Start New Round" and the network request fails? An inline error message is shown on the host's screen. The host can retry the action. All other participants remain on their current view until the transition succeeds on the server.
- What happens if a participant is polling the room state during a host-initiated transition? The participant's next poll will reflect the new state once the transition succeeds on the server. No special client handling is needed beyond normal polling.
- What happens if someone tries to join a room after the first round has started? The join request is rejected. New participants can only join the room in the `lobby` state before the first round begins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round ends (by any means), the system MUST transition the room to `round_end` state and present a results view to all participants containing: the secret word, each participant's name and total score, and which guessers guessed correctly in that round.
- **FR-002**: The results view MUST indicate whether the round ended normally (all guessers guessed correctly) or was ended early by the host.
- **FR-003**: The host MUST have a "Back to Lobby" action available on the results screen (`round_end` state). When triggered and the request succeeds, the room transitions to `lobby` state and all participants MUST see the lobby view on their next poll.
- **FR-003a**: If the "Back to Lobby" network request fails, the system MUST display an inline error on the host's screen. The host can retry. Other participants MUST remain on their current view until the transition succeeds.
- **FR-004**: Non-host participants MUST NOT be able to trigger the return-to-lobby transition. They MUST see a status message indicating they are waiting for the host.
- **FR-005**: In the lobby after a completed round, the participant list MUST reflect all current room members.
- **FR-006**: The host MUST have a "Start New Round" action available in the lobby after a completed round. If the request fails, an inline error is shown on the host's screen and the host can retry.
- **FR-007**: When a new round starts, the system MUST assign a new drawer by rotating through the participant list in a deterministic order (e.g., round-robin based on join order).
- **FR-008**: When a new round starts, the system MUST select a new secret word that is different from the previous round's word. If all words have been used, cycle through the word list.
- **FR-009**: When a new round starts, the system MUST reset per-round state: canvas strokes, guess history, and per-round score tally. Cumulative session scores MUST be preserved.
- **FR-010**: The system MUST allow a participant to leave the room from the results screen or lobby. The leaving participant's name MUST be removed from the participant list for all remaining members.
- **FR-011**: If the host leaves the room, the system MUST assign host status to the next participant (in join order) who remains in the room.
- **FR-012**: If fewer than 2 participants remain in the room, the "Start New Round" action MUST NOT be available, and the host MUST see a message indicating more players are needed.
- **FR-013**: If a participant refreshes their browser while on the results screen, the results MUST still be displayed on reload (server maintains round results until a new round starts or the room is disbanded).
- **FR-014**: The maximum number of rounds per game session MUST equal the number of participants in the room at the time the first round started (participant list is locked once the first round begins). After the Nth round (N = participant count), the "Start New Round" action MUST NOT be available.
- **FR-016**: The system MUST reject join requests from new participants once the first round has started. Participants can only join in the `lobby` state before the first round begins.
- **FR-015**: After the final round ends, the system MUST display a final standings screen ranking all participants by cumulative score (highest to lowest). The top-ranked participant MUST be visually distinguished as the winner.

### Key Entities *(include if feature involves data)*

- **RoundResult**: The record of a completed round including the secret word, each participant's score at round end, and which guessers guessed correctly. Persists on the server until a new round starts.
- **GameSession**: The overall game session comprising one or more consecutive rounds within the same room. Tracks cumulative scores across rounds and the current round number.
- **Drawer Rotation**: A deterministic order of drawer assignment derived from the participant join order. Advances by one each round, wrapping around to the start.
- **Room State Machine**: The full room lifecycle across rounds: `lobby` → `playing` → `round_end` → `lobby` → `playing` → ... → `round_end` (final round) → `game_over`. Transitions are: game start or new round (`lobby` → `playing`), round end by any means (`playing` → `round_end`), host returns to lobby after a non-final round (`round_end` → `lobby`), terminal end after final round (`round_end` → `game_over`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All participants see the results screen within 2 seconds of the round ending.
- **SC-002**: The host can return all participants to the lobby with a single click, and all participants arrive within 2 seconds.
- **SC-003**: The host can start a new round from the lobby with a single click, and all participants transition to game play within 2 seconds.
- **SC-004**: A new round starts with a drawer different from the previous round (validated by checking drawer assignment over 3 consecutive rounds).
- **SC-005**: Each new round uses a secret word different from the previous round.
- **SC-006**: Cumulative scores persist across at least 3 consecutive rounds.
- **SC-007**: A participant can leave the room from the results/lobby and all remaining participants see the updated participant list within 3 seconds.
- **SC-008**: If the host leaves, host privileges transfer to a remaining participant automatically, and the new host can start a new round.
- **SC-009**: After N rounds (N = participant count), no further rounds can be started and all participants see a final standings screen.
- **SC-010**: The final standings screen shows participants ranked by cumulative score, with the winner visually distinguished.

## Assumptions

- The lobby screen (from spec 001-room-setup-lobby) provides the base UI for displaying participants and start/host controls, and will be extended for post-round functionality.
- Drawer rotation follows a simple round-robin based on the order participants joined the room.
- The five starter words (rocket, pizza, castle, guitar, sunflower) cycle; no word is repeated in consecutive rounds, but words can repeat across non-consecutive rounds or different game sessions.
- A minimum of 2 participants is required to start a new round. Single-player rooms cannot play.
- After the host starts a new round (`lobby` → `playing`), the transition to gameplay reuses the existing game screen and round lifecycle from spec 003 (with `playing` → `round_end` as defined here instead of the `playing` → `finished` from spec 003).
- The room state machine follows: `lobby` → `playing` → `round_end` → `lobby` → ... The `finished` state from spec 003 is replaced by the `round_end` state for rooms that support multi-round play.
- Cumulative scores are reset only when the room is disbanded (all participants leave or room is destroyed).
- The number of participants at the time the first round starts determines the maximum rounds for the session. If participants leave mid-session, the max round count does not decrease.
- The participant list is locked once the first round begins. No new participants can join mid-session.
- After the final round, the room reaches a terminal `game_over` state. Participants can only leave the room from this state.
