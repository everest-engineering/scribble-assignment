# Implementation Plan: Results, Restart, and Final Validation

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: `specs/004-results-restart-validation/spec.md`

## Summary

Implement end-of-round results and restart: after a correct guess, all players see the correct word, final scores, and full guess history; host-only restart returns everyone to lobby with players preserved and all round state cleared.

## Technical Context

**Storage**: Result and round state live in the in-memory room.

**Sync**: HTTP polling moves all players into results and back to lobby after restart.

**Constraints**: Restart does not create a new room, start another round immediately, or persist across browser refresh.

## Key Endpoints

- `POST /rooms/:code/guesses`: correct guess transitions to results.
- `GET /rooms/:code?participantId=...`: polling sync for result and restart state.
- `POST /rooms/:code/restart`: host-only restart from results to lobby.

## Data Flow

1. Correct guess updates result summary and final scores.
2. Polling players receive `status: "results"`.
3. Results show correct word, final scores, winner, and full guess history.
4. Host restarts from results.
5. Backend clears round state and returns status to lobby while preserving room code and players.
6. Polling players return to lobby.

## Validation

- All players see the same results.
- Non-host restart is rejected.
- Host restart preserves players and room code.
- Restart clears drawer, word, drawing, guesses, scores, and result state.
