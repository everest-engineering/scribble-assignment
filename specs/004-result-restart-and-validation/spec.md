## Scenario 4 — Result, Restart & Final Validation

### Problem

There is currently no way to end a round. The game screen stays in the playing state indefinitely — no player ever sees a summary of what happened, and there is no path back to the lobby. The host has no mechanism to declare the round over or to reset the game for another session. The correct word, which the drawer knew throughout the round, is never revealed to guessers. Scores accumulated during the round are visible in the scoreboard, but there is no dedicated result view that brings all information together after the round ends. Without a restart flow, the only way to play again is to create a brand new room, losing all players.

---

### Requirements

#### End-of-Round State
- The host triggers the end of the round by clicking an "End Round" button on the game screen.
- Ending the round transitions the room status from `"playing"` to `"finished"` on the backend.
- Only the host can end the round; other players do not see the button.
- Once the room is in `"finished"` status, no further guesses can be submitted.

#### Result Display
- When the room status is `"finished"`, all players see a result screen in place of the game screen.
- The result screen shows the correct word that was being drawn.
- The result screen shows the final scores for all participants.
- The result screen shows the complete guess history from the round, in submission order.
- The correct word is visible to all players on the result screen — the per-viewer filtering used during the round does not apply in `"finished"` status.
- The result state is fetched via the existing polling mechanism; players transition to the result view automatically when the status changes.

#### Restart Flow
- The host sees a "Play Again" button on the result screen.
- Non-host players see a waiting message instead of the button.
- Clicking "Play Again" calls a backend endpoint that resets the room to lobby state.
- On restart, all current participants are preserved with their names and ids intact.
- On restart, all round-specific state is cleared: `status` returns to `"lobby"`, `drawerId`, `currentWord`, and `guesses` are reset, and all participant scores are reset to zero.
- After a successful restart, all players are navigated back to the lobby screen.
- The lobby resumes automatic polling so players see the participant list without manual action.

---

### Edge Cases

- A non-host player must never see the "End Round" or "Play Again" buttons, even if they inspect the page source or make direct API calls — the backend enforces host-only permission on both endpoints.
- A guess submitted after the round ends must be rejected by the backend with a clear error. The game screen's guess form should become disabled or hidden once the status is `"finished"`.
- If a non-host player's polling tick fires while the host is mid-restart, the player may briefly see stale `"playing"` data before the status transitions — this is acceptable and resolves on the next poll.
- The correct word on the result screen must be visible to all players, including guessers who never saw it during the round. The backend must return `currentWord` without filtering when the room is `"finished"`.
- Scores shown on the result screen must match the scores recorded at the moment the round ended — they must not change after the round is over.
- After a restart, participants that were in the room continue to exist; no player is removed. A player who left the browser during the round but still has a valid `participantId` remains in the room after restart.
- Restarting clears scores to zero — the scores from the previous round do not carry over.
- The room code does not change on restart — players who were in the room can still identify it by the same code.

---

### Acceptance Criteria

**End-of-round state**
- [ ] The host's game screen shows an "End Round" button.
- [ ] A non-host player's game screen does not show the "End Round" button.
- [ ] Clicking "End Round" transitions the room status to `"finished"` on the backend.
- [ ] After status is `"finished"`, a direct call to the guess endpoint returns an error.

**Result display**
- [ ] All players' screens transition to a result view when the room status becomes `"finished"` (via polling, within ~2 seconds of the host ending the round).
- [ ] The result view shows the correct word that was being drawn.
- [ ] The correct word is visible to all players on the result view, including guessers.
- [ ] The result view shows the final score for every participant.
- [ ] The result view shows the complete guess history in submission order.
- [ ] The result view matches what was in the scoreboard and activity panel at the moment the round ended.

**Restart flow**
- [ ] The host sees a "Play Again" button on the result screen.
- [ ] A non-host player does not see the "Play Again" button.
- [ ] Clicking "Play Again" calls a backend restart endpoint.
- [ ] After a successful restart, the host is navigated back to the lobby.
- [ ] After the next polling tick, non-host players are also navigated back to the lobby.
- [ ] The lobby shows the same set of participants that were in the room before the restart.
- [ ] All participant scores are reset to zero after restart.
- [ ] The room code is unchanged after restart.

**Round state cleared**
- [ ] After restart, `status` is `"lobby"`.
- [ ] After restart, `drawerId` is `null`.
- [ ] After restart, `currentWord` is `null`.
- [ ] After restart, `guesses` is an empty array.
- [ ] After restart, every participant's score is `0`.
