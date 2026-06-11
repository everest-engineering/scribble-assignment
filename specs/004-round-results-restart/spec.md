# Feature Specification: Round Results & Restart

**Feature Branch**: `004-round-results-restart`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Round Results & Restart

When a round ends, all players are shown the correct word, final scores, and the complete guess history for that round. The result view is consistent across all clients. Only the Host can restart the game. On restart, all current players are returned to the lobby, player membership is preserved, and all round-specific state-including drawings, guesses, scores, drawer assignment, and secret word-is reset to prepare for a new game."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Round Results (Priority: P1)

When an active round ends, every current player can see the correct word, the
final score for each round participant, and the complete valid guess history for
that round.

**Why this priority**: Players need a clear conclusion to the round before the
room can move on. The correct word, scores, and guesses explain the outcome and
make scoring feel fair.

**Independent Test**: End an active round with at least one drawer and one
guesser. Confirm each current player sees the same correct word, all final
scores, and every valid guess in the order it was submitted.

**Acceptance Scenarios**:

1. **Given** an active round with a selected secret word, **When** the round
   ends, **Then** all current players can see the correct word in the result
   view.
2. **Given** an active round with score changes, **When** the round ends,
   **Then** all current players can see each participant's final score.
3. **Given** an active round with valid guesses, **When** the round ends,
   **Then** all current players can see the complete valid guess history in
   submission order.

---

### User Story 2 - Keep Results Consistent and Final (Priority: P1)

After the round ends, the result view remains consistent for all current players.
The ended round is final: further drawing, clearing, and guessing are no longer
accepted for that round.

**Why this priority**: A result screen is only trustworthy if every player sees
the same final state and no late actions can change the outcome.

**Independent Test**: End a round in two client sessions, wait for normal room
state refresh, and confirm both sessions show identical results. Attempt to
draw, clear, or guess after the round has ended and confirm the final results do
not change.

**Acceptance Scenarios**:

1. **Given** multiple current players are viewing the same ended round, **When**
   their room state refreshes, **Then** they all see the same correct word,
   final scores, and guess history.
2. **Given** a round has ended, **When** any player attempts to draw, clear the
   canvas, or submit a guess for that round, **Then** the action is rejected or
   unavailable and the final result state remains unchanged.
3. **Given** a current player refreshes or reconnects while results are showing,
   **When** the room state is loaded again, **Then** the same ended-round results
   are shown until the Host restarts.

---

### User Story 3 - Restart from Results as Host (Priority: P1)

Only the Host can restart the game from the result view. Restarting returns all
current players to the lobby, keeps the room membership intact, and clears all
round-specific state so the room is ready for a new game start.

**Why this priority**: Players need a controlled way to continue playing without
losing the group or accidentally carrying old round data into a new game.

**Independent Test**: End a round, attempt restart as a non-host, then restart as
the Host. Confirm the non-host cannot restart, the Host can restart, all current
players return to the lobby, player membership and Host identity are preserved,
and drawings, guesses, scores, drawer assignment, and secret word are reset.

**Acceptance Scenarios**:

1. **Given** a round result view is displayed and the viewer is not the Host,
   **When** the viewer attempts to restart, **Then** the restart is rejected with
   clear feedback and the result state remains unchanged.
2. **Given** a round result view is displayed and the viewer is the Host,
   **When** the Host restarts the game, **Then** all current players are returned
   to the lobby.
3. **Given** the Host has restarted from results, **When** players view the
   lobby, **Then** the same current players and Host identity are preserved.
4. **Given** the Host has restarted from results, **When** the room is ready for
   a new game, **Then** prior drawings, guesses, scores, drawer assignment, and
   secret word are no longer present in the playable room state.

### Edge Cases

- A round can end with no valid guesses; the result view still shows the correct
  word, every participant's final score, and an empty guess history.
- A round can end with no drawing marks; the result view still shows the correct
  word, final scores, and guess history.
- Players with zero points remain visible in the final scores.
- A player refreshing during the result view sees the same final results until
  the Host restarts.
- Non-host restart attempts are rejected with clear feedback and do not change
  room state.
- Restart attempts when no ended round is available are rejected with clear
  feedback and do not change room state.
