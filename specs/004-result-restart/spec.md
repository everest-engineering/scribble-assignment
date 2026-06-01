# Feature 004 — Result, Restart & Final Validation

## User story

When the round ends, everyone sees the answer and scores; the host can restart to a clean lobby with the same players.

## Acceptance criteria

### Result display

- **Given** status is `result`, **When** any player views the game screen, **Then** they see the correct word, all participants’ final scores, and the full guess history.

### Restart

- **Given** the viewer is the host and status is `result`, **When** they click Restart, **Then** `POST /rooms/:code/restart` sets status to `lobby`, clears word/roles/guesses/strokes/scores, preserves participants, and all clients return to lobby via polling or navigation.

### Non-host restart

- **Given** a non-host calls restart, **Then** `403`.

### Final validation

- **Given** two browser tabs from create → join → start → draw → guess correctly → restart, **Then** the full flow works without manual refresh beyond polling.

## Edge cases

- Non-host sees disabled restart button.
- After restart, `canStart` requires ≥2 players again (still true if players preserved).

## Out of scope

Multiple rounds, leaderboard persistence across sessions.

## Validation checklist

- [ ] Two tabs: host creates, guest joins, lobby updates without manual refresh.
- [ ] Host starts with two players; guest lands on game view via polling.
- [ ] Correct guess shows result for both; scores and history match.
- [ ] Host restart returns both to lobby; participants unchanged; scores reset.
