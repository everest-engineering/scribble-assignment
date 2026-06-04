# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Scenario 3 — Gameplay Interaction: Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Canvas Drawing & Syncing (Priority: P1)

As a drawer, I want to draw or clear the canvas, and have my drawing rendered on my screen and synced to all guessers.

**Why this priority**: Essential component of the gameplay where drawing is the primary medium of communication.

**Independent Test**: Draw lines on the drawer's canvas, verify they are displayed on the drawer's screen, and verify that guessers' screens render the same drawing details on their canvas.

**Acceptance Scenarios**:

1. **Given** Alice is the drawer and Bob is a guesser, **When** Alice draws lines on her canvas, **Then** the drawing data is transmitted and Bob's canvas renders the exact same lines.
2. **Given** Alice has drawing content on her canvas, **When** Alice clicks "Clear Canvas", **Then** the canvas is cleared for both Alice and Bob.

---

### User Story 2 - Guess Submission, Validation & History Polling (Priority: P1)

As a guesser, I want to submit guesses that are validated (trimmed, case-insensitive, empty rejected) and see the guess history synchronized with all players.

**Why this priority**: Guessing is the core mechanic for players to participate and win.

**Independent Test**: Submit invalid, incorrect, and correct guesses, and verify validation errors, history logs, and list updates across all clients.

**Acceptance Scenarios**:

1. **Given** Bob is a guesser and the secret word is "rocket", **When** Bob submits a guess "  RoCkEt  ", **Then** the guess is trimmed, case-insensitively matched as correct, and Bob is marked as having guessed correctly.
2. **Given** Bob submits "   " or "", **When** he clicks guess, **Then** the guess is rejected with a validation error "Guess cannot be empty." and not added to the log.
3. **Given** Bob submits an incorrect guess "pizza", **When** the guess is processed, **Then** "pizza" is added to the shared guess history list and visible to all players via polling.

---

### User Story 3 - Score Calculation (Priority: P1)

As a player, I want correct guesses to increase my score by 100, while incorrect guesses do not change my score.

**Why this priority**: Tracks game progress and determines the winner.

**Independent Test**: Verify that a player's score increases by 100 immediately when they make a correct guess, and remains unchanged for incorrect guesses.

**Acceptance Scenarios**:

1. **Given** Bob has a score of 0, **When** Bob submits a correct guess, **Then** Bob's score increases to 100.
2. **Given** Bob has a score of 0, **When** Bob submits an incorrect guess, **Then** Bob's score remains 0.

---

### Edge Cases

- **Multiple Correct Guesses**: A player should not be able to score points multiple times for the same secret word in the same round.
- **Drawer Guessing**: The drawer must be prevented from submitting guesses.
- **Polling Latency**: Canvas updates and guess history updates must sync within 2 seconds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST capture and transmit canvas drawing paths from the drawer to guessers.
- **FR-002**: The system MUST allow the drawer to clear the canvas, updating all guesser canvases to be empty.
- **FR-003**: The system MUST trim leading and trailing spaces from guess inputs.
- **FR-004**: The system MUST compare guesses case-insensitively with the secret word.
- **FR-005**: The system MUST reject empty or whitespace-only guesses with a validation error and HTTP 400.
- **FR-006**: The system MUST sync a list of guess history logs to all participants via polling.
- **FR-007**: The system MUST award 100 points to a player upon their first correct guess in the round, and 0 points for incorrect guesses.

### Key Entities

- **DrawingState**: Represents the canvas lines/paths currently drawn.
- **Guess**: Represents a player's guess attempt, containing player ID, username, text content, and whether it was correct.
- **Score**: Represents the numeric score of each participant in the room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawing events are serialized and sent to the backend/rendered to guessers within 2 seconds of completion.
- **SC-002**: Validation feedback for empty guesses is displayed within 100ms.
- **SC-003**: Correct guesses update the score and player list on all clients within 2 seconds via polling.

## Assumptions

- Canvas drawing is synced using a coordinate list or path serialization.
- Scores are cumulative across rounds.
