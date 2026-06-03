# Spec 002 — Game Start & Drawer Flow

**Scenario 2.** Given a game is starting and player names are trimmed
(empty/whitespace-only rejected with a message), when the first round begins,
then the host (or first player) becomes the clearly-identified drawer, and the
secret word (deterministically selected from the starter list) is visible only to
the drawer.

## In scope for this group

- Player-name validation: trim, reject empty/whitespace, length cap.
- Drawer assignment on round start.
- Deterministic secret-word selection from the starter list.
- Drawer-only word visibility (everyone else is kept blind).

## Behavior

### Player-name validation
- On `POST /rooms` and `POST /rooms/:code/join`, `playerName` is **trimmed** before
  use. A name that is empty or whitespace-only is rejected with **400** and the
  message `Player name is required`.
- Names longer than 24 characters are rejected with **400**
  `Player name must be 24 characters or fewer`.
- The trimmed value is what is stored and displayed (no silent `"Player"`
  fallback — that starter behavior is removed).
- The Create and Join forms also trim and block empty submissions client-side, and
  surface the server message on failure.

### Drawer assignment
- When the host starts the round, the **host becomes the drawer** for this single
  round (host = first player = drawer; no rotation, single round per the
  assumptions).
- The drawer is identified everywhere: snapshot `drawerId`, each participant view's
  `isDrawer`, and the viewer's `role` (`"drawer"` or `"guesser"`).

### Deterministic secret-word selection
- On round start the server selects a word from the starter list
  (`rocket, pizza, castle, guitar, sunflower`) **deterministically** as a pure
  function of the room code: `index = (sum of code char codes) % wordCount`.
- The same room code always yields the same word — reproducible and testable. No
  `Math.random()` is involved in word choice.

### Drawer-only word visibility
- While the room status is `playing`, the snapshot's `word` is the secret word
  **only** when the viewer is the drawer; for every guesser (and for unidentified
  viewers) `word` is `null`.
- The drawer's game screen shows the word to draw; guessers see a "guess the word"
  prompt with no word leaked in the payload.
- (The word becomes visible to everyone in the results state — specified in
  [004](../004-result-restart/spec.md).)

## Data / API changes

- No new endpoints. `POST /rooms/:code/start` now additionally **creates the round**
  (`drawerId`, `word`, empty `strokes`/`guesses`, `winnerId: null`).
- `createRoomSchema` / `joinRoomSchema` enforce trimmed, non-empty `playerName`.

## Acceptance criteria

1. Creating/joining with `"   "` (whitespace) returns 400 `Player name is required`;
   the participant is **not** added.
2. Creating with `"  Alice  "` stores `"Alice"` (trimmed).
3. After the host starts, the snapshot has `drawerId === hostId`, the host's
   participant view has `isDrawer: true`, and the host viewer's `role` is
   `"drawer"`.
4. The drawer's snapshot includes the `word`; a guesser's snapshot for the same
   room has `word === null`.
5. Starting the same room code twice (across fresh processes) selects the same
   word — selection is deterministic and unit-tested.

## Edge cases

- Name with internal spaces (e.g. `"Sir Draws A Lot"`) is preserved after trimming
  the ends.
- A non-host calling start is still rejected (403) before any drawer/word is
  assigned (carried over from group 1).
- A guesser must never receive the word in any `playing`-state response, including
  polled snapshots.
