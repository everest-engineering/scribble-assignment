# Feature Spec: Results and Restart

**Feature**: `005-results-restart`
**Parent Assignment Spec**: `specs/001-scribble-game/spec.md`

## User Story

As players who have completed a round, I want to see the result and allow the host to restart the room so that everyone can review the outcome and return to the lobby together.

## Acceptance Criteria

1. Given a guesser submits the correct word, when the backend accepts the guess, then the room status becomes result.
2. Given the room is in result state, when any participant views the room, then they see the correct word.
3. Given the room is in result state, when any participant views the room, then they see final scores and full guess history.
4. Given the room is in result state and the viewer is the host, then restart is available.
5. Given the room is in result state and the viewer is not the host, then restart is unavailable or rejected.
6. Given the host restarts the room, then the room returns to lobby status.
7. Given the host restarts the room, then participants and host are preserved.
8. Given the host restarts the room, then drawer, secret word, drawing, guesses, scores, and result state are cleared.
9. Given other players are still on the result page, when polling observes the restart, then they return to the lobby.

## Requirements

- Correct guesses MUST transition the room to result state.
- Result snapshots MUST expose the secret word to all participants.
- Result snapshots MUST expose final scores and full guess history.
- Only the host MUST be allowed to restart.
- Restart MUST be accepted only from result state.
- Restart MUST preserve room code, host, and participants.
- Restart MUST clear all round-specific state.
- Result screens MUST keep polling so restart synchronizes across browser sessions.

## Entities

- Result snapshot: room status, secret word, final scores, guess history, restart capability.
- Room: lobby/result status and nullable round state.
- Participant: preserved player identity and host relationship.

## Validation

Automated validation covers result snapshot contents, host-only restart, non-host rejection, restart state reset, and participant preservation. Frontend tests cover result rendering, restart request shape, and local state transition back to lobby.
