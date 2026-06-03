# Quickstart: Result, Restart & Final Validation

Manual verification guide covering all three user stories.

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Open **two browser tabs**: **Tab A (Host)** and **Tab B (Guesser)**

---

## Setup — Start a Fresh Game

1. **Tab A**: Go to `http://localhost:5173` → Create Room → note the 4-letter room code.
2. **Tab B**: Go to `http://localhost:5173` → Join Room → enter the code and a different player name → Join.
3. **Tab A**: Click "Start Game" from the lobby.
4. Both tabs should now show the game screen. Tab A is the Drawer; Tab B is the Guesser.

---

## Story 1 — Auto-End on Correct Guess

5. **Tab A**: Note the word shown in the "Your word:" block.
6. **Tab B**: Type the exact word in the Guess field → Submit.
7. **Expected (within ≤2 s)**: Both Tab A and Tab B automatically navigate to `/result`.
8. Verify the result screen:
   - [ ] Correct word is displayed prominently.
   - [ ] Guess history shows the correct guess with a green/correct indicator and Tab B's player name.
   - [ ] Scoreboard shows Tab B's player at 100 points; Tab A at 0.
   - [ ] "Restart Game" button is visible in **Tab A** only — Tab B should NOT see it.

---

## Story 2 — Host Manually Ends the Round

9. Click "Restart Game" in Tab A (or create a new room) to get back to the lobby, then start a new game.
10. **Tab B**: Submit 1–2 incorrect guesses (wrong words).
11. **Tab A**: Click the "End Round" button (host-only; visible during play).
12. **Expected (within ≤2 s)**: Both tabs navigate to the result screen.
13. Verify:
    - [ ] Correct word is revealed.
    - [ ] All incorrect guesses are listed.
    - [ ] Scoreboard shows 0 for all players.

---

## Story 3 — Host Restarts

14. From the result screen, **Tab A**: click "Restart Game".
15. **Expected (within ≤2 s)**: Both tabs navigate back to `/lobby`.
16. Verify:
    - [ ] All participant names are still listed.
    - [ ] The room code is the same.
    - [ ] No word, canvas, guesses, or scores from the previous round are visible.
17. **Tab A**: Click "Start Game" again to confirm a fresh round starts correctly.

---

## Failure Cases

| Test                        | Method                                                           | Expected        |
| --------------------------- | ---------------------------------------------------------------- | --------------- |
| Non-host tries to end round | `POST /rooms/{code}/end` with Tab B's `participantId`            | `403 Forbidden` |
| Non-host tries to restart   | `POST /rooms/{code}/restart` with Tab B's `participantId`        | `403 Forbidden` |
| End-round when not playing  | `POST /rooms/{code}/end` from `"lobby"` or `"ended"` state       | `409 Conflict`  |
| Restart when not ended      | `POST /rooms/{code}/restart` from `"lobby"` or `"playing"` state | `409 Conflict`  |

You can test these using `curl` or any REST client:

```bash
# Replace CODE, HOST_ID, GUESSER_ID with real values from the browser
curl -X POST http://localhost:3001/rooms/CODE/end \
  -H "Content-Type: application/json" \
  -d '{"participantId":"GUESSER_ID"}'
# Expected: {"message":"Only the host can end the round"}, status 403
```
