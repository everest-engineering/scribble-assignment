# Feature Specification: Result Restart Flow

**Feature Branch**: `004-result-restart-flow`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Feature Group 4: Result, Restart & Final Validation. Gameplay Interaction is complete and supports drawing, guess submission, score updates, and guess history synchronization. Generate a specification for Result and Restart Flow. Given a round has ended, when the result state is displayed and the host restarts, all players see the correct secret word, final scores, complete guess history, host can restart the game, restart returns all players to the lobby, player list is preserved, room code remains unchanged, all round-specific state is cleared, scores reset, guess history resets, canvas resets, word assignment resets, and drawer assignment resets. Include acceptance criteria, edge cases, restart rules, state reset requirements, API requirements, UI requirements, and validation rules. Do not introduce multiple rounds, timers, persistence, or authentication."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Players Review the Final Result (Priority: P1)

As a player in a room whose round has ended, I want to see the revealed secret word, final scores, and complete guess history so I can understand the outcome before the room is reset.

**Why this priority**: The result state is the required conclusion of the playable round and gives every participant a shared, verifiable outcome.

**Independent Test**: End a round after drawing and multiple guesses, open the result state as the host, drawer, and guessers, and confirm all players see the same revealed word, final score totals, and ordered guess history.

**Acceptance Scenarios**:

1. **Given** a room has an ended round with a secret word, guesses, and scores, **When** any player views the result state, **Then** the secret word is visible to that player.
2. **Given** a room has an ended round with score changes, **When** any player views the result state, **Then** final scores for all current players are visible and match the ended round outcome.
3. **Given** a room has an ended round with accepted guesses, **When** any player views the result state, **Then** the complete guess history is visible in submission order.
4. **Given** a room has an ended round with no accepted guesses, **When** any player views the result state, **Then** the result view clearly shows the secret word, final scores, and an empty-history state.

---

### User Story 2 - Host Restarts to the Lobby (Priority: P2)

As the host, I want to restart after the result is shown so the same group can return to the lobby and decide whether to start a fresh game with the same room code.

**Why this priority**: Restart is the primary recovery path after a completed round and preserves the existing social context without requiring players to create and join a new room.

**Independent Test**: From the ended-round result state, have the host restart the game and confirm every player returns to the lobby with the same room code and participant list.

**Acceptance Scenarios**:

1. **Given** a room is in the result state and the host is viewing it, **When** the host restarts the game, **Then** the room returns to the lobby state.
2. **Given** the host restarts from the result state, **When** players receive the updated room state, **Then** the room code remains unchanged.
3. **Given** the host restarts from the result state, **When** players receive the updated room state, **Then** the current player list is preserved.
4. **Given** a non-host player views the result state, **When** they look for restart controls, **Then** they cannot restart the game.

---

### User Story 3 - Restart Clears Round-Specific State (Priority: P3)

As any player, I want restart to clear the completed round's gameplay data so the next start begins from a clean lobby state without stale drawings, guesses, scores, word assignment, or drawer assignment.

**Why this priority**: A restart that leaves old round data behind would make the next game confusing and could leak the previous secret word or roles.

**Independent Test**: Complete a round with canvas marks, guesses, scores, a secret word, and a drawer, restart as the host, and confirm the room snapshot contains the same room and players but no active or ended round data.

**Acceptance Scenarios**:

1. **Given** a completed round has canvas content, **When** the host restarts, **Then** the canvas resets to blank and no old drawing is displayed in the lobby.
2. **Given** a completed round has guess history, **When** the host restarts, **Then** guess history resets and no old guesses are displayed in the lobby.
3. **Given** a completed round has score values, **When** the host restarts, **Then** scores reset and no previous score advantage carries into the lobby.
4. **Given** a completed round has a secret word and drawer assignment, **When** the host restarts, **Then** word assignment and drawer assignment are cleared.
5. **Given** a room is restarted to the lobby, **When** the host later starts a new game using existing start behavior, **Then** fresh round-specific state is assigned for that new game rather than reusing the previous round's values.

---

### Edge Cases

