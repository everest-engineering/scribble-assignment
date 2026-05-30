# Implementation Plan: Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: `specs/003-gameplay-interaction/spec.md`

## Summary

Implement active-round interaction: drawer-only drawing and clear canvas, guesser-only validated guesses, case-insensitive correct-word detection, fixed scoring, and polling-based sync for drawing, guess history, and scores.

## Technical Context

**Storage**: Round state remains in the in-memory room.

**Sync**: HTTP polling; no WebSockets.

**Constraints**: Single round, no timers, no bonus scoring, no drawer rotation.

## Key Endpoints

- `PUT /rooms/:code/drawing`: drawer-only drawing update.
- `POST /rooms/:code/drawing/clear`: drawer-only drawing clear.
- `POST /rooms/:code/guesses`: guesser-only guess submission.
- `GET /rooms/:code?participantId=...`: polling sync.

## Data Flow

1. Drawer draws paths on canvas.
2. Backend accepts drawing updates only from drawer.
3. Guesser submits trimmed text.
4. Backend rejects empty guesses and drawer guesses.
5. Backend compares guesses case-insensitively.
6. Correct guess awards 100, incorrect adds 0, and history is shared by polling.

## Validation

- Drawer can draw and clear.
- Non-drawer cannot draw or clear.
- Empty guesses are rejected.
- Incorrect guesses score 0.
- Correct guesses score 100.
- Guess history syncs to all players.
