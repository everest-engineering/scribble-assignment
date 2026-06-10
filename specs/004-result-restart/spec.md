# Scenario 4 Specification: Result, Restart & Final Validation

## Overview
This specification details the final results display, reveal of the secret word, game restart mechanics, and clearing of game round state.

## Requirements

### 1. Game Over State
- The game enters the "Result" state when all guessers have either guessed correctly or when the host/game timer forces the end of the round.
- The status of the room changes to `RESULTS`.

### 2. Result Screen Requirements
- All players must be automatically transitioned to the Results screen.
- The Results screen must show:
  - The correct secret word.
  - Final scoreboard containing all players sorted by their score.
  - Full guess history from the round.

### 3. Restart Flow
- Only the host has the permission to restart the game.
- The "Restart Game" button must only be visible/accessible to the host on the Results screen.
- Clicking "Restart Game" must clear the round state (scores, drawings, guess history) but preserve the current list of participants.
- The room state status reverts to `LOBBY` and redirects all players back to the Lobby screen.

## Acceptance Criteria

### Results View
1. **Given** the round has finished,
   **When** the frontend polls the `RESULTS` status,
   **Then** all players navigate to the Results screen.
   **And** everyone can see the correct secret word in plaintext.

### Restart Interaction
1. **Given** a Host is on the Results screen,
   **When** they click "Restart Game",
   **Then** the backend resets the room status to `LOBBY`, resets player scores to 0, clears guess history, and clears canvas data.
   **And** all players are automatically redirected back to the Lobby screen via polling.
2. **Given** a non-host player is on the Results screen,
   **Then** they do not see the "Restart Game" button.
