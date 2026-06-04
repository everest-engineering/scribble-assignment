# Feature Specification: Gameplay Interaction (US3)

**Feature Branch**: `001-scribble-game`
**Created**: 2026-06-04
**Status**: Complete

## User Story

The drawer draws on the canvas; guessers see updates within ~2 seconds. Guessers submit text guesses. A correct guess (case-insensitive match to the secret word) scores 100 points. A player cannot score twice for the same word. Guess history is visible to all players and synced via polling.

## Acceptance Scenarios

1. **Given** the drawer draws on the canvas and releases the mouse, **When** the stroke ends, **Then** the canvas data is sent to the server and guessers see the updated canvas within ~2 seconds.
2. **Given** the drawer clicks Clear, **When** cleared, **Then** the canvas is wiped and an empty canvas is synced to guessers.
3. **Given** a guesser submits the correct word (case-insensitive), **When** the guess is processed, **Then** their score increases by 100 and the guess appears in history as correct.
4. **Given** a guesser already scored correctly, **When** they submit the correct word again, **Then** their score stays at 100 (no double-scoring).
5. **Given** a guesser submits an incorrect guess, **When** processed, **Then** score stays at 0 and guess appears in history as incorrect.
6. **Given** two guessers each submit the correct word, **When** both are processed, **Then** each independently scores 100 (not shared).
7. **Given** a guesser submits an empty guess, **When** they click Submit, **Then** a client-side error is shown and no API call is made.
8. **Given** the drawer tries to submit a guess, **When** processed, **Then** the guess form is disabled and the server returns 403.
9. **Given** a non-drawer tries to update the canvas, **When** the server receives the request, **Then** it returns 403.
10. **Given** the game is in "playing" status, **When** any player's poll fires, **Then** they receive the latest canvas data and guess history.

## Functional Requirements

- FR-011: `updateCanvas` stores `canvasData` string; only drawer can call (403 otherwise)
- FR-012: `submitGuess` checks case-insensitive equality against `secretWord`
- FR-013: Scoring is per-player and independent — each guesser has their own score entry
- FR-014: No double-scoring — prior correct guess for same participant blocks second award
- FR-015: Guess form disabled when `isDrawer`; empty text rejected client-side and server-side
- FR-016: GamePage polls every 2s while `status === "playing"`

## Success Criteria

- SC-006: Draw syncs to guesser within ~2s
- SC-007: Two guessers each score 100 independently
