# Implementation Plan: Gameplay Interaction

## Scope

This feature slice implements the playable core loop: drawer drawing, drawer clear, guesser guesses, shared guess history, scoring, and transition to result. It keeps the implementation dependency-free and within the starter architecture.

## Technical Approach

- Add `updateDrawing`, `clearDrawing`, and `submitGuess` mutations to the backend room store.
- Require active room state before gameplay mutations.
- Enforce drawer-only drawing actions on the server.
- Enforce guesser-only guess submission on the server.
- Trim guesses and reject empty text with clear feedback.
- Compare guesses against the secret word case-insensitively.
- Add incorrect guesses to history with 0 points.
- Add correct guesses to history with 100 points, update the score map, set ended time, and move the room to result state.
- Add HTTP routes for drawing, clear drawing, and guesses.
- Replace the canvas placeholder with an SVG drawing surface.
- Keep active game polling so drawing, guesses, and scores synchronize.
- Render scores and guess history from the current room snapshot.

## Files

- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.test.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/Scoreboard.tsx`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/styles/app.css`

## Risks

- SVG stroke synchronization can be chatty because each pointer move updates state. This is acceptable for the small assignment flow.
- Polling introduces a short delay for other players to see drawing and guesses.

## Validation Plan

- Backend tests for drawing authorization, clear, guess validation, scoring, and result transition.
- Frontend tests for API/store methods, drawing rendering, guess form normalization, score rendering, and guess history.
- Manual two-browser validation for drawing sync, clear sync, incorrect guess, and correct guess.
