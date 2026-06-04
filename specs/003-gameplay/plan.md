# Implementation Plan: Gameplay Interaction

## Overview
This plan details the implementation of drawing synchronization and guess processing. We will use JSON-encoded coordinate data for drawing and a standard POST/poll flow for guess validation and scoring.

## Proposed Changes

### Backend: Models & State
- **Room Interface**: Update the `Room` interface to include:
  - `canvasData: string`: To store JSON-encoded strokes.
  - `guesses: Guess[]`: To store the round's history.
  - `scores: Record<string, number>`: To track each player's cumulative score.
- **Guess Interface**: Define a `Guess` object with `playerId`, `playerName`, `text`, `isCorrect`, and `timestamp`.

### Backend: Service Layer
- **Update Canvas Service**: Implement `updateCanvas(code, participantId, data)` to:
  - Verify the requester is the active drawer.
  - Overwrite the room's `canvasData` with the new payload.
- **Submit Guess Service**: Implement `submitGuess(code, participantId, text)` to:
  - Verify the requester is NOT the drawer.
  - Compare the guess with the `secretWord` (case-insensitive).
  - Add the guess to history and award 100 points if correct.

### Backend: API Layer
- **New Routes**: Add `POST /rooms/:code/draw` and `POST /rooms/:code/guess` to `backend/src/api/rooms.ts`.

### Frontend: State & UI
- **Canvas Implementation**: In `GamePage.tsx`, use a `useRef` for the HTML5 `<canvas>` element. Implement mouse/touch handlers to capture and draw lines locally for the drawer.
- **Stroke Synchronization**: Implement a mechanism to JSON-encode the list of strokes and send it to the backend via `roomStore.draw()`.
- **Canvas Renderer**: In the polling loop, update the guesser's canvas by parsing the incoming `canvasData` JSON and redrawing the strokes.
- **Scoreboard & History**: Update `Scoreboard.tsx` and the guess log in `GamePage.tsx` to pull data from the synchronized room state.

## Verification Strategy
- **Unit Testing**: Add tests in `roomStore.scenario3.test.ts` to verify drawing permissions, guess validation, and scoring accuracy.
- **Manual Verification**: Test drawing precision across different screen sizes. Verify that correct guesses immediately update the scoreboard for all players.
