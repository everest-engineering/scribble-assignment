# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` | **Date**: 2026-06-04

## Summary
Add drawing canvas, guess submission, scoring, and synced guess history.

## State Model Changes

### Backend — Room
- Add `strokes: Stroke[]` (array of {x1,y1,x2,y2,color,width})
- Add `guesses: Guess[]` (array of {participantId, text, correct, timestamp})

### RoomSnapshot
- Add `strokes: Stroke[]`
- Add `guesses: Guess[]`
- Add `scores: Record<string, number>`

## API Endpoints
- `POST /rooms/:code/draw` — Add stroke (drawer only)
- `POST /rooms/:code/clear` — Clear all strokes (drawer only)
- `POST /rooms/:code/guess` — Submit guess (guesser only)

## File-Level Changes

### Backend
1. `backend/src/models/game.ts` — Add Stroke, Guess interfaces, update Room
2. `backend/src/services/roomStore.ts` — Add addStroke(), clearStrokes(), submitGuess() with validation and scoring
3. `backend/src/api/schemas.ts` — Add drawSchema, guessSchema
4. `backend/src/api/rooms.ts` — Add draw, clear, guess routes

### Frontend
5. `frontend/src/services/api.ts` — Add draw/clear/guess API calls, update types
6. `frontend/src/state/roomStore.ts` — Add draw/clear/guess methods
7. `frontend/src/components/Canvas.tsx` — NEW: Interactive canvas with mouse drawing and clear
8. `frontend/src/components/GuessForm.tsx` — Wire to API, add validation
9. `frontend/src/components/Scoreboard.tsx` — Show live scores from snapshot
10. `frontend/src/components/ResultPanel.tsx` — Show guess history
11. `frontend/src/pages/GamePage.tsx` — Wire everything together

## Implementation Sequence
1. Add Stroke and Guess types to models
2. Add stroke/guess store methods
3. Add draw/clear/guess routes
4. Create Canvas component
5. Update GuessForm, Scoreboard, ResultPanel
6. Wire GamePage
