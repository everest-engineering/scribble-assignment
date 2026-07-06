# Feature Specification: Gameplay Interaction — Drawing, Guessing, and Scoring

**Feature Branch**: `007-gameplay-interaction`

**Created**: 2026-07-06

**Status**: Specified

**Input**: User description: "A round is active with a drawer and guessers (all scores start at 0). The drawer draws/clears the canvas. Guessers submit their guesses. Guesses are trimmed, case-insensitively compared, and empty ones rejected. Guess history is synced via polling. Only the first correct guess scores 100; subsequent correct guessers get 0 points with a notice."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Drawing Canvas (Priority: P1)

As the drawer, I want an interactive canvas where I can draw freely and clear my drawing so that guessers can see what I'm sketching.

**Why this priority**: The drawing canvas is the core interaction surface. Without it, there is no gameplay for any participant.

**Independent Test**: Can be fully tested by opening two browser tabs. Tab 1 is the drawer. Tab 2 is a guesser. Tab 1 draws on the canvas and the marks appear; Tab 2 sees the drawing reflected via polling. Tab 1 clears the canvas and the clearing is reflected on Tab 2.

**Acceptance Scenarios**:

1. **Given** a round is active with a designated drawer, **When** the drawer draws on the canvas, **Then** marks appear on the drawer's screen in real time.
2. **Given** a round is active and the drawer has drawn on the canvas, **When** the drawer clicks "Clear Canvas", **Then** the canvas is erased for both drawer and all guessers.
3. **Given** a drawing has been made, **When** guessers poll for room state, **Then** the current drawing state is included in the response.
4. **Given** a round is active and the current user is the drawer, **When** the drawer clicks "Next Word", **Then** the round number increments, a new secret word is selected, the canvas is cleared, and the guess history (including correctGuessersInRound) is reset.
5. **Given** a round is active and the current user is a guesser, **When** the guesser views their screen, **Then** no "Next Word" button is visible.

---

### User Story 2 - Guess Submission with Validation (Priority: P1)

As a guesser, I want to submit my guess and receive validation feedback so that I know my guess was processed or if there was an issue.

**Why this priority**: Guessing is the primary interaction for non-drawer participants. Validation ensures fair play and clear feedback.

**Independent Test**: Can be fully tested by opening two browser tabs. Tab 1 is the drawer. Tab 2 is a guesser. Tab 2 submits various guesses (empty, whitespace-only, case-variant correct answer, wrong answer) and observes the system's response for each.

**Acceptance Scenarios**:

1. **Given** a round is active and the current user is a guesser, **When** they submit a non-empty trimmed guess, **Then** the guess is accepted and compared against the secret word.
2. **Given** a guesser submits an empty or whitespace-only guess, **When** they click submit, **Then** an inline error message is shown and the guess is not sent to the server.
3. **Given** a guesser submits a guess that matches the secret word (case-insensitively), **When** the guess is processed, **Then** it is recorded as a correct guess.
4. **Given** a guesser submits a guess that does not match the secret word, **When** the guess is processed, **Then** it is recorded as an incorrect guess.
5. **Given** the current user is the drawer, **When** the drawer views their screen, **Then** no guess submission form is visible.

---

### User Story 3 - Guess History and Scoring (Priority: P1)

As a participant, I want to see the guess history for the current round and know each guesser's score so that I can track the game's progress.

**Why this priority**: Score tracking and guess history are essential for game awareness and competitive play.

**Independent Test**: Can be fully tested by opening two browser tabs. Tab 1 is the drawer. Tab 2 is a guesser. Tab 2 submits guesses. Both tabs see the guess history and updated scores via polling.

**Acceptance Scenarios**:

1. **Given** a guess has been submitted, **When** any participant polls for room state, **Then** the guess history includes the guess text, submitter, and whether it was correct.
2. **Given** a guesser submits the first correct guess in a round, **When** scoring is calculated, **Then** that guesser's score increases by exactly 100 points.
3. **Given** a guesser submits an incorrect guess, **When** scoring is calculated, **Then** that guesser's score remains unchanged (adds 0).
4. **Given** a guesser has already submitted a correct guess this round, **When** they submit another guess of any kind, **Then** the server rejects it with a 400 error and the guess is not recorded.
5. **Given** participant A has already guessed correctly this round, **When** participant B submits a correct guess, **Then** participant B's guess is recorded as correct but their score remains unchanged (0 points) and a notice "Already guessed! 0 points added." is displayed.
6. **Given** the drawer clicks "Next Word", **When** the round advances, **Then** all guessers' scores carry over but the canvas, guesses, and correctGuessersInRound are reset for the new round.
7. **Given** a participant has guessed correctly in a round, **When** they view the success message, **Then** the points displayed reflect the points awarded for that specific guess (0 or 100), not their cumulative total across rounds.

---

### Edge Cases

