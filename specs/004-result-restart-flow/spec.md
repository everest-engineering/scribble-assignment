# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-flow`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "#### Scenario 4 — Result, Restart & Final Validation — Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing

### User Story 1 — Round Ends and All Players See the Result Screen (Priority: P1)

When the round ends — because a guesser answered correctly or the host ends the round — every participant (drawer and all guessers) is automatically transitioned to a result screen. The result screen displays the correct word that was being drawn, the final scores for all players, and the complete guess history for the round.

**Why this priority**: This is the core payoff moment of the game loop. Without a visible result state, players have no confirmation the round ended, no closure on the correct word, and no shared awareness of scores. Everything else in this feature depends on a round being in the `"ended"` state.

**Independent Test**: Start a game with two browser tabs. In the guesser tab, submit the correct word. Both tabs should automatically transition from `GamePage` to a result/summary view showing: the revealed correct word, a ranked score list, and all submitted guesses. No manual navigation should be required.

**Acceptance Scenarios**:

1. **Given** a round is `"playing"` and a guesser submits the correct word, **When** the server records the correct guess, **Then** the room's status transitions to `"ended"` immediately (first correct answer wins), `revealedWord` is set, and no further guesses are accepted.
2. **Given** the room status is `"ended"`, **When** any participant's poll fires, **Then** their UI automatically navigates to the result screen without any user action.
3. **Given** the result screen is displayed, **When** a participant views it, **Then** they see: the correct word, the full guess history (all guesses in chronological order, with submitter names and correct/incorrect indicators), and a scoreboard with all participants ranked by final score.
4. **Given** the result screen is displayed, **When** a non-host participant views it, **Then** the "Restart Game" control is not visible to them — only the host can trigger a restart.

---

### User Story 2 — Host Ends the Round Manually (Priority: P1)

The host can choose to end the round at any time (e.g., time is up, no one is guessing) without waiting for a correct guess. This produces the same `"ended"` state as a correct guess, displaying the result screen to all players.

**Why this priority**: Without a manual end mechanism, a round can never end if no one guesses correctly. This makes the game unplayable beyond the first round. It is P1 alongside US1 because both are required for the `"ended"` state to be reachable in all game conditions.

**Independent Test**: Start a game. Do not submit a correct guess. In the host tab, click "End Round". Both tabs should navigate to the result screen showing the word that was never guessed.

**Acceptance Scenarios**:

1. **Given** the room status is `"playing"`, **When** the host calls the end-round action, **Then** the room status changes to `"ended"` and `revealedWord` is set to `currentWord`.
2. **Given** the room status is `"playing"` and a non-host participant calls the end-round action, **Then** the server returns a 403 error and the room status is unchanged.
3. **Given** the room status is NOT `"playing"` (e.g., `"lobby"` or `"ended"`), **When** anyone calls the end-round action, **Then** the server returns an appropriate error (409) and the status is unchanged.

---

### User Story 3 — Host Restarts the Game and All Players Return to Lobby (Priority: P2)

From the result screen, the host can restart the game. On restart, the room returns to `"lobby"` status with all current participants preserved. All round-specific state is cleared: `strokes`, `guesses`, `scores`, `currentWord`, `currentDrawerId`, `roundNumber`, and `revealedWord` are all reset. All participants (including those who were not the host) are automatically navigated back to the lobby page.

**Why this priority**: P2 because the game is still fully playable as a one-shot experience without restart. Restart adds replayability and is the natural next step after the result screen, but it is not required for the MVP result display.

**Independent Test**: After the result screen appears, click "Restart Game" in the host tab. Both tabs should navigate back to `LobbyPage`. All participant names should still be present. The word, canvas, guesses, and scores from the previous round should no longer appear.

**Acceptance Scenarios**:

1. **Given** the room status is `"ended"`, **When** the host calls the restart action, **Then** the room status becomes `"lobby"`, all participants are preserved, and `strokes`, `guesses`, `scores` (reset to zero — not cumulative), `currentWord`, `currentDrawerId`, `roundNumber`, and `revealedWord` are all cleared/reset to initial values.
2. **Given** the room status is `"ended"` and a non-host calls the restart action, **Then** the server returns a 403 error and the room status is unchanged.
3. **Given** the room status is `"lobby"` after restart, **When** any participant's poll fires, **Then** they are automatically navigated to `LobbyPage` (not `GamePage`).
4. **Given** the room status is NOT `"ended"` (e.g., `"playing"` or `"lobby"`), **When** the host calls the restart action, **Then** the server returns 409 and the status is unchanged.

---

### Edge Cases

- What happens when the correct guess fires and the host simultaneously ends the round — does the status transition twice or is the first write authoritative?
- What happens when a participant navigates away during the result screen — do they re-enter the correct page on reconnect (via poll)?
- What happens when the host closes the browser during `"ended"` state — can another tab still see the result?
- What does the result screen show if `revealedWord` is somehow absent (e.g., legacy room data)?
- What happens if a restart is attempted while the room is `"playing"` (not `"ended"`)?

## Requirements

### Functional Requirements

