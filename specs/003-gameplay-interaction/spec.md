# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Gameplay Interaction"

## Clarifications

### Session 2026-06-11

- Q: After the round ends and results are shown, what happens next? → A: Deferred to next spec. The results screen showing secret word and scores is the terminal state for this feature. Room transitions to "finished" status.
- Q: How should canvas state be delivered to guessers? → A: Separate endpoint (e.g., GET /rooms/:code/canvas) polled independently alongside the room state poll.
- Q: How should network failures during guess submission be handled? → A: Show inline error message and keep the guess text in the input field so the user can retry manually.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws on Canvas and Others See It (Priority: P1)

The assigned drawer opens their drawing tools and creates artwork on the canvas. All other participants see the drawing update in near-real time, stroke by stroke.

**Why this priority**: Drawing is the core of the game. Without the ability for the drawer to draw and others to see it, there is no game. This is the primary gameplay loop.

**Independent Test**: Can be fully tested by opening the game in two browser tabs (one drawer, one guesser), having the drawer draw a few lines, and verifying the guesser sees the same strokes appear on their canvas within 3 seconds of each stroke.

**Acceptance Scenarios**:

1. **Given** a game in progress with a drawer and guessers, **When** the drawer draws a line on the canvas, **Then** all guessers see that line appear on their canvas within 3 seconds.
2. **Given** a game in progress, **When** the drawer selects a color and draws, **Then** the stroke appears in that color for all participants.
3. **Given** a game in progress, **When** the drawer clears the canvas, **Then** all guessers see a blank canvas within 3 seconds.
4. **Given** a guesser viewing the canvas, **When** the drawer is actively drawing, **Then** the guesser's canvas updates incrementally (stroke by stroke) without flickering or full-page refresh.
5. **Given** a guesser who just joined mid-round or refreshed their browser, **When** the game screen loads, **Then** they see the current state of the canvas including all strokes drawn so far.

---

### User Story 2 - Guesser Submits a Guess and Gets Feedback (Priority: P1)

A guesser types a word they think matches the drawing, submits it, and immediately sees whether it was correct or incorrect. All participants see the guess appear in the guess history.

**Why this priority**: Guessing is the second half of the core gameplay loop. Without feedback, guessers cannot play the game.

**Independent Test**: Can be tested by a guesser submitting a correct guess (matching the secret word) and an incorrect guess, and verifying the feedback differs in each case and appears in the guess log for all participants.

**Acceptance Scenarios**:

1. **Given** a guesser on the game screen, **When** they type a word and submit it, **Then** they receive immediate feedback indicating whether their guess was correct or incorrect.
2. **Given** a guesser submits an incorrect guess, **When** they view the guess log, **Then** that incorrect guess is visible to all participants (drawer and guessers).
3. **Given** a guesser submits the correct word, **When** they view the guess log, **Then** their correct guess is visually distinguished from incorrect guesses (e.g., highlighted or marked). And the correct guess is visible only to the guesser.
4. **Given** a guesser, **When** they submit a guess, **Then** the guess is matched against the secret word case-insensitively and ignoring leading/trailing whitespace.
5. **Given** a guesser who has already correctly guessed the word, **When** they submit another guess, **Then** the system notifies them that they have already guessed correctly.

---

### User Story 3 - Scoring and Round Results (Priority: P1)

When a guesser correctly identifies the secret word, they earn points. When all guessers have guessed correctly, the round ends and everyone sees the results.

**Why this priority**: Points create motivation and competition. Seeing final results provides closure and feedback on performance.

**Independent Test**: Can be tested with two guessers in a room, having each guess correctly, and verifying each earns 100 points and the round ends after the last guesser guesses correctly.

**Acceptance Scenarios**:

1. **Given** a guesser in a game, **When** they submit the correct word, **Then** their score increases by exactly 100 points.
2. **Given** multiple guessers in a game, **When** each guesses correctly, **Then** each gets 100 points.
3. **Given** a round where all guessers have correctly guessed the word, **When** the last guesser guesses correctly, **Then** the round ends and all participants see a results screen showing the secret word and final scores.
4. **Given** a single guesser in a room with the drawer, **When** the guesser submits the correct word, **Then** the round ends immediately (all guessers have guessed).

---

### User Story 4 - Host Can End the Round Early (Priority: P2)

If the host decides the drawing has gone on long enough or the word is too difficult, they can end the round manually. All participants see the results.

**Why this priority**: Manual round end gives the host control over game pacing and prevents rounds from dragging indefinitely if guessers are stuck.

**Independent Test**: Can be tested by the host clicking "End Round" while a game is in progress and verifying all participants see the results screen.

**Acceptance Scenarios**:

1. **Given** a game in progress with active guessers, **When** the host clicks "End Round", **Then** the round ends and all participants see the results screen with the secret word revealed and final scores.
2. **Given** a game where the host ends the round early, **When** guessers view the results, **Then** guessers who had not yet guessed correctly do not receive points for that round.
3. **Given** the drawer attempts to end the round, **When** the drawer is not the host, **Then** the "End Round" option is not available to them.

---

### User Story 5 - Canvas Reset for New Round Preparation (Priority: P3)

After the round ends, the canvas is cleared in preparation for the next round.

**Why this priority**: This ensures the game is ready for the next round without leftover strokes from the previous round remaining visible.

**Independent Test**: Can be tested by completing a round and verifying the canvas is blank when viewing the room afterwards.

**Acceptance Scenarios**:

