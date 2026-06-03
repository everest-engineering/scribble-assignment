# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-lab`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

---

## User Scenarios & Testing

### User Story 1 — Interactive Drawing Canvas (Priority: P1)

The drawer can paint freely on the canvas area and clear the entire canvas at any time. All other players see the current state of the drawing, updated continuously during the round.

**Why this priority**: Without a visible canvas, there is nothing for guessers to guess from — the entire gameplay loop depends on drawing being live and visible to all players.

**Independent Test**: With two browser tabs (one drawer, one guesser), the drawer can draw strokes on the canvas. The guesser's tab shows the same drawing within approximately 2 seconds. The drawer can clear the canvas; the guesser's view clears within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is the drawer, **When** the drawer draws strokes on the canvas, **Then** the strokes appear on the drawer's canvas in real time.
2. **Given** a round is active, **When** the guesser's view polls for the latest room state, **Then** the guesser sees the same drawing the drawer has produced, with no more than approximately 2 seconds of lag.
3. **Given** the drawer has drawn strokes on the canvas, **When** the drawer presses the "Clear Canvas" button, **Then** all strokes are removed from the canvas and the cleared state is visible to all players within approximately 2 seconds.
4. **Given** a round is active and the viewer is a guesser, **When** the game screen is displayed, **Then** the canvas is visible but the guesser cannot draw on it.

---

### User Story 2 — Guess Submission & Validation (Priority: P1)

A guesser can type a guess into a text field and submit it. The guess is trimmed of leading and trailing whitespace before comparison. Empty or whitespace-only guesses are rejected with a clear inline message. The guess is compared case-insensitively to the secret word, and the result (correct or incorrect) is immediately visible to the guesser who submitted it.

**Why this priority**: Guess submission is the primary interaction for guessers. Without it, guessers have no way to participate in the round.

**Independent Test**: In a started game, the guesser submits a blank guess — an inline error message appears and nothing is recorded. The guesser submits "ROCKET" (the secret word) — the result shows "Correct". The guesser submits "pizza" — the result shows "Incorrect". The drawer cannot submit a guess.

**Acceptance Scenarios**:

1. **Given** a round is active and the viewer is a guesser, **When** they submit an empty or whitespace-only guess, **Then** the submission is rejected with an inline validation message and no guess is recorded.
2. **Given** a round is active and the viewer is a guesser, **When** they submit a guess that matches the secret word (regardless of case or surrounding whitespace), **Then** the guess is recorded as correct and the guesser sees a "Correct!" outcome.
3. **Given** a round is active and the viewer is a guesser, **When** they submit a guess that does not match the secret word, **Then** the guess is recorded as incorrect and the guesser sees an "Incorrect" outcome.
4. **Given** a round is active and the viewer is the drawer, **When** the game screen is displayed, **Then** no guess submission form is available to the drawer.

---

### User Story 3 — Synced Guess History (Priority: P2)

All players can see a continuously updated history of all guesses submitted during the round. Each entry in the history shows the player's name, their guess text, and whether it was correct or incorrect. The history is refreshed automatically via polling.

**Why this priority**: Guess history provides shared context for all players — guessers can see what has already been tried, and the drawer can see how close players are. It is secondary to basic guess submission (US2) but required for a coherent multi-player experience.

**Independent Test**: With two guesser tabs and one drawer tab, one guesser submits a correct guess and one submits an incorrect guess. All three tabs show the complete guess history (both entries) within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** any guesser submits a guess, **Then** that guess (name, text, and correct/incorrect label) appears in the guess history visible to all players within approximately 2 seconds.
2. **Given** multiple guesses have been submitted, **When** any player views the guess history, **Then** all guesses are listed in submission order, each labeled with the submitting player's name and outcome.
3. **Given** no guesses have been submitted yet, **When** any player views the guess history area, **Then** an empty state message is shown (e.g., "No guesses yet").

---

### User Story 4 — Score Tracking (Priority: P2)

All players start the round with 0 points. A correct guess awards exactly 100 points to the guesser who submitted it. An incorrect guess awards 0 points. The scoreboard on the game screen reflects current scores and updates via polling.

**Why this priority**: Scoring provides the competitive context for the round. It depends on guess submission (US2) and guess history (US3) being in place, so it is lower priority but must be consistent with those stories.

**Independent Test**: Two guessers start at 0. One submits a correct guess — their score becomes 100. The other submits an incorrect guess — their score remains 0. Both scores appear correctly on all players' scoreboards within approximately 2 seconds.

**Acceptance Scenarios**:

1. **Given** a round has just started, **When** any player views the scoreboard, **Then** all participants show a score of 0.
2. **Given** a guesser submits a correct guess, **When** the scoreboard updates, **Then** that guesser's score increases by exactly 100 points.
3. **Given** a guesser submits an incorrect guess, **When** the scoreboard updates, **Then** that guesser's score remains unchanged.
4. **Given** scores have changed, **When** all players' scoreboards update via polling, **Then** all players see the same scores for all participants.

