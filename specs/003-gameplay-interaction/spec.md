# Feature Specification: Gameplay Interaction

**Feature Group**: 3 — Gameplay Interaction
**Date**: 2026-06-04
**Status**: Draft

## User Stories

### User Story 1 — Drawing on Canvas (P1)
The drawer can draw on an interactive canvas using their mouse.

**Acceptance Scenarios**:
1. Given the drawer is in the game, When they click and drag on the canvas, Then lines appear in real-time
2. Given the drawer draws something, When a guesser views the game, Then they see the same drawing (synced via polling)
3. Given the drawer wants to start over, When they click "Clear Canvas", Then the drawing is erased

### User Story 2 — Submitting Guesses (P1)
Guessers can type and submit guesses.

**Acceptance Scenarios**:
1. Given a guesser types a guess, When they click "Submit Guess", Then the guess is recorded and visible in the guess history
2. Given a guesser submits an empty guess (whitespace), When they submit, Then they see "Guess cannot be empty"
3. Given a guesser submits the correct word, When the guess is processed, Then they score 100 points and the round ends

### User Story 3 — Scoring (P2)
Correct guesses earn points; incorrect guesses earn 0.

**Acceptance Scenarios**:
1. Given a guesser submits the correct word (case-insensitive), When the guess is evaluated, Then they earn 100 points
2. Given a guesser submits an incorrect word, When the guess is evaluated, Then they earn 0 points
3. Given a correct guess ends the round, When the result is computed, Then status changes to "result"

### User Story 4 — Guess History Sync (P2)
All players see the same guess history via polling.

**Acceptance Scenarios**:
1. Given a guesser submits a guess, When other players poll, Then they see the guess in the history
2. Given multiple guesses are submitted, When any player views the game, Then they see all guesses with correct/incorrect markers

## Edge Cases
- Empty guess rejected on both frontend and backend
- Case-insensitive word comparison ("Rocket" matches "rocket")
- Drawer cannot submit guesses (rejected by backend)
- After correct guess, no more guesses are accepted (status="result")
- Canvas hidden until status="playing"

## Functional Requirements
- **FR-001**: System MUST store strokes as an array of {x1,y1,x2,y2,color,width}
- **FR-002**: System MUST allow only the drawer to draw/clear
- **FR-003**: System MUST reject empty guesses with 400 status
- **FR-004**: System MUST compare guesses case-insensitively
- **FR-005**: System MUST award 100 points for exact match, 0 otherwise
- **FR-006**: System MUST set status="result" on correct guess
- **FR-007**: System MUST include strokes, guesses, and scores in RoomSnapshot
