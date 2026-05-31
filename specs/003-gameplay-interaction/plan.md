# Technical Plan: Gameplay Interaction

This document outlines the API design, data schemas, and synchronization methods required to support drawing synchronization, guess processing, and scoring updates.

## 1. State Model Changes
Extend `Room` and `Participant` state models:
* `drawingData`: Save drawing state as a serialized string (e.g. coordinates or image data) in-memory.
* `guesses`: A list of `Guess` objects, where each contains `senderId`, `senderName`, `text`, `correct` flag, and `timestamp`.

## 2. API Endpoints
* **`POST /rooms/:code/drawing`**:
  * Payload: `{ drawingData: string }`
  * Action: Updates the room's drawing state.
  * Validation: Requesting player must be the drawer.
* **`POST /rooms/:code/guess`**:
  * Payload: `{ text: string }`
  * Action: Process guess, check case-insensitively, append to guess history, award points, and set status to `"result"` if correct.
  * Validation: Zod schema rejects empty guesses. The drawer cannot submit guesses.

## 3. Frontend Polling & Redraw Loops
* **Drawing Transmission**:
  * The drawer component records drawing coordinates on canvas events (mouse/touch down, move, up) and periodically pushes the serialized stroke state to `POST /rooms/:code/drawing`.
* **Drawing Polling**:
  * Guessers poll the room snapshot. When the polled `drawingData` changes, they parse the string and redraw the lines on their read-only canvas.
* **Guess Log & Scores**:
  * The guess list and participant scores in the room state are updated by polling and rendered dynamically in the UI.

## 4. Verification Plan
* Verify that drawing strokes sync between two tabs within the 2-second polling window.
* Test that empty guesses are rejected by the UI.
* Confirm that case-insensitive guesses (e.g. "PiZzA" for "pizza") trigger the correct score allocation and transition the room to the result view.
