# Plan 004 — Result, Restart & Final Validation

## State model

No new fields. Two transitions complete the lifecycle:
```
playing --(first correct guess, group 3)--> results
results --(host restart)-----------------> lobby
```
On restart:
```
room.round = null
room.status = "lobby"
room.participants.forEach(p => p.score = 0)   // players preserved, scores cleared
// hostId unchanged
```
Result visibility (already implemented): when `status === "results"`,
`wordForViewer` returns the word for everyone; `participants[].score` and
`guesses` are already in every snapshot.

## Data flow

```
Correct guess (group 3) → status results → all poll → results snapshot
Host clicks Restart → store.restart → POST /rooms/:code/restart
   → round=null, status=lobby, scores=0
All poll (2s) → status lobby → GamePage redirects to /lobby (already wired)
Lobby → host can start a fresh round
```

## File-level plan

Backend:
- `api/schemas.ts` — add `restartRoomSchema` (`{ participantId }`).
- `services/roomStore.ts` — `restartRound(code, participantId)`: host guard (403),
  not-in-lobby guard (409), reset round + scores, status → lobby.
- `api/rooms.ts` — `POST /:code/restart`.

Frontend:
- `services/api.ts` — `restart(code, participantId)`.
- `state/roomStore.ts` — `restart()` action.
- `components/ResultPanel.tsx` — show correct word, winner, final scoreboard, and
  full guess history; Restart button for the host, waiting message otherwise.
- `pages/GamePage.tsx` — render `ResultPanel` when `status === "results"`; the
  existing effect already returns everyone to the lobby on `status === "lobby"`.

## Testing strategy

- Backend unit tests:
  - `restartRound`: non-host → 403; from lobby → 409; from results resets scores to
    0, clears round, status lobby, preserves participants.
  - results snapshot: word visible to a guesser once status is results.
- Manual two-tab: play a round to completion → both tabs show the same result →
  host restarts → both return to lobby with players preserved, scores cleared →
  can start again.

## Risks / mitigations

- **One tab stuck on the game screen after restart:** every screen polls; the
  game page redirects to the lobby as soon as a poll reports `status === "lobby"`.
- **Restart racing a late guess:** the active-round guard rejects guesses/canvas
  writes once status leaves `playing` (409), so restart cannot be corrupted.
- **Forgetting to reset scores:** explicitly covered by a unit test asserting all
  scores are 0 after restart.
