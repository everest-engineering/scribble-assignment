# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Feature Group 3: Gameplay Interaction

Requirements:
- Interactive drawing canvas for drawer
- Clear canvas action
- Drawing visible on drawer screen
- Guess submission
- Trim guesses
- Reject empty guesses
- Case-insensitive guess comparison
- Synced guess history through existing polling
- Correct guess awards 100 points
- Incorrect guess awards 0 points

Out of scope:
- Result screen
- Restart flow
- Multiple rounds
- Drawer rotation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Drawer Canvas (Priority: P1)

The drawer has an interactive drawing canvas on their game screen. They can draw freehand lines to depict the secret word and can clear the canvas to start over. The drawing strokes are rendered locally on the drawer's screen in real-time.

**Why this priority**: Without a canvas, the drawer cannot draw and there is no visual gameplay core.

**Independent Test**: Join a game and start it. As the drawer, click and drag on the canvas to draw lines. Verify that the lines render. Click the "Clear Canvas" button and verify the canvas is blanked.

**Acceptance Scenarios**:

1. **Given** a player is the drawer and is on the game page, **When** they click/touch and drag across the canvas area, **Then** a continuous line is drawn following their pointer.
2. **Given** a canvas containing drawings, **When** the drawer clicks the "Clear Canvas" button, **Then** the canvas is completely cleared of all drawings.

---

### User Story 2 - Guess Submission & Validation (Priority: P1)

Guessers have an entry interface to submit guesses for the secret word. The client validates and sanitizes input by trimming leading/trailing spaces and rejecting empty or whitespace-only submissions. Drawers are blocked from submitting guesses.

**Why this priority**: Essential to capture guesses and prevent invalid/empty payloads from polluting the game state.

**Independent Test**: Join as a guesser. Try to submit a blank text field or one containing only spaces, and check that it is blocked. Type a valid word with surrounding spaces (e.g. `"  rocket  "`) and verify it submits. As a drawer, verify that the guess entry field is either disabled, hidden, or any submission attempts are rejected.

**Acceptance Scenarios**:

1. **Given** a player is a guesser and is on the game page, **When** they attempt to submit a blank or whitespace-only guess, **Then** the submission is rejected by the client UI.
2. **Given** a guesser enters a guess with leading or trailing spaces, **When** they submit, **Then** the guess is trimmed of all leading and trailing spaces before submission.
3. **Given** a player is designated as the drawer, **When** they attempt to submit a guess, **Then** the submission is rejected by the system and no guess-history entry is created.

---

### User Story 3 - Guess Evaluation & Scoring (Priority: P1)

Guesses are evaluated by the system. Correct guesses are awarded 100 points, while incorrect guesses are awarded 0 points. Guesses are matched against the secret word case-insensitively. Points are awarded only once per round per player.

**Why this priority**: Defines the winning mechanic, score accumulation, and game logic rules.

**Independent Test**: As a guesser, submit an incorrect guess and verify that your score remains 0. Submit a guess matching the secret word in different casing (e.g. `"RoCkEt"` for `"rocket"`) and verify your score becomes 100. Submit the correct guess a second time and verify your score remains 100.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess that does not match the secret word, **When** evaluated, **Then** their score is not incremented and they receive 0 points.
2. **Given** a guesser submits a guess that matches the secret word (regardless of casing differences), **When** evaluated, **Then** their score increases by 100 points.
3. **Given** a guesser has already successfully guessed the correct word in the current round, **When** they submit the correct guess again, **Then** their score is not incremented a second time.

---

### User Story 4 - Synced Guess History (Priority: P1)

All guess attempts are recorded and synced to all participants (both drawer and guessers) in the room via the existing HTTP polling mechanism.

**Why this priority**: Allows all players to see the log of attempts and maintains consistent state across clients.

**Independent Test**: Open two browser windows (Drawer and Guesser). Submit a guess as the guesser and verify that the guess log list updates on both the drawer's screen and the guesser's screen within 2 seconds.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** the backend registers the guess, **Then** it is added to a list of guess attempts for that room session in submission order.
2. **Given** the 2-second HTTP poll interval, **When** client states refresh, **Then** all players see the updated history of guess attempts in chronological order.

### Edge Cases

- **Concurrent guesses**: Guesses submitted at the same time are serialized by the server and both appear in the history in order of arrival.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive canvas element for the drawer to draw on using mouse or touch input.
- **FR-002**: System MUST provide a "Clear Canvas" action that empties the drawing canvas for the drawer.
- **FR-003**: The canvas strokes MUST be rendered immediately on the drawer's screen.
- **FR-004**: System MUST allow guessers to submit word guesses through a text input interface.
- **FR-005**: System MUST trim all leading and trailing whitespace from submitted guesses.
- **FR-006**: System MUST reject empty or whitespace-only guess submissions.
- **FR-007**: System MUST perform case-insensitive comparison of guess attempts against the room's secret word.
- **FR-008**: System MUST increment a player's score by exactly 100 points upon their first correct guess.
- **FR-009**: System MUST award 0 points for incorrect guesses.
- **FR-010**: System MUST record all guess attempts in a guess log history for the room session.
- **FR-011**: System MUST synchronize the guess log history and participant scores to all room participants via the existing HTTP polling mechanism.
- **FR-012**: The system MUST award points to a participant only once per round, even if they submit the correct guess multiple times.
- **FR-013**: Player scores MUST remain associated with participants for the duration of the room session.
- **FR-014**: Guess history MUST be stored and returned in submission order.
- **FR-015**: The drawer MUST NOT be permitted to submit guesses.

### Key Entities

- **Canvas**: The interactive drawing pane rendered on the drawer's client.
- **Participant**: A player connected to the room session. Attributes: `id`, `name`, `joinedAt`, and `score` (representing the points accumulated during the session).
- **Guess**: An attempt made by a guesser to identify the secret word. Attributes: participant name, word guessed, and correct/incorrect status.
- **Guess History**: A list of all guesses submitted during the room session, containing guess details sorted in submission order.
- **Scoreboard**: A derived view of all participant scores sorted or listed for display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid, submitted guesses are correctly recorded in the guess history log.
- **SC-002**: 100% of guess validations (trimming, case-insensitivity, and empty rejection) are enforced correctly.
- **SC-003**: The score of a player increases by exactly 100 points within 2 seconds of submitting a correct guess.
- **SC-004**: Guesses submitted by any player appear in the guess log on all other players' UIs within 2 seconds.
- **SC-005**: 100% of drawer guess-submission attempts are rejected and do not create guess-history entries.

## Assumptions

- **Local drawing only**: Drawing synchronization to guesser screens is out of scope for this feature group. Only the drawer's screen renders the active drawing canvas. Guessers only interact via text guessing, guess history log, and scoreboard updates.
- **Single round limit**: The game remains in a single round. Multiple rounds and drawer rotation are out of scope.
- **Score persistence**: Scores are stored in-memory in the backend room data structure and are cleared when the room is destroyed.
