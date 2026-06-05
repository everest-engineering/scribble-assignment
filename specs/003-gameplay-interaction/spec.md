# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-05

**Status**: Draft

**Input**: Business Scenario 3 — "Given a round is active with a drawer and
guessers (all scores start at 0), When the drawer draws/clears the canvas and
guessers submit their guesses, Then the drawing is visible on the drawer's screen;
guesses are trimmed, case-insensitively compared, and empty ones rejected; the
guess history is synced to all players via polling; correct guesses score 100
(incorrect add 0)."

## Clarifications

### Session 2026-06-05

- Q: How is the drawing represented for polling sync? → A: As an ordered list of
  strokes on the room; each stroke is a list of `{x, y}` points (normalized
  0–1). The drawer appends strokes via an endpoint; all clients render the
  `strokes` array from the snapshot. This keeps payloads small and avoids image
  blobs.
- Q: Who can draw / clear? → A: Only the drawer. Guesser canvases are read-only;
  the clear-canvas endpoint is drawer-only.
- Q: How is a guess scored and recorded? → A: Trim the guess; reject empty;
  compare case-insensitively to the secret word. Correct → +100 to that player's
  score (once); incorrect → +0. Every attempt is appended to a shared
  `guesses` history with `{participantId, name, text, correct, at}`.
- Q: Can the drawer guess? → A: No. The drawer already knows the word; the guess
  endpoint rejects the drawer.
- Q: Are scores cumulative per attempt? → A: A correct guess awards 100 once; a
  player who already guessed correctly does not score again (idempotent at 100
  for this single round).
- Q: What does the guesser see of the word? → A: Still nothing (Scenario 2 rule
  holds); guessers only see strokes, the guess history, and scores.
- Q: Does a correct guess end the round? → A: No (this scenario). A correct guess
  is recorded and scored 100, but the room stays `playing`. The transition to a
  terminal result state is owned by Scenario 4.
- Q: How are strokes synced? → A: The drawer accumulates one stroke locally and
  POSTs the complete stroke on pointer-up; guessers render strokes from the 2s
  snapshot. Keeps requests few and payloads small.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer draws and clears the canvas (Priority: P1)

The drawer draws on the canvas with the pointer; strokes appear on their screen
and sync to guessers via polling. The drawer can clear the canvas.

**Why this priority**: Drawing is the core activity the guessers react to.

**Independent Test**: As the drawer, draw a few strokes and confirm they render;
click Clear and confirm the canvas empties; confirm a guesser tab shows the same
strokes within ~2s and cannot draw.

**Acceptance Scenarios**:

1. **Given** the drawer's game screen, **When** they draw, **Then** strokes
   render on their canvas and are persisted to the room.
2. **Given** strokes exist, **When** a guesser polls, **Then** the same strokes
   render read-only on the guesser's canvas within ~2s.
3. **Given** the drawer clicks Clear, **When** the action completes, **Then** the
   room's strokes are emptied for all players.
4. **Given** a guesser, **When** they interact with the canvas, **Then** nothing
   is drawn (read-only) and no clear control is shown.

---

### User Story 2 - Guessers submit validated guesses (Priority: P1)

Guessers type guesses; empty guesses are rejected; guesses are trimmed and
compared case-insensitively to the secret word.

**Why this priority**: Guessing is how non-drawers participate and score.

**Independent Test**: Submit "" (rejected), "  ROCKET " (matches `rocket`),
"Pizza" when the word is `rocket` (incorrect). Confirm validation, trimming, and
case-insensitive matching.

**Acceptance Scenarios**:

1. **Given** the guess input, **When** a guesser submits an empty/whitespace
   guess, **Then** it is rejected and not recorded.
2. **Given** the secret word `rocket`, **When** a guesser submits "  Rocket  ",
   **Then** it is trimmed, matched case-insensitively, and marked correct.
3. **Given** a wrong guess, **When** submitted, **Then** it is recorded as
   incorrect and adds 0 points.
