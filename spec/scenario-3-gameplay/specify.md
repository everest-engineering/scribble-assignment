# Feature Specification: Scenario 3 — Gameplay Interaction

## Purpose
Provide feature-level artifacts for drawer drawing, guess submission, synced history, and scoring.

## Scope
- Drawer drawing and clear canvas actions
- Guess submission with validation
- Synced guess history across players via polling
- Deterministic scoring for correct and incorrect guesses

## User Stories

### Drawer Drawing and Clear Canvas
As the drawer, I want to update and clear the drawing so I can communicate the word.

Acceptance Criteria:
- Drawer can draw on the canvas.
- Drawer can clear the canvas.
- Only the drawer can send drawing updates to the backend.

### Guess Submission and Sync
As a guesser, I want to submit guesses and see synced guess history across players.

Acceptance Criteria:
- Empty/whitespace guesses are rejected.
- Guesses are trimmed before storage.
- Guess history is visible to all players within polling cadence.

### Deterministic Scoring
As a player, I want correct guesses to score 100 points and incorrect guesses 0.

Acceptance Criteria:
- Correct guesses are scored case-insensitively.
- First correct guess by a participant awards 100 points.
- Repeated correct guesses award 0 additional points.
- Scoreboard updates for both players.

## Edge Cases
- Drawer-only drawing updates must be enforced by backend permission checks.
- Guessers cannot clear the canvas.
- A correct guess repeated by the same participant must not award extra points.
- The guess history and scores must sync within the existing polling interval.
