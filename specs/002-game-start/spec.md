# Specification

> Iterative specification by feature group. Each section corresponds to one scenario.
> Updated incrementally after each implementation phase.

---

## Iteration 2 — Game Start & Drawer Flow (Scenario 2)

### Acceptance Criteria

| ID | Criterion | Detail |
|---|---|---|
| 2.1 | Name validation on join | Same as 1.2 — names trimmed, empty/whitespace rejected. |
| 2.2 | Drawer assignment | First player (host) is assigned role `"drawer"`. All other players are `"guesser"`. |
| 2.3 | Word selection | Secret word chosen deterministically: `wordIndex = participants.length % WORDS.length`. |
| 2.4 | Word visibility | `secretWord` field is non-null only in the drawer's snapshot. Null for guessers. |
| 2.5 | Role visibility | Each player sees their own role via `myRole` field in the snapshot. |
| 2.6 | Status transition | Start game transitions room from `"lobby"` to `"playing"`. |
| 2.7 | Start-game validation | Only host can start. Room must have ≥2 participants. Otherwise returns 403/400. |

### Edge Cases
- Non-host tries to start game — server returns 403, button not visible on frontend.
- Drawer sees the word in the UI; guessers see `"???"` or a hidden placeholder.
- Word index wraps correctly: 2 players → `words[2]`, 6 players → `words[1]`, etc.
