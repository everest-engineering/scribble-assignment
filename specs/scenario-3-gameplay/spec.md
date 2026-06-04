# Feature Specification: Scenario 3 — Gameplay Interaction

**Created**: 2026-06-04
**Status**: Draft

## User Scenarios & Testing

### User Story 1 — Drawing and Viewing (Priority: P1)

The drawer draws on a canvas; all players see the drawing update via polling.

**Why this priority**: Drawing is the core mechanic — without it, guessers have nothing to guess.

**Independent Test**: Drawer draws a stroke on the canvas. After the next poll cycle, all players see the stroke.

**Acceptance Scenarios**:

1. **Given** a game in progress, **When** the drawer draws a stroke, **Then** the stroke is persisted and visible in the room snapshot.
2. **Given** a game in progress, **When** a non-drawer views the room, **Then** they see all strokes drawn so far.
3. **Given** a game in progress, **When** the drawer clicks "Clear Canvas", **Then** all strokes are removed from the room snapshot.

### User Story 2 — Guessing and Scoring (Priority: P1)

Guessers submit guesses; guesses are validated, compared case-insensitively, scored, and synced to all players.

**Why this priority**: Guessing and scoring make the game competitive and complete the core loop.

**Independent Test**: A guesser submits a guess matching the word (case-insensitive). The guess shows as correct, score increases by 100, and all players see the guess in the activity feed.

**Acceptance Scenarios**:

1. **Given** a game in progress, **When** a guesser submits an empty or whitespace-only guess, **Then** the API rejects with "Guess cannot be empty".
2. **Given** a game in progress, **When** a guesser submits a correct guess with different casing, **Then** it is marked correct and +100 points awarded.
3. **Given** a game in progress, **When** a guesser submits an incorrect guess, **Then** it is marked incorrect and 0 points awarded.
4. **Given** a game in progress, **When** any guess is submitted, **Then** it appears in the room's guess history visible to all players via polling.
5. **Given** a game in progress, **When** the drawer attempts to submit a guess, **Then** the API returns 400 "Drawer cannot guess".

---

### Edge Cases

- What happens if two guessers submit simultaneously? — Each guess is processed sequentially; both appear in history.
- What happens if a guess matches after trimming but was typed with leading/trailing spaces? — Zod `.trim()` normalizes before comparison.
- What happens if all guessers guess correctly? — Game automatically transitions to "finished" status.

## Requirements

### Functional Requirements

- **FR-001**: Drawing strokes MUST be stored as serializable point arrays in the room.
- **FR-002**: Only the drawer MAY add strokes or clear the canvas.
- **FR-003**: All players MUST see the current drawing via polling.
- **FR-004**: Guesses MUST be trimmed and empty guesses rejected.
- **FR-005**: Guess comparison MUST be case-insensitive.
- **FR-006**: Correct guesses MUST award exactly 100 points.
- **FR-007**: Incorrect guesses MUST award 0 points.
- **FR-008**: The drawer MUST NOT be allowed to guess.
- **FR-009**: All guesses MUST appear in a shared history visible to all players.

### Key Entities

- **CanvasStroke**: `{ points: {x,y}[], color: string, width: number }`
- **Guess**: `{ participantId, text, correct, timestamp }`
- **Room.guesses**: Ordered array of all guesses.
- **Room.drawing**: Ordered array of all strokes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Drawing strokes appear on all clients within 2 seconds.
- **SC-002**: Guesses appear in all clients' activity feeds within 2 seconds.
- **SC-003**: Scores update immediately upon correct guess.