- A result state with no guesses still reveals the secret word and shows a clear empty guess history.
- A result state with tied scores shows all tied players accurately without changing the recorded final values.
- A restart attempt by a non-host is rejected or disabled and leaves room state unchanged.
- A restart attempt before the round has ended is rejected and leaves active gameplay state unchanged.
- A restart attempt after the room has already returned to the lobby does not recreate old result data or alter the preserved player list.
- A restart request from an unknown participant, missing room, or stale room code fails with clear recoverable feedback.
- Multiple players polling at different moments converge on the same lobby state after the host restart.
- Temporary polling failures do not erase the last visible result state and should recover to the latest room state on the next successful refresh.
- Multiple rooms remain isolated; restarting one room does not change another room's result, lobby, players, scores, canvas, guesses, word, or drawer.
- If a player joins after restart using the unchanged room code, they join the lobby state and do not receive old round-specific result data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST represent a completed round with a result state before restart is available.
- **FR-002**: System MUST reveal the completed round's secret word to all current players while the room is in the result state.
- **FR-003**: System MUST show final scores for all current players while the room is in the result state.
- **FR-004**: System MUST show the complete accepted guess history for the completed round while the room is in the result state.
- **FR-005**: System MUST preserve guess history order as the order in which guesses were accepted during gameplay.
- **FR-006**: System MUST allow only the host to restart the game from the result state.
- **FR-007**: System MUST prevent non-host participants from restarting the game.
- **FR-008**: System MUST prevent restart while a round is still active.
- **FR-009**: System MUST return all players in the room to the lobby state after a valid host restart.
- **FR-010**: System MUST preserve the room code during restart.
- **FR-011**: System MUST preserve the current player list during restart.
- **FR-012**: System MUST clear the completed round's canvas state during restart.
- **FR-013**: System MUST clear the completed round's guess history during restart.
- **FR-014**: System MUST reset scores during restart so no completed-round points carry into the lobby.
- **FR-015**: System MUST clear the completed round's secret word assignment during restart.
- **FR-016**: System MUST clear the completed round's drawer assignment during restart.
- **FR-017**: System MUST clear all other round-specific state during restart while keeping room-level identity and participants.
- **FR-018**: System MUST synchronize result and restarted lobby state to all players through polling without requiring page refresh.
- **FR-019**: System MUST keep room state isolated so result display and restart in one room never affect another room.
- **FR-020**: System MUST validate result and restart actions against room existence, participant membership, host role, and current room state before changing room state.

### Restart Rules

- Restart is available only after a round has ended and the room is showing the result state.
- Restart is host-only.
- Restart returns the room to the lobby rather than starting another round automatically.
- Restart keeps the same room code.
- Restart keeps the current player list and host identity.
- Restart removes all round-specific data from shared room state.
- Restart does not create multiple rounds, advance round counters, start timers, persist history, or require authentication.

### State Reset Requirements

- **Preserved on Restart**: Room code, room identity, host identity, and current player list.
- **Cleared on Restart**: Ended round state, active round state, secret word, drawer assignment, canvas content, guess history, correctness tracking, and any result-only display data derived from the completed round.
- **Reset on Restart**: Scores return to their pre-game lobby baseline and must not carry completed-round points into the next game.
- **After Restart**: The room is ready for the existing start flow to create fresh word assignment, drawer assignment, canvas state, scores, and guess history.

### API Requirements

- The application MUST provide a way for players to retrieve result-state room data, including revealed secret word, final scores, complete guess history, room code, player list, and current room status.
- The application MUST provide a way for the host to request restart for a room in the result state.
- Restart requests MUST identify the room and requesting participant.
- Restart requests MUST be rejected when the room is missing, the participant is unknown, the participant is not the host, or the room is not in the result state.
- Successful restart responses MUST include enough updated room state for the requesting host to see the lobby immediately.
- Polling responses MUST include enough updated room state for all other players to move from result view to lobby without a page refresh.

### UI Requirements

