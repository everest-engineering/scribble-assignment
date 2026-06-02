# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Spec**: [spec.md](./spec.md)

## Summary

This phase implements the core interactive gameplay: drawing on the canvas and submitting guesses. Research indicates that the primary logic for these actions already exists in `DrawingCanvas.tsx`, `GuessForm.tsx`, and `roomStore.ts` (both backend and frontend). The focus of this plan is to verify the correctness of these interactions, ensure reliable synchronization via polling, and validate the scoring logic.

## Technical Context

- **Drawing**: `DrawingCanvas.tsx` captures points and calls `roomStore.appendDrawing`.
- **Guessing**: `GuessForm.tsx` captures input and calls `roomStore.submitGuess`.
- **Backend Logic**: `backend/src/services/roomStore.ts` handles scoring (+100 for correct) and status transition to `results`.
- **Synchronization**: `GamePage.tsx` implements a 2-second polling interval to refresh the room state.

## Planned Changes

1.  **Verification & Testing**:
    *   Add backend integration tests for guess submission, scoring, and status transitions.
    *   Add backend unit tests for `appendDrawing` and `clearDrawing` in `roomStore.test.ts`.
    *   Add frontend component tests to verify that `DrawingCanvas` and `GuessForm` correctly gate interactions based on the `isDrawer` state.
2.  **UI Refinement**:
    *   Ensure the `ResultPanel.tsx` correctly displays the success message and winner when a round ends.
    *   Verify that the "Exit Game" button and navigation logic are consistent with the user experience.

## Risk and Scope

- **Performance**: High-frequency drawing updates could potentially overwhelm the polling mechanism if not handled carefully. However, current specs assume "post-stroke" updates which should be manageable.
- **Concurrency**: Concurrent correct guesses need to be handled gracefully by the backend (already implemented via room status transition).
