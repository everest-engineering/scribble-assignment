# Implementation Plan: Scenario 4 — Result, Restart & Final Validation

**Date**: 2026-06-04

## Summary
Implement results view (correct word, scores, guess history) and restart flow (preserve players, clear round state, return to lobby).

## Technical Context
- GamePage renders results when room.status === "finished"
- Host-only restart button in results view
- Auto-poll in results view catches restart and navigates to /lobby

## Implementation
1. Add results UI to GamePage when status is "finished"
2. Add endRound() to roomStore + POST /rooms/:code/end-round endpoint
3. Add auto end when all guessers guess correctly
4. Add restartGame() to roomStore + POST /rooms/:code/restart endpoint
5. Wire restart button in results view
6. LobbyPage auto-poll detects restart and stays in lobby
