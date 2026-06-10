# Scenario 3 Specification: Gameplay Interaction

## Overview
This specification details the drawing and guessing mechanics, scoring rules, and synchronization of canvas/guess histories.

## Requirements

### 1. Canvas Interactive Drawing
- The drawer has access to a drawing canvas where they can click-and-drag or draw lines/curves.
- The drawing canvas includes a "Clear" button that resets the canvas back to blank.
- The canvas strokes/data must be stored in the room state on the backend so they can be synchronized.

### 2. Canvas Polling Sync
- For guessers, the frontend must poll the canvas status and strokes from the backend periodically (e.g., every 1000-2000ms) and render the drawing accordingly.

### 3. Guess Submission & Validation
- Guessers submit their guesses via a text input field on the Game screen.
- Guesses must be trimmed using `.trim()` before sending/validation.
- Empty or whitespace-only guesses must be rejected client-side with a clear warning, and not submitted to the backend.
- Guesses are case-insensitive. A guess of "Rocket" matches the secret word "rocket".

### 4. Sync Guess History
- Guess submissions are saved to the backend room state.
- All participants must see a synced log of recent guesses in a chat/guess history box, updated via the polling cycle.

### 5. Scoring Rules
- Correct guesses award 100 points to the guesser.
- Incorrect guesses award 0 points.
- Scoring is updated on the room state on the backend, which is synced to the frontend scoreboard.

## Acceptance Criteria

### Drawing Validation
1. **Given** a player is the drawer,
   **When** they draw on the canvas,
   **Then** the stroke data is uploaded to the backend and synced to other players.
2. **Given** a player is the drawer,
   **When** they click "Clear",
   **Then** the canvas is cleared locally and updated as blank on the backend.

### Guessing Validation
1. **Given** a player is a guesser,
   **When** they submit a guess matching the secret word (case-insensitively),
   **Then** they receive 100 points, and the guess history displays they guessed correctly.
2. **Given** a player is a guesser,
   **When** they submit an empty guess,
   **Then** it is rejected and not sent to the backend.
