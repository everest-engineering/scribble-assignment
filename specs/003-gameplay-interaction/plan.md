# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Parent plan**: [001-scribble-game/plan.md](../001-scribble-game/plan.md)

## Summary

Interactive HTML5 canvas for the drawer, vector stroke sync via polling, guess submission with trim/case-insensitive match, scoring (100 on correct guess), and transition to `result` on correct guess.

## Technical Context

See shared context in [001-scribble-game/plan.md](../001-scribble-game/plan.md).

## Proposed Changes

### Backend

- `backend/src/services/roomStore.ts` — `submitDraw`, `submitGuess` (correct guess → status `result`, +100 points).
- `backend/src/api/rooms.ts` — `POST /rooms/:code/draw`, `POST /rooms/:code/guess`.

### Frontend

- `frontend/src/pages/GamePage.tsx` — canvas draw/clear, 2s poll for strokes and guesses.
- `frontend/src/components/Scoreboard.tsx`, `GuessForm.tsx` — live scores and guess log.

## Dependencies

- **Requires**: [002-game-start-drawer](../002-game-start-drawer/plan.md).
- **Blocks**: [004-result-restart](../004-result-restart/plan.md).

## Verification

Drawer paints; guesser sees stroke after poll; correct guess scores 100 and status becomes `result`.
