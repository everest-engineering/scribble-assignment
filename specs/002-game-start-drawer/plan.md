# Technical Plan: Game Start & Drawer Flow

This document details the backend endpoints, data filtering rules, and frontend page rendering updates needed to support transitioning the room to an active game state.

## 1. State Model Changes
We extend the backend `Room` model:
* `status`: Expose `"game"` status.
* `drawerId`: Store the participant ID of the drawer.
* `secretWord`: Store the secret word.

## 2. API Endpoints
* **`POST /rooms/:code/start`**:
  * Action: Changes room status to `"game"`.
  * Validation: Requesting participant ID must match the room's `hostId`, and there must be at least 2 participants in the room.
  * Logic: Assign `drawerId = hostId`. Choose the first word from the starter list `rocket` (or select deterministically based on room properties).
* **`GET /rooms/:code`**:
  * Security/Rule: Modify the `toRoomSnapshot` mapping service. If the requesting participant ID (received from the headers/query) does not match the room's `drawerId`, replace the `secretWord` value with `null` in the returned JSON object.

## 3. Frontend Layout Split
* **Store (`frontend/src/state/roomStore.ts`)**:
  * Add action `startGame()` to trigger the start endpoint.
* **Game Page (`frontend/src/pages/GamePage.tsx`)**:
  * Implement active polling inside a `useEffect` hook.
  * Retrieve the room snapshot. If `status` is `"game"`, identify if the local player's ID matches `drawerId`.
  * **Drawer UI**: Render an interactive drawing canvas and display the secret word.
  * **Guesser UI**: Render a read-only drawing canvas and a text box to submit guesses.

## 4. Verification Plan
* Test that starting the game changes states across multiple screens.
* Inspect network requests to confirm the secret word is NOT sent to guesser clients.