4. **Given** the drawer, **When** they attempt to guess, **Then** the guess is
   rejected (drawer cannot guess).

---

### User Story 3 - Synced history and deterministic scoring (Priority: P1)

All players see the same guess history (with ✓/✗) and a scoreboard that reflects
correct = 100, incorrect = 0, sorted by score.

**Why this priority**: Shared history and scores are what make the round feel
synchronized and fair.

**Independent Test**: From two tabs, submit several guesses; confirm both tabs
show the same history order and the scoreboard updates (correct guesser at 100)
within ~2s.

**Acceptance Scenarios**:

1. **Given** multiple guesses, **When** any player polls, **Then** they see the
   full shared history with correct/incorrect markers in submission order.
2. **Given** a correct guess, **When** scored, **Then** that player's score is
   exactly 100; incorrect guesses leave the score unchanged.
3. **Given** the scoreboard, **When** rendered, **Then** participants are listed
   with their scores sorted descending.

---

### Edge Cases

- All scores start at 0 when the game starts.
- A second correct guess by the same player does not add another 100 (capped at
  100 for the round).
- Empty/whitespace guesses never enter the history.
- A guess submitted by a non-participant id is rejected.
- Clearing the canvas does not affect scores or guess history.
- Strokes use normalized coordinates so canvases of different sizes stay aligned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The room MUST store an ordered `strokes` list; each stroke is a list
  of normalized `{x, y}` points.
- **FR-002**: A drawer-only `POST /rooms/:code/strokes` endpoint MUST append a
  stroke to the room.
- **FR-003**: A drawer-only `POST /rooms/:code/clear-canvas` endpoint MUST empty
  the room's strokes.
- **FR-004**: The snapshot MUST include `strokes` so all clients render the same
  drawing; guesser canvases MUST be read-only.
- **FR-005**: A `POST /rooms/:code/guess` endpoint MUST trim the guess and reject
  empty/whitespace; it MUST reject the drawer and unknown participant ids.
- **FR-006**: Guess comparison MUST be case-insensitive against the secret word.
- **FR-007**: A correct guess MUST set that participant's score to 100 (awarded
  once); an incorrect guess MUST add 0.
- **FR-008**: Every accepted guess MUST be appended to a shared `guesses` history
  with participant id, name, text, correctness, and timestamp.
- **FR-009**: The snapshot MUST include `guesses` and per-participant `scores` so
  history and scoreboard sync to all players via polling.
- **FR-010**: All participants MUST start the round with a score of 0.
- **FR-011**: The Scoreboard MUST display participants sorted by score descending.

### Key Entities

- **Stroke**: an ordered list of normalized points `{x: number, y: number}`
  (0–1) representing one pen stroke.
- **Guess**: `{participantId, name, text, correct, at}` recording one attempt.
- **Room** (extended): adds `strokes: Stroke[]`, `guesses: Guess[]`, and
  `scores: Record<participantId, number>`.
- **RoomSnapshot** (extended): adds `strokes`, `guesses`, and `scores`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drawer strokes appear on a guesser's screen within ~2s and the
  guesser cannot draw or clear.
- **SC-002**: Empty guesses are rejected 100% of the time; "  Rocket " matches
  `rocket`.
- **SC-003**: A correct guess yields exactly 100 points for that player; repeated
  correct guesses do not exceed 100.
- **SC-004**: Both tabs show identical guess history order within ~2s.
- **SC-005**: The scoreboard renders players sorted by score descending, starting
  from 0.

## Assumptions

- Single round; scoring rules are fixed by the constitution (100 / 0).
- Strokes are stored as point lists (vector), not raster images, to keep polling
  payloads small and avoid new dependencies.
- The drawer is fixed (= host) from Scenario 2; no rotation.
- Result/finish/restart behavior is owned by Scenario 4; this scenario keeps the
  room in `playing` and focuses on interaction.
- Polling cadence/resilience reuse Scenario 1/2 (2s, non-fatal failures).
