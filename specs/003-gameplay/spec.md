# Group 3 — Gameplay Interaction (Scenario 3)

## Acceptance Criteria
3.1. The drawer can draw on a canvas (mouse/touch drawing).
3.2. The drawer can clear the canvas (single button clears all strokes).
3.3. The drawing is synced to all players via polling (stored as image data URL on server).
3.4. Guessers can submit guesses; guesses are trimmed before processing.
3.5. Guess comparison is case-insensitive.
3.6. Empty guesses are rejected with feedback.
3.7. Guess history is synced to all players via polling.
3.8. Correct guesses score 100 points; incorrect guesses add 0.
3.9. When a correct guess is made, the round ends (status → "result").

## Edge Cases
- Empty guess → "Guess cannot be empty" message.
- Case variation: "Pizza", "pizza", "PIZZA" all match the word "pizza".
- Leading/trailing whitespace in guess → trimmed.
- Guesser submits after correct guess already made → rejected (round over).
- Drawer cannot submit guesses (UI hides the guess form for drawer).
- Canvas cleared → all strokes removed.
