# Feature Specification: Result, Restart & Final Validation

## Overview
The "Result, Restart & Final Validation" feature handles the conclusion of a round and the transition back to a fresh starting state. It provides closure for the participants by showing the final outcome and gives the host the power to either continue playing or reset the entire game session. This stage is vital for the replayability and lifecycle management of the game.

## User Story
**As a host**, I want to be able to end a round and see the results,
**So that** we can see who won and decide whether to play another round or start over.

**Given** a round has concluded,
**When** the host ends the round, the room status changes to `result`.
**Then** all players see the correct word, the final scores, and the complete guess history.
**When** the host chooses to restart, all round-specific state is cleared while participants are preserved.

## Acceptance Criteria

### 1. Controlled Round Conclusion
- The host must have an "End Round" button (simulated for this lab) to manually conclude the drawing phase.
- Upon clicking, the room status must transition to `result`, signaling all clients via polling to display the final scoreboard.

### 2. Result Screen Requirements
- All participants must see a comprehensive summary of the round.
- The summary must include:
  - The secret word (revealed to everyone).
  - The final scores for all players in the room.
  - The full, chronologically ordered guess history.
- The result screen must disable drawing and guessing actions.

### 3. Continuous Multi-Round Gameplay (Scenario 5 Enhancement)
- The host must have a "Next Round" option to continue the session.
- "Next Round" must:
  - Transition the room back to the `playing` status.
  - Automatically rotate the drawer role to the next participant in the list.
  - Select a new, randomized secret word.
  - Clear the canvas and guess history.
  - Preserve the cumulative scores from previous rounds.

### 4. Full Game Reset
- The host must have a "Back to Lobby" (or "Restart Game") option.
- This action must:
  - Reset the room status to `lobby`.
  - Clear all scores to zero.
  - Clear all round-specific data (canvas, guesses, word, drawer).
  - Preserve the list of participants.

### 5. Final Validation & End-to-End Integrity
- The entire game lifecycle (Lobby -> Start -> Gameplay -> Result -> Next Round/Lobby) must be verifiable using two browser tabs.
- The system must remain stable and consistent through multiple round cycles and resets.

## Technical Constraints
- The backend must strictly enforce host-only privileges for the "End Round", "Next Round", and "Restart" actions.
- Room status changes must be detected by the existing polling loop to trigger UI navigation.
