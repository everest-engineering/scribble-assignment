# Quickstart Validation Guide: Game Start & Drawer Flow

## Prerequisites

- Backend running on `http://localhost:3001` (`cd backend && npm run dev`)
- Frontend running on `http://localhost:5173` (`cd frontend && npm run dev`)
- Two browser tabs open (Tab A = host, Tab B = second player)

---

## Scenario 1 — Happy Path: Game starts and drawer receives secret word

**Setup**

1. Tab A: Create a room (enter name "Alice"). Note the room code.
2. Tab B: Join the room with name "Bob" using the code from Tab A.
3. Both tabs should show the Lobby with two participants.

**Start the game**

4. Tab A (host): Click "Start Game".
5. Verify Tab A navigates **immediately** to the Game screen (no polling wait).
6. Within the next 2-second poll cycle, Tab B (Bob) should also auto-navigate to the Game screen.

**Check drawer gets secret word**

7. On Tab A's Game screen (Alice = drawer), verify the secret word **"rocket"** is visible in the Player Info section.
8. On Tab B's Game screen (Bob = guesser), verify **no secret word** is shown.
9. Confirm via API: `GET /rooms/<code>?participantId=<alice's-id>` returns `secretWord: "rocket"`.
10. Confirm via API: `GET /rooms/<code>?participantId=<bob's-id>` returns NO `secretWord` field.

**Expected outcomes**:
- Room status is `"playing"`.
- `drawerName` is `"Alice"` (first joiner / host).
- Alice's Game screen shows "rocket"; Bob's Game screen shows no secret word.
- Alice's API snapshot contains `secretWord: "rocket"`; Bob's does not.

---

## Scenario 2 — Guard: Cannot start an already-playing room

1. Follow Scenario 1 steps 1–5.
2. Attempt `POST /rooms/<code>/start` again.
3. Expected: HTTP 409 with `{ "message": "Game has already started" }`.
4. Room status remains `"playing"`.

---

## Scenario 3 — Guard: Invalid names block start

1. Create a room via the API directly with a participant whose name is whitespace-only (edge case, bypassing frontend validation).
2. Call `POST /rooms/<code>/start`.
3. Expected: HTTP 400 with `{ "message": "All player names must be non-empty" }`.
4. Room status remains `"lobby"`.

---

## Scenario 4 — Guard: Unknown room code

1. Call `POST /rooms/ZZZZ/start` (non-existent code).
2. Expected: HTTP 404 with `{ "message": "Room not found" }`.

---

## Scenario 5 — UI: Non-host auto-navigates via polling

1. Tab A: Create room (host = Alice).
2. Tab B: Join room (Bob).
3. Tab A: Click "Start Game" — Tab A navigates immediately.
4. Without any action on Tab B, within 2 seconds Tab B's lobby polling detects `status: "playing"` and automatically navigates to the Game screen.

---

## Scenario 6 — UI: Secret word display in GamePage

1. Follow Scenario 1 steps 1–6 (both players on Game screen).
2. On Tab A (Alice = drawer): confirm the Player Info section shows the secret word "rocket".
3. On Tab B (Bob = guesser): confirm the Player Info section does NOT show a secret word.

---

## Scenario 7 — 3-Player: Multiple guessers never see the secret word (SC-005)

1. Tab A: Create a room (host = Alice). Note the room code.
2. Tab B: Join the room with name "Bob".
3. Tab C: Join the room with name "Carol".
4. All three tabs should show the Lobby with three participants.
5. Tab A (host): Click "Start Game".
6. All three tabs navigate to the Game screen (Tab A immediately; Tabs B and C within 2 s).

**Expected outcomes**:
- `drawerName` is `"Alice"` (first joiner).
- Tab A (Alice = drawer): Player Info shows `Secret Word: rocket`.
- Tab B (Bob = guesser): Player Info has no "Secret Word" row.
- Tab C (Carol = guesser): Player Info has no "Secret Word" row.
- API: `GET /rooms/<code>?participantId=<bob's-id>` → no `secretWord` key.
- API: `GET /rooms/<code>?participantId=<carol's-id>` → no `secretWord` key.

---

## TypeScript Build Verification

After implementing, run both builds before marking any task done:

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must complete without errors.
