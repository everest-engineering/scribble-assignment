# Feature Specification: Results & Restart

**Feature Branch**: `004-results-restart`

**Created**: 2026-06-05

**Status**: Draft

## Objective

Provide a shared round result experience where all players see the correct word, final scores, and guess history, and allow only the host to restart the game back to the lobby.

## Acceptance Criteria

1. Given a round has ended, when the result screen is shown, then all players see the same correct word, final scores, and full guess history.
2. Given the host views the result screen, when they press restart, then all players return to the lobby.
3. Given a restart happens, when players return to the lobby, then the participant roster is preserved and all prior round state is cleared.
4. Given a non-host tries to restart, when they attempt the action, then it is rejected with a host-only error.

## Edge Cases

- Result state must show the correct word even if the drawer leaves after the round ends.
- Restart must reset scores to zero while preserving the participant roster.
- A restarted room must not retain the previous guess history or drawer assignment.

## Key Requirements

- Only host may restart from the result state.
- Restart clears round state and scores, returning status to `lobby`.
- Result presentation is shared and consistent for all players.
