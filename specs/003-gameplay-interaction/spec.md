# Feature Group 3 — Gameplay Interaction

Covers Business Scenario 3. Adds the interactive canvas and clear action,
validated guess submission, scoring, and guess-history sync via polling.

## User scenario

> **Given** a round is active with a drawer and guessers (all scores start at 0),
> **When** the drawer draws/clears the canvas and guessers submit their guesses,
> **Then** the drawing is visible on the drawer's screen; guesses are trimmed,
> case-insensitively compared, and empty ones rejected; the guess history is
> synced to all players via polling; correct guesses score 100 (incorrect add 0).

## In scope

- An interactive drawing canvas for the drawer, with a clear-canvas action.
- Guess submission by guessers: trimmed, case-insensitive comparison, empty
  rejected with a message.
- A shared guess history synced to all players (~2s polling).
- Scoring: a correct guess awards 100; incorrect adds 0; all scores start at 0.
- A scoreboard rendered from the synced snapshot.

## Out of scope

Result state, round end transition, and restart (Group 4). Transmitting the
drawing to other players (drawing is local to the drawer per the discovery
assumption). Multiple rounds, timers, bonuses.

## Design decisions

- **Drawing is local to the drawer.** The scenario requires the drawing to be
  visible on the drawer's screen, so canvas strokes are not sent to the backend
  or other clients. Guessers see a "drawer is drawing" surface. This keeps us
  within scope and avoids streaming pixel data over polling.
- **The drawer cannot guess.** The drawer holds the word, so guess submission is
  rejected for the drawer.
- **The round does not end in this group.** A correct guess scores 100 and stays
  recorded; ending the round and showing the result is Group 4.

## Functional requirements

1. **Canvas.** The drawer can draw freehand on a canvas with the mouse. A "Clear"
   action empties the canvas. Guessers do not see strokes.
2. **Guess validation.** A guess is trimmed; empty/whitespace-only is rejected
   with "Enter a guess." Comparison against the secret word is case-insensitive
   on trimmed text.
3. **Scoring.** A correct guess awards exactly 100 to the guesser; an incorrect
   guess adds 0. Scores begin at 0 for all participants.
4. **Guess history.** Every submitted guess is appended to a shared history with
   the player name, text, and whether it was correct, and is returned in the room
   snapshot so all clients converge via polling.
5. **Sync.** The game screen polls the snapshot ~2s, updating the guess history
   and scoreboard for every player.

## Acceptance criteria

- AC1: A guesser submitting the correct word (any case, with surrounding spaces)
  has their score become 100; the guess is marked correct in the history.
- AC2: An incorrect guess leaves the guesser's score at 0 and is recorded as not
  correct.
- AC3: An empty/whitespace-only guess is rejected with "Enter a guess." and not
  recorded.
- AC4: The drawer cannot submit a guess (rejected).
- AC5: With the game open in two tabs, a guess submitted in one appears in the
  other's history within ~2s.
- AC6: The scoreboard shows each participant's current score, all starting at 0.

## Edge cases

- Submitting a guess when the room is not `playing` is rejected.
- A non-participant cannot submit a guess.
- Clearing an already-empty canvas is a no-op and does not error.
