# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Scenario 4 (Result, restart, and final validation)"

## Clarifications

### Session 2026-05-30

- Q: When the host ends the round while a guess is in flight, should that guess be accepted or rejected? → A: Accept guesses already received before end-round is processed; reject any submitted after.
- Q: Should the final canvas drawing remain visible on the result screen? → A: Hide the canvas on the result screen (word, scores, history only).
- Q: Should players navigate to a separate result screen or stay on the game screen? → A: Same game screen transitions in-place to result mode (no route change).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Ends the Round and Enters Result State (Priority: P1)

When gameplay is complete, the host can end the active round. The session transitions from
active play to a result state where round outcomes are finalized and ready for all participants
to review.

**Why this priority**: Ending the round is the gateway from gameplay to the shared result
experience. Without a defined round-end transition, players cannot reach the result screen.

**Independent Test**: With two players in an active round, the host activates end round.
Verify the session leaves active play, both clients see the game screen transition in-place
to result mode within approximately 2 seconds without manual refresh, and guess submission
and drawing are no longer available.

**Acceptance Scenarios**:

1. **Given** an active round with at least two participants, **When** the host activates end
   round, **Then** the room session enters a result state and active gameplay controls are
   disabled.
2. **Given** a participant is on the game screen during an active round, **When** the host
   ends the round, **Then** that participant's game screen transitions in-place to result mode
   within approximately 2 seconds without manual refresh or route change.
3. **Given** the session is in result state, **When** any participant views the screen, **Then**
   they cannot submit new guesses or add canvas strokes.
4. **Given** an active round, **When** a non-host participant attempts to end the round, **Then**
   the action is blocked and the round remains in active play.
5. **Given** a room still in lobby status, **When** a participant attempts to end the round,
   **Then** the action is unavailable or rejected.

---

### User Story 2 - All Players See the Shared Result (Priority: P2)

Once the round has ended, every participant sees the same outcome: the correct secret word
(revealed to all), final scores for every player, and the complete guess history from the
round. The drawing canvas is not shown in result state. Result data stays synchronized across
clients through automatic refresh.

**Why this priority**: The result screen is the payoff of the round. All players must see
identical, complete information so the outcome is fair and verifiable.

**Independent Test**: End a round where one guesser scored 100 and another scored 0 after
submitting guesses. On both browser tabs, confirm the secret word is visible to drawer and
guesser alike, scores match, and every guess from the round appears in chronological order
within approximately 2 seconds without manual refresh.

**Acceptance Scenarios**:

1. **Given** the session is in result state, **When** any participant views the result screen,
   **Then** they see the correct secret word that was used during the round.
2. **Given** the session is in result state, **When** the drawer views the result screen, **Then**
   they see the secret word (no longer hidden from non-drawers only).
3. **Given** the session is in result state, **When** any participant views the scoreboard,
   **Then** they see each participant's final score from the completed round.
4. **Given** the session is in result state, **When** any participant views the guess history,
   **Then** they see every accepted guess from the round with submitter name and trimmed guess
   text in chronological order.
5. **Given** scores or history changed before the round ended, **When** any participant views
   the result screen, **Then** the displayed word, scores, and history match across all clients
   within approximately 2 seconds without manual refresh.
6. **Given** the session is in result state, **When** a participant who did not submit any
   guesses views the result, **Then** they still see the full history and all final scores.
7. **Given** the session is in result state, **When** any participant views the result screen,
   **Then** the drawing canvas is not displayed (result shows word, scores, and history only).

---

### User Story 3 - Host Restarts and Returns Everyone to the Lobby (Priority: P3)

After reviewing the result, the host can restart the session. All participants return to the
lobby together with the same player roster preserved, while every piece of round-specific
state is cleared so a fresh round can begin when the host starts again.

**Why this priority**: Restart completes the game loop and validates that round data does not
leak into the next session. Preserving players avoids forcing everyone to rejoin.

