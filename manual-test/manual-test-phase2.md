# Manual Test: Phase 2 — Game Start and Drawer Flow

**Fulfills**: T014 (specs/002-game-start-drawer/tasks.md)

## Prerequisites

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open two browser tabs at `http://localhost:5173`.

---

## Test 1: Create and Join Room

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Click **Create Room**, enter `Alice`, submit | Lobby with Alice (Host), room code visible |
| 2 | B | Click **Join Room**, enter code & `Bob`, submit | Both tabs show Alice + Bob in lobby |

---

## Test 2: Host Gating — Non-Host Cannot Start

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | B (Bob) | Look for **Start Game** button | **Not visible** — shows "Waiting for host to start..." |
| 2 | A (Alice) | Look for **Start Game** button | Visible and enabled |

---

## Test 3: Minimum Players Rejection

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | B | Close Tab B so only Alice remains | — |
| 2 | A | Click **Start Game** | Button shows "Need at least 2 players" (disabled) |
| 3 | B | Re-open Tab B, re-join as Bob | Both back in lobby with 2 players |

---

## Test 4: Host Starts Game — Drawer View

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A (Alice) | Click **Start Game** | — |
| 2 | A | — | Navigates to `/game`, title says "Draw the Word!" |
| 3 | A | — | Role badge shows **Drawer** |
| 4 | A | — | Secret word card visible (e.g. "rocket", "sunflower") |
| 5 | A | — | Canvas shows "Waiting for drawing..." placeholder |
| 6 | B (Bob) | — | Navigates to `/game`, title says "Guess the Word!" |
| 7 | B | — | Role badge shows **Guesser** |
| 8 | B | — | **No secret word visible** — shows guess form instead |
| 9 | B | — | Canvas shows "Waiting for drawing..." placeholder |

---

## Test 5: Word Isolation (Network Inspection)

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | B | Open DevTools → Network tab | — |
| 2 | B | Find GET `/rooms/:code` request, inspect response | `currentRound.secretWord` is **undefined** (field absent) |
| 3 | A | Open DevTools → Network tab | — |
| 4 | A | Find GET `/rooms/:code` request, inspect response | `currentRound.secretWord` contains the actual word string |

---

## Test 6: Error Conditions

| Test | Setup | Action | Expected Error |
|------|-------|--------|----------------|
| Start with 1 player | Fresh room, only host | Host clicks Start Game | "At least 2 players are needed to start" |
| Non-host starts | Room with 2+ players | Bob (non-host) tries to start | "Only the host can start the game" |

---

## Test 7: Exit Game

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A or B | Click **Exit Game** button | Navigates back to home page (`/`) |

---

## Test 8: Deterministic Word Selection

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Note room code and secret word | e.g. `S84M` → `sunflower` |
| 2 | Both | Go back to home, create a new room with different code | — |
| 3 | Both | Join as 2 players, start game | Different code → potentially different word |
| 4 | A | Note new code and word | Same code would always produce same word |

---

## Test 9: Room Isolation (Active Game)

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | C (new) | Open 3rd tab, Create Room as `Charlie` | Different room, different game state |
| 2 | A/B | — | Still on game page, undisturbed |

---

## Test 10: Visual Checks

| Check | Expected |
|-------|----------|
| Canvas area | White board with border, "Waiting for drawing..." text |
| Guesser sidebar | "Your Guess" card with `GuessForm` input |
| Drawer sidebar | "Your Word" card with bold word, **no** guess form |
| Round number | Shows "Round 1" above title |
| Scoreboard | Present on left sidebar |
| Result panel | Present on left sidebar |
