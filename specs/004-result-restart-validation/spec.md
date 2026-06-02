# Feature Specification: Result, Restart & Final Validation

**Feature Code**: `004-result-restart-validation`
**Created**: 2026-06-01
**Status**: Approved
**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round End & Result State Transition (Priority: P1)

When all guessers have guessed the secret word correctly, the round automatically concludes and the room transitions to a "result" state. Additionally, the drawer can manually end the round early.

**Why this priority**: Without a round-end mechanism, the game never reaches the result state. This is the foundation of the feature.

**Independent Test**: Start a game with two guessers. Both guess the correct word. The room status changes to "result".

**Acceptance Scenarios**:

1. **Given** a round is active with multiple guessers, **When** all guessers have submitted a correct guess, **Then** the room status changes to "result" automatically.
2. **Given** a round is active with a drawer, **When** the drawer clicks "End Round" on the game page, **Then** the room status changes to "result" immediately.
3. **Given** a round is active with leftover guessers, **When** the drawer ends the round, **Then** guessers who did not guess correctly do NOT receive points.

---

### User Story 2 - Result Display (Priority: P1)

When the room is in "result" status, all players see the correct secret word, final scores for all participants, and the full guess history from the round.

**Why this priority**: Players need to see the outcome of the round. This is the core user-facing part of the feature.

**Independent Test**: Complete a round (auto or manual). Verify all players see the correct word, correct final scores, and full guess history.

**Acceptance Scenarios**:

1. **Given** the room is in "result" status, **When** any player views the game screen, **Then** they see the correct secret word displayed prominently, revealed to all (including guessers).
2. **Given** the room is in "result" status, **When** any player views the game screen, **Then** they see the final scores for all participants.
3. **Given** the room is in "result" status, **When** any player views the game screen, **Then** they see the full guess history including all guesses made during the round.

---

### User Story 3 - Host Restart (Priority: P1)

The host (original room creator) can initiate a restart from the result view. All players return to the lobby with the same participants, but all round-specific state is cleared.

**Why this priority**: Without restart, the game is stuck at the result screen.

**Independent Test**: Complete a round, host clicks "Restart". All players see the lobby. Player list is unchanged. Canvas, guesses, drawer assignment are cleared.

**Acceptance Scenarios**:

1. **Given** the room is in "result" status, **When** the host clicks "Restart Game", **Then** the room status changes to "lobby".
2. **Given** the room is in "result" status and the host restarts, **When** the room transitions to lobby, **Then** all existing participants remain in the room.
3. **Given** the room is in "result" status and the host restarts, **When** the room transitions to lobby, **Then** all round state is cleared: canvasStrokes, guesses, correctGuessers, currentDrawerId is set to null, roundNumber resets to 0.
4. **Given** the room is in "result" status, **When** a non-host participant tries to restart, **Then** the request is rejected with a 403 error.

---

### User Story 4 - Auto-Navigate to Result (Priority: P2)

When the round ends (status changes from "playing" to "result"), players currently on the game page automatically see the result view without requiring a manual refresh.

**Why this priority**: This completes the user experience by automatically showing the result when the round ends.

**Acceptance Scenarios**:

1. **Given** a player is on the game page during an active round, **When** the room status changes to "result", **Then** the game page transitions to the result display within 2 seconds (via room polling).
2. **Given** a player is on the lobby page, **When** the room status changes to "result" (edge case), **Then** they remain on the lobby page.

---

### Edge Cases

