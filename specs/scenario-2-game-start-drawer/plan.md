# Implementation Plan: Scenario 2 — Game Start & Drawer Flow

**Date**: 2026-06-04

## Summary
Implement game start logic: deterministic drawer assignment, secret word selection, role-based visibility, and lobby-to-game transition.

## Technical Context
- Deterministic selection uses character-code hash of room code
- Frontend polls lobby; on status=playing, navigates to /game
- Role displayed in GamePage player info card

## Implementation
1. Add `startGame()` to roomStore with deterministic drawer/word selection
2. Add `POST /rooms/:code/start` endpoint
3. Update LobbyPage auto-poll to navigate to /game on status change
4. Update GamePage to show role and conditional secret word
