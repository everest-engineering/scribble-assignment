# Reflection

## What the starter already had

The starter app ran fine on a clean clone. It could:

- create a room and get a 4-letter code,
- join a room with that code,
- show a lobby with the list of players and a manual "Refresh Room" button.

Behind that it had a small Express backend with a Zod-validated API and an in-memory store (basically a `Map` of rooms), and a React frontend with routing and a small state store built on `useSyncExternalStore`.

Everything past the basic room flow was either missing or faked. The game screen was a placeholder. The canvas was just a styled `<div>`, the guess box did nothing, and the scoreboard and result panel showed dummy text. There was no concept of a host, no auto refresh, no way to start a game, no drawer or secret word, and no guessing or scoring.

## What I added

I built the game in four groups, matching the four scenarios:

1. **Room setup & lobby**. The room creator is now the host. Joining checks the code and shows clear errors ("Enter a room code." vs "No room with that code."). The lobby refreshes itself roughly every 2 seconds instead of needing the button, and only the host can start, and only once there are at least 2 players.
2. **Game start & drawer**. Names get trimmed and empty ones are rejected. When the host starts, one player becomes the drawer and a secret word is picked from the starter list. The word is shown only to the drawer.
3. **Gameplay**. The drawer gets a real canvas to draw on, plus a clear button. Guessers type guesses, which are trimmed and compared case-insensitively. Every guess shows up in a shared history that all players see through the same polling. A correct guess is worth 100 points.
4. **Result & restart**. The host can end the round, which reveals the word to everyone along with the final scores and the full guess list. The host can then restart, which sends everyone back to the lobby, keeps the players, and wipes the round (scores back to 0, word and guesses gone) so they can play again.

I stuck to the rules in the constitution: no new libraries, no database, no WebSockets. Sync stays as ~2 second polling, and I extended the existing files instead of rewriting them.

## How Spec Kit guided the work

For each group I followed the same loop: write the spec, clarify the unclear bits, plan it out, break that into tasks, and only then write code, checking each slice in the browser before committing.

The part I found most useful was **clarify**. It forced me to make small decisions on purpose instead of guessing them mid-code. A few examples: how the secret word is picked (derived from the room code, so it's stable), whether the drawing is shared with guessers (no, it stays on the drawer's screen since pushing pixels over a 2s poll didn't make sense), and what happens after a correct guess (the input gets disabled).

From group 2 onward I also ran **analyze** before coding. It's a read-only check that the spec, plan, and tasks agree with each other. In group 2 it caught that I'd planned name validation in one file but written the task for another, so I lined them up. In group 4 it suggested making the "end round" endpoint reject calls when there's no active round, which I added.

Keeping the commits small and tied to one task each made it really easy to look back and see what changed and why.

## Decisions and tradeoffs

- **Drawing is local to the drawer.** Syncing the actual strokes would need real-time updates, which are out of scope. The assignment only asks for the drawing to be visible on the drawer's screen, so that's what I built.
- **Validation lives on the server, not just the UI.** Things like "only the host can start/end/restart" and "the drawer can't guess" are enforced on the backend, so hiding a button isn't the only thing stopping a bad action.
- **The secret word is hidden in the data, not just on the screen.** During play, a guesser's room snapshot simply doesn't include the word, so they can't dig it out of the network response. It's only sent back once the round ends.
- **Scores reset on restart.** Each start is a single round, so a restart clears scores rather than carrying them over.

## How I validated it

Two ways, every step:

- **In the browser, with two windows** (one host, one joiner) for each slice. I checked host badges, error messages, the polling, the drawer-only word, the synced guess list, scoring, the result reveal, and the restart back to a clean lobby.
- **Automated tests** at the service layer with Vitest. Around 21 backend tests covering host/start gating, name validation, drawer and word selection, word secrecy, guess validation and scoring, and end/restart. The existing frontend tests still pass. All green.

One real bug came out of testing. After moving to the game screen, the guess history wasn't updating for other players. Turned out the polling only existed on the lobby page, so the game page never refreshed. I added the same 2-second poll to the game page and that fixed the sync for both the history and the scores. I wrote it down as a deviation in the group 3 notes.

## If I had more time

I'd add round timers, drawer rotation so everyone gets a turn, and a proper end-of-game summary across rounds. None of that was in scope here, so I left it out on purpose to keep the spec, plan, and code in step with each other.
