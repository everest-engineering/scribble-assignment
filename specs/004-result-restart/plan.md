# Implementation Plan: Results & Restart

## Summary

Implement result display after round completion and restart flow. This feature completes the gameplay cycle and prepares the room for a new round.

## Data Flow

Round Ends → Display Results → Host Restarts → Clear Round State → Return to Lobby

## Testing Approach

Verify:
- Round transitions to finished state when a correct guess is submitted
- Results display final scores, the correct word, and complete guess history
- The restart action is available only to the host
- Restart preserves all participants and the room code
- Restart clears drawing data, guess history, and scores
- All players return to the lobby after restart
