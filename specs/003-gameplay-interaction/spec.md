# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Status**: Pending

## Scenario

### F3.1 Drawing Canvas
- The drawer sees an interactive `<canvas>` element.
- The drawer can draw freeform lines on the canvas (mouse/touch).
- A "Clear Canvas" button resets the canvas to blank.

### F3.2 Canvas Sync
- Drawing data is sent to the backend and retrieved by guessers via polling.
- Guessers see the drawer's canvas (read-only).

### F3.3 Guess Submission
- Guessers can type and submit text guesses.
- Guesses are trimmed and compared case-insensitively against the secret word.

### F3.4 Guess Validation
- Empty or whitespace-only guesses are rejected with a message.
- Correct guesses are scored 100 points.
- Incorrect guesses add 0 points.
- The drawer cannot submit guesses.

### F3.5 Guess History Sync
- All guesses (correct and incorrect) are visible to all players in the guess history.
- The guess history updates via polling.

### F3.6 Scoring
- All players start at 0 points.
- Correct guess: +100 points.
- Scores are synced to all players via polling.

## Acceptance Criteria
- [ ] Drawer can draw on canvas and clear it.
- [ ] Guessers see the drawing.
- [ ] Guesses are validated (trimmed, empty rejected, case-insensitive match).
- [ ] Correct guess scores 100; incorrect scores 0.
- [ ] Drawer cannot submit guesses.
- [ ] All players see the guess history update.

## Requirements

### Functional Requirements
- **FR-001**: System MUST provide an interactive `<canvas>` for the drawer.
- **FR-002**: System MUST support freeform drawing (mouse/touch).
- **FR-003**: System MUST provide a "Clear Canvas" button.
- **FR-004**: System MUST sync canvas data to the backend via POST.
- **FR-005**: System MUST display canvas to guessers as read-only via polling.
- **FR-006**: System MUST allow guessers to submit text guesses.
- **FR-007**: System MUST trim and case-insensitively compare guesses to the secret word.
- **FR-008**: System MUST reject empty or whitespace-only guesses.
- **FR-009**: System MUST award 100 points for a correct guess.
- **FR-010**: System MUST award 0 points for an incorrect guess.
- **FR-011**: System MUST prevent the drawer from submitting guesses.
- **FR-012**: System MUST show guess history to all players via polling.
- **FR-013**: System MUST sync scores to all players via polling.

### Key Entities
- **Room**: Extended with `canvasData`, `guesses[]`, `scores`.
- **Guess**: Contains participantId, text, correct flag, timestamp.

## Edge Cases
- Empty/whitespace guesses rejected.
- Case-insensitive word matching.
- Drawer cannot submit guesses.
- Scores start at 0 for all players.
