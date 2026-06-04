# Feature Specification: Gameplay Interaction

## Overview
The "Gameplay Interaction" feature is the core of the Scribble experience. It encompasses the real-time (polling-based) drawing activity and the competitive guessing mechanism. This feature requires high synchronization between the drawer and the guessers to ensure that the game is playable and engaging.

## User Story
**As a player**, I want to be able to draw or guess the secret word,
**So that** I can earn points and enjoy the game with others.

**Given** a round is active with a drawer and guessers,
**When** the drawer sketches on the canvas or clears it, the updates are synchronized to all guessers.
**When** a guesser submits a guess, it is validated against the secret word and added to the round's history.
**Then** correct guesses earn points, and all activities are visible to all participants through the scoreboard and history log.

## Acceptance Criteria

### 1. Interactive Drawing Canvas
- The drawer must have access to a functional drawing canvas.
- Mouse and touch events must be captured to record the drawer's strokes as a series of coordinates.
- Drawing must be fluid and appear precisely under the cursor, accounting for responsive canvas scaling.
- A "Clear Canvas" button must be available for the drawer to reset the drawing area.

### 2. Real-time Drawing Synchronization
- Since WebSockets are not used, the drawing strokes must be JSON-encoded and stored in the room state on the backend.
- Guessers must poll the room state every 2 seconds to fetch and render the drawer's sketches.
- The synchronization must handle multiple strokes and the "clear" action effectively.

### 3. Guess Submission & Validation
- Guessers must be provided with an input field to submit their guesses.
- Guesses must be trimmed and compared case-insensitively with the `secretWord`.
- Empty or whitespace-only guesses must be rejected with appropriate feedback.
- Drawers are strictly prohibited from submitting guesses to prevent self-scoring or cheating.

### 4. Guess History & Scoring
- All guesses (correct and incorrect) must be recorded in the room's history.
- The history must be visible to all players to create a social and competitive atmosphere.
- Correct guesses must award the player 100 points.
- The scoreboard must be updated automatically via the polling loop.

### 5. Participant Identification
- Every activity (drawing, guessing) must be attributed to the correct player.
- The guess history must show the name of the player who made each guess.

## Technical Constraints
- The backend must enforce guess submission restrictions (no drawer guessing).
- Canvas coordinates must be scaled to the internal 800x500 resolution before transmission to ensure consistency across different screen sizes.
