# Quickstart Validation: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer — Scenario 2
**Prereqs**: Scenario 1 passing, backend and frontend running.

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## US1 — Drawer Assignment

1. **Tab A**: Create room as "Alice" → land on Lobby.
2. **Tab B**: Join room as "Bob" using the code → land on Lobby.
3. **Tab A (host)**: Click **Start Game**.
4. Expected: Both tabs navigate to `/game`.
5. Expected: Both tabs display **Alice** as the drawer (Alice created the room).
6. Expected: The drawer identity is the same on both screens.

**Verify determinism**: Refresh the page in Tab A. Confirm Alice is still shown as the drawer.

---

## US2 — Deterministic Word Selection

1. Complete US1 above so the game is active.
2. In **Tab A** (Alice / drawer): Confirm the secret word **"rocket"** is displayed.
3. Restart the game (or create a fresh room) and start again.
4. Expected: The word is **"rocket"** again — no variation across runs.

---

## US3 — Drawer-Only Word Visibility

1. With the game active from US1:
2. In **Tab A** (Alice / drawer): Confirm `rocket` is visible somewhere on the game screen.
3. In **Tab B** (Bob / guesser): Confirm the word `rocket` does **not** appear anywhere on the game screen.
4. Open browser DevTools in **Tab B** → Network → find the latest `GET /rooms/...` response.
5. Expected: The JSON response for Tab B does **not** contain a `currentWord` field.

---

## Build Verification

```bash
cd backend  && npm run build   # must exit 0
cd frontend && npm run build   # must exit 0
```
