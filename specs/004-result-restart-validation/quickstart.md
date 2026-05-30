# Quickstart: Validate Result, Restart & Final Validation

**Feature**: 004-result-restart-validation | **Prerequisites**: Scenarios 1–3 complete, Node 18+, two browser tabs

## 1. Start services

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Confirm `http://localhost:3001/health` returns `{ "ok": true }`.

## 2. Reach active round (Tab A = Host/Drawer, Tab B = Guest/Guesser)

1. Tab A: Create room as **Host**
2. Tab B: Join with room code as **Guest**
3. Tab A: Start game
4. Both tabs on `/game` within ~3s; Host shows drawer role and secret word **rocket**

## 3. Play a short round

| Step | Tab | Expected |
|------|-----|----------|
| Drawer draws a few strokes | A | Strokes visible on drawer canvas |
| Wait ~2–3s | B | Strokes sync to guesser |
| Guest submits `"pizza"` | B | History shows pizza; score 0 |
| Guest submits `"Rocket"` | B | History shows Rocket; score **100** |
| Wait ~2–3s | A | Scoreboard shows Guest at 100 |

## 4. Host ends round → result mode

| Step | Tab | Expected |
|------|-----|----------|
| Host clicks **End Round** | A | Screen transitions in-place to result mode (no route change) |
| Wait ~2–3s | B | Same in-place transition without manual refresh |
| View result on both tabs | A, B | Secret word **rocket** visible to **both** drawer and guesser |
| Check result layout | A, B | Scoreboard + guess history visible; **no canvas** |
| Guest tries to guess | B | No guess form available |
| Drawer tries to draw | A | No canvas / clear controls |
| Non-host tries End Round / Restart | B | Controls not shown or action rejected |

## 5. Shared result sync

| Step | Tab | Expected |
|------|-----|----------|
| Compare word, scores, history | A, B | Identical on both tabs |
| Guest with no extra guesses | B | Still sees full history and all scores |

## 6. Host restarts → lobby

| Step | Tab | Expected |
|------|-----|----------|
| Host clicks **Restart** | A | Returns to lobby |
| Wait ~2–3s | B | Auto-navigates to lobby without manual refresh |
| View lobby | A, B | Same participants and host preserved |
| Check cleared state | A, B | No secret word; scores 0 or absent; no guess history |
| Try `/game` directly | A, B | Redirects to `/lobby` |

## 7. Second game (fresh round)

| Step | Tab | Expected |
|------|-----|----------|
| Host starts new game | A | Both return to `/game` |
| View scoreboard | A, B | All scores **0**; empty history |
| Play briefly | A, B | Normal Scenario 3 gameplay works |

## 8. End-to-end loop (SC-006)

Run sections 2–7 as one continuous flow without manual refresh between transitions.
Confirm: lobby → play → result → restart → lobby → second start — all synchronized.

## 9. Guess race at end-round (optional)

1. Guest prepares a guess submit
2. Host clicks End Round at nearly the same time
3. If guess POST processed first: guess appears in final result history
4. If end processed first: guess rejected with error; not in history

## 10. Room isolation (optional)

1. Open two separate rooms in four tabs
2. Complete end → restart in each independently
3. Confirm no cross-room data leakage

## 11. Regression — Scenarios 1–3

- Lobby polling, join validation, host-only start unchanged
- Drawer-only word during **playing** (guesser never sees word until result)
- Drawing, guessing, scoring during **playing** unchanged

## 12. Build check

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must complete without errors before marking Scenario 4 complete.
