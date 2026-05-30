# Quickstart: Validate Gameplay Interaction

**Feature**: 003-gameplay-interaction | **Prerequisites**: Scenarios 1–2 complete, Node 18+, two browser tabs

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

## 3. Drawing and canvas sync

| Step | Tab | Expected |
|------|-----|----------|
| Drawer draws several strokes | A | Strokes visible immediately on drawer canvas |
| Wait ~2–3s | B | Same strokes appear on guesser canvas |
| Drawer clicks Clear Canvas | A | Canvas empty on drawer |
| Wait ~2–3s | B | Canvas empty on guesser |
| Guesser tries to draw | B | No drawing interaction (read-only canvas) |

## 4. Guess validation

| Step | Tab | Expected |
|------|-----|----------|
| Submit empty guess | B | Error: guess required; nothing in history |
| Submit `"   "` | B | Same rejection |
| Submit `"  pizza  "` | B | Accepted as **pizza** in history; score stays 0 |
| Check drawer UI | A | No guess submission form |

## 5. Guess history sync

| Step | Tab | Expected |
|------|-----|----------|
| Submit `"hello"` then `"world"` | B | Both appear in history with Guest name |
| Wait ~2–3s | A | Activity panel shows both guesses in order |

## 6. Scoring (deterministic word = rocket)

| Step | Tab | Expected |
|------|-----|----------|
| View scoreboard at game start | A, B | Host 0, Guest 0 |
| Guest submits `"PIZZA"` | B | History shows pizza; Guest score 0 |
| Guest submits `"Rocket"` | B | History shows Rocket; Guest score **100** |
| Guest submits `"rocket"` again | B | History entry added; score stays **100** |
| Wait ~2–3s | A | Scoreboard shows Guest at 100 |

## 7. Case-insensitivity

1. Fresh game or note prior correct score capped
2. Submit guess differing only by case from **rocket** (e.g., `"ROCKET"`)
3. Confirm +100 awarded once per participant per round

## 8. Poll error resilience

1. Stop backend while on game screen
2. Confirm non-blocking error; last drawing, history, and scores remain visible
3. Restart backend — room lost (in-memory); expected 404 on poll

## 9. Regression — Scenario 2

- Host still drawer; guesser never sees secret word in UI or poll JSON
- Lobby/start flows unchanged
- Game guard: `/game` redirects to `/lobby` before start

## 10. Build check

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must complete without errors before marking Scenario 3 complete.
