# Quickstart Validation: Result, Restart & Final Validation

**Feature**: 004-result-restart — Scenario 4
**Prereqs**: Scenarios 1–3 passing. Both servers running.

```bash
cd backend  && npm run dev   # port 3001
cd frontend && npm run dev   # port 5173
```

---

## Setup

1. Create room as Alice → Join as Bob → Start game.
2. Confirm game screen: Alice sees word "rocket", Bob does not.
3. Bob submits "castle" (wrong) and "rocket" (correct).
4. Confirm Bob's score is 100, Alice's is 0.

---

## US1 — End Round and Show Results

1. In **Tab A** (Alice / host): click **End Round**.
2. Expected: Within ~2 s, both Tab A and Tab B navigate to the result screen.
3. On the result screen in both tabs, confirm:
   - Secret word "rocket" is displayed.
   - Alice: 0 pts, Bob: 100 pts are both shown.
   - Guess history shows both guesses in order ("castle" ✗, "rocket" ✓).
4. In **Tab B** (Bob / guesser): confirm there is no End Round button.

---

## US2 — Restart to Lobby

1. With both tabs on the result screen, click **Restart** in **Tab A** (Alice / host).
2. Expected: Within ~2 s, both tabs navigate to the `/lobby` screen.
3. On the lobby screen in both tabs, confirm:
   - Alice and Bob are both still listed as participants.
   - Start Game button is visible in Tab A (host) and absent/non-interactive in Tab B.
4. Start a new game from the lobby.
5. Confirm on the game screen:
   - Alice and Bob scores are both 0.
   - Canvas is blank.
   - Guess history is empty.
   - Alice sees "rocket" as the secret word.

---

## Build Verification

```bash
cd backend  && npm run build   # exit 0
cd frontend && npm run build   # exit 0
```
