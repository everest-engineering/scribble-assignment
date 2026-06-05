# Quickstart: Validating Game Start & Drawer Flow

Manual validation procedure for Scenario 2. Run after implementation is complete.
Requires Scenario 1 to be fully working first.

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Two browser tabs open

---

## Test 1 — Drawer Is Assigned on Game Start (US1)

1. Tab 1 creates a room as **Alice** → Lobby.
2. Tab 2 joins as **Bob** → Lobby.
3. Tab 1 (Alice, host) clicks **Start Game**.
4. Both tabs navigate to the game screen.
5. **Verify on Tab 1 (Alice)**: Alice is identified with a "Drawer" label in the player info.
6. **Verify on Tab 2 (Bob)**: Alice is also shown as the drawer with a "Drawer" label.
7. **Verify on Tab 2**: Bob has no "Drawer" label (he is a guesser).

---

## Test 2 — Secret Word Visible Only to Drawer (US2)

1. After Test 1, remain on the game screen.
2. **Verify on Tab 1 (Alice, drawer)**: A banner above the canvas reads "Your word: rocket".
3. **Verify on Tab 2 (Bob, guesser)**: No banner, no word displayed anywhere on screen.
4. Open DevTools on Tab 2 (Network tab). Find the most recent `GET /rooms/...` response.
5. **Verify**: The JSON response for Bob does **not** contain a `secretWord` field.

---

## Test 3 — Deterministic Word Selection (US2 AS3)

1. Restart the backend to clear all rooms.
2. Repeat Test 1 with different player names.
3. **Verify**: The secret word is still "rocket" — always the first starter word.

---

## Test 4 — Role-Differentiated Canvas (US3)

1. After Test 1, on the game screen.
2. **Verify on Tab 1 (Alice, drawer)**: The canvas area shows a label appropriate for drawing
   (e.g., "Draw here…"). The guess input is **absent or disabled**.
3. **Verify on Tab 2 (Bob, guesser)**: The canvas area shows a passive label
   (e.g., "Waiting for drawer…"). The guess input is **enabled**.

---

## Test 5 — Drawer Label in Player List (US1 AS4)

1. On either tab's game screen, find the player list or scoreboard area.
2. **Verify**: Alice's name has a "Drawer" label or equivalent visual indicator.
3. **Verify**: Bob's name has no such label.

---

## Pass Criteria

All 5 tests must pass before proceeding to Scenario 3.
