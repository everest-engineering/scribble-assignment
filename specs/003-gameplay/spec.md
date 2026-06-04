# Scenario 3 — Gameplay Interaction

## Acceptance Criteria
3.1 The drawer sees an interactive canvas where they can draw with mouse
3.2 The drawer can clear the canvas with a "Clear Canvas" button
3.3 The drawer sees the secret word displayed prominently on their screen
3.4 Guessers see a guess input form (disabled for the drawer)
3.5 Empty/whitespace-only guesses are rejected with inline error "Guess cannot be empty"
3.6 Guesses are compared case-insensitively (e.g., "Rocket" matches "rocket")
3.7 A correct guess scores 100 points for the guesser; incorrect guesses add 0
3.8 Guess history (all guesses: who guessed what) is synced to all players via polling
3.9 Drawing strokes are synced to all players via polling (stored on backend, rendered on all screens)
3.10 When a guesser guesses correctly, the round transitions to "finished" status
3.11 All players start with score 0

## Edge Cases
- Drawer submits a guess → guess input hidden or disabled
- Guesser submits empty guess → inline error, no API call
- Guesser submits whitespace-padded guess → trimmed before comparison
- Multiple correct guesses → only first guesser scores 100 (round ends immediately)
- Guesses submitted after round is finished → rejected with 400 "Round is over"
- Drawing updates during round → strokes accumulated and synced via polling
