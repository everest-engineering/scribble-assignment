# Quickstart: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-02

## Prerequisites

- Node.js 18+ and npm 9+ installed
- Two browser tabs (or two different browsers) for multi-player testing

## Start the Backend

```bash
cd backend
npm install   # first time only
npm run dev
```

Confirm: `http://localhost:3001/health` returns `{ "ok": true }`.

## Start the Frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

Confirm: `http://localhost:5173` shows the Start screen.

## Manual Verification Checklist

### 1 — Create Room & Host Tracking

1. Open `http://localhost:5173` in Tab A.
2. Click **Create Room**, enter name `"Alice"`, submit.
3. Confirm you land on the Lobby screen.
4. Confirm Alice is listed in the participants panel.
5. Confirm a **Start Game** button is visible (and disabled, because only 1 player).
6. No "host" label is required yet — just confirming the button exists for the creator.

### 2 — Join Room & Isolation

1. Open `http://localhost:5173` in Tab B.
2. Click **Join Room**, enter name `"Bob"` and the room code from Tab A, submit.
3. Confirm Tab B lands on the Lobby.
4. Confirm Tab B shows both Alice and Bob in the participant list.
5. Confirm Tab B does NOT show the Start Game button (Bob is not the host).
6. Create a second room in Tab C with a different name; confirm Tab C shows only that
   room's participants — not Alice or Bob.

### 3 — Lobby Auto-Polling

1. With Tab A on the Lobby, watch the participant list.
2. Open Tab D, join the same room as Tab A with name `"Charlie"`.
3. Within ~2 seconds Tab A should show Charlie without any manual interaction.

### 4 — Start Game

1. With 2+ players in the lobby, Tab A (Alice / host) should have the Start Game button
   enabled.
2. Click Start Game on Tab A.
3. Confirm the room status transitions to `"active"` (visible in API response or via
   navigation to Game screen).
4. On Tab B's next poll cycle (~2 s), it should also reflect the `"active"` status.

### 5 — Validation Edge Cases

| Test | Input | Expected |
|------|-------|----------|
| Empty name on Create | Submit with blank name | Inline error, no room created |
| Whitespace name on Create | `"   "` | Inline error, no room created |
| Empty code on Join | Blank code field | Inline error, no API call |
| Unknown code on Join | `"ZZZZ"` | "Room not found" error message |
| Case-insensitive code | Enter `"ab3k"` for room `"AB3K"` | Join succeeds |
| Non-host tries to start | Call `POST /rooms/:code/start` with Bob's `participantId` | 403 response |

## Run Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

All pre-existing tests should still pass. New tests for host tracking and start-game
validation will be added in the tasks phase.