- Result UI MUST display the revealed secret word to all players.
- Result UI MUST display final scores for all current players.
- Result UI MUST display the completed guess history, including an empty state when no guesses were accepted.
- Result UI MUST display restart controls only for the host.
- Non-host players MUST receive a clear waiting state indicating that the host can restart.
- After restart, all player views MUST show the lobby for the same room code and preserved player list.
- After restart, lobby UI MUST NOT show the previous canvas, guesses, secret word, drawer assignment, or completed-round scores.
- Recoverable result or restart errors MUST be shown without crashing the player view.

### Validation Rules

- A room code is required for result retrieval and restart.
- A participant identity is required for viewer-specific result retrieval and restart.
- The participant must belong to the room being viewed or restarted.
- Only the host participant may restart.
- Restart is valid only from the result state.
- Restart must not be accepted from the lobby, waiting, or active gameplay states.
- Restart must clear round-specific state in a single state transition so players do not observe a partially reset room.
- Result snapshots must reveal the secret word only after the round has ended.

### Error Handling

- Missing rooms, unknown participants, non-host restart attempts, and invalid room states MUST produce clear recoverable errors.
- Failed restart attempts MUST leave room state unchanged.
- Temporary polling failures SHOULD keep the latest successful result or lobby state visible and indicate that updates may be stale.
- Retrying after a recoverable polling failure SHOULD converge to the latest room state without requiring a page refresh.

### Key Entities *(include if feature involves data)*

- **Result State**: The room state after a round has ended, exposing the completed round's secret word, final scores, and accepted guess history to all current players.
- **Restart Action**: A host-only action that moves a room from result state back to lobby state while preserving room identity and participants.
- **Room Lobby State**: The post-restart state where players remain gathered under the same room code and no round-specific data is active.
- **Round-Specific State**: Data created for one played round, including secret word, drawer, canvas, guesses, scores, correctness tracking, and result display data.
- **Player List**: The current participants in the room, including host identity, preserved across restart.

### Traceability & Scope

- **Source Scenario(s)**: Feature Group 4 Result, Restart & Final Validation business scenario; User Story 1, User Story 2, and User Story 3 in this specification.
- **In Scope**: Result-state display; revealed secret word after round end; final scores; complete guess history; host-only restart; restart to lobby; preserving room code and player list; clearing round-specific state; score reset; polling synchronization; restart validation and recoverable feedback.
- **Out of Scope**: Multiple rounds; timers; persistence; authentication; databases; WebSockets or push protocols; automatic next-round start; drawer rotation; score carryover; changing room creation, join, lobby, game-start, drawing, or guessing rules except where needed to display final results and reset them.
- **Polling Behavior**: Result and restart state MUST refresh automatically while a player remains on the room page. User-visible result and lobby updates SHOULD appear within the existing application polling freshness window, and polling MUST stop for a view after the player leaves the room page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a completed three-player room, 100% of players see the same revealed secret word, final scores, and complete guess history in the result state.
- **SC-002**: 100% of valid host restarts from the result state return the room to the lobby with the same room code and preserved current player list.
- **SC-003**: 100% of restarts clear prior canvas, guess history, secret word assignment, drawer assignment, and completed-round scoring state before the next game can start.
- **SC-004**: 100% of non-host restart attempts are rejected or unavailable without changing shared room state.
- **SC-005**: In a multi-tab room, all players observe the host restart and return to the lobby within the existing polling freshness window.
- **SC-006**: In two simultaneous rooms, restarting one room produces 0 visible changes to the other room's result, lobby, players, scores, canvas, guesses, word, or drawer.
- **SC-007**: After restart, a host can use the existing start flow to begin a fresh game without any previous round-specific data appearing in the new lobby or game state.

## Assumptions

- The gameplay feature already records canvas state, accepted guesses, scores, the secret word, and drawer assignment for a single active round.
- A separate round-ending transition exists or will be provided before this restart flow is used; this feature specifies what players see once that ended result state is reached.
- The existing polling cadence is reused for result and restart synchronization.
- The post-restart lobby uses the same room behavior as the existing room setup and game-start features.
- Score reset means completed-round points do not carry into the lobby or the next game start.
- Current participants at the moment of restart are the players preserved in the lobby.
