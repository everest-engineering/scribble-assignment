# Implementation Plan: Result, Restart & Final Validation

## Overview
This plan details the logic for ending rounds, rotating drawers, and resetting the game state. We will expand the backend services to handle these transitions and update the frontend UI for a polished result experience.

## Proposed Changes

### Backend: Models & State
- **Status Enum**: Update `RoomStatus` to include `result`.
- **Turn Rotation**: Add `drawerIndex: number` to the `Room` interface to track whose turn it is across multiple rounds.

### Backend: Service Layer
- **End Round Service**: Implement `endRound(code, participantId)` to transition the status to `result`. revelation of the secret word happens here automatically via the snapshot logic.
- **Next Round Service**: Implement `nextRound(code, participantId)` to:
  - Increment `drawerIndex` with modulo wrapping.
  - Pick a new random word.
  - Reset `canvasData` and `guesses`.
  - Set `status = 'playing'`.
- **Restart Game Service**: Implement `restartGame(code, participantId)` to reset the room to the `lobby` state and zero out all scores.

### Backend: API Layer
- **New Endpoints**: Add `POST /rooms/:code/end`, `POST /rooms/:code/next-round`, and `POST /rooms/:code/restart` to `backend/src/api/rooms.ts`.

### Frontend: State & UI
- **Result UI**: Create or update `ResultPanel.tsx` to display the revealed word, standings, and history.
- **Polling Logic**: Update the polling in `GamePage.tsx` to detect `status === 'result'` and show the panel, and `status === 'lobby'` to redirect back to the lobby.
- **Host Controls**: Implement "Next Round" and "Back to Lobby" buttons on the result screen, visible only to the host.

## Verification Strategy
- **Unit Testing**: Add tests in `roomStore.scenario4.test.ts` and `roomStore.scenario5.test.ts` to verify rotation logic and state reset rules.
- **End-to-End Walkthrough**: Follow the `speckit.checklist` to verify the entire game flow across multiple rounds.
