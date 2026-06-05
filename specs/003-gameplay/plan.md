# Implementation Plan: Gameplay & Guessing

**Branch**: `003-gameplay` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the current game flow to support an active round. The drawer sees a secret word and can draw, while guessers submit validated guesses. The backend tracks guesses, scoring, and round visibility; the frontend renders a drawer-only canvas, guess form, and synchronized history.

## Technical Context

- Backend: add active round semantics in `backend/src/services/roomStore.ts` and route `POST /rooms/:code/guess`.
- Frontend: add draw/canvas controls in `frontend/src/pages/GamePage.tsx`, guess submission in `frontend/src/components/GuessForm.tsx`, and shared guess history/score display.
- Use existing polling system for sync.

## Approach

- Add new round state and guess history to room snapshots.
- Validate guesses in both schema and UI.
- Award 100 points for a correct guess, 0 otherwise.

## Validation

- Manual test with one drawer and one guesser.
- Confirm case/whitespace-insensitive matching.
- Confirm incorrect guesses do not change score.
