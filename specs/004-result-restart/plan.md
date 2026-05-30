# Technical Plan: Result, Restart & Final Validation

This document outlines the API route, controller functions, and UI updates required to support transitioning to a post-game result state and resetting back to the lobby.

## 1. State Model Changes
The backend room data store handles transitions back to `"lobby"` status.
* `status`: Expose `"result"` status.
* Clean up all gameplay variables in the room state upon a restart trigger.

## 2. API Endpoints
* **`POST /rooms/:code/restart`**:
  * Validation: Requesting player ID must match the room's `hostId`.
  * Action: Resets room state:
    * `status` is set back to `"lobby"`.
    * `drawerId = null`.
    * `secretWord = null`.
    * `drawingData = ""`.
    * `guesses = []`.
    * For each participant, set `score = 0`.
  * Response: Return the updated room snapshot.

## 3. Frontend Layout Updates
* **Store (`frontend/src/state/roomStore.ts`)**:
  * Add action `restartGame()` to POST to the restart endpoint.
* **Game Page (`frontend/src/pages/GamePage.tsx`)**:
  * If the polled room status changes to `"result"`, render the post-game layout instead of the drawer/guesser view.
  * Render the final scoreboard, correct word, and guess list.
  * Render a "Return to Lobby" button visible only to the host.
  * Trigger `restartGame()` on button click.
  * If the room status changes to `"lobby"` via polling, redirect the client back to `/rooms/:code/lobby`.

## 4. Verification Plan
* Validate that correct guesses trigger immediate result view loading on all tabs.
* Check that restarting preserves participants and clears scores.
* Verify the whole workspace builds cleanly.
