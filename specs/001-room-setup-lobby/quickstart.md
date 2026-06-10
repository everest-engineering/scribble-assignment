# Quickstart Validation Guide: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10

This guide validates every acceptance scenario from the spec using two browser
tabs and the browser network panel. No automated tests are added by this feature.

## Prerequisites

- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
- Both TypeScript builds must pass before validating:
  ```
  cd backend && npm run build
  cd frontend && npm run build
  ```

---

## Scenario 1 — Host Creation & Name Validation (US1)

**Tab A: Create Room screen**

1. Leave the Player name field empty and click **Create and Continue**.
   - ✅ Inline error appears below the name field.
   - ✅ Page does NOT navigate away.

2. Enter `"   "` (spaces only) and click **Create and Continue**.
   - ✅ Inline error appears (treated as blank).

3. Enter `"  Ada  "` and click **Create and Continue**.
   - ✅ Navigates to Lobby.
   - ✅ Network panel shows `POST /rooms` with `{ "playerName": "Ada" }`.
   - ✅ Participant list shows "Ada" with a host indicator (e.g., "(Host)" badge).

---

## Scenario 2 — Join & Invalid Code Handling (US2)

**Tab B: Join Room screen**

1. Leave name empty, enter a valid code, and click **Join Lobby**.
   - ✅ Inline error on name field.

2. Enter a valid name and an unknown code (e.g., `ZZZZ`), click **Join Lobby**.
   - ✅ Network panel shows `POST /rooms/ZZZZ/join` → 404.
   - ✅ Inline error: "Room not found. Check the code and try again." (or similar).

3. Enter `"  Bo  "` and the room code shown on Tab A's Lobby, click **Join Lobby**.
   - ✅ Navigates to Lobby in Tab B.
   - ✅ Tab B participant list shows "Bo" with NO host indicator.

---

## Scenario 3 — Lobby Auto-Polling (US3)

**Continuing from Scenarios 1 & 2, Tab A = host, Tab B = joiner**

1. In Tab A (Lobby), watch the participant list without clicking anything.
   - ✅ Within ~4 seconds of Tab B joining, "Bo" appears in Tab A's list automatically.
   - ✅ No spinner or "Refreshing…" text appears during background polls.
   - ✅ Network panel in Tab A shows repeated `GET /rooms/XXXX` requests every ~2 s.

2. Navigate Tab A away from the Lobby (e.g., back to the Start screen).
   - ✅ Network panel shows NO further `GET /rooms/XXXX` requests after navigation.

---

## Scenario 4 — Host-Only Start Game Gate (US4)

**Tab A = host (Ada), Tab B = Bo (non-host)**

1. Open Tab A's Lobby when only Ada is present (1 participant).
   - ✅ Start Game button is visible but **disabled**.

2. Open Tab B's Lobby.
   - ✅ No Start Game button is rendered at all.

3. After Tab B joins and Tab A's next poll fires (≤ 4 s):
   - ✅ Start Game button in Tab A becomes **enabled**.

4. Click Start Game in Tab A.
   - ✅ Application navigates to the Game screen.

---

## Scenario 5 — Room Isolation (US5)

**Three tabs**

1. Tab A: Create Room → note code `AAAA`.
2. Tab B: Create Room → note code `BBBB` (different code).
3. Tab C: Join Room with code `AAAA` and name "Charlie".

4. In Tab B's Lobby (or via `GET /rooms/BBBB` in DevTools):
   - ✅ "Charlie" does NOT appear in room BBBB's participant list.
   - ✅ Room BBBB has exactly 1 participant (its own creator).

---

## Manual API Verification (optional)

Directly verify the contract changes with curl or the browser DevTools console:

```bash
# Create room
curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Ada"}' | jq .

# Expected: participants[0].isHost === true

# Join room (replace XXXX with actual code)
curl -s -X POST http://localhost:3001/rooms/XXXX/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bo"}' | jq .

# Expected: joining participant has isHost === false
# Expected: creator participant has isHost === true

# Unknown code → 404
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/rooms/ZZZZ/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Test"}'
# Expected: 404

# Empty name → 422
curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"   "}' | jq .
# Expected: { "message": "Player name is required" }
```
