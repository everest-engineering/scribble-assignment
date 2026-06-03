# Feature Group 4 — Result, Restart & Final Validation

Covers Business Scenario 4. Ends the round on a correct guess, shows a shared
result to all players, and lets the host restart back to the lobby.

## User scenario

> **Given** a round has ended, **When** the result state is displayed and the
> host restarts, **Then** all players see the correct word, final scores, and
> full guess history; on restart, everyone returns to the lobby with players
> preserved and all round state cleared.

## In scope

- A round-end trigger: a correct guess ends the round (`status` → `ended`).
- A shared result state visible to every player: the correct word, final scores,
  and the full guess history.
- A host-only restart that returns to `lobby`, preserves participants, resets
  their scores to 0, and clears drawer, secret word, and guesses.
- Clients react: when the round ends all players see the result; when the host
  restarts all players return to the lobby.

## Out of scope

Multiple rounds, drawer rotation, timers, or per-round bonuses. No new persistence
or libraries.

## Design decisions

- **Correct guess ends the round.** The first correct guess transitions the room
  to `ended`. Subsequent guesses are rejected (the game is no longer `playing`).
- **Word revealed on end.** The secret word is included in the snapshot for every
  viewer once `status === "ended"` (during `playing` it stays drawer-only).

## Functional requirements

1. **Round end.** When a guess is correct, the room `status` becomes `ended` in
   the same operation that scores it.
2. **Result visibility.** While `ended`, every snapshot includes the correct
   `word`, the participants with their final `score`s, and the complete
   `guesses` history — identical for all viewers.
3. **Restart (host-only).** `POST /rooms/:code/restart` by the host sets `status`
   back to `lobby`, `drawerId`/`secretWord` to null, empties `guesses`, and resets
   every participant's `score` to 0. Participants themselves are preserved. A
   non-host request is rejected (403); an unknown room is 404.
4. **Client result + restart.** The game screen shows the result when `ended`
   (word, final scores, history). The host sees a restart control; on restart all
   players (via polling) return to the lobby with cleared round state.

## Acceptance criteria

- AC1: A correct guess sets `status` to `ended` in the response snapshot.
- AC2: After end, a snapshot fetched by any participant (drawer or guesser)
  includes the correct `word`.
- AC3: The ended snapshot shows final scores (the correct guesser at 100) and the
  full guess history for every viewer.
- AC4: `POST /rooms/:code/restart` by a non-host returns 403; by the host returns
  a `lobby` snapshot with the same participants, all scores 0, no drawer, no word,
  and an empty history.
- AC5: Submitting a guess after the round has ended is rejected.
- AC6: In two tabs, after a correct guess both see the result; after the host
  restarts both return to the lobby with a cleared round.

## Edge cases

- Restarting a room that is already in `lobby` is a harmless reset (still
  host-only).
- A guesser cannot restart even by calling the endpoint directly.
- After restart, the same room can be started again (status is `lobby`).
