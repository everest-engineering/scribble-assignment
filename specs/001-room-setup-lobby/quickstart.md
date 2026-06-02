# Quickstart: Room Setup & Lobby Validation

Use this guide to manually validate the Room Setup & Lobby scenario after implementation.

## Prerequisites

1. Backend running: `cd backend && npm run dev` (port 3001)
2. Frontend running: `cd frontend && npm run dev` (port 5173)
3. Two browser tabs open to `http://localhost:5173`

---

## Step 1 — Create a Room (Tab A)

1. Click **Create Room**.
2. Enter name `Alice`, click submit.
3. **Expected**: Land on the Lobby screen showing "Alice" in the participant list and a room code (e.g. `ABCD`).
4. **Expected**: Start Game button is visible but disabled (fewer than 2 players).

---

## Step 2 — Join the Room (Tab B)

1. Click **Join Room**.
2. Enter name `Bob` and room code from Step 1 (try lowercase — e.g. `abcd`).
3. Click submit.
4. **Expected**: Land on the Lobby screen showing both "Alice" and "Bob".

---

## Step 3 — Lobby Polling (Tab A)

1. Without clicking anything in Tab A, wait up to 2 seconds.
2. **Expected**: "Bob" appears in the participant list automatically, without a manual refresh.

---

## Step 4 — Host-Only Start Game

1. In Tab A (Alice / host): confirm Start Game is now **enabled** (2 players present).
2. In Tab B (Bob / non-host): confirm Start Game is **disabled** or not interactive.
3. In Tab A: click Start Game.
4. **Expected**: Both tabs navigate to the Game screen.

---

## Step 5 — Validation Checks

| Check | Expected |
|-------|----------|
| Empty name on Create Room | Form not submitted, error shown inline |
| Whitespace-only name on Join | Form not submitted, error shown inline |
| Empty code on Join | Form not submitted, error shown inline |
| Non-existent code (e.g. `ZZZZ`) | "Room not found" error on Join screen |
| Lowercase code matches uppercase room | Join succeeds |
| Start Game with 1 player only | Button disabled |
| Non-host clicks Start Game | Button disabled / no action |

---

## Step 6 — Room Isolation

1. Open two more tabs (Tab C and Tab D) and create a second room.
2. **Expected**: Tab C and Tab D have a different room code and an independent participant list.
3. Joining Tab C does not make the new player appear in Tab A's lobby.
