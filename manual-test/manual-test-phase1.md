# Manual Test: Phase 1 — Room Setup and Lobby

## Prerequisites

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open two browser tabs at `http://localhost:5173`.

---

## Test 1: Create Room

| Step | Tab A | Expected |
|------|-------|----------|
| 1 | Click **Create Room** | — |
| 2 | Enter name `Alice`, click **Create and Continue** | Land on Lobby |
| 3 | — | See `Alice (Host)` in participant list |
| 4 | — | See room code badge (e.g. `A3X9`) |

---

## Test 2: Join Room (Valid Code)

| Step | Tab B | Expected |
|------|-------|----------|
| 1 | Click **Join Room** | — |
| 2 | Enter name `Bob`, enter room code from Tab A | — |
| 3 | Click **Join Lobby** | Land on Lobby |
| 4 | — | See `Alice (Host)` and `Bob` in participant list |

---

## Test 3: Host Gating

| Tab | Action | Expected |
|-----|--------|----------|
| B (Bob) | Look for start button | **No start button visible** — shows "Waiting for host to start..." |
| A (Alice) | Look for start button | **Start Game** button visible |

---

## Test 4: Minimum Players Rejection

| Tab | Action | Expected |
|-----|--------|----------|
| A (Alice) | Close Tab B so Alice is alone, click **Start Game** | Button text says "Need at least 2 players" (disabled) |

---

## Test 5: Auto-Refresh

| Step | Action | Expected |
|------|--------|----------|
| 1 | Tab B re-joins with same room code as Bob | — |
| 2 | Both tabs on Lobby | Both see Alice + Bob |
| 3 | Open 3rd tab, Join Room as `Charlie` with same code | — |
| 4 | Switch to Tab A & B | Within ~2s, `Charlie` appears in both lobbies |

---

## Test 6: Start Game (Success)

| Step | Tab A | Expected |
|------|-------|----------|
| 1 | With 2+ players, click **Start Game** | — |
| 2 | Tab A | Navigates to `/game` |
| 3 | Tab B | Navigates to `/game` |

---

## Test 7: Room Isolation

| Step | Tab D (new) | Expected |
|------|-------------|----------|
| 1 | Open 4th tab, Create Room with `Dave` | Different room code, only Dave in list |
| 2 | Tab A / B | Still see Alice / Bob / Charlie — no Dave visible |

---

## Test 8: Error Handling

| Tab | Action | Expected Error |
|-----|--------|----------------|
| Any | Join Room with blank code, submit | "Room code is required" |
| Any | Join Room with code `ZZZZ`, submit | "Room not found" |
| Any | Create Room with name `a-very-long-name-here` | "Player name must be 16 characters or less" |
| Any | Join Room with empty name | "Player name is required" |
