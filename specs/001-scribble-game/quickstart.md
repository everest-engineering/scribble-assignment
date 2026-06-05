# Quickstart Validation: Room Setup & Lobby

**Feature**: 001-scribble-game — Scenario 1
**Prereqs**: Node.js 18+, two browser tabs, backend and frontend running.

---

## Start the App

```bash
# Terminal 1
cd backend && npm install && npm run dev
# Confirm: http://localhost:3001/health → { "ok": true }

# Terminal 2
cd frontend && npm install && npm run dev
# Confirm: http://localhost:5173 shows the Start screen
```

---

## US1 — Create a Room and Become Host

**Tab A** (host):

1. Click **Create Room**.
2. Enter name `"Alice"`, click **Create and Continue**.
3. Expected: Lobby screen with room code (e.g. `A3KP`) and `Alice` listed as a participant.
4. Expected: Start Game button is visible but **disabled** (or absent).

**Reject empty name**:

1. Leave the name field blank, click **Create and Continue**.
2. Expected: Inline error message — no navigation, no API call.

**Reject whitespace-only name**:

1. Enter `"   "`, click **Create and Continue**.
2. Expected: Same inline error message.

---

## US2 — Join a Room by Code

**Tab B** (joiner):

1. Click **Join Room**.
2. Enter name `"Bob"` and the code shown in Tab A.
3. Click **Join Lobby**.
4. Expected: Tab B lands on Lobby and shows both `Alice` and `Bob`.

**Reject bad code**:

1. Enter name `"Charlie"` and code `"ZZZZ"` (non-existent).
2. Expected: Error message on Join screen — no navigation.

**Reject whitespace-only name**:

1. Leave name blank, enter valid code.
2. Expected: Inline error message.

---

## US3 — Auto-Refresh

With both tabs open on the Lobby:

1. Open **Tab C** (a third browser tab), join the room as `"Carol"`.
2. Expected: Within ~2 seconds, both Tab A and Tab B show `Carol` in the participant list **without any manual action**.

---

## US4 — Host-Only Start with Minimum Players

With Alice (Tab A) and Bob (Tab B) in the lobby:

1. Confirm Tab B has **no enabled Start Game button**.
2. In Tab A, confirm Start Game is **enabled** (2 players present).
3. Click **Start Game** in Tab A.
4. Expected: Both Tab A and Tab B navigate to `/game`.

**Minimum player guard**:

1. Remove Bob (or use a fresh room with only Alice).
2. Confirm Start Game is **disabled** in Tab A when only 1 player is present.

---

## Build Verification

```bash
cd backend  && npm run build  # must exit 0
cd frontend && npm run build  # must exit 0
```

No type errors or build failures expected after implementation.
