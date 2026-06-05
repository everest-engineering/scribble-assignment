# Feature Group 3: Gameplay Interaction

## Scenario

Given a round is active with a drawer and at least one guesser, when the drawer draws or clears the canvas and guessers submit guesses, then scores start at 0, drawing state and guess history sync through HTTP polling, guesses are trimmed and validated, correct guesses score 100, and incorrect guesses score 0.

## Acceptance Criteria

1. Given a game has started, when the first room snapshot is returned, then every participant has a score of 0.
2. Given the drawer is on the game page, when they draw on the canvas, then the drawing is visible on the drawer's screen.
3. Given the drawer drawing state has changed, when other participants poll the room, then they receive the latest drawing state.
4. Given the drawer clicks clear canvas, when the action succeeds, then the canvas is cleared for the drawer.
5. Given the drawer clears the canvas, when other participants poll the room, then they receive the cleared canvas state.
6. Given a non-drawer is on the game page, then they cannot modify or clear the shared drawing state.
7. Given a guesser submits a guess with leading or trailing spaces, when the backend processes it, then the stored guess text is trimmed.
8. Given a guesser submits an empty or whitespace-only guess, when the backend processes it, then the guess is rejected with a clear message and is not added to history.
9. Given a guesser submits a guess with different casing than the secret word, when the trimmed text matches case-insensitively, then the guess is marked correct.
10. Given a guesser submits the correct guess, then that guesser's score becomes 100.
11. Given a guesser submits an incorrect guess, then that guesser's score remains 0.
12. Given guesses have been submitted, when any participant polls the room, then the full guess history is visible to that participant.
13. Given the drawer is the current viewer, then guess submission is unavailable or rejected for the drawer.
14. Given the round is not active, then drawing updates, clear-canvas actions, and guess submissions are rejected.

## Edge Cases

1. A guess contains only whitespace.
2. A guess contains leading or trailing whitespace around a valid word.
3. A guess uses uppercase, lowercase, or mixed-case letters.
4. A guess contains the correct word plus extra characters; it must be incorrect unless the trimmed whole guess matches the word case-insensitively.
5. A guesser submits the same incorrect guess multiple times.
6. A guesser submits the correct guess after one or more incorrect guesses.
7. Multiple guessers submit guesses close together.
8. The drawer attempts to submit a guess.
9. A non-drawer attempts to draw or clear the canvas through the UI or direct API call.
10. A participant not in the room attempts to draw, clear, or guess.
11. Drawing or clear requests target an unknown room code.
12. Drawing or guess requests are sent before the game has started.
13. The drawer clears an already-empty canvas.
14. A poll occurs while a drawing, clear, or guess request is in flight.
15. A participant refreshes and loses local participant identity; they can still view synced state but cannot perform privileged actions without a valid participant id.
16. A correct guess is submitted more than once by the same guesser; score must remain deterministic and not exceed 100 for this round.
