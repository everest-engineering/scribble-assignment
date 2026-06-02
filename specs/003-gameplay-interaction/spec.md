# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Scenario 3: Gameplay Interaction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Interacts with Canvas (Priority: P1)

As a drawer, I want to draw shapes on the canvas and clear them so that I can communicate the secret word to other players.

**Why this priority**: Core gameplay loop; without drawing, the game cannot proceed.

**Independent Test**: Can draw a line on the canvas and click "Clear" to reset the canvas to blank.

**Acceptance Scenarios**:

1. **Given** I am the designated drawer, **When** I click and drag on the canvas, **Then** a drawing path is captured and displayed locally.
2. **Given** I have drawing paths on the canvas, **When** I click the "Clear" button, **Then** all drawing paths are removed from my canvas.

---

### User Story 2 - Guesser Submits Guesses (Priority: P1)

As a guesser, I want to submit text guesses so that I can try to identify the secret word and earn points.

**Why this priority**: Core gameplay loop; guessing is the primary interaction for non-drawers.

**Independent Test**: Submit a guess via the form and see it appear in the activity history.

**Acceptance Scenarios**:

1. **Given** I am a guesser and a round is active, **When** I enter a non-empty string in the guess box and submit, **Then** my guess is recorded and displayed in the guess history for everyone.
2. **Given** I submit a guess with leading/trailing whitespace, **When** it is processed, **Then** it is trimmed before comparison.
3. **Given** I submit an empty or whitespace-only guess, **When** I attempt to submit, **Then** the system rejects the submission and displays a validation error.

---

### User Story 3 - Synchronization and Scoring (Priority: P2)

As a player, I want to see the drawing and guess history update automatically so that I stay in sync with the game state.

**Why this priority**: Multiplayer presence and feedback loop.

**Independent Test**: A guesser sees the drawer's drawing appear on their screen within 2 seconds.

**Acceptance Scenarios**:

1. **Given** the drawer has added paths or cleared the canvas, **When** my client polls the backend, **Then** my canvas view updates to match the drawer's state within 2 seconds.
2. **Given** a guesser submits the correct secret word (case-insensitive), **When** it is processed, **Then** the guesser receives 100 points and the round status changes to reflect the success.

---

### Edge Cases

- What happens if the drawer disconnects while drawing? (Handled by host reassignment from Scenario 2, but needs verification for canvas state).
- How are concurrent guesses handled if two people guess correctly at nearly the same time?
- What if the guess matches the secret word but has different casing? (e.g. "Rocket" vs "rocket").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture drawing paths from the drawer and store them in the backend room state.
- **FR-002**: System MUST allow the current drawer to clear all drawing paths in the room.
- **FR-003**: System MUST provide a guess submission form for all participants except the current drawer.
- **FR-004**: System MUST trim and validate guesses, rejecting empty or whitespace-only inputs.
- **FR-005**: System MUST perform case-insensitive comparison of guesses against the secret word.
- **FR-006**: System MUST append all valid guesses to the room's guess history, including the participant's name and a correctness flag.
- **FR-007**: System MUST award 100 points to a participant who correctly identifies the secret word.
- **FR-008**: System MUST transition the room status from "active" to "results" immediately upon a correct guess.

### Key Entities *(include if feature involves data)*

- **Drawing Path**: Represents a series of points, color, and line width captured during a drawing stroke.
- **Guess**: Represents a text submission from a guesser, containing the text, participant ID, participant name, and correctness result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawing updates appear on other clients within 2 seconds of the drawer finishing a stroke.
- **SC-002**: 100% of valid guesses are correctly identified as correct/incorrect regardless of casing.
- **SC-003**: Scores are updated and reflected in the scoreboard within 2 seconds of a successful guess.

## Assumptions

- Polling interval of 2 seconds is acceptable for the current user experience requirements.
- Drawing paths are sent as discrete chunks after each "mouse up" or similar event.
- Scoring is binary (100 for correct, 0 for incorrect) with no speed bonuses in this phase.
