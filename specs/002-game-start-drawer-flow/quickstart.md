# Quickstart: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-06-03

---

## Prerequisites

- Node.js 18+ installed
- Dependencies installed: `cd backend && npm install` and `cd frontend && npm install`

---

## Running Locally

**Backend** (port 3001):

```bash
cd backend && npm run dev
```

**Frontend** (port 5173):

```bash
cd frontend && npm run dev
```

---

## Manual End-to-End Verification (two-browser-tab flow)

1. Open **Tab 1** and navigate to `http://localhost:5173`.
2. Enter a player name (e.g. `Alice`) and click **Create Room**. Note the 4-character room code.
3. Open **Tab 2** and navigate to `http://localhost:5173`. Click **Join Room**, enter the room code and a name (e.g. `Bob`).
4. In **Tab 1** (Alice / host), click **Start Game** in the lobby.
5. Both tabs should navigate to the `/game` route.
6. **Tab 1 (Alice / drawer)**:
   - Participant list shows Alice labelled **Drawer**, Bob labelled **Guesser**.
   - The secret word (`rocket`) is displayed.
7. **Tab 2 (Bob / guesser)**:
   - Participant list shows Alice labelled **Drawer**, Bob labelled **Guesser**.
   - The placeholder text **"Waiting for the drawer…"** is shown — no word visible.

---

## Running Tests

**Backend unit tests**:

```bash
cd backend && npm test
```

**Frontend unit tests**:

```bash
cd frontend && npm test
```

**Verify API word redaction directly**:

```bash
# Start game first, then:
# As drawer (replace ROOM and HOST_ID with actual values):
curl "http://localhost:3001/rooms/ROOM?participantId=HOST_ID" | jq .room.currentWord
# Expected: "rocket"

# As guesser (replace GUEST_ID):
curl "http://localhost:3001/rooms/ROOM?participantId=GUEST_ID" | jq .room.currentWord
# Expected: null
```
