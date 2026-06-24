# Feature Spec: Gameplay Interaction (Scenario 3)

## Overview

Enable interactive drawing for the drawer, guess submission for guessers, synced state via polling, and deterministic scoring.

## User Stories

### US-1: Interactive drawing
**As** the drawer, **I want** to draw on a canvas, **so that** my drawing is visible on my screen.

**Acceptance Criteria:**
- [ ] Drawer can draw with mouse on canvas
- [ ] Strokes stored on server and synced to all clients via polling
- [ ] Non-drawers see the drawing update via polling
- [ ] Drawer cannot submit guesses (form disabled)

### US-2: Clear canvas
**As** the drawer, **I want** to clear the canvas, **so that** I can start over.

**Acceptance Criteria:**
- [ ] Clear button visible only to drawer
- [ ] Clears all strokes server-side
- [ ] All clients see empty canvas on next poll

### US-3: Guess submission
**As** a guesser, **I want** to submit guesses, **so that** I can try to identify the word.

**Acceptance Criteria:**
- [ ] Guess text trimmed; empty rejected with message
- [ ] Case-insensitive comparison against secret word
- [ ] Correct guess adds 100 to guesser's score; incorrect adds 0
- [ ] Guess history appended and synced to all via polling
- [ ] Guessers only (not drawer) can submit

### US-4: Round end on correct guess
**As** all players, **I want** the round to end when someone guesses correctly.

**Acceptance Criteria:**
- [ ] Correct guess transitions room status to "result"
- [ ] No further guesses or drawing accepted after result

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Drawer tries to guess | Disabled / rejected |
| Duplicate wrong guesses | Allowed, score unchanged |
| Empty guess | Rejected |
| Guess "ROCKET" vs word "rocket" | Correct (case-insensitive) |

## API Changes

- `POST /rooms/:code/drawing/strokes` — drawer adds stroke
- `POST /rooms/:code/drawing/clear` — drawer clears canvas
- `POST /rooms/:code/guesses` — guesser submits guess

## Validation Strategy

Two-tab test: drawer draws, guesser sees strokes; guesser submits wrong then correct guess; scores update; status becomes result.
