# Spec 004 — Result, Restart & Final Validation

**Scenario 4.** Given a round has ended, when the result state is displayed and the
host restarts, then all players see the correct word, final scores, and full guess
history; on restart, everyone returns to the lobby with players preserved and all
round state cleared.

## In scope for this group

- Shared result state visible to all players.
- Host-only restart that returns everyone to the lobby with players preserved and
  round state cleared.

## Behavior

### Round end → results
- A round ends when a guesser guesses correctly (from group 3): the room status
  becomes `results` and `round.winnerId` is set.
- In `results`, the snapshot is the same for everyone in these respects:
  - `word` is revealed to **all** players (not just the drawer).
  - `participants[].score` shows the final scores.
  - `guesses` contains the full, ordered guess history.
  - `drawerId` / `winnerId` identify who drew and who won.

### Result presentation
- The game screen shows a result panel with: the correct word, the winner (if
  any), the final scoreboard, and the complete guess history.
- The host sees a **Restart** control. Non-hosts see "Waiting for the host to
  restart…".

### Host-only restart
- `POST /rooms/:code/restart` `{ participantId }`:
  - not host → **403** `Only the host can restart`
  - status `lobby` (nothing to restart) → **409** `Game has not started`
  - otherwise: `round = null`, `status = "lobby"`, **every** participant's `score`
    reset to 0, participants list **preserved** (same ids/names), `hostId`
    unchanged.
- After restart, all clients polling the game are returned to the lobby (the lobby
  is reached when status is `lobby`), where they can start again.

## Data / API changes

- New endpoint `POST /rooms/:code/restart`.
- New Zod schema reuse: `startRoomSchema` shape (`{ participantId }`) — a
  `restartRoomSchema` alias is added for clarity.
- No new model fields; restart clears `round` and resets scores.

## Acceptance criteria

1. After a correct guess, **both** players' snapshots show `status: "results"`,
   the same `word`, the same final scores, and the same full guess history.
2. The result panel shows the correct word, the winner, the scoreboard, and the
   guess history.
3. A non-host cannot restart (403); the host can.
4. Restarting from `lobby` returns 409 `Game has not started`.
5. After the host restarts: `status` is `lobby`, `round` is cleared, every score
   is 0, and the participant list is unchanged (same players).
6. Both browser tabs return to the lobby after restart and can start a new round.

## Edge cases

- Restart is idempotent in effect: calling it again from the resulting lobby
  returns 409 (already in lobby) rather than corrupting state.
- A late canvas/guess request arriving after restart hits the active-round guard
  (status is `lobby` → 409 `No active round`).
- Scores reset to 0 for everyone, including the previous winner and the drawer.
