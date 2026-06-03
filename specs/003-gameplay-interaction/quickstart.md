# Quickstart Validation: Gameplay Interaction

Use at least two browser tabs (Tab A = host/drawer, Tab B = guesser) with both servers running. For checks 11–13, open a third tab (Tab C) joined as a second guesser before starting the game.

**Setup**: Create a room in Tab A, join with a different name in Tab B (and optionally Tab C), then start the game from Tab A.

## Validation Table

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | In Tab A, draw a stroke on the canvas (click and drag) | Stroke appears on Tab A's canvas immediately |
| 2 | Wait ~2 seconds; check Tab B | Tab B shows the same stroke the drawer drew |
| 3 | In Tab A, click "Clear Canvas" | Canvas clears on Tab A immediately |
| 4 | Wait ~2 seconds; check Tab B | Tab B canvas is also cleared |
| 5 | In Tab B, submit an empty guess (no text) | Inline error: "Guess cannot be empty" (or similar); no guess recorded |
| 6 | In Tab B, submit "ROCKET" (uppercase) | Result shows "Correct!"; Tab B score updates to 100 |
| 7 | In Tab B, submit "pizza" | Result shows "Incorrect"; score remains 100 |
| 8 | Check Tab A's guess history | Both guesses appear: "ROCKET ✓" and "pizza ✗" with the guesser's name |
| 9 | Check Tab A's scoreboard | Drawer score = 0; guesser score = 100 |
| 10 | In Tab A (drawer), attempt to submit a guess | No guess form is visible to the drawer |
| 11 | In Tab B, after guessing "ROCKET" correctly, attempt to type and submit another guess | Guess form is hidden; "You already guessed correctly!" is shown instead |
| 12 | Refresh Tab B (after a correct guess) | Session restores; guess form remains hidden — derived from guess history |
| 13 | Refresh Tab C (a player who has only guessed incorrectly) | Session restores; guess form is still visible — player may continue guessing |
