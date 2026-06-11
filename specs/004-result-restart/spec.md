# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-11

- Q: How should the "result" state be represented in the room lifecycle? → A: Option A — New `"result"` room status, distinct from `"playing"` and `"lobby"`. RoomStatus becomes `"lobby" | "playing" | "result"`.

## User Scenarios & Testing

### User Story 1 - Round Results Display (Priority: P1)

When a round ends, all participants transition to a result view showing the correct word, final scores for every participant, and the complete guess history from the round just played. Every participant sees the same information.

**Why this priority**: The result state is the natural conclusion of each round — players need closure on what the word was, how everyone scored, and what guesses were made. Without this, the game feels incomplete after guessing ends.

**Independent Test**: Play a round until all guessers guess correctly. Verify every participant's screen changes to show the correct word, a list of scores for all participants, and the full guess history.

**Acceptance Scenarios**:

1. **Given** a round is active with guessers, **When** all guessers have submitted a correct guess, **Then** the round stays in playing state — only the host's "Reveal & End Round" action transitions to result state
2. **Given** a round is active, **When** the host clicks "Reveal & End Round", **Then** the round transitions to result state
3. **Given** the round is in result state, **When** any participant views the game page, **Then** they see the correct word displayed to all
4. **Given** the round is in result state, **When** any participant views the game page, **Then** they see final scores for all participants
5. **Given** the round is in result state, **When** any participant views the game page, **Then** they see the complete guess history with who guessed what and whether each guess was correct or incorrect

---

### User Story 2 - Restart to Lobby (Priority: P2)

After the result state is displayed, the host can restart the game. All participants return to the lobby with the same players still in the room. All round-specific data (strokes, guesses, scores, round number, secret word) is cleared.

**Why this priority**: Restart allows continuous gameplay sessions without recreating rooms. Players preserved means groups stay together. However, the game functions without restart (players can create a new room manually), making this enhancement over the core result display.

**Independent Test**: After a round ends in result state, the host clicks restart. Verify all participants see the lobby view, all players are still in the room, and no round data remains visible.

**Acceptance Scenarios**:

1. **Given** the round is in result state, **When** the host clicks restart, **Then** all participants see the lobby view
2. **Given** the host has restarted, **When** any participant views the lobby, **Then** all previous participants are still in the room
3. **Given** the host has restarted, **When** any participant views the lobby, **Then** no round information (secret word, scores, guess history, strokes) is visible
4. **Given** the host has restarted, **When** any participant views the lobby, **Then** the room status is "lobby" and a new game can be started

---

### Edge Cases

- What happens if a player joins during the result state? (They see the result state alongside existing participants)
- What happens if the host disconnects during result state? (Another host cannot be promoted — round persists in result state until a host restarts; this is consistent with existing host-locked actions)
- Can non-host participants restart? (No — restart is host-only, matching existing start-game access control)
- What happens if a guesser hasn't guessed correctly when the host manually ends the round? (The round ends anyway; all participants see the correct word and scores based on guesses made so far)
- What happens to scores across restarts? (Scores are cleared on restart — each game session starts fresh)

## Requirements

### Functional Requirements

- **FR-001**: System MUST detect when all active guessers have submitted correct guesses but MUST NOT auto-transition — result state is entered only via host "Reveal & End Round" action
- **FR-002**: Host MUST be able to manually end the round at any time via a "Reveal & End Round" action, transitioning to result state
- **FR-003**: When round ends (auto or manual), all participants MUST see the correct word
- **FR-004**: When round ends, all participants MUST see final scores for every participant
- **FR-005**: When round ends, all participants MUST see the complete guess history from the round (who guessed what, and whether each was correct)
- **FR-006**: In result state, the host MUST see a "Restart" action
- **FR-007**: When the host restarts, all participants MUST be returned to the lobby view
- **FR-008**: On restart, all participants MUST remain in the room (player list preserved)
- **FR-009**: On restart, all round-specific state MUST be cleared (strokes, guesses, scores, round number, secret word, drawer assignment)
- **FR-010**: On restart, room status MUST become "lobby" and a new game can be started via existing start-game flow
- **FR-011**: System MUST sync result state and restart transitions to all participants via existing polling mechanism

### Key Entities

- **Room Status**: Lifecycle is represented as `"lobby" → "playing" → "result" → "lobby"`. The `"result"` status is a distinct room state (not a flag on `"playing"`). The RoomStatus type becomes `"lobby" | "playing" | "result"`.
- **Round Result**: The end-of-round view containing the correct word, final scores per participant (accumulated from correct guesses during the round), and the complete guess history ordered by submission time. Active when `room.status === "result"`.
- **Game Restart**: The transition from `"result"` status back to `"lobby"` status, clearing all round-specific data while preserving the participant list. Only the host can initiate restart.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Result state (correct word, scores, history) is visible to all participants within one polling cycle (2 seconds) of round ending
- **SC-002**: Restart to lobby propagates to all participants within one polling cycle
- **SC-003**: All participants see identical final scores and guess history in result state
- **SC-004**: Player list is identical before restart and after restart — no participants are lost

## Assumptions

- A round ends only when the host clicks "Reveal & End Round". The previous feature explicitly deferred round-end to this feature. Even if all guessers have guessed correctly, the round stays in playing state until the host reveals.
- All guessers being correct is determined by checking each non-drawer participant has at least one correct guess in the current round's guess list.
- The drawer is excluded from guessing and therefore not counted in "all guessers correct" detection.
- Scores are computed from correct guesses during the round (100 points each), consistent with the scoring model from the Gameplay Interaction feature.
- The restart action is available exclusively to the host, matching the existing pattern where only the host can start a game.
- The existing 2-second polling mechanism is sufficient for syncing result state and restart transitions.
