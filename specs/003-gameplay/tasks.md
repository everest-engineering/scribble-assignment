# Tasks: Gameplay Interaction

This document tracks the tasks for implementing the interactive drawing and guessing system.

## Backend Implementation
- [x] **Model Extension**: Add `canvasData`, `guesses`, and `scores` to the room interfaces.
- [x] **Drawing Logic**: Implement `updateCanvas` with drawer validation.
- [x] **Guessing Logic**: Implement `submitGuess` with scoring and history tracking.
- [x] **API Endpoints**: Add drawing and guessing POST routes to the Express router.

## Frontend Implementation
- [x] **API Update**: Integrate the new drawing and guessing endpoints into the `api` service.
- [x] **Canvas Hook**: Implement a coordinate-aware canvas drawing hook in `GamePage.tsx`.
- [x] **Scaling Fix**: Update the coordinate mapper to handle responsive canvas scaling ratios.
- [x] **Sync Renderer**: Implement the `useEffect` logic to fetch and render drawing data for guessers.
- [x] **Scoreboard & Log**: Hook up UI components to display real-time scores and guess history.

## Validation Tasks
- [x] **Unit Testing**: Run scenario 3 tests to verify permissions and scoring rules.
- [x] **Multiplayer Test**: Verify visual drawing sync between two tabs with a ~2s lag.
- [x] **Precision Test**: Confirm that drawing is accurate regardless of window size.
