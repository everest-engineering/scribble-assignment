# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` | **Date**: 2026-06-04

## Summary
Display round results and provide host-only restart that resets game state.

## State Model Changes
No new model fields. Restart transitions:
- status: "result" → "lobby"
- drawerId: cleared
- secretWord: cleared
- strokes: []
- guesses: []
- scores: all reset to 0

## API Endpoints
- `POST /rooms/:code/restart` — Host only, resets round state, preserves participants

## File-Level Changes

### Backend
1. `backend/src/services/roomStore.ts` — Add restartGame() that resets round state, preserves participants, status→lobby
2. `backend/src/api/rooms.ts` — Add POST /:code/restart route

### Frontend
3. `frontend/src/services/api.ts` — Add restartGame() API call
4. `frontend/src/state/roomStore.ts` — Add restartGame method
5. `frontend/src/pages/GamePage.tsx` — When status="result", show result view; show host-only "Play Again" button; navigate to /lobby on restart
6. `frontend/src/components/ResultPanel.tsx` — Show final scores, correct word, guess history

## Data Flow
Correct guess → status="result" → polling picks up result → all players see result → host clicks "Play Again" → POST /rooms/:code/restart → backend resets → polling picks up lobby → all players navigate to /lobby

## Implementation Sequence
1. Add restartGame to backend store
2. Add restart route
3. Update frontend API and store
4. Update GamePage and ResultPanel
