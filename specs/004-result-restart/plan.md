# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Parent plan**: [001-scribble-game/plan.md](../001-scribble-game/plan.md)

## Summary

Reveal secret word and final scores in `result` status, host-only restart back to `lobby` with round state reset, and automatic redirect to lobby for all players.

## Technical Context

See shared context in [001-scribble-game/plan.md](../001-scribble-game/plan.md).

## Proposed Changes

### Backend

- `backend/src/services/roomStore.ts` — reveal `secretWord` in snapshot when `status === "result"`; `restartRoom` clears canvas/guesses/scores, preserves participants.
- `backend/src/api/rooms.ts` — `POST /rooms/:code/restart` (host-only).

### Frontend

- `frontend/src/pages/GamePage.tsx` — result panel, host-only Restart, redirect to `/lobby` on status `lobby`.
- `frontend/src/components/ResultPanel.tsx` — revealed word, scores, guess history.

## Dependencies

- **Requires**: [003-gameplay-interaction](../003-gameplay-interaction/plan.md).

## Verification

After correct guess, both see result; host restarts; both return to lobby with same players.
