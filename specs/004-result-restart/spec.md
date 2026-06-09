# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-09

**Status**: Draft

**Input**: README Scenario 4 — "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-09

- Q: What triggers the result state? → A: The room transitions to `"result"` automatically when all guessers have guessed correctly (handled in Scenario 3). No manual end-round action from the drawer.
- Q: What information is shown on the result screen? → A: The revealed secret word, each participant's final score, the full guess history (who guessed what and whether it was correct), and who was the drawer. The drawer is NOT revealed separately — it is already visible during gameplay.
- Q: Who can restart? → A: Only the host can restart the game, returning all participants to the lobby.
- Q: What happens to participants on restart? → A: All participants remain in the room. The room status returns to `"lobby"`. Round state (secret word, scores, guesses, canvas strokes) is cleared. The host remains host.
- Q: What happens if a non-host tries to restart? → A: The backend rejects with HTTP 403, same as starting the game.
- Q: Does the result screen need a separate route or can it be part of the GamePage? → A: The result view is rendered within `GamePage` when `room.status === "result"`. No separate route is needed.
- Q: What happens if the host refreshes during the result screen? → A: On restore, the room snapshot still shows `status: "result"` and the same data. All players still see the result. The host still sees the restart button.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - All players see result state (Priority: P1)

When the round ends, all participants need to see the outcome: the secret word, final scores, and what everyone guessed.

**Why this priority**: The result is the payoff of the round. Without it, players don't know the word or how they performed.

**Independent Test**: After all guessers have guessed correctly, all participants see the secret word revealed, final scores, and full guess history within 2 seconds of the round ending.

**Acceptance Scenarios**:

1. **Given** all guessers have guessed correctly, **when** any participant polls the room, **then** `room.status` is `"result"`, the `secretWord` is revealed to all participants, `currentRound.guesses` contains the full guess history, and `currentRound.scores` contains final scores.
2. **Given** the room is in `"result"` status, **when** a participant views the game screen, **then** they see the secret word, each participant's name and score, and the complete ordered list of guesses with correct/incorrect labels.
3. **Given** the room is in `"result"` status, **when** a participant who missed the round (joined later) views the screen, **then** they see the same result data as everyone else (the word, scores, and guess history from the completed round).

---

### User Story 2 - Host restarts the game (Priority: P1)

After the result is shown, the host can restart the game to play another round.

**Why this priority**: Restarting keeps the game going without requiring everyone to create/join a new room.

**Independent Test**: The host clicks Restart, the room returns to `"lobby"` status, all participants see the lobby within 2 seconds, and round data is cleared.

**Acceptance Scenarios**:

1. **Given** the room is in `"result"` status and the viewer is the host, **when** they click "Restart Game", **then** the backend transitions the room to `"lobby"` status, clears round state (secret word, scores, guesses, canvas), preserves all participants, and the host navigates to `/lobby`.
2. **Given** the room is in `"result"` status and the viewer is NOT the host, **when** they view the game screen, **then** they do NOT see a restart button or see it disabled, with a message "Waiting for the host to restart..."
3. **Given** the host restarts the game, **when** any participant polls the room, **then** they see `status: "lobby"` and all round-related fields are cleared. The participant list remains unchanged.

---

### User Story 3 - Full round-trip verification (Priority: P2)

A complete flow from lobby → game → result → restart → lobby works without errors.

**Why this priority**: Smoke-testing the full lifecycle catches integration bugs between all features.

**Independent Test**: Two browser tabs complete a full cycle: create room → join → start → draw → guess correctly → see result → restart → see lobby with both players.

**Acceptance Scenarios**:

1. **Given** two players are in a game, **when** the guesser guesses correctly and the round ends, **then** both see the result with the revealed word, updated scores, and guess history.
2. **Given** the host sees the result, **when** they restart, **then** both players see the lobby with the participant list intact and the start button available (enabled when ≥2 players).
3. **Given** the host restarts, **when** the host starts a new game, **then** a new round begins with a fresh canvas, empty guess history, reset scores, and a new secret word (potentially different from the previous round).

---

### Edge Cases

- A non-host sends `POST /rooms/:code/restart` directly; the backend MUST reject with HTTP 403 `{ "error": "not_host", "message": "Only the host may restart the game" }`.
- A host tries to restart a room that is not in `"result"` or `"playing"` status; the backend MUST reject with HTTP 400.
- A player refreshes during the result screen; on restore they still see the same result data.
- A player joins a room that is in `"result"` status; they should see the result screen with the revealed word, scores, and guess history.
- Scores reset to 0 on restart; the new round starts with a clean scoreboard.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-034**: System MUST display a result view when `room.status === "result"`. The result view MUST show the revealed secret word, all participants' final scores, and the complete ordered guess history.
- **FR-035**: System MUST reveal the secret word to ALL participants when the room enters `"result"` status (unlike during gameplay where it is hidden from guessers).
- **FR-036**: System MUST provide a `POST /rooms/:code/restart` endpoint that only the host may call. It MUST transition the room to `"lobby"`, preserve all participants, and clear all round-specific state (scores, guesses, canvas, secret word, drawer assignment).
- **FR-037**: System MUST reject `POST /rooms/:code/restart` with HTTP 403 if the caller is not the host.
- **FR-038**: System MUST reject `POST /rooms/:code/restart` with HTTP 400 if the room is not in `"result"` or `"playing"` status.
- **FR-039**: System MUST display a "Restart Game" button on the result screen that is visible and enabled only for the host.
- **FR-040**: System MUST display a message to non-host players on the result screen indicating they should wait for the host to restart.
- **FR-041**: System MUST clear all guess-related state (guess history, scores) and the canvas state when the game restarts.
- **FR-042**: System MUST preserve the participant list and host identity across restarts.

### Key Entities

- **Result State**: The concluding state of a round, containing the revealed word, final scores, and full guess history.
- **Restart**: The action of resetting the game from result/playing state back to lobby, preserving participants.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-016**: All participants see the result view within 2 seconds of the round ending, with the correct word, all scores, and the complete guess history.
- **SC-017**: The host can restart the game. All participants see the lobby with the preserved participant list within 2 seconds.
- **SC-018**: On restart, all round state (scores, guesses, canvas, secret word) is cleared. Scores start at 0 for the new round.
- **SC-019**: Non-host participants never see or can activate a restart control.
- **SC-020**: A complete lobby → play → result → restart → lobby cycle works without errors across two browser tabs.

## Assumptions

- The `result` view is rendered inside `GamePage` based on `room.status === "result"` — no separate route.
- The restart button is only shown on the result view (not during active gameplay).
- Scores are per-round and reset on restart. Future rounds start from 0.
- The `RoomSnapshot` interface is extended to include `canvasState` and `currentRound` (with `roundNumber`, `drawerParticipantId`, `secretWord`, `scores`, `guesses`).
- The frontend `GamePage` already handles status-conditional rendering for the three states (`"playing"`, `"result"`, and redirect on `"lobby"`).
- Deterministic word selection uses the same formula across rounds. Round 2 uses `STARTER_WORDS[(totalParticipants + 2) % 5]`, and so on.