1. **Given** a round has ended and results are displayed, **When** participants continue to the next state (e.g., back to lobby), **Then** the canvas is cleared.

---

### Edge Cases

- What happens when a guesser submits an empty or whitespace-only guess? The system should ignore the submission or show a validation message; empty guesses should not count as attempts.
- What happens when a guesser submits the same incorrect guess multiple times? The system should process each submission and show it in the guess history (no deduplication of repeated incorrect guesses).
- What happens when the drawer tries to submit a guess? The draw action should be available but submitting a guess should either be disabled or ignored for the drawer role.
- What happens if all participants leave mid-round? The round should remain active with any remaining participants, or if no participants remain, the room should be cleaned up.
- What happens when a participant submits a guess that contains the secret word as a substring (e.g., "rocket" vs "rocket science")? The guess should match exactly, case-insensitively, after trimming whitespace. Substring matches that differ from the exact word should be marked incorrect.
- What should happen if the drawer clears the canvas and the game has no strokes yet? Clearing an already-empty canvas should be a no-op.
- What should happen when a guess submission fails due to network error? The guess text is preserved in the input field and an inline error message is shown so the user can retry manually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store drawing strokes (color and path data) on the server when the drawer draws them.
- **FR-002**: System MUST serve the current canvas state (all strokes drawn so far) via a dedicated polling endpoint (separate from the room state endpoint) so participants can retrieve and render it on an independent cadence.
- **FR-003**: System MUST process a clear-canvas action that removes all strokes from the server-side canvas state.
- **FR-004**: System MUST accept guess submissions from guesser participants only. Drawer and non-participant guess submission requests MUST be rejected.
- **FR-005**: System MUST compare each submitted guess against the secret word exactly, case-insensitively, after trimming leading and trailing whitespace.
- **FR-006**: System MUST record all submitted guesses (correct and incorrect) in a guess log visible to all participants in the room.
- **FR-007**: System MUST award 100 points to a guesser when they submit a correct guess. Points MUST NOT be awarded for incorrect guesses.
- **FR-008**: System MUST track each participant's cumulative score during the round.
- **FR-009**: System MUST end the round automatically when all guessers have submitted a correct guess.
- **FR-010**: System MUST allow the host to manually end the round at any time. When the host ends the round, the secret word is revealed to all participants.
- **FR-011**: When the round ends (by any means), the system MUST reveal the secret word to all participants and display final scores.
- **FR-012**: The drawer MUST NOT be able to submit guesses. The guess submission UI MUST be hidden or disabled for the drawer role.
- **FR-013**: The drawer's own canvas MUST remain interactive (they can keep drawing) even after they have finished their initial drawing. Only the "Clear Canvas" and the draw functionality are available to the drawer.
- **FR-014**: When the round ends, the canvas state MUST be cleared in preparation for potential future rounds.
- **FR-015**: The system MUST trim leading and trailing whitespace from submitted guesses before comparison.
- **FR-016**: When a guess submission fails due to a network error, the system MUST display an inline error message and preserve the guess text in the input field so the user can retry manually without re-typing.

### Key Entities *(include if feature involves data)*

- **Canvas State**: The collection of all strokes drawn by the drawer in the current round. Each stroke is an ordered sequence of points with associated color.
- **Stroke**: A single continuous drawing action consisting of a color, a sequence of 2D coordinates (points), and the order in which it was drawn.
- **Guess**: A submission by a guesser participant containing the guessed text, the participant ID, a timestamp, and whether it was correct.
- **Score**: A running tally of points earned by each participant during the game. Scores persist across rounds within the same game session.
- **Guess Log**: An ordered list of all guesses submitted during the round, visible to all participants, with correct guesses visually distinguished.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A guesser sees drawing strokes appear on their canvas within 3 seconds of the drawer drawing them.
- **SC-002**: A guesser receives feedback on their guess (correct/incorrect) within 2 seconds of submitting it.
- **SC-003**: All participants see each new guess appear in the guess log within 3 seconds of submission.
- **SC-004**: A guesser who submits the correct word receives exactly 100 points.
- **SC-005**: The round ends within 2 seconds of the last guesser guessing correctly, showing the results screen.
- **SC-006**: The host can end the round with a single action, and all participants see the results within 2 seconds.
- **SC-007**: A guesser who refreshes their browser mid-round sees the current canvas state and guess history on reload.
- **SC-008**: Empty, whitespace-only, and duplicate incorrect guesses do not crash the UI or cause data loss.
- **SC-009**: When a guess submission fails due to network error, the guess text remains in the input field and an inline error message is displayed.

## Assumptions

- The round operates within a single game session. Drawer rotation and multi-round progression are out of scope for this feature.
- The five starter words (rocket, pizza, castle, guitar, sunflower) are sufficient for gameplay across this feature.
- Canvas strokes are transmitted as coordinate data (via a dedicated canvas endpoint) rather than image snapshots, enabling efficient polling and replay.
- Polling interval of approximately 2 seconds for canvas state and game state updates is sufficient for gameplay. The canvas endpoint is polled independently from the room state endpoint.
- The drawer's score is not affected by guesser performance (per constitution: "Correct guess = 100 points" — drawer does not earn points from guesses).
- After the round ends, the room transitions to a "results" view showing the secret word and scores, then changes to "finished" status. Post-round flow (returning to lobby, starting a new round) is deferred to a future spec.
- All guessers who correctly guess the word are treated equally — no speed bonus for being first.
