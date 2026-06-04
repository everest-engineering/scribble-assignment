# Scenario 3 — Gameplay Interaction

**Given** a round is active with a drawer and guessers (all scores start at 0),
**When** the drawer draws/clears the canvas and guessers submit their guesses,
**Then** the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0).

## Acceptance Criteria
1. Canvas supports drawing with mouse/touch. The drawer can draw lines on the canvas.
2. A "Clear Canvas" button clears the drawing (only for the drawer).
3. Guess submission trims whitespace and rejects empty guesses with an error.
4. Guesses are compared case-insensitively against the secret word.
5. A correct guess awards 100 points; incorrect adds 0.
6. Guess history (player name, guess text, correctness) is synced to all players via polling.
7. Scoreboard shows each player's cumulative score.
8. Canvas state is synced via polling (drawing data transmitted as base64 data URL).

## Edge Cases
- Guesser cannot submit empty or whitespace-only guesses.
- Guesser cannot see the secret word.
- Canvas state is maintained between poll intervals.
