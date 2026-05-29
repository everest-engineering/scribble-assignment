# Research: Drawing, Guessing, and Scoring

## Needs Clarification Resolution

All clarifications were resolved during the specification phase:
- **Synchronization Format**: Drawing data will be represented as a list of `Stroke` objects.
- **Scoring**: Correct guesses award exactly 100 points.
- **Validation**: Guess correctness is determined by case-insensitive, trimmed comparison.
- **Tools**: Full RGB selection and slider-based width control for the drawer.
- **Coordinates**: Fixed logical 800x600 system scaled to fit the visual container.
- **History Limit**: Sequential guess history limited to the last 50 items.

## Technology Research

### Decision: react-sketch-canvas
- **Library**: `react-sketch-canvas`
- **Rationale**: Requested by the user. Provides a robust React component for free-hand drawing, supports SVG/Canvas exports, and includes built-in undo/redo (though undo/redo is out of scope for the *sync* phase, the local interaction is improved).
- **Integration Plan**:
  - Install via `npm install react-sketch-canvas` in the `frontend` directory.
  - The drawer will use the component's `exportPaths` or `onStroke` handlers to extract line data.
  - Since real-time vector broadcasting is out of scope, we will periodically snapshot the paths and send them to the backend, which will then be polled by other players.

## Current State Analysis

### Backend
- **Room Store (`backend/src/services/roomStore.ts`)**: Needs to be updated to store `strokes` (array of stroke objects) and `guesses` (array of guess objects).
- **Models (`backend/src/models/game.ts`)**: New interfaces for `Stroke` and `Guess`.
- **API (`backend/src/api/rooms.ts`)**: New endpoints for `POST /:code/strokes` and `POST /:code/guesses`.

### Frontend
- **Game Page (`frontend/src/pages/GamePage.tsx`)**: Replace the placeholder canvas with `react-sketch-canvas`. Implement the guess submission form.
- **Scoreboard (`frontend/src/components/Scoreboard.tsx`)**: Update to display scores from the `participant.score` property.
- **Sync**: Use the established `useRoomPolling` hook to pull latest strokes and guess history every 2 seconds.

## Implementation Strategy

1. **Backend Foundation**: Update models and roomStore to hold stroke and guess data. Implement the 50-item limit for guesses.
2. **Backend API**: Implement endpoints for submitting strokes (replaces existing stroke list) and submitting guesses (validates and updates score).
3. **Frontend Library**: Install `react-sketch-canvas` and wrap it in a local component that handles the 800x600 logical coordinate scaling.
4. **Interactive Drawing**: Connect the canvas to the backend. When the drawer finishes a stroke, send the updated stroke list.
5. **Guessing & Scoring**: Implement the guess form. On correct guess, trigger the backend scoring logic and display success UI.
6. **Synchronization**: Ensure the polling loop correctly updates the canvas (for guessers) and the guess history/scoreboard (for everyone).
