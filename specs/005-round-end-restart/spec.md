# Feature Specification: Round End — Results Display and Lobby Restart

**Feature Branch**: `005-round-end-restart`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — All Players See the Round Results (Priority: P1)

When the host ends the round, every player's screen transitions from the game view to a results screen. The results screen shows three things: the correct word (the word the drawer was drawing), the final scoreboard (each player's name and total score), and the full guess history (every guess submitted during the round, in order, with a correct/incorrect label). Players do not need to refresh — the results appear automatically within 2 seconds of the host ending the round.

**Why this priority**: This is the primary payoff of the game. Without seeing the results, players have no feedback on who guessed correctly or what the word was. It is the foundational requirement for the restart flow to make sense.

**Independent Test**: Two tabs open — Tab A (host/drawer) and Tab B (guesser). Tab B submits "pizza" (incorrect) then "rocket" (correct). Host clicks "End Round" on Tab A. Within 2 seconds, both Tab A and Tab B display a result screen showing: (1) "The word was: rocket", (2) scores — Tab A player with 0, Tab B player with 100, (3) guess history — "pizza ✗", "rocket ✓".

**Acceptance Scenarios**:

1. **Given** the game is active with at least one guess submitted, **When** the host clicks "End Round", **Then** all players see a result screen within 2 seconds (via polling).
2. **Given** the result screen is displayed, **When** any player views it, **Then** they see the correct word prominently labelled (e.g., "The word was: rocket").
3. **Given** the result screen is displayed, **When** any player views the scoreboard section, **Then** each participant is listed with their final score (number of correct guesses × 100), and the list is sorted from highest to lowest score.
4. **Given** the result screen is displayed, **When** any player views the guess history section, **Then** every guess submitted during the round is shown in submission order with the guesser's name, guess text, and correct/incorrect indicator.
5. **Given** no guesses were submitted during the round, **When** the result screen is shown, **Then** all players show a score of 0 and the guess history section shows "No guesses submitted."

---

### User Story 2 — Host Restarts; Everyone Returns to Lobby (Priority: P1)

On the result screen, the host sees a "Play Again" button. Clicking it resets the room: all players are returned to the lobby, the room is ready for a new round, and all previous round data (guesses, scores) is cleared. Non-host players do not have a "Play Again" button — they see a waiting message until the host restarts. Once the host restarts, all players are taken back to the lobby automatically within 2 seconds.

**Why this priority**: The restart completes the game loop. Without it, the game is a one-shot experience. This story is inseparable from Story 1 in terms of user value — results are only meaningful if the game can continue.

**Independent Test**: After the result screen from Story 1 is displayed: Tab B (guesser) sees "Waiting for host to start a new round…" and no restart button. Tab A (host) sees "Play Again". Host clicks "Play Again". Within 2 seconds, both Tab A and Tab B display the lobby. The lobby shows both players. The lobby shows 0 guesses for any future round (no residual history). Starting a new game again works normally.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** a non-host player views it, **Then** they see a "Waiting for host to start a new round…" message and no restart button.
2. **Given** the result screen is displayed, **When** the host views it, **Then** they see a clearly labelled "Play Again" button.
3. **Given** the host clicks "Play Again", **When** the restart completes, **Then** all players see the lobby screen within 2 seconds (via polling).
4. **Given** the restart has completed, **When** any player views the lobby, **Then** all prior participants are still listed — no player has been removed.
5. **Given** the restart has completed, **When** the host starts a new game, **Then** all scores start at 0 and there is no guess history visible from the previous round.
6. **Given** the restart has completed, **When** a new game starts, **Then** the same word ("rocket") is the secret word for the new round (deterministic selection is preserved).

---

### Edge Cases

- What if the host closes the browser during the result screen? Guessers remain on the result screen until a new host session is established; this is out of scope — the host is assumed to remain connected.
- What if a player joins the room during the result screen? Joining during an "ended" round is out of scope; the join endpoint is unmodified and may return the result state, which is sufficient.
- What happens if the host clicks "End Round" when no guesses were submitted? The result screen still appears, showing all scores at 0 and an empty guess history.
- Can the host end the round multiple times? No — the "End Round" button is only present when the room status is "active"; it is not shown on the result screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "End Round" button visible only to the host, and only while the game is in the active state.
- **FR-002**: System MUST transition the room to a "ended" state when the host clicks "End Round".
- **FR-003**: System MUST display a result screen to all players when the room is in the "ended" state; the result screen replaces the game view.
- **FR-004**: System MUST display the correct word on the result screen, labelled clearly (e.g., "The word was: [word]").
- **FR-005**: System MUST display each participant's final score on the result screen, sorted from highest to lowest.
- **FR-006**: System MUST display the full guess history on the result screen, in submission order, with each entry showing guesser name, guess text, and correct/incorrect status.
- **FR-007**: System MUST display a "Waiting for host to start a new round…" message to non-host players on the result screen; no restart button is shown to them.
- **FR-008**: System MUST display a "Play Again" button to the host on the result screen.
- **FR-009**: System MUST reset the room to "lobby" status when the host clicks "Play Again".
- **FR-010**: System MUST clear all round data (guess history) when the room is reset to lobby.
- **FR-011**: System MUST preserve all participants in the room after a restart — no player is removed.
- **FR-012**: System MUST return all players to the lobby screen within 2 seconds of the host clicking "Play Again" (via polling).

### Key Entities *(include if feature involves data)*

- **RoundResult** (derived): Not stored separately — computed on demand from room state when status is "ended". Contains: the correct word (`availableWords[0]`), final scores (computed from guesses), and the full guess history.
- **Room** (extended): Gains a new status value — `"ended"` — in addition to the existing `"lobby"` and `"active"` statuses. The `"ended"` status signals all clients to display the result screen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the result screen within 2 seconds of the host ending the round — verified by observing two browser tabs update within the polling interval.
- **SC-002**: The correct word displayed on the result screen matches the word the drawer was given — 100% accuracy, verifiable by comparing the displayed word to the known starter list entry.
- **SC-003**: All player scores on the result screen equal the number of correct guesses × 100 — no score discrepancy between players' views.
- **SC-004**: All players see the lobby screen within 2 seconds of the host clicking "Play Again" — verifiable with two-tab testing.
- **SC-005**: After restart, 0 guesses from the previous round appear in any subsequent game session — complete state reset is verifiable by starting a new game and checking the activity panel.
- **SC-006**: After restart, all players who were present before the restart remain in the lobby — 100% player retention across a restart.

## Assumptions

- "End Round" is triggered exclusively by the host via a button click — there is no automatic round-end trigger (no timers, no auto-end on correct guess per constitution Principle V).
- The "ended" status is a new third value for `RoomStatus` (alongside existing "lobby" and "active").
- The correct word is always `availableWords[0]` ("rocket"), consistent with features 003 and 004.
- All round data stored in memory is cleared on restart — guesses array is reset to `[]` and status reverts to "lobby".
- The restart does NOT reassign the host or change who the drawer would be in the next round — the host role remains with the same player.
- Non-host players poll the same room endpoint as during the game; the `"ended"` status in the response triggers the result screen client-side.
- Players who navigate directly to the game URL when the room is in "ended" status see the result screen (same redirect logic as the active game screen).
- The word selection for new rounds remains deterministic: `availableWords[0]` — the same word is used each time (per constitution Principle III).
