# Feature Specification: Round Result and Restart

**Feature Branch**: `004-round-result-restart`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Result, restart, and final validation — Shared result state visible to all players, clean restart to lobby with players preserved and round state cleared"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Round Results (Priority: P1)

After a round ends (all guessers correct or drawer reveals the word), all players automatically transition to a results view showing the secret word, each player's guess correctness, and final scores.

**Why this priority**: Results provide closure to the round. Without this, players would have no feedback on the round outcome and no indication that the game is over.

**Independent Test**: Complete a full round (drawing + guesses), end the round, and confirm all players in the room see the results screen with the correct word, guess outcomes, and scores matching the round's events.

**Acceptance Scenarios**:

1. **Given** a round has ended because all guessers guessed correctly, **When** any player polls the room state, **Then** the room state is "results" and the response includes the secret word, each player's final guess status, and all player scores
2. **Given** a round has ended because the drawer manually revealed the word, **When** any player polls the room state, **Then** the room state is "results" and the response includes which guessers had already guessed correctly before the reveal
3. **Given** the results screen is displayed, **When** the drawer views it, **Then** they see the secret word, which players guessed correctly, the final scoreboard, and a "Play Again" action
4. **Given** the results screen is displayed, **When** a guesser views it, **Then** they see the secret word for the first time, their own guess outcome, which other players guessed correctly, the scoreboard, and a "Play Again" action
5. **Given** the results screen is displayed and a new player joins the room, **When** they poll, **Then** they receive the same results data as existing players

---

### User Story 2 — Restart to Lobby (Priority: P1)

After viewing results, any player can trigger a restart that returns all players to the lobby view. The full player roster is preserved, but all round-specific data is cleared.

**Why this priority**: Restart is the mechanism to play another game with the same group. It preserves the social context while fully resetting game state.

**Independent Test**: Complete a round, trigger "Play Again" from any player, and confirm all players land in the lobby with the same players, no round artifacts, and the host can start a new game.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed, **When** any player clicks "Play Again", **Then** the room transitions to "lobby" state and all players see the lobby on their next poll
2. **Given** a restart has been completed, **When** any player polls the room, **Then** the room state is "lobby", all original players are present, and no word, drawing, guesses, or scores exist
3. **Given** a restart has been completed and the room is back in lobby, **When** the host clicks "Start Game", **Then** a new game begins with a clean slate (new word, empty canvas, no guesses, zero scores)
4. **Given** two players click "Play Again" in the same poll cycle, **When** the server processes both requests, **Then** the room transitions to lobby once and subsequent requests are no-ops
5. **Given** a player leaves the room before restart is triggered, **When** the restart completes, **Then** the departed player is no longer in the player list

---

### Edge Cases

- What happens if a player tries to submit a guess while the room is in the "results" state? The guess is rejected with an appropriate error.
- What happens if a player tries to draw on the canvas while results are displayed? The drawing action is rejected — the round is over.
- What happens if all players leave the room while on the results screen? The room remains available (with its results data) until the room cleanup mechanism removes it.
- What happens if a player joins the room mid-results? They receive the current results on their first poll.
- How does the drawer reveal action interact with the results state? The reveal action (from spec 003) ends the round; the results state is then entered automatically.
- What happens when "Play Again" is triggered but the host has already left? The room still restarts; host reassignment follows existing rules from room setup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round ends (by any termination condition), the system MUST transition the room to a "results" state
- **FR-002**: The results state MUST expose the secret word, per-player guess correctness, and final scores to all players via HTTP polling
- **FR-003**: The results state MUST be the same for all players in the room (consistent view)
- **FR-004**: The system MUST provide a "Play Again" action available to any player while in the results state
- **FR-005**: When "Play Again" is triggered, the system MUST transition the room back to the "lobby" state (equivalent to the pre-game lobby)
- **FR-006**: When restarting, the system MUST preserve all current players in the room's player list
- **FR-007**: When restarting, the system MUST clear all round-specific data: secret word, drawing strokes, guess history, and player scores
- **FR-008**: The "Play Again" action MUST be idempotent — if two players trigger it simultaneously, the room transitions once and subsequent calls are no-ops
- **FR-009**: The system MUST reject guess submissions while the room is in the "results" state
- **FR-010**: The system MUST reject drawing actions (strokes, clear) while the room is in the "results" state
- **FR-011**: A player who joins a room in the "results" state MUST receive the complete results data on their first poll
- **FR-012**: After restart, the room state MUST be functionally identical to a freshly created lobby (same players, same host, no game data) — the host can start a new game

### Key Entities

- **Room State**: The current phase of a room. Extended to include "results" (in addition to existing "lobby" and "in-progress"). Represents the post-round display phase.
- **Round Result**: Immutable snapshot created when the round ends. Contains the secret word, per-player guess outcomes (who guessed correctly), and final scores. Exposed to all players via polling.
- **Restart Action**: A player-triggered action that transitions the room from "results" to "lobby", clearing round-scoped data while preserving the player list and host assignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results screen within 3 seconds of the round ending (one poll cycle)
- **SC-002**: Every player in the room sees the same secret word, guess outcomes, and scores at any given point during the results phase
- **SC-003**: A "Play Again" action returns all players to the lobby view within 3 seconds of the action
- **SC-004**: After restart, polling the room returns lobby state with all original players present and no round data (word, drawing, guesses, scores all absent)
- **SC-005**: A player cannot submit guesses or drawing actions while the room is in the results state — such actions are always rejected
- **SC-006**: Triggering "Play Again" from two players simultaneously results in exactly one state transition and no data corruption

## Assumptions

- The room state machine follows the cycle: lobby → in-progress → results → lobby
- Round results persist indefinitely until "Play Again" is triggered (no auto-dismiss timer — timers are out of scope)
- Any player can trigger "Play Again" during the results phase (host-only restriction applies only to game start from lobby)
- Polling continues during the results phase at the same interval as other game phases
- This feature builds on the existing room, player, round-end, and game state infrastructure from prior specs (001, 002, 003)
- "Play Again" is the only mechanism to leave the results screen (no manual navigation or browser back button handling)
- The existing room cleanup mechanism (removing inactive rooms) still applies during the results phase
