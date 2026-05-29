# Feature Specification: Scenario 4 — Result State & Restart

## Purpose
Provide feature-level artifacts for round results, shared final state, and host restart behavior.

## Scope
- Display shared result state after a round ends
- Show the correct word, final scores, and full guess history
- Allow only the host to restart the room
- Restart should preserve participants and clear round-specific state

## User Stories

### Shared Result State
As a participant, I want a clear result screen so I can see the outcome of the round.

Acceptance Criteria:
- Room status transitions to `results`.
- All participants see the same correct word.
- Final scores and full guess history are shown.
- Result view is read-only.

### Host Restart
As the host, I want to restart the room so the same players can return to the lobby.

Acceptance Criteria:
- Only the host can restart.
- Restart transitions room status back to `lobby`.
- Round-specific state is cleared.
- Participants remain in the room.
- Non-hosts see a waiting message.

## Edge Cases
- Result state is preserved until the host restarts.
- Restart clears `drawerId`, `secretWord`, drawing, guesses, and active-round scores.
- Restart does not remove participants or host identity.
- Polling clients navigate to `/lobby` when status returns to `lobby`.
