# Quickstart Validation: Result, Restart & Final Validation

Use two browser tabs with both servers running.

**Setup**: Create a room in Tab A (host/drawer), join with a different name in Tab B (guesser), then start the game from Tab A. In Tab B, submit at least one guess so there is guess history to display on the result screen.

## Validation Table

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | In Tab A (host), confirm an "End Round" button is visible on the game screen | Button is present and visible only to Tab A (the host/drawer) |
| 2 | In Tab B (guesser), confirm no "End Round" button is visible | No End Round button appears for non-host players |
| 3 | In Tab B, submit a correct guess ("rocket") | "Correct!" shown; score updates to 100 |
| 4 | In Tab A, click "End Round" | Tab A immediately transitions to the result view showing "Round Over", the correct word, the final scoreboard, and the full guess history |
| 5 | Wait ~2 seconds; check Tab B | Tab B also transitions to the result view with the same data |
| 6 | On the result view, confirm the correct word is visible to Tab B (the guesser) | Tab B shows the revealed word (e.g., "rocket") — word is no longer hidden |
| 7 | On the result view, confirm the scoreboard shows Tab B's score as 100 and Tab A's score as 0 | Scores match the guesses submitted during the round |
| 8 | On the result view, confirm the guess history shows all guesses with submitter names | All guesses (correct and incorrect) appear in submission order |
| 9 | In Tab B, confirm no "Restart" button is visible on the result view | Non-host players do not see the Restart button |
| 10 | In Tab A, confirm a "Restart" button is visible on the result view | Restart button is present for the host only |
| 11 | In Tab A, click "Restart" | Tab A is redirected to the lobby page; all round state is cleared (no word, no guesses, no scores visible) |
| 12 | Wait ~2 seconds; check Tab B | Tab B is also redirected to the lobby page automatically |
| 13 | On the lobby page, confirm both players are still listed | Participants are preserved after restart; no one had to rejoin |
| 14 | Refresh Tab B while on the result screen (before host restarts) | Tab B is restored to the result view with the correct word, scores, and guess history still visible — session restore works on the result screen |
| 15 | Start a new game from Tab A after the restart | Game starts fresh: no strokes, no guesses, scoreboard shows 0 for all players |
