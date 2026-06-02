# Feature 003: Gameplay Interaction

## Discovery

Builds on Feature 002 playing state. Additional gaps:
- Canvas is a static placeholder with no drawing interaction
- GuessForm submit is a no-op
- No guess history, scoring, or round-end transition

## User Story

As the drawer, I want to draw on a canvas while guessers submit guesses, so that everyone sees the drawing and guess history sync via polling.

## Acceptance Criteria

### AC-1: Drawing Canvas
- **Given** the viewer is the drawer and status is `playing`
- **When** they draw on the canvas with mouse/touch
- **Then** strokes are sent to `POST /rooms/:code/strokes`
- **And** all players see strokes via polling within ~2s

### AC-2: Clear Canvas
- **Given** the drawer is drawing
- **When** they click "Clear Canvas"
- **Then** `POST /rooms/:code/clear` removes all strokes
- **And** all players see empty canvas on next poll

### AC-3: Guess Submission
- **Given** a guesser (non-drawer) during `playing`
- **When** they submit a guess via `POST /rooms/:code/guess`
- **Then** guess is trimmed; empty guesses return 400
- **And** guess is compared case-insensitively to `secretWord`
- **And** guess appears in history for all players

### AC-4: Scoring
- **Given** all scores start at 0 on game start
- **When** a guess is correct → scorer gets +100, status → `result`
- **When** a guess is incorrect → scorer gets +0, game continues

### AC-5: Guess History Sync
- **Given** multiple guesses submitted
- **When** any player polls
- **Then** full guess history is visible with participant name, text, and correct/incorrect indicator

### AC-6: UI Restrictions
- Drawer cannot submit guesses (form disabled)
- Non-drawers cannot draw on canvas (read-only view)
- Scoreboard shows live scores from snapshot

## Edge Cases

- Drawer-only stroke/clear authorization (403 otherwise)
- Guess during result state returns 409
- Multiple incorrect guesses allowed; first correct ends round

## Out of Scope

- Result panel details (Feature 004)
- Timers, speed bonuses, multiple rounds
