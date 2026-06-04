# Implementation Plan: Gameplay Interaction (US3)

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Summary

Add `updateCanvas` and `submitGuess` service functions, their routes and schemas, a `DrawingCanvas` React component, and wire GamePage with polling, the canvas, the guess form, and the scoreboard.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | Add `updateCanvas` (drawer guard); add `submitGuess` (drawer blocked, no-double-score, +100 correct) |
| `backend/src/api/schemas.ts` | Add `canvasUpdateSchema`, `submitGuessSchema` |
| `backend/src/api/rooms.ts` | Add `POST /:code/canvas`, `POST /:code/guess` routes |
| `frontend/src/services/api.ts` | Add `api.submitGuess`, `api.updateCanvas` |
| `frontend/src/state/roomStore.ts` | Add `submitGuess`, `updateCanvas` actions |
| `frontend/src/components/DrawingCanvas.tsx` | New component: canvas element, mouse handlers, `canDraw` gate, `onStrokeEnd` callback, Clear button, image-load for guesser |
| `frontend/src/components/GuessForm.tsx` | Add `onSubmit` prop, empty guard, clear on success |
| `frontend/src/components/Scoreboard.tsx` | Render `room.participants` × `room.scores` |
| `frontend/src/pages/GamePage.tsx` | Wire DrawingCanvas, GuessForm, Scoreboard; add 2s polling |

## Key Design Decisions

- Canvas sync via base64 `toDataURL()` — no WebSocket needed, fits polling constraint
- No-double-score checked server-side by scanning `room.guesses` for prior correct entry
- Guess comparison is `toLowerCase()` on both sides — case-insensitive without extra lib
- Polling only active when `status === "playing"` to avoid unnecessary requests

## Test Plan

- `correct guess awards 100 points`
- `incorrect guess awards 0`
- `duplicate correct guess keeps score at 100`
- `drawer blocked from guessing (403)`
- `empty text rejected (400)`
- `non-drawer canvas update blocked (403)`
- `api.submitGuess` and `api.updateCanvas` frontend unit tests
