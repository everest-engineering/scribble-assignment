# Quickstart: Verifying Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-05-31

Use this guide to manually verify each user story after implementation.

## Prerequisites

Start both servers:

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` in a browser.

---

## US2 — Player Name Validation (P2)

### Happy path: trimmed name stored correctly

1. Open **Create Room**. Enter `  Alice  ` (with leading/trailing spaces) and submit.
2. **Expected**: You land in the lobby. The participant list shows `Alice` (no surrounding spaces).
3. Inspect the `POST /rooms` response in DevTools → Network. Confirm `participants[0].name === "Alice"`.

### Gate: whitespace-only name blocked

1. Open **Create Room**. Enter `     ` (spaces only) and click submit.
2. **Expected**: An inline error appears (e.g. "Player name is required."). No network request is made.

3. Open **Join Room**. Enter `     ` in the name field, any code in the room code field, and submit.
4. **Expected**: Same inline error; no network request.

### Gate: whitespace-only name blocked at the API level

```bash
curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"   "}' | jq .
```

**Expected**: `400` response with a validation error message.

---

## US1 — Game Starts and Drawer Is Assigned (P1)

### Single-player start (host only)

1. Create a new room as `Alice`. You are now in the lobby alone.
2. **Expected**: The **Start Game** button is enabled (or present) even with 1 player.
3. Click **Start Game**.
4. **Expected**: Alice's tab navigates to the game screen.
5. **Expected**: The game screen clearly identifies Alice as the drawer (e.g. "Drawing" label or equivalent).
6. **Expected**: Alice's screen displays the secret word prominently (e.g. "rocket").

### Drawer sees secret word; guesser does not

1. Create a room as `Alice` and note the room code.
2. Open a second tab. Join as `Bob` using the room code.
3. On Alice's tab, click **Start Game**.
4. **Expected**: Both Alice's and Bob's tabs navigate to the game screen.
5. On **Alice's** screen: Alice is labelled as the drawer AND the secret word is visible.
6. On **Bob's** screen: Alice is labelled as the drawer but the secret word is NOT shown (blank or placeholder).

### Deterministic word selection

1. Start a game. Note the secret word shown to the drawer.
2. Restart the backend server (`Ctrl-C` and `npm run dev`).
3. Create a new room, start the game again.
4. **Expected**: Round 1 always shows `rocket` (index 0 in the starter word list).

### Non-drawer cannot see word via the API

```bash
# Get the room snapshot as a non-drawer participant
curl -s "http://localhost:3001/rooms/ABCD?participantId=<bob-uuid>" | jq .room.secretWord
```

**Expected**: `null` (field absent → `jq` returns `null`).

```bash
# Get the snapshot as the drawer
curl -s "http://localhost:3001/rooms/ABCD?participantId=<alice-uuid>" | jq .room.secretWord
```

**Expected**: `"rocket"`.

---

## Smoke Test Checklist

Run through these quickly after all tasks are complete:

- [ ] Whitespace-only name blocked on Create Room (inline error, no network request)
- [ ] Whitespace-only name blocked on Join Room (inline error, no network request)
- [ ] Name with surrounding spaces stored trimmed (e.g. "  Alice  " → "Alice")
- [ ] `POST /rooms` with `{"playerName":"   "}` returns 400
- [ ] Host alone can start game (single-player lobby)
- [ ] Host's game screen labels them as the drawer
- [ ] Host's game screen displays the secret word
- [ ] Non-drawer's game screen shows who is drawing but NOT the secret word
- [ ] Round 1 secret word is always "rocket" (deterministic)
- [ ] `GET /rooms/:code?participantId=<drawer-id>` includes `secretWord`
- [ ] `GET /rooms/:code?participantId=<non-drawer-id>` does NOT include `secretWord`
