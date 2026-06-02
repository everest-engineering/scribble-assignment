# Specification

> Iterative specification by feature group. Each section corresponds to one scenario.
> Updated incrementally after each implementation phase.

---

## Iteration 4 — Result, Restart & Final Validation (Scenario 4)

### Acceptance Criteria

| ID | Criterion | Detail |
|---|---|---|
| 4.1 | Round end trigger | When a guesser submits the correct word, room status transitions to `"finished"`. |
| 4.2 | Result visibility | All players see the correct word, final scores, and full guess history. |
| 4.3 | Secret word revealed | When status is `"finished"`, `secretWord` is visible to all players. |
| 4.4 | Restart button | "Play Again" button visible only to host when status is `"finished"`. |
| 4.5 | Restart action | Calls `POST /rooms/:code/restart`. Clears round state (word, drawer, scores, strokes, guesses). |
| 4.6 | Players preserved | Restart keeps all participants in the room. No one is removed. |
| 4.7 | Post-restart navigation | All players return to lobby (detected via polling — status changes back to `"lobby"`). |
| 4.8 | Full game flow | Two browsers can: create/join → lobby → start → drawer draws → guesser guesses → results → restart → lobby again. |

### Edge Cases
- Host restarts from finished state — all players see lobby again with participants intact.
- Player joins during "playing" or "finished" state — they see current state (no special handling beyond standard fetch).
- Round state is fully cleared: word, drawerId, scores reset, strokes cleared, guesses cleared.
