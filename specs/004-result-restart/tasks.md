# Tasks: Result, Restart & Final Validation

This document tracks the tasks for implementing the round end and game reset logic.

## Backend Implementation
- [x] **Model Update**: Add `result` to the status enum and `drawerIndex` to the room model.
- [x] **Service Logic**: Implement `endRound` with status transition logic.
- [x] **Service Logic**: Implement `nextRound` with turn rotation and random word selection.
- [x] **Service Logic**: Implement `restartGame` with full state and score reset.
- [x] **API Endpoints**: Add the necessary POST routes to the Express backend.

## Frontend Implementation
- [x] **API Update**: Integrate end, next-round, and restart endpoints into the `api` service.
- [x] **Result Panel**: Implement the `ResultPanel.tsx` component to show standings and history.
- [x] **Polling Update**: Enhance `GamePage.tsx` to handle result and lobby status transitions.
- [x] **Host Actions**: Add and hook up buttons for "Next Round" and "Back to Lobby" in the UI.

## Validation Tasks
- [x] **Unit Testing**: Run scenario 4 and 5 tests to verify rotation and reset rules.
- [x] **Manual Walkthrough**: Complete multiple round cycles using two browser tabs.
- [x] **Final Build Check**: Ensure both frontend and backend are production-ready.
