# Feature Specification: Drawing, Guessing, and Scoring

**Feature Branch**: `scribble-lab`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Interactive drawing canvas, clear canvas, guess submission with validation, synced guess history via polling, deterministic scoring"

## Clarifications

### Session 2026-05-28
- Q: How should drawing data be represented for synchronization? → A: As a list of `Stroke` objects (points, color) for efficient polling.
- Q: What is the scoring rule for a correct guess? → A: A correct guess awards exactly 100 points to the participant.
- Q: How is a guess validated as "correct"? → A: Case-insensitive, trimmed string comparison against the room's `secretWord`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Drawing (Priority: P1)

As the assigned drawer, I want to draw on a canvas using my mouse/touch so that other players can see my sketch.

**Acceptance Scenarios**:
1. **Given** I am the `drawer`, **When** I click and drag on the canvas, **Then** a stroke is rendered locally and added to the room's stroke list.
2. **Given** I am the `drawer`, **When** I click the "Clear Canvas" button, **Then** all strokes are removed from the canvas and the room state.
3. **Given** I am a `guesser`, **When** I view the canvas, **Then** it is locked/disabled for interaction.

---

### User Story 2 - Guess Submission & Scoring (Priority: P1)

As a guesser, I want to submit text guesses so that I can try to identify the secret word and earn points.

**Acceptance Scenarios**:
1. **Given** I am a `guesser`, **When** I submit a string like `"  RoCkEt  "`, **Then** the system normalizes it to `"rocket"`, marks it correct, and awards 100 points.
2. **Given** I have already successfully guessed the word, **When** I submit the correct word again, **Then** my score does not increase further.
3. **Given** I am the `drawer`, **When** I try to submit a guess, **Then** the system rejects the request with a 403 Forbidden error.
4. **Given** I submit an empty or whitespace-only guess, **Then** the system discards it and does not write it to the history logs.

---

### User Story 3 - Synced Gameplay (Priority: P2)

As a participant, I want to see the latest drawing and guess history automatically so that the game feels interactive.

**Acceptance Scenarios**:
1. **Given** I am in the game, **When** the room state is polled, **Then** my local canvas and sequential guess history are updated to match the server state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render an interactive HTML5 canvas for the `drawer` with standard pixel tracking.
- **FR-002**: System MUST allow the `drawer` to trigger a `clearRect` (or equivalent) to reset the visual grid.
- **FR-003**: System MUST provide a text input for `guesser` roles that trims surrounding whitespace upon submission.
- **FR-004**: System MUST validate guesses against `secretWord` using case-insensitive evaluation (`.toLowerCase()`).
- **FR-005**: System MUST increase a player's score by exactly 100 points for their **first** correct guess of the round.
- **FR-006**: System MUST maintain a sequential array of all valid guess attempts (logs) in the backend room memory.
- **FR-007**: System MUST sync `strokes` and `guesses` via the established ~2s auto-polling loop.
- **FR-008**: System MUST reject any guess attempt from a participant assigned the `drawer` role with a `403 Forbidden` error.
- **FR-009**: System MUST discard blank or empty guess submissions before writing to history logs.

### Key Entities

- **Stroke**: `{ points: {x, y}[], color: string, width: number }`
- **Guess**: `{ playerName: string, text: string, isCorrect: boolean, timestamp: string }`
- **Participant**: Updated to include `score: number`.

### Edge Cases

- **EC-01: Extraneous Spaces/Casing**: Guesses are normalized (trimmed + lowercased) before comparison.
- **EC-02: Repeated Correct Guesses**: Multiple score accumulation is prevented; only the first correct guess per player per round counts.
- **EC-03: Drawer Submitting Guesses**: Backend validation blocks drawers from self-scoring.
- **EC-04: Empty/Whitespace Triggers**: Submissions containing only whitespace do not write empty rows or trigger API errors.

## Explicitly Out Of Scope

- [ ] Real-time vector broadcasting (lines are drawn locally by drawer, synced via snapshots).
- [ ] Multiple round rotations.
- [ ] Timer-based round endings.

## Success Criteria *(mandatory)*

- **SC-001**: Correct guesses award exactly 100 points.
- **SC-002**: Canvas updates/sketches are visible to all players within 3 seconds.
- **SC-003**: Guess history is displayed in correct chronological order.
