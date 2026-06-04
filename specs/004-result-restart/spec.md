# Feature Specification: Result, Restart & Final Validation (US4)

**Feature Branch**: `001-scribble-game`
**Created**: 2026-06-04
**Status**: Complete

## User Story

The host ends the round from the game screen. All players see a result screen showing the secret word, per-player scores, and the full ordered guess history. The host can restart the game, which resets all round state while keeping the same players. A second round can then be played cleanly.

## Acceptance Scenarios

1. **Given** the host clicks End Round, **When** processed, **Then** `status` changes to `"result"` and all players see the result screen.
2. **Given** the result screen is shown, **When** any player views it, **Then** they see the secret word, a per-player score list, and an ordered guess history with correct/incorrect indicators.
3. **Given** the host clicks Play Again, **When** processed, **Then** `status` returns to `"lobby"`, `drawer`/`secretWord`/`canvasData`/`guesses`/`scores` are cleared, and participants and `hostId` are preserved.
4. **Given** a non-host calls `POST /:code/end`, **When** processed, **Then** 403 is returned.
5. **Given** a non-host calls `POST /:code/restart`, **When** processed, **Then** 403 is returned.
6. **Given** the game is in `"result"` status, **When** the drawer polls, **Then** `secretWord` is visible to all players (result state removes the filter).
7. **Given** the host clicks End Round twice, **When** processed, **Then** the second call is idempotent — status stays `"result"`.
8. **Given** a second round starts, **When** played through, **Then** it functions identically to the first round with clean state.

## Functional Requirements

- FR-017: `endGame` sets `status="result"`; host-only (403)
- FR-018: `restartGame` sets `status="lobby"`; clears `drawer`, `secretWord`, `canvasData`, `guesses=[]`, `scores={}`; preserves `participants` and `hostId`; host-only (403)
- FR-019: Post-restart invariant — `participants.length` unchanged; `hostId` unchanged; all round fields reset
- FR-020: ResultPanel shown when `status === "result"` — displays word, scores, guess history
- FR-021: GamePage navigates to `/lobby` when `status === "lobby"` (after restart)

## Success Criteria

- SC-008: Full round-trip — end → result screen shows word+scores+history; restart → lobby with same players; second round starts clean
