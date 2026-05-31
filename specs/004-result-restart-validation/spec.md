# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Given a round is active with guessers submitting guesses, When a correct guess occurs the round ends, the secret word is revealed to everyone, and round results are shown. The host can then advance to the next round (rotating the drawer). After all rounds complete, final scores are displayed and the host can restart the game."

## User Scenarios & Testing

### User Story 1 — Round Ends on Correct Guess (Priority: P1)

When a guesser submits the correct guess, the round ends immediately. The secret word is revealed to all players. The room status changes to "round_end" and the round status changes to "revealed".

**Why this priority**: Ending the round is the core transition — without it, the game cannot progress.

**Independent Test**: Start a game as a guesser, submit the correct secret word, verify the room status becomes "round_end" and the secret word is visible to all players.

**Acceptance Scenarios**:

1. **Given** an active round with a secret word, **When** a guesser submits a correct guess, **Then** the round immediately ends and room status changes to "round_end".
2. **Given** the round has ended, **When** any player views the room, **Then** the secret word is visible to all players (not just the drawer).
3. **Given** the round has ended, **When** any player views the room, **Then** the round status is "revealed" and all guesses (including the correct one) are visible.
4. **Given** the round has ended, **When** a guesser submits another guess, **Then** the guess is rejected (round is no longer active for guessing).

---

### User Story 2 — Host Advances to Next Round (Priority: P1)

After round results are displayed, the host can advance to the next round. The next player in the participant list becomes the drawer. A new secret word is selected. The canvas is cleared.

**Why this priority**: The game must be able to progress through multiple rounds.

**Independent Test**: Start a game, have a guesser submit the correct word, verify the host sees a "Next Round" button, click it, verify a new round starts with a different drawer.

**Acceptance Scenarios**:

1. **Given** the room is "round_end", **When** the host clicks "Next Round", **Then** a new round begins with status "drawing" and room status returns to "playing".
2. **Given** a new round starts, **When** players view the room, **Then** the drawer is the next participant in the list (rotating through all participants).
3. **Given** a new round starts, **When** the drawer views the room, **Then** they see a new secret word and an empty canvas.
4. **Given** the room is "round_end", **When** a non-host tries to advance the round, **Then** the action is rejected.

---

### User Story 3 — Game Over After All Rounds (Priority: P2)

After each participant has had a turn as drawer (i.e., rounds completed equals number of participants), the room status becomes "game_over". Final scores are displayed.

**Why this priority**: The game needs a definite end state, but the core loop works without it.

**Independent Test**: Play through all rounds with 2 players (2 rounds), verify the room status becomes "game_over" after the last round ends and final scores are shown.

**Acceptance Scenarios**:

1. **Given** the last round of the game has ended, **When** the host would advance to the next round, **Then** the room status becomes "game_over" instead.
2. **Given** the game is over, **When** any player views the room, **Then** they see final scores for all participants.

---

### User Story 4 — Host Restarts the Game (Priority: P2)

After the game is over, the host can restart the game. This resets all scores, clears all rounds, and returns the room to "lobby" status.

**Why this priority**: Replayability is important, but the game functions without it.

**Independent Test**: Complete a game, click "Restart Game" as host, verify scores reset to 0, room status is "lobby", and players can start a new game.

**Acceptance Scenarios**:

1. **Given** the game is over, **When** the host clicks "Restart Game", **Then** all scores reset to 0, rounds are cleared, and room status returns to "lobby".
2. **Given** the game is over, **When** a non-host tries to restart, **Then** the action is rejected.

### Edge Cases

- What happens when there are more participants than the word list? (Word selection wraps using modulo, same as existing behavior)
- What happens if the host leaves before advancing to the next round? (Room remains in "round_end" until host returns or room is abandoned)
- What happens if all players but the host disconnect during round_end? (Host can still advance, game continues)
- What happens if the restart is triggered while players are still on the game page? (Polling picks up the new lobby status, players are redirected to lobby)

## Requirements

### Functional Requirements

- **FR-001**: When a correct guess is submitted, the system MUST change the round status to "revealed" and the room status to "round_end".
- **FR-002**: In "round_end" status, the room snapshot MUST include the secret word for all viewers.
- **FR-003**: In "round_end" status, no further guesses for that round are accepted.
- **FR-004**: System MUST provide a `POST /rooms/:code/next-round` endpoint for the host to advance to the next round.
- **FR-005**: The next round's drawer MUST be the next participant in the participants array (cycling through all participants).
- **FR-006**: The next round's secret word MUST be selected deterministically using the round number (word = words[(roundNumber - 1) % wordList.length]).
- **FR-007**: The new round's canvas MUST start empty (no drawing data).
- **FR-008**: After all participants have been drawer (rounds completed >= number of participants), advancing results in room status "game_over" instead of a new round.
- **FR-009**: System MUST provide a `POST /rooms/:code/restart` endpoint for the host to reset the game.
- **FR-010**: Restart MUST reset all scores to 0, clear all rounds, and set room status to "lobby".
- **FR-011**: Only the host can advance to the next round and restart the game; non-host attempts are rejected with 403.
- **FR-012**: On the frontend, when room status is "round_end", the host sees a "Next Round" button and all players see the revealed secret word and round results.
- **FR-013**: On the frontend, when room status is "game_over", the host sees a "Restart Game" button and all players see final scores.

### Key Entities

- **Round Status**: Extended lifecycle — "drawing" → "guessing" → "revealed" (already defined).
- **Room Status**: Extended lifecycle — "lobby" → "playing" → "round_end" → "game_over" (already defined).
- **Next Round**: A new round with incremented number, rotating drawer, new word, empty drawing.
- **Game Restart**: Reset operation that clears all game state but preserves room code and participants.

## Success Criteria

- **SC-001**: A correct guess immediately ends the round and reveals the secret word to all players within one polling cycle (~2s).
- **SC-002**: The host can advance to the next round and see a new drawer and word within 2 seconds.
- **SC-003**: After all rounds complete, the game transitions to "game_over" with final scores visible.
- **SC-004**: The host can restart the game from "game_over" and return to lobby within 2 seconds.
- **SC-005**: Non-host actions for advance/restart are consistently rejected.

## Assumptions

- The drawer rotation follows the order of the participants array, cycling through each one.
- The number of rounds per game equals the number of participants (each player draws once).
- The word list is the existing STARTER_WORDS array; word selection wraps modulo-style.
- Canvas data is cleared on each new round (empty drawing array).
- After restart, players stay in the same room — no new room code is generated.