---

### Edge Cases

- What happens if a guesser submits the correct word more than once? Once a player's guess is recorded as correct, further submissions from that player are blocked — the guess form is hidden on the client, and the backend rejects any additional attempt with a 403. A player who has guessed incorrectly may keep submitting until they guess correctly.
- What happens if the drawer submits a guess? The guess submission form is not shown to the drawer — the attempt is not possible through the UI.
- What happens if a guess consists entirely of whitespace? It is trimmed to an empty string and rejected with the same validation message as an empty guess.
- What happens if multiple guessers submit the correct word? Each correct submission is independent — each guesser who submits the right word scores 100 points.
- What happens if a player refreshes the browser during gameplay? Session is restored; the player returns to the game screen with the current canvas state, guess history, and scores.

---

## Requirements

### Functional Requirements

- **FR-001**: The game screen MUST display an interactive drawing canvas to the drawer, accepting free-form drawing input (mouse or pointer events).
- **FR-002**: The game screen MUST display the current canvas state as a read-only view to all players who are not the drawer.
- **FR-003**: The drawer MUST be able to clear the entire canvas with a single action; the cleared state MUST propagate to all players via polling.
- **FR-004**: The canvas state MUST be stored in room state on the backend so that all clients can retrieve it via polling.
- **FR-005**: Guessers MUST be able to submit a text guess via a form input. The drawer MUST NOT have access to the guess submission form.
- **FR-006**: Submitted guesses MUST be trimmed of leading and trailing whitespace before validation and comparison.
- **FR-007**: Empty or whitespace-only guesses MUST be rejected with an inline validation message; no guess record is created.
- **FR-008**: A submitted guess MUST be compared case-insensitively to the current secret word to determine correctness.
- **FR-009**: A correct guess MUST award exactly 100 points to the submitting player. An incorrect guess MUST award 0 points.
- **FR-010**: All submitted guesses MUST be stored in the room state and included in the room snapshot returned to polling clients.
- **FR-011**: The guess history MUST display each entry with the submitting player's name, the guess text, and a correct/incorrect label, ordered by submission time.
- **FR-012**: The scoreboard MUST display each participant's current score, initialized to 0 at round start and updated after each correct guess.
- **FR-013**: All gameplay state (canvas, guesses, scores) MUST be refreshed for all clients via polling at approximately a 2-second interval.
- **FR-014**: A player who has already submitted a correct guess in the current round MUST NOT be able to submit further guesses. The backend MUST reject any additional guess from that player with a 403 error. The client MUST hide the guess form after a correct submission and MUST derive this state from room.guesses on session restore.

### Key Entities

- **Stroke**: A single drawing action on the canvas, described by its path data. A list of strokes constitutes the current canvas state.
- **Guess**: A single guess submission containing the player's ID, the guessed text (trimmed), a correctness flag, and a timestamp.
- **Score**: A mapping of participant ID to their current integer point total for the round.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All players see the drawer's current canvas within approximately 2 seconds of a stroke being drawn or the canvas being cleared.
- **SC-002**: 100% of empty or whitespace-only guess submissions are rejected with a visible inline message on the client; the server independently validates and returns a 400 for any that reach it.
- **SC-003**: A correct guess (case-insensitive, trimmed) is recognized as correct in 100% of valid submissions.
- **SC-004**: All players see a new guess in the shared history within approximately 2 seconds of it being submitted.
- **SC-005**: Scoreboard totals are consistent across all players' views within approximately 2 seconds of a score change.

---

## Assumptions

- Drawing input is captured via pointer/mouse events on an HTML canvas element. The canvas state is serialized as an ordered list of strokes stored in room state and polled by all clients.
- The drawer can draw multiple strokes; each stroke is appended to the stroke list. "Clear canvas" resets the stroke list to empty.
- Once a player has a correct guess recorded in the round, the backend rejects any further guess from that player with a 403. The guess form is hidden on the client after a correct submission, and on session restore the client derives this state from room.guesses (checking whether the player already has a correct entry). A player who has guessed incorrectly may continue submitting until they guess correctly.
- Scores persist for the duration of the active round; they are not reset by canvas clears or guess resubmissions.
- The drawer's score is 0 for the round (they cannot guess). Their name still appears on the scoreboard.
- Session restore on page refresh reloads the room snapshot (canvas, guesses, scores) from the backend; no client-side state needs to be preserved across refreshes.
- Canvas rendering fidelity across browsers is implementation-defined; pixel-perfect reproduction is not required — only that all strokes and the cleared state are correctly transmitted and displayed.
- Polling cadence for gameplay state matches the lobby cadence: approximately 2 seconds, consistent with the constitution.
