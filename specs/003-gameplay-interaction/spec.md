# Spec 003 — Gameplay Interaction

**Scenario 3.** Given a round is active with a drawer and guessers (all scores
start at 0), when the drawer draws/clears the canvas and guessers submit their
guesses, then the drawing is visible on the drawer's screen; guesses are trimmed,
case-insensitively compared, and empty ones rejected; the guess history is synced
to all players via polling; correct guesses score 100 (incorrect add 0).

## In scope for this group

- Interactive drawing canvas for the drawer; clear-canvas action.
- Guess submission with validation (trim, reject empty, case-insensitive compare).
- Guess history synced to all players via polling.
- Deterministic scoring: first correct guess scores 100; incorrect adds 0; all
  scores start at 0.

## Behavior

### Drawing canvas
- The drawer draws freehand strokes on a real `<canvas>`; the drawing is visible
  on the drawer's screen immediately.
- A stroke is `{ color, width, points: [{x, y}, …] }`. On completing a stroke the
  drawer's client `PUT`s the full stroke list to the server
  (`PUT /rooms/:code/canvas`), which becomes the round's canvas.
- **Clear canvas** sends an empty stroke list, wiping the drawing for everyone.
- Strokes are synced to guessers via the same 2s polling as the rest of the
  snapshot, so guessers can watch the drawing without WebSockets.
- Only the **drawer** may update the canvas; a non-drawer `PUT` is rejected
  **403** `Only the drawer can draw`. Canvas updates outside an active round are
  **409** `No active round`.

### Guess submission + validation
- `POST /rooms/:code/guesses` with `{ participantId, text }`.
- `text` is **trimmed**; empty/whitespace-only is rejected **400**
  `Guess cannot be empty`.
- The comparison against the secret word is **case-insensitive** and trim-based
  (`guess.trim().toLowerCase() === word.toLowerCase()`).
- The **drawer cannot guess**: **403** `The drawer cannot guess`.
- Guessing outside an active round is **409** `No active round`.
- Every accepted guess is appended to the round's guess history with
  `{ id, participantId, playerName, text, correct, createdAt }`.

### Synced guess history
- The full guess history is included in every snapshot's `guesses` and rendered to
  **all** players; it stays in sync via polling.

### Scoring
- All participants start at `score: 0` (set at create/join).
- The **first correct guess** awards that guesser **+100** and ends the round
  (`winnerId` is set and the room moves to `results`). Incorrect guesses add 0.
- Scoring is deterministic — a fixed 100, no time/speed bonuses.

> Ending the round transitions the room to `results`; the results *presentation*
> and *restart* are specified in [004](../004-result-restart/spec.md). The word
> becomes visible to everyone once status is `results` (logic already in place).

## Data / API changes

- New endpoints:
  - `PUT /rooms/:code/canvas` `{ participantId, strokes }` → drawer-only.
  - `POST /rooms/:code/guesses` `{ participantId, text }`.
- New Zod schemas: `strokeSchema`, `canvasUpdateSchema`, `guessSchema`.
- `Round.strokes` / `Round.guesses` / `Round.winnerId` are now written.

## Acceptance criteria

1. The drawer can draw and see strokes immediately; a guesser polling the room
   sees the same strokes within ~2s.
2. Clear canvas empties the drawing for all viewers.
3. A non-drawer cannot draw (403); the drawer cannot guess (403).
4. `"  "` (whitespace) guess → 400 `Guess cannot be empty`; no guess recorded.
5. Guess `"  PIZZA "` matches secret `pizza` (trim + case-insensitive) and scores
   the guesser 100; an incorrect guess leaves their score unchanged.
6. Both players see the full, ordered guess history via polling.
7. After the correct guess the room status is `results` and the guesser's score is
   100.

## Edge cases

- Two guesses arriving close together: only the first correct one wins/scores; a
  later guess against an already-finished round returns 409.
- A guess from someone not in the room is rejected (treated as not a guesser).
- Canvas payloads are bounded by normal play; no stroke history is retained across
  rounds (cleared on restart in group 4).