- After restart, no player can see or receive the previous secret word, previous
  drawings, previous guesses, previous scores, or previous drawer assignment.
- Results and restart actions in one room do not affect any other room.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show a round result view to current players after a
  round ends.
- **FR-002**: System MUST reveal the correct word to all current players in the
  result view.
- **FR-003**: System MUST show final scores for every participant in the ended
  round.
- **FR-004**: System MUST show the complete valid guess history for the ended
  round in submission order.
- **FR-005**: System MUST keep the result view consistent across current players
  viewing the same room.
- **FR-006**: System MUST preserve the ended-round result state across normal
  refreshes or reconnects until the Host restarts the game.
- **FR-007**: System MUST prevent any drawing, clearing, or guessing from
  changing an ended round.
- **FR-008**: System MUST make restart available only to the Host.
- **FR-009**: System MUST reject non-host restart attempts with clear
  user-facing feedback and leave room state unchanged.
- **FR-010**: System MUST return all current players in the room to the lobby
  when the Host restarts from results.
- **FR-011**: System MUST preserve player membership, player display names, room
  code, and Host identity when restarting from results.
- **FR-012**: System MUST reset round-specific drawing state when restarting from
  results.
- **FR-013**: System MUST reset round-specific guesses and guess history when
  restarting from results.
- **FR-014**: System MUST reset round-specific scores and score-award state when
  restarting from results.
- **FR-015**: System MUST reset round-specific drawer assignment and secret word
  when restarting from results.
- **FR-016**: System MUST prepare the room for a new game start after restart
  without automatically starting a new round.
- **FR-017**: System MUST keep result and restart state isolated to the room
  where the round ended.
- **FR-018**: System MUST prevent new players from joining while round results
  are being displayed; normal lobby joining rules apply again after restart.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST use TypeScript and ES Modules in both `frontend/` and `backend/`.
- **CC-002**: Feature MUST use HTTP REST requests and polling for synchronization.
- **CC-003**: Feature MUST keep all room/game state in memory only; databases and persistent storage are out of scope.
- **CC-004**: Feature MUST NOT add WebSockets, Socket.io, server-sent events, authentication, sessions, JWT, OAuth, deployment, Docker, or unrelated dependencies.
- **CC-005**: Backend request and response boundaries MUST use Zod validation.

### Key Entities *(include if feature involves data)*

- **Ended Round**: A round that is no longer accepting drawing, clearing, or
  guessing actions. It provides the source state for the result view.
- **Round Result**: The visible summary of an ended round, including the correct
  word, final scores, and complete valid guess history.
- **Final Score**: A participant's score at the moment the round ends.
- **Guess History**: The ordered list of valid guesses submitted during the
  ended round.
- **Restart Action**: A Host-only action that returns the room to the lobby while
  preserving current player membership and clearing round-specific state.
- **Current Player**: A player who already belongs to the room when results are
  displayed or when the Host restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested ended rounds, all current players can see the
  correct word, final scores, and complete valid guess history.
- **SC-002**: Under normal local conditions, all current players see the same
  result view within 3 seconds after the round ends.
- **SC-003**: In 100% of tested ended-round states, drawing, clearing, and
  guessing attempts do not change final results.
- **SC-004**: In 100% of tested non-host restart attempts, restart is rejected
  with clear feedback and the result state remains unchanged.
- **SC-005**: In 100% of tested Host restart attempts from results, all current
  players return to the lobby with membership, room code, display names, and
  Host identity preserved.
- **SC-006**: In 100% of tested restarts, previous drawings, guesses, scores,
  drawer assignment, and secret word are absent from the new lobby-ready room
  state.
- **SC-007**: At least 90% of playtest participants can identify the correct
  word and their final score within 5 seconds of seeing the result view.

## Assumptions

- This feature begins after an active round has been ended by the game's round
  lifecycle; the specific trigger for ending a round is outside this feature.
- Result state represents the final round state captured at the moment the round
  ends.
- Current players are the existing room participants when the result view is
  displayed; spectator mode is out of scope.
- The room Host remains the same Host assigned during room creation.
- Restarting from results returns the room to the lobby and does not
  automatically start the next round.
- Historical round results are not retained in the lobby after restart; the
  result view is available only until the Host restarts.
