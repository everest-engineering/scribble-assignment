# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `assignment`

**Created**: 2026-05-28

**Status**: Draft

**Feature Directory**: `specs/004-result-restart`

---

## Overview

After a round ends, all players see a shared result screen showing the correct
word, final scores, and the full guess history. The host can restart the game,
which returns all players to the lobby with the same participant list but all
round state cleared (no guesses, no scores, no drawer, no secret word, status
back to "lobby").

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — End Round & Show Result Screen (Priority: P1)

The host ends the round by clicking "End Round". The room transitions to
`"result"` status. All players are automatically navigated to a result screen
(via polling) showing the correct word, final scores, and full guess history.

**Why this priority**: The result screen is the natural conclusion of every round
and the gate before restart. Nothing in this group works without the transition.

**Independent Test**: In a live game, host clicks End Round. Both tabs navigate
to the result screen showing "rocket", the scoreboard, and all guesses within
~2 seconds.

**Acceptance Scenarios**:

1. **Given** the game is in `"playing"` status and the host clicks End Round,
   **When** `POST /rooms/:code/end` is called with the host's `participantId`,
   **Then** the room status transitions to `"result"` and returns the updated
   snapshot.

2. **Given** the room status becomes `"result"`, **When** any player's poll
   detects this change, **Then** they are automatically navigated to the result
   screen.

3. **Given** the result screen is shown, **When** any player views it, **Then**
   they see: the correct word (`"rocket"`), all participants with their final
   scores, and the complete guess history in submission order.

4. **Given** a non-host player is on the result screen, **When** they view it,
   **Then** they see the result data but do not see a Restart button.

---

### User Story 2 — Host Restarts to Lobby (Priority: P1)

The host clicks Restart on the result screen. The room transitions back to
`"lobby"` status with all participants preserved but all round state cleared.
All players are navigated back to the lobby.

**Why this priority**: Without restart, the game is single-use. Restart completes
the full game loop.

**Independent Test**: After the result screen appears, host clicks Restart. Both
tabs return to the lobby showing the same player list but scores at 0, no guess
history, and no secret word.

**Acceptance Scenarios**:

1. **Given** the room is in `"result"` status and the host clicks Restart,
   **When** `POST /rooms/:code/restart` is called with the host's `participantId`,
   **Then** the room status transitions to `"lobby"` and all round state is
   cleared: `guesses = []`, `scores = {}`, `drawerId = undefined`,
   `secretWord = undefined`.

2. **Given** the restart completes, **When** any player's poll detects
   `status === "lobby"`, **Then** they are automatically navigated back to the
   lobby.

3. **Given** the lobby is shown after restart, **When** any player views it,
   **Then** the full participant list is preserved (no one was removed) and the
   Start Game button reflects the correct host/player-count state.

4. **Given** a non-host player is on the result screen, **When** they view it,
   **Then** no Restart button is shown to them.

---

### Edge Cases

- Non-host calling `POST /rooms/:code/end` or `/restart`: server returns 403.
- Calling `/end` when status is not `"playing"`: server returns 400.
- Calling `/restart` when status is not `"result"`: server returns 400.
- Player navigating away from result screen manually: allowed; they may miss
  the auto-navigate on restart.
- Game screen poll detecting `status === "result"`: auto-navigates to result
  screen (wires Group 3 polling to this transition).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /rooms/:code/end` MUST accept `{ participantId }`, validate
  the caller is the host (403 otherwise), validate status is `"playing"` (400
  otherwise), set status to `"result"`, and return the updated snapshot.
- **FR-002**: `POST /rooms/:code/restart` MUST accept `{ participantId }`,
  validate the caller is the host (403 otherwise), validate status is `"result"`
  (400 otherwise), reset status to `"lobby"`, clear `guesses`, `scores`,
  `drawerId`, and `secretWord`, and return the updated snapshot.
- **FR-003**: The result screen MUST be accessible at `/result` and display:
  the correct word, all participants with final scores, and full guess history.
- **FR-004**: The result screen MUST show a Restart button only to the host.
- **FR-005**: The game screen polling (Group 3) MUST auto-navigate to `/result`
  when it detects `status === "result"`.
- **FR-006**: The result screen MUST poll `GET /rooms/:code` every ~2 seconds;
  when `status === "lobby"` is detected, all players auto-navigate to `/lobby`.
- **FR-007**: After restart, participants array MUST be unchanged — all players
  who were in the room before restart remain in the room.

### Key Entities

- **Room state after `end`**: status = `"result"`; guesses, scores, drawerId,
  secretWord all preserved for display.
- **Room state after `restart`**: status = `"lobby"`; guesses = `[]`;
  scores = `{}`; drawerId = `undefined`; secretWord = `undefined`;
  participants unchanged.

---

## Success Criteria *(mandatory)*

- **SC-001**: Both players see the result screen with correct word, final scores,
  and full guess history within ~2 seconds of the host clicking End Round.
- **SC-002**: Non-hosts do not see the Restart button on the result screen.
- **SC-003**: After the host clicks Restart, both players return to the lobby
  within ~2 seconds with the same participant list and all round state gone.
- **SC-004**: The full game loop — lobby → game → result → lobby — works end-to-end
  in two browser tabs without any manual page refresh.

---

## Assumptions

- The "End Round" trigger is a host-only button on the game screen (not automatic).
- There is no timer or automatic end — the host decides when the round is over.
- The result screen is a new route `/result` with its own page component.
- Polling on the result screen reuses the same `fetchRoom` pattern as lobby/game.
- `POST /rooms/:code/restart` does not reset participants — only round state.
- After restart, non-host players' lobby poll detects `status === "lobby"` and
  auto-navigates (same pattern as the playing transition in Group 1).
- The host navigates to `/lobby` immediately on restart success (same pattern as
  start game navigating host to `/game`).
