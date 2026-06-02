# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart` | **Spec**: [spec.md](./spec.md)

## Summary

This phase finalizes the game lifecycle by ensuring results are clearly communicated to all players and the host can reset the game for a new round. While much of the logic for status transitions and the result view already exists, we need to address a gap in the score reset logic upon restart and perform a final validation of the entire flow.

## Technical Context

- **Backend**: `backend/src/services/roomStore.ts` contains `restartRoom` and `submitGuess` (status transition).
- **Frontend**: `frontend/src/pages/GamePage.tsx` handles the `results` view and host restart action.
- **Gap**: Current `restartRoom` logic preserves scores; FR-006 requires scores to be reset to zero.

## Planned Changes

1.  **Backend Refinement**:
    *   Update `restartRoom` in `backend/src/services/roomStore.ts` to reset all participant scores to zero.
2.  **Verification & Testing**:
    *   Update backend unit tests to verify score reset on restart.
    *   Add backend integration tests for the full restart flow.
    *   Add frontend component tests to verify the "Round Result" card visibility and host-only gating of the "Restart" button.
3.  **Final Polish**:
    *   Ensure consistent navigation between Lobby and Game pages.
    *   Verify that new players joining during the result phase see the correct state.

## Risk and Scope

- **State Sync**: Ensuring all players reliably transition from Results to Lobby when the host restarts. The 2-second polling should handle this.
- **Score Integrity**: Verifying that scores are truly zeroed out and don't leak into the next round.
