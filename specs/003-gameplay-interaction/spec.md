# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "(Gameplay Interaction): Building the interactive drawing canvas, syncing guess submissions via polling, and applying scoring rules."

## Clarifications
### Session 2026-05-30
- Q: If the drawer disconnects mid-turn, how should the game proceed? → A: Instantly end their turn and select a new drawer
- Q: To prevent spamming and server overload from rapid guess submissions, should we enforce a rate limit? → A: Yes, limit to 1 guess per second per user
- Q: For long continuous lines, should we batch and sync points while the pen is down? → A: Yes, batch and sync points periodically (e.g., every 500ms) while drawing

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Interaction (Priority: P1)

As the current drawer, I want to use an interactive canvas to draw the word so that other players can guess it.

**Why this priority**: The core mechanic of the game relies on one user being able to draw something for others to see.

**Independent Test**: The canvas correctly captures mouse or touch movements as strokes and displays them. Strokes are successfully transmitted to the server.

**Acceptance Scenarios**:

1. **Given** it is the player's turn to draw, **When** they click and drag on the canvas, **Then** a visible line follows their cursor.
2. **Given** the player is drawing a long stroke, **When** 500ms elapses, **Then** the new points are batched and sent to the server without waiting for the stroke to finish.

---

### User Story 2 - Guesser Experience (Priority: P1)

As a guesser, I want to see the drawing update in near real-time and submit text guesses to guess the word.

**Why this priority**: Without the ability to see the drawing and guess, the game loop cannot be completed.

**Independent Test**: The client successfully polls for drawing updates and renders them on a read-only canvas. The user can submit a text guess and receive validation feedback.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn a stroke, **When** the guesser's client polls the server, **Then** the new stroke is received and rendered on their canvas.
2. **Given** the guesser enters a guess, **When** they submit it, **Then** the system validates it and returns whether it was correct or incorrect.

---

### User Story 3 - Scoring and Game Progression (Priority: P2)

As a player, I want points to be awarded fairly when someone guesses correctly, so that the game has a competitive element.

**Why this priority**: Scoring provides motivation and structure to the game.

**Independent Test**: Can be tested by submitting correct guesses at different time intervals and verifying the assigned scores for both the drawer and the guesser.

**Acceptance Scenarios**:

1. **Given** a player guesses the word correctly, **When** the server processes the guess, **Then** points are awarded to the guesser and the drawer based on how fast the guess was made.
2. **Given** all players have guessed correctly, **When** the last correct guess is processed, **Then** the round ends early.

### Edge Cases

- If a player submits multiple guesses rapidly, the system MUST rate limit them to 1 guess per second, ignoring excess guesses.
- How does system handle late-arriving strokes from a player whose turn just ended?
- If the drawer disconnects or leaves the game mid-turn, the system MUST instantly end their turn and select a new drawer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive canvas for the current Drawer to draw strokes.
- **FR-002**: System MUST capture drawing data as coordinate paths (strokes).
- **FR-003**: System MUST synchronize canvas strokes from the Drawer to the server, batching and sending points periodically (e.g., every 500ms) during continuous drawing.
- **FR-004**: System MUST synchronize canvas strokes from the server to the Guessers via regular updates.
- **FR-005**: System MUST allow Guessers to submit text guesses via a text input field.
- **FR-006**: System MUST evaluate guesses on the server against the current word (case-insensitive).
- **FR-007**: System MUST prevent the drawer from submitting guesses.
- **FR-008**: System MUST apply scoring rules when a guess is correct, rewarding faster guesses with more points.
- **FR-009**: System MUST award a portion of points to the Drawer when a Guesser guesses correctly.
- **FR-010**: System MUST rate limit guess submissions to a maximum of 1 per second per user.

### Key Entities

- **Stroke**: Represents a single continuous line drawn on the canvas, composed of a series of X/Y coordinates, color, and brush size.
- **Guess**: Represents an attempted answer submitted by a player, containing the text and the timestamp.
- **GameState**: Maintains the current canvas state (list of strokes), current drawer, word to guess, scores, and remaining time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawing strokes appear smooth and responsive to the drawer (rendering in under 16ms per frame).
- **SC-002**: Canvas updates are visible to guessers within 1 second of the drawer completing a stroke.
- **SC-003**: Players receive immediate feedback on their guesses (correct/incorrect) in the chat/guess log.
- **SC-004**: Scores are accurately reflected on all clients at the end of the round.

## Assumptions

- Drawing operations are limited to basic colors and brush sizes (no complex tools like layers or fill).
- Guess syncing and canvas syncing share the same update infrastructure already established for the game loop.
- The server stores the entire canvas state (all strokes) in memory for the duration of the round to send to newly connected clients or clients who missed a poll.
