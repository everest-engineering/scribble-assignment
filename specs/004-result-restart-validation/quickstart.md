# Quickstart: Manual Verification Guide

**Feature**: Result, Restart & Final Validation | **Date**: 2026-05-31

## Prerequisites

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open two browser tabs both pointed at `http://localhost:5173`.

---

## Test 1 — Host ends round; all players see result (US1 P1)

1. **Tab A**: Create a room (enter a name, click Create). Note the room code.
2. **Tab B**: Join the room using that code (enter a different name, click Join).
3. **Tab A** (host): Click "Start Game". Both tabs navigate to the game screen.
4. **Tab B** (guesser): Submit a guess (correct word is shown in the drawer's tab A).
   Optionally submit an incorrect guess first.
5. **Tab A** (host): Click "End Round".

**Expected**:
- Both Tab A and Tab B transition to the result screen within ~3 seconds.
- Result screen shows the **correct word** (revealed to all).
- Result screen shows **scores** for all participants.
- Result screen shows the **full guess history** in submission order.
- Tab B (guesser who didn't know the word) now sees it revealed.

---

## Test 2 — Host restarts; all players return to lobby (US2 P1)

Continuing from Test 1 (both tabs on result screen):

1. **Tab A** (host): Click "Restart".

**Expected**:
- Both Tab A and Tab B return to the lobby screen within ~3 seconds.
- Both tabs show the same participants they had before the round.
- No scores, no guesses, no secret word are visible on the lobby screen.

---

## Test 3 — Host-only restart button (US3 P2)

1. Complete Test 1 to reach the result screen.
2. Inspect **Tab A** (host): "Restart" button is visible and clickable.
3. Inspect **Tab B** (non-host): "Restart" button is **not** visible.

---

## Test 4 — Non-host cannot call restart via API (edge case)

After completing a round (room in "finished" state), copy the non-host's `participantId`
from the browser's `localStorage` (or from the network tab of a previous request).

```bash
curl -X POST http://localhost:3000/rooms/<CODE>/restart \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<non-host-participant-id>"}'
```

**Expected**: HTTP 403 response with an error message.

---

## Test 5 — Zero guesses result (edge case)

1. Create and join a room, start the game.
2. **Tab A** (host): Click "End Round" immediately without submitting any guesses.

**Expected**:
- Both tabs show the result screen.
- Correct word is revealed.
- All scores show 0.
- Guess history is empty (no error, no crash).

---

## Test 6 — Idempotent restart (edge case)

After a restart (room back in lobby):

```bash
curl -X POST http://localhost:3000/rooms/<CODE>/restart \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<host-participant-id>"}'
```

**Expected**: HTTP 200 with lobby snapshot. No error.