**Independent Test**: From the result screen with two tabs, the host activates restart. Confirm
both tabs return to the lobby within approximately 2 seconds, the same participants and host
are listed, scores show 0 (or are absent until the next game), guess history is empty, and
the host can start a new game.

**Acceptance Scenarios**:

1. **Given** the session is in result state, **When** the host activates restart, **Then** the
   room returns to lobby status with the same participants and host as before the round.
2. **Given** a participant is on the result screen, **When** the host restarts, **Then** that
   participant's screen returns to the lobby within approximately 2 seconds without manual
   refresh.
3. **Given** the host has restarted to the lobby, **When** any participant views the lobby,
   **Then** round-specific data is cleared: canvas drawing, guess history, scores reset to
   zero, and the secret word is no longer visible.
4. **Given** the session has returned to the lobby after restart, **When** the host starts a
   new game, **Then** a new round begins with fresh round state (same rules as Scenario 2).
5. **Given** the session is in result state, **When** a non-host participant attempts to
   restart, **Then** the action is blocked and the session remains in result state.
6. **Given** the session has returned to the lobby after restart, **When** a participant tries
   to open the game screen directly, **Then** they are redirected to the lobby until the host
   starts a new game.

---

### User Story 4 - Full Game Loop Validates End-to-End (Priority: P4)

Two participants can complete the entire lab game flow in separate browsers: create or join a
room, start from the lobby, play one round with drawing and guessing, reach the shared result,
and restart back to the lobby with a clean state.

**Why this priority**: Final validation proves all four scenarios work together and satisfies
the lab's working-game-flow acceptance bar.

**Independent Test**: In Browser A (host) and Browser B (guest), run the full sequence: create
room → guest joins → host starts → drawer draws → guest submits incorrect then correct guess →
host ends round → both see matching result → host restarts → both land in lobby with cleared
round state and preserved players.

**Acceptance Scenarios**:

1. **Given** two browsers in the same room, **When** the full play → result → restart sequence
   is executed, **Then** both browsers stay synchronized at each stage without manual refresh.
2. **Given** the full sequence completes successfully, **When** the host starts a second game
   from the lobby, **Then** the new round begins with zero scores and empty history.
3. **Given** two separate rooms each running the full sequence concurrently, **When** both
   complete restart, **Then** each room's lobby and cleared state remain isolated with no
   cross-room data leakage.

---

### Edge Cases

- What happens when the host ends the round before any guesses are submitted? Result state
  shows the secret word, all scores at 0, and an empty guess history; the canvas is hidden.
- What happens when the host ends the round immediately after a correct guess? Final scores
  reflect points already awarded; result shows the correct word and full history.
- What happens when a guesser submits at the same moment the host ends the round? Guesses
  already received by the server before end-round is processed are accepted and included in
  final history and scores; any guess submitted after end-round is processed is rejected.
- What happens when a non-host tries to end the round or restart? Action is rejected; only the
  host may transition session state.
- What happens when polling fails during result or restart transition? Show a non-blocking
  error or status; retry on the next interval without clearing the last known state.
- What happens when the backend restarts mid-result? Room is lost; refresh fails with a clear
  not-found message (inherent to in-memory scope).
- What happens when a participant navigates away during result state? Returning to the game
  screen route resumes refresh and shows current result mode until restart.
- What happens when the host uses client-side exit/navigation during result? Server session
  remains in result state; other participants continue to see result until host restarts.
- What happens when restart occurs with only two players? Both return to lobby; the two-player
  minimum for starting again still applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow only the host to end an active round and transition the session
  to result state.
- **FR-002**: System MUST reject or hide end-round actions when the session is not in active
  play.
- **FR-003**: System MUST disable guess submission and canvas drawing for all participants
  while in result state.
- **FR-003a**: System MUST accept guess submissions that reach the server before end-round is
  processed and reject guess submissions received after end-round is processed.
- **FR-004**: System MUST reveal the correct secret word to all participants in result state
  (not limited to the drawer).
