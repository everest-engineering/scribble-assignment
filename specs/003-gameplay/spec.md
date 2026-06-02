# Specification

> Iterative specification by feature group. Each section corresponds to one scenario.
> Updated incrementally after each implementation phase.

---

## Iteration 3 — Gameplay Interaction (Scenario 3)

### Acceptance Criteria

| ID | Criterion | Detail |
|---|---|---|
| 3.1 | Canvas drawing | Drawer can draw via mouse on an HTML5 Canvas element. |
| 3.2 | Auto-save strokes | Each stroke is sent to `POST /rooms/:code/draw` on mouseup. |
| 3.3 | Canvas visibility | All players see current canvas strokes fetched via polling. |
| 3.4 | Clear canvas | Drawer has a "Clear Canvas" button. Calls `POST /rooms/:code/clear-drawing`. |
| 3.5 | Guess submission | Guessers can submit guesses via `POST /rooms/:code/guess`. |
| 3.6 | Guess validation | Guesses are trimmed. Empty/whitespace-only rejected with `"Guess cannot be empty"`. |
| 3.7 | Guess comparison | Case-insensitive: `guess.trim().toLowerCase() === secretWord`. |
| 3.8 | Score allocation | Correct guess: +100 points. Incorrect: +0 points. All scores start at 0 at game start. |
| 3.9 | Guess history | All guesses (player name, text, correct/incorrect) available in snapshot. |
| 3.10 | Synced history | All players see the full guess history via polling. |
| 3.11 | Role enforcement | Drawer cannot submit guesses (server rejects). Guessers cannot draw/clear (server rejects). |

### Edge Cases
- Drawer tries to open guess panel — hidden or disabled.
- Guesser tries to draw/clear — server returns 403, button disabled on frontend.
- Case mismatch: "Rocket", "ROCKET", "RoCkEt" all match "rocket".
- Whitespace: "  rocket  " is trimmed to "rocket" and matches.
- Multiple correct guesses after round ends — once status is "finished", new guesses rejected.