- What happens if a guesser submits a guess before the drawer has made any marks? The guess is still processed and scored normally.
- What if a guesser submits the same incorrect guess multiple times? Each submission is recorded and scored (0 points each).
- What if all guessers guess correctly before the round ends? Each is scored once; subsequent guesses from already-correct guessers are rejected with a 400 status and a clear error message.
- What if the drawer closes their browser mid-draw? The current drawing state is preserved and visible to future pollers until the next draw action or round end.
- What if a non-participant (someone not in the room) tries to submit a guess? They cannot access the guess form because they have no active room session.
- What if the canvas is cleared but no new drawing is made? Guessers see a blank canvas.
- What if the drawer clicks "Next Word" before all guessers have guessed? The round advances; the canvas, guesses, and correctGuessersInRound are reset and a new word is picked. Scores carry over.
- What if the drawer clicks "Next Word" when there is only one word left in the list? The word is selected deterministically via `(round - 1) % words.length`, which wraps around if the round exceeds the list length.
- What if a guesser submits a correct guess right as the drawer clicks Next Word? Depending on timing, either the guess is processed (scored normally, then overwritten by the reset) or the request arrives after the reset and is processed against the new word. This race condition is accepted — the next poll will show the consistent state.
- What if a participant had a 100-point correct guess in round 1 and then makes a 0-point correct guess in round 2? The success message must show "0 points added." from the per-guess `pointsAwarded` field, not "+100" from the cumulative total.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an interactive drawing canvas that responds to pointer input (mouse or touch) for the designated drawer.
- **FR-002**: The system MUST allow the drawer to clear the entire canvas with a single "Clear Canvas" action.
- **FR-003**: The current canvas drawing state MUST be included in the room snapshot response so it can be propagated to all participants via polling.
- **FR-004**: Guesses MUST be trimmed of leading and trailing whitespace before submission.
- **FR-005**: Empty or whitespace-only guesses MUST be rejected on the frontend with a clear inline error message, and the guess MUST NOT be sent to the server.
- **FR-006**: The backend MUST trim and validate guesses before processing, rejecting empty guesses with a 400 status.
- **FR-007**: Guess comparison against the secret word MUST be case-insensitive.
- **FR-008**: Only the first correct guess in a round MUST award exactly 100 points to the guessing participant. All subsequent correct guesses (even from different participants) MUST award 0 points.
- **FR-009**: An incorrect guess MUST award 0 points.
- **FR-010**: A participant who has already guessed correctly in the current round MUST be rejected with a 400 error on subsequent guess submissions. Any correct guess submitted after the first correct guess in the round (including from other participants) MUST award 0 points.
- **FR-011**: The guess history for the current round MUST be included in the room snapshot response, containing each guess's text, submitter, correctness status, and points awarded (0 or 100).
- **FR-012**: Only the designated drawer for the current round MUST be shown as "drawer" — guessers MUST see the guess submission form and must not see the "Drawer" label or the secret word.
- **FR-013**: The guess submission form MUST provide full feedback: button disabled while submitting, inline error on failure, and brief success indication on acceptance.
- **FR-014**: The system MUST provide a "Next Word" button visible only to the drawer that advances the round by incrementing the round counter, selects a new secret word from the word list, and resets the canvas strokes, guess history, and correctGuessersInRound. Cumulative scores MUST persist across rounds.

### Key Entities *(include if feature involves data)*

- **Canvas State**: The current visual state of the drawing canvas — represented as an ordered list of strokes, each containing an array of pointer coordinates. Uses a single black pen with fixed stroke width (no color or size attributes).
- **Guess**: A single guess submission containing the guess text (string), submitter (participant ID), correctness flag (boolean), points awarded (0 or 100), and timestamp.
- **Score**: A numeric value associated with each participant, calculated as 100 only for the first correct guess in a round. Subsequent correct guesses award 0 points. Scores persist across rounds (accumulated via Next Word). Persisted as part of the room state for the duration of the game session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A drawer can draw visible marks on the canvas and clear them, and the changes are reflected on guessers' screens within the polling interval (~2s).
- **SC-002**: An empty or whitespace-only guess is blocked on the frontend with an inline error before reaching the server — verified on all major browsers.
- **SC-003**: Non-empty guesses are processed and the guess history correctly shows the guesser, their text, and whether it was correct — verified across multiple browser tabs.
- **SC-004**: Only the first correct guess in a round awards exactly 100 points; subsequent correct guesses (from any participant) award 0 points — verified by inspecting scores after multiple correct guesses in the same round.
- **SC-005**: A guesser who has already guessed correctly receives a 400 error on further submissions. A participant who guesses correctly after the first correct guesser receives 0 points with a clear notice.
- **SC-006**: A correct guess in a later round that earns 0 points (because someone else guessed first) displays "0 points added." not "+100" from a prior round — verified by inspecting the guess success message after cross-round scoring.
- **SC-007**: All existing create/join/lobby/game-start flows continue to function unchanged.

## Assumptions

- The drawing canvas uses a stroke-based model (mouse/touch events record points that are replayed on guessers' screens), not a pixel/raster image approach, to minimize data transfer.
- Canvas state is transmitted as coordinate data via HTTP polling, not as image blobs.
- The round advances when the drawer clicks "Next Word". There is no automatic round-end logic — the drawer decides when to move to the next word.
- The drawer's own browser renders strokes in real time; guessers see the strokes only after the next poll fetches the updated room state.
- The existing game page polling interval (~2s) is sufficient for canvas state synchronization.