- All guessers have already guessed correctly before the drawer ends the round — the status is already "result" so the button is hidden or disabled.
- The host restarts while a player is mid-poll — the player polls again and detects "lobby" status, redirecting to the lobby view.
- A player joins the room after the round has ended but before restart — they see the lobby view after joining (join returns lobby status).
- Only one participant is the drawer and there are no guessers (should not happen due to startGame requiring 2+ participants).
- The drawer and host are the same person (current implementation) — the End Round button and Restart button appear in separate contexts.
- Race condition: drawer clicks "End Round" simultaneously with last guesser submitting correct answer — `endRound` is idempotent (accepts already-"result" as success), so the drawer never sees an error.
- GamePage poll detects "result" status: must NOT navigate to lobby (current `!== "playing"` condition would incorrectly redirect). Condition must be `=== "lobby"`.
- Canvas polling continues during "result" status unnecessarily — guard canvas polling effect with `room.status === "playing"`.
- Frontend store has stale `canvasStrokes` after restart — `restartGame` store method must call `setCanvasStrokes([])`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition room status from "playing" to "result" when all non-drawer participants have submitted a correct guess.
- **FR-002**: System MUST allow the drawer to manually end the round via a dedicated endpoint, transitioning the room to "result" status. The endpoint MUST be idempotent: if the room is already in "result" status, it returns success without error (handles race condition with auto-end).
- **FR-003**: System MUST reveal the correct secret word to ALL participants (not just the drawer) when the room is in "result" status. The `getSecretWord` function MUST allow both "playing" and "result" statuses to return the word.
- **FR-004**: System MUST display the correct secret word, final scores, and complete guess history on the result view.
- **FR-005**: System MUST provide a restart endpoint that only the host can call, transitioning the room from "result" to "lobby" status.
- **FR-006**: System MUST preserve all participants when restarting the room.
- **FR-007**: System MUST clear all round-specific state on restart: canvasStrokes, guesses, correctGuessers, currentDrawerId (set to null), roundNumber (reset to 0).
- **FR-008**: System MUST auto-detect the "result" status on the GamePage via polling and display the result view without redirecting away.
- **FR-009**: System MUST reject restart requests from non-host participants with a 403 error.
- **FR-010**: System MUST include the updated `status` field in the `submitGuess` response so the frontend can immediately reflect "result" without waiting for the next poll.
- **FR-011**: System MUST guard the auto-end check: only auto-end if there is at least one non-drawer participant (prevents false end on empty guesser list).

### Key Entities

- **Room Status**: Extended to include "result" in addition to "lobby" and "playing".
- **Result State**: A read-only display of the completed round's outcome, shown when `room.status === "result"`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When all guessers guess correctly, the room transitions to "result" status within 1 second of the last correct guess.
- **SC-002**: When the drawer ends the round, the room transitions to "result" status within 1 second.
- **SC-003**: All players see the correct word, final scores, and guess history within 2 seconds of the room entering "result" status.
- **SC-004**: When the host clicks restart, all players return to the lobby within 2 seconds.
- **SC-005**: After restart, the participant list is identical to before the restart.
- **SC-006**: After restart, all round state (canvas, guesses, drawer) is cleared.

## Assumptions

- Scores persist in the room data after returning to the lobby (so the result view can show final scores). The host can reset scores by starting a new game (which clears scores per the existing startGame implementation).
- The result view is rendered inline on the GamePage (not a separate page), replacing the canvas/guess form with result content.
- The auto-end-round trigger checks after every guess submission: if all guessers have guessed correctly, the round ends automatically.
- The "End Round" button is shown to the drawer only during gameplay (status "playing").
- The "Restart Game" button is shown to the host only during result (status "result").
- The `endRound` endpoint is idempotent: calling it when status is already "result" returns success (to handle the race condition where auto-end and manual end occur simultaneously).
- The `submitGuess` response includes the updated `status` field so the frontend can immediately show the result view without waiting for the next poll cycle.
- The GamePage polling condition for redirecting to lobby is `=== "lobby"` (not `!== "playing"`), so "result" status keeps the user on GamePage.
- Canvas polling is disabled when `room.status !== "playing"` to avoid wasteful requests during "result".
- The `restartGame` store method clears local canvas state (`setCanvasStrokes([])`).

## Clarifications

### Resolved Decisions

1. **Round-end triggers** → Both auto and manual. The round ends automatically when all guessers guess correctly, AND the drawer can manually end the round early via an "End Round" button on the game page (FR-001 + FR-002 both in effect).
2. **Score persistence on restart** → Scores persist after restart. They are only reset when a new game starts from the lobby (via existing startGame). This lets the result view show final scores even after returning to lobby (FR-007 scoped to non-score state).
3. **Result view location** → Inline on GamePage. The GamePage detects "result" status via the existing 2s room poll and replaces the canvas/guess UI with the result content. No new route needed (FR-008).
