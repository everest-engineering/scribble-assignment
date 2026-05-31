# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `assignment`

**Created**: 2026-05-31

**Status**: Draft

## Clarifications

### Session 2026-05-31

- Q: What triggers the end of a round? → A: The round ends automatically when the first correct guess is submitted. The system transitions to a result state at that moment — no manual end-round action is needed.
- Q: Should the correct word be revealed to all players on the result screen? → A: Yes. The result state reveals the secret word to every player, including guessers who never saw it during the round.
- Q: What does "round state cleared" mean on restart? → A: The drawer assignment, secret word, guess history, and scores are all reset to their initial empty values. The participant list and host identity are preserved. The room returns to lobby status ready for a new round.
- Q: Can only the host restart, or can any player? → A: Only the host can trigger a restart, consistent with the host-only start mechanic from Scenario 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Result Screen (Priority: P1)

When the first correct guess is submitted, the round ends automatically. All
players are taken to a result screen showing the secret word that was being
drawn, the final scores for every participant, and the complete guess history
for the round.

**Why this priority**: The result screen is the payoff of the game loop. Without
it, players have no shared moment of completion and no summary of what happened.

**Independent Test**: Start a game with two tabs. Submit a correct guess from
the guesser tab. Within one poll cycle (≤2 seconds), both tabs should
automatically navigate to the result screen showing the secret word, scores,
and guess history.

**Acceptance Scenarios**:

1. **Given** a guesser submits the correct word, **When** the system processes
   the guess, **Then** the room transitions to result state immediately and
   the correct guess is recorded in the history.
2. **Given** the room is in result state, **When** any player's screen next
   polls or navigates, **Then** they are taken to the result screen
   automatically — no manual navigation required.
3. **Given** the result screen is displayed, **When** any player views it,
   **Then** they see the secret word that was drawn, the final score for every
   participant, and the full guess history for the round.
4. **Given** a guesser never saw the secret word during the round, **When**
   the result screen is shown, **Then** the secret word is now visible to
   them along with all other players.
5. **Given** the result screen is displayed, **When** a guesser views it,
   **Then** the result screen is read-only — no guess input is available.

---

### User Story 2 — Host Restarts to Lobby (Priority: P1)

The host can restart the game from the result screen. On restart, all
participants return to the lobby together. The participant list is preserved
exactly as it was. All round state — scores, guesses, drawer assignment, and
secret word — is cleared so the lobby is ready for a fresh round.

**Why this priority**: Without restart, the game is single-use. Players would
have to leave and rejoin for every round. Restart is what makes the room
reusable.

**Independent Test**: From the result screen, the host clicks Restart. Both
tabs navigate to the lobby. Confirm the same players are listed. Confirm scores
show 0 and no guess history exists when the new round is started.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** the host clicks
   Restart, **Then** the room returns to lobby status with all participants
   preserved.
2. **Given** the room has restarted, **When** any player views the lobby,
   **Then** all previous round state (scores, guesses, drawer, secret word)
   is cleared — the lobby shows a clean state.
3. **Given** the room has restarted, **When** the host starts a new round,
   **Then** scores begin at 0 for all participants and the guess history
   is empty.
4. **Given** a non-host player views the result screen, **When** they look
   for a restart option, **Then** no restart button is visible to them —
   only the host sees it.
5. **Given** the host restarts, **When** the non-host tabs next poll,
   **Then** they detect the lobby status and navigate to the lobby
   automatically within one poll cycle (≤2 seconds).

---

### Edge Cases

- If a player submits multiple correct guesses in rapid succession, only the
  first correct guess triggers the round-end transition — subsequent guesses
  after `status: "result"` are rejected (game is no longer active).
- Guesses submitted after the round ends must be rejected with a clear error.
- The secret word is revealed to all players on the result screen, including
  guessers who never saw it.
- The restart action is idempotent at the state level: restarting an already-
  lobby-state room is a no-op.
- Non-host players cannot trigger a restart; the backend enforces this
  regardless of what the client sends.
- Polling continues on the result screen so all players are automatically
  redirected when the host restarts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a correct guess is submitted, the backend MUST automatically
  transition the room to result state.
- **FR-002**: The room snapshot in result state MUST include the secret word
  visible to all participants — not just the drawer.
- **FR-003**: The result screen MUST display the secret word, the final score
  for every participant, and the complete guess history.
- **FR-004**: All clients MUST be automatically navigated to the result screen
  when the room enters result state — no manual action required.
- **FR-005**: The result screen MUST poll for room status every 2 seconds so
  it detects a host restart and redirects to the lobby automatically.
- **FR-006**: Guess submissions MUST be rejected when the room is not in game
  state (i.e., after the round has ended).
- **FR-007**: The backend MUST expose a restart endpoint accessible only to
  the host that resets the room to lobby state.
- **FR-008**: On restart, the backend MUST preserve the participant list and
  host identity, and MUST clear scores, guesses, drawer assignment, and
  secret word.
- **FR-009**: Only the host MUST be able to trigger a restart; non-host
  requests MUST be rejected with an authorisation error.
- **FR-010**: The restart button MUST be visible only to the host on the
  result screen.
- **FR-011**: All clients MUST be automatically redirected to the lobby within
  one poll cycle after a restart.

### Key Entities

- **Room** (extended): Gains a `"result"` status. In result state, `secretWord`
  is visible to all players in the snapshot (not just the drawer).
- **RoomStatus**: Extended from `"lobby" | "game"` to `"lobby" | "game" | "result"`.
- **Result Screen**: A dedicated view showing secret word, final scores, and
  full guess history. Host-only Restart button included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both tabs navigate to the result screen within one poll cycle
  (≤2 seconds) of the first correct guess being submitted.
- **SC-002**: The result screen shows the secret word to all players,
  including those who were guessers.
- **SC-003**: The result screen scores match the guess history — each correct
  guess in the history corresponds to 100 points for that player.
- **SC-004**: After a restart, both tabs show the lobby with the same
  participants within one poll cycle (≤2 seconds).
- **SC-005**: After a restart, starting a new round begins with all scores
  at 0 and an empty guess history — confirmed by visual inspection and
  the DevTools network response.

## Assumptions

- The round ends automatically on the first correct guess. There is no
  manual "end round" button — the system handles the transition.
- In result state, `secretWord` is returned to all clients in the snapshot,
  not just the drawer. This is the reveal moment.
- The restart resets the room to exactly the same state as just after joining
  the lobby — same participants, zero scores, no guesses, no drawer, no word.
- The result screen is a new dedicated page accessible at `/result`. The
  existing `/game` route remains unchanged.
- Polling on the result screen reuses the same `fetchRoom` mechanism already
  present on the lobby and game screens.
- No new npm dependencies are introduced for this scenario.
- "Final Validation" in the scenario name refers to end-to-end verification
  of the complete four-scenario game loop, not a separate feature.
