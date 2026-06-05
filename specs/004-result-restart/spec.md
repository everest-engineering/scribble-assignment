# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-05

**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — End Round and Show Results (Priority: P1)

The host can end the active round at any time by clicking an "End Round" button. This
transitions all players to a shared result screen showing the secret word, every player's
final score, and the complete guess history.

**Why this priority**: The result screen is the output of the gameplay loop. Without it,
players have no way to see the outcome of the round, and the restart flow has no starting
point.

**Independent Test**: With a game in progress, click End Round in the host's tab. Confirm
both tabs display the result screen with the secret word, all scores, and all guesses.

**Acceptance Scenarios**:

1. **Given** the game is active, **When** the host clicks End Round, **Then** the room
   status transitions to a result state and all players see the result screen.

2. **Given** the result screen is displayed, **When** any player views it, **Then** they
   see the secret word that was used for the round.

3. **Given** the result screen is displayed, **When** any player views it, **Then** they
   see every participant's final score.

4. **Given** the result screen is displayed, **When** any player views it, **Then** they
   see the complete guess history in submission order, with correct and incorrect guesses
   visually distinguished.

5. **Given** the game is active and the player is not the host, **When** they view the
   game screen, **Then** they see no End Round button.

---

### User Story 2 — Restart to Lobby (Priority: P1)

From the result screen, the host can restart the game. All players return to the lobby
with the same participant list. All round state (canvas, guesses, scores, word, drawer)
is cleared. The room is ready for a new game.

**Why this priority**: Without restart, the game is a dead end after one round. Restart
closes the game loop and allows re-play without re-creating the room.

**Independent Test**: On the result screen, host clicks Restart. Both tabs land back on
the lobby screen showing all participants still listed, Start Game button present and
disabled (need 2 players). Start a new game — confirm scores are 0 and canvas is blank.

**Acceptance Scenarios**:

1. **Given** the result screen is displayed, **When** the host clicks Restart, **Then**
   all players navigate to the lobby screen.

2. **Given** a restart has just occurred, **When** the lobby loads, **Then** all players
   who were present in the previous round are still listed as participants.

3. **Given** a restart has just occurred and a new game is started, **When** the game
   screen loads, **Then** all scores are 0, the canvas is blank, and the guess history
   is empty.

4. **Given** the result screen is displayed and the player is not the host, **When** they
   view the result screen, **Then** they see no Restart button or it is non-interactive.

---

### Edge Cases

- A non-host player tries to end the round (e.g., via direct API call) — the backend
  MUST reject with a 403 error.
- A non-host player tries to restart (e.g., via direct API call) — the backend MUST
  reject with a 403 error.
- The host closes the browser tab during an active game — other players remain on the
  game screen; no automatic round-end or host migration is required.
- A player who was in the game refreshes on the result screen — they see the result
  screen again (the room is in result state, not lobby).
- The host restarts and then the room transitions to lobby — guessers who were polling
  the game screen should detect the status change and navigate to the lobby automatically.
- After restart, the word is still "rocket" (same deterministic selection applies to the
  new round).

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST expose an "End Round" action available only to the host
  during an active game.
- **FR-002**: Triggering End Round MUST transition the room status to a result state.
- **FR-003**: All players MUST be able to see the result state via polling; they MUST
  navigate to the result screen automatically when the status changes.
- **FR-004**: The result screen MUST display the secret word that was used in the round.
- **FR-005**: The result screen MUST display each participant's final score.
- **FR-006**: The result screen MUST display the complete guess history in submission
  order, with correct and incorrect guesses visually distinguished.
- **FR-007**: Only the host MAY trigger End Round; non-host attempts MUST be rejected.
- **FR-008**: The system MUST expose a "Restart" action available only to the host on
  the result screen.
- **FR-009**: Triggering Restart MUST transition the room status back to `"lobby"` and
  clear all round state: canvas strokes, guesses, scores, current word, and drawer
  assignment.
- **FR-010**: After restart, all participants from the previous round MUST remain in the
  room.
- **FR-011**: All players MUST navigate to the lobby automatically when a restart is
  detected via polling.
- **FR-012**: Only the host MAY trigger Restart; non-host attempts MUST be rejected.

### Key Entities

- **RoomStatus** (extended): adds `"result"` to the existing `"lobby" | "active"` union.
- **Room** (on End Round): status becomes `"result"`; all other fields unchanged.
- **Room** (on Restart): status becomes `"lobby"`; `canvasStrokes`, `guesses`, `scores`,
  `currentWord`, `drawerId` are all cleared (set to empty/undefined); `participants` and
  `hostId` are preserved.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: In a two-tab test, clicking End Round in the host tab causes both tabs to
  display the result screen within ~3 seconds.
- **SC-002**: The result screen shows the secret word, all scores, and all guesses — 100%
  of the time across all manual test runs.
- **SC-003**: Clicking Restart returns both tabs to the lobby screen with all participants
  listed, within ~3 seconds.
- **SC-004**: A new game started after a restart begins with all scores at 0, an empty
  canvas, and no guess history.
- **SC-005**: 100% of the acceptance scenarios in this spec pass when tested manually
  with two browser tabs.

---

## Assumptions

- Scenarios 1–3 are fully implemented and passing.
- The round ends only when the host explicitly triggers it — there is no automatic timer
  or "all guessers guessed" trigger in scope.
- The polling loops already running on the game screen detect the `"result"` status and
  navigate to the result screen; no separate polling is needed.
- The result screen is a new page (or a conditional render on the game screen) that shows
  the post-round summary.
- After restart, the polling on the result/lobby screen detects `status === "lobby"` and
  navigates accordingly.
- The `currentWord` on the result screen is the word stored in `room.currentWord` at the
  time of End Round; it does not need to be separately recorded.
- Multi-round drawer rotation is out of scope; if a new game starts after restart, the
  same host is the drawer again.
