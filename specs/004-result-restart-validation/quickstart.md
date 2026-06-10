# Quickstart Validation Guide: Result, Restart, and Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-10

## Prerequisites

1. Start both servers from project root:
   ```bash
   cd backend && npm run dev   # port 3001
   cd frontend && npm run dev  # port 5173
   ```
2. Open two browser tabs to `http://localhost:5173`.

---

## Scenario 1 — Host Ends the Game, All Players See Result Screen

1. Tab A: Create room as "Alice" (host).
2. Tab B: Join the same room as "Bob".
3. Tab A: Click **Start Game**. Both tabs navigate to the Game screen.
4. Tab B: Submit any guess (e.g., type "test" and submit).
5. Tab A: Verify the "End Game" button is **visible** on Alice's Game screen.
6. Tab B: Verify the "End Game" button is **absent** on Bob's Game screen.
7. Tab A: Click **End Game**.
8. **Expected**: Within 2 seconds, both tabs navigate to the Result screen.
9. **Expected**: Result screen shows the correct secret word ("Rocket"), Bob's score, and the guess "test" in the guess history.

---

## Scenario 2 — Non-Host Cannot End the Game

```bash
# Get room code from Scenario 1 setup, e.g. ABCD
curl -s -X POST http://localhost:3001/rooms/ABCD/end \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob"}' | jq .
# Expected: { "message": "Only the host can end the game" } with HTTP 403
```

---

## Scenario 3 — Result Screen Displays Correct Data

After Scenario 1, on the Result screen in either tab:

- [ ] Secret word ("Rocket") is prominently displayed.
- [ ] Bob's score is shown as 0 (if "test" was wrong) or 100 (if correct).
- [ ] Guess history lists Bob's guess with points awarded.
- [ ] Alice (drawer) also appears in the scores section with her score.
- [ ] "Play Again" button is **visible** on Alice's (host's) Result screen.
- [ ] "Play Again" button is **absent** on Bob's Result screen.

---

## Scenario 4 — Host Restarts, All Players Return to Lobby

1. From the Result screen (Scenario 1), Tab A (Alice/host): Click **Play Again**.
2. **Expected**: Within 2 seconds, both tabs navigate back to the Lobby screen.
3. **Expected**: Both participants (Alice and Bob) are listed with their original names.
4. **Expected**: No secret word, no guess history visible in the new lobby.

---

## Scenario 5 — Non-Host Cannot Restart

```bash
curl -s -X POST http://localhost:3001/rooms/ABCD/restart \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob"}' | jq .
# Expected: { "message": "Only the host can restart the game" } with HTTP 403
```

---

## Scenario 6 — Invalid State Rejections

```bash
# Try to end a lobby (not playing) room
curl -s -X POST http://localhost:3001/rooms/ABCD/end \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice"}' | jq .
# Expected: HTTP 409 with message about wrong state

# Try to restart a playing (not result) room
curl -s -X POST http://localhost:3001/rooms/ABCD/restart \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice"}' | jq .
# Expected: HTTP 409 with message about wrong state
```

---

## Scenario 7 — Full Round-Trip

1. Complete Scenario 1 (lobby → start → play → end → result).
2. Complete Scenario 4 (restart → lobby).
3. Start a second game from the same lobby.
4. **Expected**: New game starts cleanly with the same two players; no data from the previous round visible during the new game.
5. End the second game.
6. **Expected**: Result screen shows only data from the second round (fresh guess history and scores).