- **FR-004a**: System MUST NOT display the drawing canvas during result state; the result
  screen shows the secret word, final scores, and guess history only.
- **FR-005**: System MUST display final scores for every participant on the result screen.
- **FR-006**: System MUST display the complete guess history from the completed round on the
  result screen, including submitter identity and trimmed guess text in chronological order.
- **FR-007**: System MUST synchronize result state (secret word, scores, history) to all
  participants via automatic refresh at approximately 2-second intervals while they remain on
  the game screen in result mode.
- **FR-007a**: System MUST transition the existing game screen in-place to result mode without
  navigating to a separate route.
- **FR-008**: System MUST allow only the host to restart from result state back to the lobby.
- **FR-009**: System MUST preserve the participant list and host designation when restarting
  to the lobby.
- **FR-010**: System MUST clear all round-specific state on restart, including canvas drawing,
  guess history, participant scores (reset to zero), secret word visibility, and drawer/round
  assignment, while setting session status back to lobby.
- **FR-011**: System MUST direct all participants to the lobby automatically when restart
  succeeds, within approximately 2 seconds without manual refresh.
- **FR-012**: System MUST prevent access to active game or result experiences when the session
  is in lobby status after restart (redirect to lobby until the host starts again; the game
  screen shows playing or result mode only when the session status matches).
- **FR-013**: System MUST support the complete end-to-end flow: lobby → active play → result
  → lobby restart, verifiable with two concurrent browser sessions.
- **FR-014**: System MUST maintain room isolation so result and restart state in one room does
  not affect other rooms.

### Key Entities

- **Result State**: The post-round session phase where the secret word is public, final scores
  are fixed, guess history is complete, and gameplay inputs are disabled.
- **Round Summary**: The collective outcome data shown in result state: revealed secret word,
  per-participant final scores, and ordered guess history from the completed round.
- **Restart Action**: A host-initiated transition that returns the session to lobby status,
  preserves participants, and clears all round-specific fields.
- **Lobby State (post-restart)**: The waiting-room phase after restart with the same roster,
  zero scores, no active secret word, and readiness for the host to start a new round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-browser testing, 100% of host end-round actions transition both clients
  to result state within 3 seconds without manual refresh.
- **SC-002**: In two-browser testing, 100% of result screens show the same secret word, final
  scores, and guess history across both clients within 3 seconds without manual refresh.
- **SC-003**: In two-browser testing, 100% of host restart actions return both clients to the
  lobby within 3 seconds without manual refresh.
- **SC-004**: After restart, 100% of test sessions show zero scores, empty guess history, and
  no visible secret word until the next game start.
- **SC-005**: 100% of non-host attempts to end the round or restart are blocked without
  changing session state.
- **SC-006**: Two-browser end-to-end validation (lobby → play → result → restart → lobby)
  completes successfully in 100% of test runs without cross-room interference.
- **SC-007**: A second game started after restart begins with fresh round state (zero scores,
  empty history) in 100% of test sessions.

## Assumptions

- Scenarios 1, 2, and 3 are complete: room lobby with host-only start, game start with
  drawer assignment and deterministic secret word, interactive drawing, guess validation,
  synced history, and scoring are already in place.
- The host ends the round explicitly to enter result state; rounds do not auto-end on a
  correct guess (gameplay may continue after scoring until the host ends the round).
- Only the host may end the round and restart, consistent with host-only game start from
  Scenario 1.
- Result and lobby transitions use the same approximately 2-second automatic refresh cadence
  established in prior scenarios.
- Restart returns to lobby (not directly into a new round); starting the next round reuses
  Scenario 2 start-game behavior.
- Multiple rounds, drawer rotation, timers, and automatic round completion are out of scope.
- Synchronization uses periodic refresh (polling), not push notifications.
- No authentication; participant identity remains session-local via the identifier from
  create/join.
- Room state is in-memory only; sessions do not survive a server restart.
- "Final validation" in this scenario means verifying the complete four-scenario game loop
  with two browsers, not automated CI or deployment testing.
