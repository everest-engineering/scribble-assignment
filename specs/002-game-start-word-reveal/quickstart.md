# Quickstart: Game Start, Drawer Selection & Secret Word Reveal

## Run

Two terminals from the repo root:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm install && npm run dev

# Terminal 2 — frontend (Vite dev server)
cd frontend && npm install && npm run dev
```

Open the frontend URL Vite prints (typically `http://localhost:5173`).

## Build gate (must pass before PR — Constitution)

```bash
cd backend && npm run build
cd frontend && npm run build
cd backend && npm test          # vitest: roomStore, wordSelection, schemas
```

## Two-browser acceptance script

Use two browsers (or a normal + an incognito window) = Host and Guesser.

### US3 — Name validation (do this first)

1. Host browser → **Create Room** → leave the name blank (or type only spaces) → submit.
   - ✅ Rejected with a clear message ("Please enter a name to continue."); no room is created. *(FR-010)*
2. Type `"  Ada  "` (leading/trailing spaces) → submit.
   - ✅ Room is created; the lobby shows the name as `"Ada"` (trimmed). *(FR-009)*
3. Guesser browser → **Join Room** with a blank name → submit.
   - ✅ Rejected with the same clear message. Then join with a valid name. *(FR-010, FR-011)*

### US1 — First round begins with a clearly identified drawer

4. With Host + at least one Guesser in the lobby (≥2 players), Host clicks **Start Game**.
5. Within ~2s, both browsers navigate to the game screen. *(SC-001)*
   - ✅ Both browsers clearly show **who the drawer is** (the host is badged as the drawer). *(FR-003)*
   - ✅ The Host browser identifies itself as the **drawer**; the Guesser browser identifies itself as a **guesser**. *(FR-003, SC-002)*

### US2 — Secret word visible only to the drawer

6. On the **Host (drawer)** browser:
   - ✅ The full secret word is shown (what to draw). *(FR-006, SC-004)*
7. On the **Guesser** browser:
   - ✅ Only blanks are shown (one per letter), never the actual word. *(FR-007, FR-008)*
8. In the Guesser browser devtools → Network, inspect the `GET /rooms/<code>` response:
   - ✅ The response body contains `wordLength`/`maskedWord` but **no** `word` field — the word cannot be recovered from the data. *(FR-007, SC-003)*

### Determinism check (SC-005)

9. Note the word chosen for the current room code. Restart the backend (clears state), recreate a room — to force the same code, you can drive the API directly:
   ```bash
   # create + start in a fixed-code room is easiest to verify at the API level:
   # repeat a start for the same room code twice and compare round.word
   ```
   - ✅ For a given room **code** at round 1, the same word is selected every time. *(FR-005, SC-005)*

### Drawer/host leaves after start (FR-013)

10. After the round begins, close the Host (drawer) browser/tab.
    - ✅ Within ~10s the Guesser's poll returns 404 and they are ejected to the entry screen with a "host left" message (room closed). *(FR-013)*

## Mapping

| Step | User Story | FR / SC |
|------|-----------|---------|
| 1–3 | US3 | FR-009, FR-010, FR-011 |
| 4–5 | US1 | FR-001, FR-003, SC-001 |
| 5 | US1 | FR-002, SC-002 |
| 6 | US2 | FR-006, SC-004 |
| 7–8 | US2 | FR-007, FR-008, SC-003 |
| 9 | US2 | FR-005, SC-005 |
| 10 | edge case | FR-013 |
