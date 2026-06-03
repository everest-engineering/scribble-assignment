# Feature Specification: Gameplay Interaction

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Drawer draws/clears the canvas, guessers submit guesses. Guesses are trimmed, case-insensitively compared, empty rejected. Guess history is synced via polling. Correct guesses score 100."

## User Scenarios & Testing

### User Story 1 - Drawer draws on canvas (Priority: P1)

The drawer has an interactive canvas they can draw on using mouse/touch. They can also clear the canvas.

**Why this priority**: Core mechanic — the drawing is the hint.

**Independent Test**: Can be tested by opening the game as drawer and confirming mouse drag draws lines and clear button resets.

**Acceptance Scenarios**:

1. **Given** the drawer is on the game screen, **When** they click and drag on the canvas, **Then** lines appear following the cursor.
2. **Given** the drawer has drawn on the canvas, **When** they click "Clear Canvas", **Then** the canvas is wiped clean.

---

### User Story 2 - Guess submission and validation (Priority: P1)

Guessers submit guesses. Empty guesses are rejected. Guesses are case-insensitively compared to the secret word. A correct guess scores 100 points.

**Why this priority**: Core mechanic — guessing is the game.

**Independent Test**: Can be tested by submitting correct, incorrect, and empty guesses from a second browser tab.

**Acceptance Scenarios**:

1. **Given** a guesser is on the game screen, **When** they type the correct word (any casing) and submit, **Then** the guess is recorded as correct and their score becomes 100.
2. **Given** a guesser is on the game screen, **When** they type an incorrect word and submit, **Then** the guess is recorded as incorrect and their score stays 0.
3. **Given** a guesser is on the game screen, **When** they submit an empty or whitespace-only guess, **Then** the submission is rejected with an error message.
4. **Given** the drawer submits a guess, **When** they try, **Then** the submission is rejected (drawer cannot guess their own word).

---

### User Story 3 - Guess history synced via polling (Priority: P2)

All players see the full guess history, updated automatically via polling.

**Why this priority**: Transparency — everyone sees who guessed what.

**Independent Test**: Can be tested by submitting guesses from one tab and confirming they appear in another tab within ~3 seconds.

**Acceptance Scenarios**:

1. **Given** a guess has been submitted, **When** a player polls the room snapshot, **Then** the guess appears in the guess history with the guesser's name and whether it was correct.

---

### User Story 4 - Scoreboard updated (Priority: P2)

All players see live scores, synced via polling. Scores start at 0.

**Why this priority**: Game progress visibility.

**Independent Test**: Can be tested by submitting a correct guess and seeing score update to 100.

### Edge Cases

- What if the same player submits multiple guesses? — All guesses are recorded; score is set to 100 once (doesn't increase further).
- What if a guesser joins mid-game? — Not supported; joining is lobby-only.
- What if the drawer clears the canvas before anyone guesses? — Canvas is reset, guessing continues.

## Requirements

### Functional Requirements

- **FR-001**: Frontend MUST provide an interactive HTML5 canvas for the drawer with mouse drawing.
- **FR-002**: Frontend MUST provide a "Clear Canvas" button that resets the drawer's canvas.
- **FR-003**: Backend MUST expose `POST /rooms/:code/guess` that accepts `participantId` and `text`.
- **FR-004**: Backend MUST reject empty/whitespace-only guesses with a 400 error.
- **FR-005**: Backend MUST reject guesses from the drawer with a 400 error.
- **FR-006**: Backend MUST compare guess text case-insensitively against the secret word.
- **FR-007**: Backend MUST store all guesses with participant name, text, correctness, and timestamp.
- **FR-008**: Backend MUST set guesser score to 100 on first correct guess (no further increase).
- **FR-009**: Backend MUST include `guesses` and `scores` in the room snapshot.
- **FR-010**: Frontend MUST display guess history (all guesses with name, text, correct/incorrect indicator) in the Activity panel.
- **FR-011**: Frontend MUST display each participant's score in the Scoreboard.

### Key Entities

- **Guess**: participantId, participantName, text, isCorrect, createdAt
- **Room**: now includes `guesses: Guess[]` and `scores: Record<string, number>`
- **RoomSnapshot**: now includes `guesses` and `scores`

## Success Criteria

- **SC-001**: A correct guess ("rocket" or "ROCKET" or "Rocket") scores 100 points within 2 seconds.
- **SC-002**: An incorrect guess is recorded but score stays 0.
- **SC-003**: Empty guesses are rejected with an error message in under 1 second.
- **SC-004**: Guess history appears in a second tab within ~3 seconds of submission.
- **SC-005**: The drawer can draw lines on the canvas with mouse drag.

## Assumptions

- Canvas drawing is local to the drawer's browser only (no real-time sync — WebSockets are forbidden).
- Clear canvas is also local-only.
- Drawing strokes are not stored on the backend.
- Scoring: first correct guess sets score to 100; subsequent correct guesses don't increase further (one word to guess per round).
- Secret word is "rocket" for the single round.
