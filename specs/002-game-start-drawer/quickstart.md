# Quickstart — Game Start & Drawer Flow

Spec: [./spec.md](./spec.md) · Plan: [./plan.md](./plan.md) · Contracts: [./contracts/rooms-api.md](./contracts/rooms-api.md)

Validate this feature end-to-end against a freshly restarted backend.

## Prerequisites

- `cd backend && npm install && npm run dev` — backend on `http://localhost:3001`.
- `cd frontend && npm install && npm run dev` — frontend on `http://localhost:5173`.
- Two browser tabs (call them **Tab 1 = Alice**, **Tab 2 = Bob**) and one terminal for curl probes.

> Reset between scenarios: stop the backend (`Ctrl+C`) and restart it. The in-memory `rooms` map is wiped each restart.

---

## Scenario 1 — Drawer assignment & word visibility (US1 + US2)

1. In **Tab 1**: Create Room as `Alice`. Note the room code (`ABCD`).
2. In **Tab 2**: Join Room as `Bob` using that code.
3. In **Tab 1**: click **Start Game**.
4. **Expected within ~2s on both tabs**:
   - Both tabs leave the lobby panel and enter the round panel.
   - Banner reads **"Round 1 — Alice is drawing"**.
   - Alice's participant tile shows a **"Drawer"** indicator.
5. **Tab 1 (Alice / drawer)**: the round panel prominently shows **"Your word: ROCKET"** (cleartext).
6. **Tab 2 (Bob / guesser)**: the round panel shows **`_ _ _ _ _ _`** (six underscores) and the text **"Alice is drawing"** but **no cleartext word**.
7. In **Tab 2**, open DevTools → Network. Find the most recent `GET /rooms/ABCD?participantId=...` response. Search the payload for the string `rocket`. **Expected**: zero matches. The `round` field has `maskedWord: "______"` and **no** `secretWord` key.

### Verifying with curl

```bash
ROOM=ABCD; ALICE=<alice-participant-id>; BOB=<bob-participant-id>

# Drawer view — must include "secretWord": "rocket"
curl -s "http://localhost:3001/rooms/$ROOM?participantId=$ALICE" | jq '.room.round'

# Guesser view — must NOT include "secretWord"
curl -s "http://localhost:3001/rooms/$ROOM?participantId=$BOB" | jq '.room.round'
curl -s "http://localhost:3001/rooms/$ROOM?participantId=$BOB" | grep -q '"secretWord"' \
  && echo "LEAK" || echo "OK: no secretWord in guesser payload"
```

---

## Scenario 2 — Deterministic word selection (US3)

1. Stop and restart the backend (wipes `rooms`).
2. Repeat Scenario 1 steps 1–5.
3. **Expected**: the drawer's word in Tab 1 is **again** `ROCKET`, every single time, for 10 consecutive resets.
4. Create a **second** room in a new browser window with different names. Start that game too.
5. **Expected**: that room's drawer also sees `ROCKET` (because both are round 1 against the same seed). Different rooms, same word in round 1 — deterministic across rooms by design.

---

## Scenario 3 — Idempotent Start

1. With Alice + Bob in the lobby, in Tab 1 press **Start Game**. Round begins with `ROCKET`.
2. Press **Start Game** again (the button may be hidden post-start; use curl instead):

   ```bash
   curl -i -X POST http://localhost:3001/rooms/$ROOM/start \
     -H "Content-Type: application/json" \
     -d "{\"participantId\":\"$ALICE\"}"
   ```

3. **Expected**: `HTTP/1.1 200` with the **same** body as the first start (same `drawerParticipantId`, same `secretWord: "rocket"`, same `roundNumber: 1`).
4. As Bob, try to start during the active round:

   ```bash
   curl -i -X POST http://localhost:3001/rooms/$ROOM/start \
     -H "Content-Type: application/json" \
     -d "{\"participantId\":\"$BOB\"}"
   ```

   **Expected**: `HTTP/1.1 403` with body `{"message":"Only the host can start the game"}`. The room remains in round 1 unchanged on the next poll.

---

## Scenario 4 — Lobby → Round transition is reflected by polling

1. Reset backend. Recreate Alice + Bob in the lobby.
2. **Without clicking Start in Tab 1**, watch Tab 2's lobby. It should show "Waiting for the host to start the game."
3. In Tab 1, click Start.
4. **Expected**: within ~2s **Tab 2 transitions automatically** to the round panel — no click required, polling alone delivers the state change. Bob never sees `secretWord`.

---

## Negative checks

- **Drawer's snapshot poll** after the round starts: continues to return `secretWord: "rocket"` on every subsequent poll for the drawer (FR-008). Confirm by polling 5x via curl and `jq '.room.round.secretWord'` — 5x `"rocket"`.
- **Guesser's snapshot poll** never returns `secretWord` (FR-005). Confirm by polling 5x via curl and grepping for `secretWord` — 0 hits.
- **`POST /rooms/UNKN/start`** with a host id: returns `404 {"message":"Room not found"}` (unchanged from `001`).

---

## Acceptance summary

This feature is "done" when:

- Tab 1 (host/drawer) sees the cleartext word; Tab 2 (guesser) sees only the mask. (FR-002, FR-005)
- The word for round 1 is always `"rocket"` against the current seed. (FR-004)
- Pressing Start twice does not re-roll the word and does not advance the round number. (FR-007, FR-008)
- Both tabs flip from lobby to round panel automatically within one poll cycle. (FR-001)
- `npm test` passes in both `backend/` and `frontend/`. (constitution Principle V)
