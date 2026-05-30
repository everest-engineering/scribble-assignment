# Feature Specification: Scenario 4 Result State and Restart

**Feature Branch**: `assignment`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 4 result state, restart flow, and final
validation where all players see the correct word, final scores, and full guess
history after the round ends, and the host can restart to return everyone to
the lobby with players preserved and all round state cleared. Keep this limited
to Scenario 4 only. Exclude multiple rounds, drawer rotation, timers, bonuses,
persistence, and any new out-of-scope features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Players Review Round Results (Priority: P1)

When the active round ends, every player in the room can review the completed
round outcome, including the correct word, the final scores, and the full guess
history.

**Why this priority**: Scenario 4 has no value unless players can reliably see
how the finished round resolved before any restart behavior is introduced.

**Independent Test**: Complete a round with a correct guess, then confirm in at
least two tabs that every player sees the same correct word, the same final
scores, and the same full guess history for that room.

**Acceptance Scenarios**:

1. **Given** a round is in progress, **When** a correct guess ends that round,
   **Then** the room enters a result state instead of remaining in active play.
2. **Given** a room is in the result state, **When** any player views that room,
   **Then** they see the correct word from the completed round.
3. **Given** a room is in the result state, **When** any player reviews the
   round outcome, **Then** they see the final scores and the full accepted guess
   history from that completed round.

---

### User Story 2 - Host Restarts the Room (Priority: P2)

After players review the completed round, the host can restart the room so the
same group returns to the lobby and can begin a fresh game setup.

**Why this priority**: Restart is the control that lets the room continue after
results are reviewed without forcing players to create or join a new room.

**Independent Test**: Finish a round, restart from the host tab, and confirm
that every player returns to the lobby in the same room with the same player
list still present.

**Acceptance Scenarios**:

1. **Given** a room is in the result state, **When** the host restarts the
   room, **Then** the room returns to the lobby and preserves the existing
   player roster.
2. **Given** a non-host player is viewing the result state, **When** they try
   to restart the room, **Then** the restart is rejected with clear feedback.
3. **Given** a round has not finished yet, **When** any player attempts a
   restart, **Then** the restart is rejected and active play continues.

---

### User Story 3 - Restart Clears Round State Cleanly (Priority: P3)

When the host restarts, all round-specific data is removed so the room is ready
for a clean return to the lobby without leaking prior gameplay details.

**Why this priority**: Preserving players is only useful if the next lobby state
starts cleanly and does not carry over outdated round data.

**Independent Test**: Finish a round, restart it, and confirm in at least two
tabs that the room keeps the same players but no longer exposes the finished
word, round scores, guess history, or drawing state.

**Acceptance Scenarios**:

1. **Given** a room has finished a round and entered the result state, **When**
   the host restarts it, **Then** the room clears the completed round's word,
   drawing state, guess history, and score totals.
2. **Given** a room has restarted to the lobby, **When** players refresh that
   room, **Then** they all receive the same clean lobby state for that room.
3. **Given** another room is still in play or in results, **When** one room is
   restarted, **Then** the other room's state is unchanged.

### Edge Cases

- A player opens the result state after the round ended and must still see the
  same final word, scores, and guess history as the rest of the room.
- A non-host attempts to restart from the result state.
- The host attempts to restart before the room has reached the result state.
- A restarted room must not retain the previous round's drawing surface, secret
  word, guess history, or score totals.
- Restarting one room must not affect another room that is still playing or has
  already finished.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST end the active round and transition the room into
  a result state when a correct accepted guess is recorded.
- **FR-002**: The system MUST reveal the completed round's correct word to every
  player while the room is in the result state.
- **FR-003**: The system MUST display the final score totals for every player in
  the room while the room is in the result state.
- **FR-004**: The system MUST preserve and display the full accepted guess
  history from the completed round while the room is in the result state.
- **FR-005**: The system MUST keep the result state synchronized for all players
  in the same room through scheduled refreshes.
- **FR-006**: The system MUST allow only the host to restart a room.
- **FR-007**: The system MUST allow restart only after the room has entered the
  result state.
- **FR-008**: The system MUST return a restarted room to the lobby while
  preserving the room code, host identity, and current player roster.
- **FR-009**: The system MUST clear all round-specific state when a room is
  restarted, including the completed word, drawer assignment, drawing state,
  guess history, and score totals.
- **FR-010**: The system MUST provide clear feedback when a restart is rejected
  because the requester is not the host or the room is not ready to restart.
- **FR-011**: The system MUST keep result-state and restart behavior isolated to
  the affected room only.
- **FR-012**: This feature MUST exclude multiple rounds, drawer rotation,
  timers, bonuses, persistence, and any new out-of-scope features.

### Key Entities *(include if feature involves data)*

- **Result State**: The post-round room state that reveals the completed round
  outcome to every player before a restart occurs.
- **Final Scoreboard**: The ordered set of player score totals captured at the
  end of the completed round.
- **Completed Guess History**: The full room-specific record of accepted guesses
  from the finished round that remains visible during results.
- **Restarted Lobby State**: The preserved room roster and host ownership after
  round-specific gameplay data has been cleared.

## Constraints & Non-Goals *(mandatory)*

- **CN-001**: Result-state and restart updates in this scenario MUST continue
  using scheduled refreshes rather than instant push-based updates.
- **CN-002**: Result-state and restart data in this scenario MUST remain
  temporary for the current runtime only and are not expected to survive a
  service restart.
- **CN-003**: Players MUST continue to access rooms without sign-in, account
  creation, or identity verification features.
- **CN-004**: This feature MUST build directly on the existing Scenario 1,
  Scenario 2, and Scenario 3 gameplay flow without introducing unrelated
  product areas.
- **CN-005**: The scope is limited to Scenario 4 result-state and restart
  behavior only.
- **CN-006**: Multiple rounds, drawer rotation, timers, bonuses, persistence,
  and any new out-of-scope features are explicit non-goals for this
  specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-tab validation, once a correct guess ends the round, all
  players in the same room see the same correct word, final scores, and full
  guess history within one scheduled refresh cycle.
- **SC-002**: In repeated validation, 100% of restart attempts by non-host
  players are rejected and do not change room state.
- **SC-003**: In two-tab validation, a host-triggered restart returns every
  player in the room to the lobby with the same player roster within one
  scheduled refresh cycle.
- **SC-004**: In repeated validation, every successful restart clears prior
  round word visibility, round scores, guess history, and drawing state while
  leaving other rooms unchanged.

## Assumptions

- Scenario 3 already provides the active round, guess evaluation, accepted guess
  history, and score totals that Scenario 4 will expose after the round ends.
- Because timers and manual round ending are out of scope, the first correct
  accepted guess is the event that ends the round and opens the result state.
- Restart returns players to the same room code and preserves the same host so
  the existing group can begin again from the lobby.
- Players can keep at least two browser tabs open during multiplayer
  validation.

## Verification Plan *(mandatory)*

- Validate that a correct guess transitions the room from active play into a
  shared result state.
- Validate that every player in the same room sees the correct word, final
  scores, and full guess history after the round ends.
- Validate that only the host can restart and that restart is rejected before
  the room reaches the result state.
- Validate that restarting returns all players to the lobby with the same room
  roster and no leftover round data.
- Validate that restarting one room does not change another room's active or
  finished state.