- **FR-001**: The system MUST expose an end-round action (`POST /rooms/:code/end`) callable only by the host.
- **FR-002**: The end-round action MUST transition the room status from `"playing"` to `"ended"` and set `revealedWord` to the value of `currentWord` at the moment of ending.
- **FR-003**: When the **first** guesser submits a correct guess (feature 003), the system MUST automatically transition the room status to `"ended"` and set `revealedWord`, as part of the same `submitGuess` operation. The round ends immediately — no further guesses are accepted and no other participant can score for that round.
- **FR-004**: The system MUST expose a restart action (`POST /rooms/:code/restart`) callable only by the host.
- **FR-005**: The restart action MUST transition the room status from `"ended"` to `"lobby"` and clear all round-specific fields: `strokes`, `guesses`, `scores` (reset to zero / empty — no cumulative scoring across restarts), `currentWord`, `currentDrawerId`, `roundNumber`, and `revealedWord`. Each restart begins a completely fresh game.
- **FR-006**: The restart action MUST preserve all participants in the room (no participants are removed).
- **FR-007**: The `RoomSnapshot` MUST include a `revealedWord` field when `status === "ended"`, containing the word that was being drawn.
- **FR-008**: The `RoomSnapshot` MUST include `guesses`, `scores`, and `strokes` when `status === "ended"`, so the result screen can display full history and final scores.
- **FR-009**: A non-host participant attempting the end-round or restart action MUST receive a 403 error; the room MUST NOT be modified.
- **FR-010**: The end-round action on a room that is not `"playing"` MUST return a 409 error.
- **FR-011**: The restart action on a room that is not `"ended"` MUST return a 409 error.
- **FR-012**: The frontend MUST automatically navigate all participants to `/result/:code` when the polled `RoomSnapshot.status` is `"ended"`, without requiring user action.
- **FR-013**: The frontend MUST automatically navigate all participants back to `LobbyPage` when the polled `RoomSnapshot.status` returns to `"lobby"` after having been `"ended"`.
- **FR-014**: The result screen MUST display the `revealedWord`, the full chronological guess history with submitter names and correct/incorrect indicators, and a ranked scoreboard.
- **FR-015**: The "End Round" button MUST be visible only to the host on `GamePage` (during `"playing"` status).
- **FR-016**: The "Restart Game" button MUST be visible only to the host on the result screen (during `"ended"` status).

### Key Entities

- **Round Result**: Represents the snapshot of a completed round. Key data: `revealedWord` (the word that was drawn), `guesses` (full list), `scores` (final per-player totals). Part of `RoomSnapshot` when `status === "ended"`.
- **Room** (modified): Gains a new status value `"ended"` and a new field `revealedWord?: string`. The `strokes`, `guesses`, and `scores` fields already added in feature 003 are retained and included in the result snapshot.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After a correct guess, both the drawer's and the guesser's screens display the result view within ≤2 seconds (one poll cycle) — no manual navigation required.
- **SC-002**: After the host clicks "End Round", all participant screens display the result view within ≤2 seconds.
- **SC-003**: The result screen correctly displays the revealed word, all submitted guesses (with submitter names), and the final ranked scoreboard for 100% of completed rounds.
- **SC-004**: After the host clicks "Restart Game", all participant screens return to the lobby within ≤2 seconds, with all participant names preserved and all round data absent.
- **SC-005**: Non-host participants cannot trigger end-round or restart — 100% of unauthorized attempts are rejected with an error response and cause no state change.

## Assumptions

- The existing 2-second polling interval from feature 003 is the sole sync mechanism — no new polling logic is needed; status transitions propagate to all participants within one poll cycle.
- A round ends in exactly two ways: a correct guess (automatic, triggered by `submitGuess`) or the host manually ending it (`POST /rooms/:code/end`). There is no time-based round expiry.
- `revealedWord` is added to the `Room` model as an optional field. It is populated on round end and cleared on restart, following the same pattern as `currentWord`.
- The result screen is a new page/component (`ResultPage`) mounted at the route `/result/:code`, rather than a modal or overlay on `GamePage`. This keeps navigation state explicit: `GamePage` navigates to `/result/:code` on status `"ended"`, and `ResultPage` navigates back to `/lobby/:code` on status `"lobby"`.
- `RoomStatus` must be extended to include `"ended"` as a third valid value.
- The host identity is determined by `room.hostId === participantId` — no separate permission system.
- Re-using the existing `participants` array for the scoreboard on the result screen is sufficient; no need to archive participants outside the room.
- On restart, the drawer for the next round will be the host again (same logic as `startRoom()`), consistent with feature 002 behaviour.
- Accessibility: the result screen's revealed word and result summary should be readable to screen readers; `aria-live` or focus management is out of scope unless trivially achievable.

## Clarifications

### Session 2026-06-03

- Q: Is the intended behaviour that the first correct guess immediately ends the round for all participants (only the winner scores), or does a correct guess award points without ending the round? → A: First correct guess ends the round immediately — all other guessers stop; only the winner scores (Option A).
- Q: Should scores reset to zero on restart (fresh game) or accumulate across restarts (multi-round match)? → A: Scores reset to zero on restart — each restart is a completely fresh game (Option A).
- Q: Should the result screen be a dedicated route or rendered inside `GamePage`? → A: Dedicated route `/result/:code` (Option A).
