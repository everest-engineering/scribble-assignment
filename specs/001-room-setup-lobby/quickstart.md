# Quickstart: Room Setup & Lobby

A runnable validation guide that proves the feature satisfies the spec end-to-end. Implementation lives in source; this document is the manual gate.

## Prerequisites

- Node version from `.nvmrc` installed (`nvm use`).
- `backend/` and `frontend/` dependencies installed (`npm install` in each).
- Two browser tabs available against the dev frontend.

## Bring the system up

In two terminals from the repo root:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

Quick sanity:

```bash
curl http://localhost:3001/health
# → {"ok":true}
```

## Scenario 1 — Create as host (US1)

1. Open `http://localhost:5173` in **Tab 1**.
2. Click **Create Room**, enter `Alice`, submit.
3. **Expected**: Lobby renders with a 4-character room code (e.g., `ABCD`). Alice appears in the participant list with a host indicator. **Start Game** is visible but disabled.

Negative check: leave the name blank and submit. **Expected**: form blocks the submission with a validation message; no network request is sent.

## Scenario 2 — Join with a code (US2)

1. Open `http://localhost:5173` in **Tab 2**.
2. Click **Join Room**, enter `Bob` and the code from Scenario 1.
3. **Expected**: Tab 2 lands in the same lobby; the participant list shows `Alice` (host) and `Bob`. Tab 2 does **not** show **Start Game**.

Negative checks (Tab 2's join form):

- Submit with the code field empty → form blocks submission, no network call.
- Submit with code `ZZZZ` (or any unused code) → inline error reading `Room not found`; the join form remains.

## Scenario 3 — Polling keeps the lobby in sync (US3)

1. Keep Tab 1 on the lobby. Do **not** click any refresh control.
2. Open a third tab, join the same room as `Carol`.
3. **Expected**: Tab 1's participant list shows `Carol` within ~2 seconds without any manual action. Tab 2 also updates within the same window.
4. In Tab 2, switch to a different OS application/tab so the lobby tab is hidden, then back.
5. **Expected**: While hidden, network polling pauses (visible in DevTools → Network). On returning, an immediate fetch runs and the list is current.

Resilience check: stop the backend (`Ctrl+C` in Terminal 1), wait one poll cycle, restart it. **Expected**: the previously rendered participant list stays on screen during the outage; polling resumes successfully on the next tick.

404 check: stop the backend and clear `rooms` (just restart the dev server). On the next tick, both lobby tabs surface a "Room no longer available" state and stop polling.

## Scenario 4 — Host-only Start with 2-player gate (US4)

1. With `Alice` (Tab 1) and `Bob` (Tab 2) in the lobby, observe Tab 1's **Start Game** button.
2. **Expected**: enabled in Tab 1 (host, 2 participants). Not present in Tab 2.
3. From a terminal, attempt to start as a non-host:

   ```bash
   curl -i -X POST http://localhost:3001/rooms/ABCD/start \
     -H "Content-Type: application/json" \
     -d '{"participantId":"<bob-participant-id>"}'
   ```

   **Expected**: `HTTP/1.1 403` with body `{"message":"Only the host can start the game"}`.

4. Repeat as the host with only one participant in a fresh room:

   ```bash
   curl -i -X POST http://localhost:3001/rooms/<solo-code>/start \
     -H "Content-Type: application/json" \
     -d '{"participantId":"<host-participant-id>"}'
   ```

   **Expected**: `HTTP/1.1 409` with body `{"message":"Need at least 2 players to start"}`.

5. As the host with 2 participants, click **Start Game** in Tab 1.
   **Expected**: `200 OK`. Visible state transition into gameplay is out of scope for this feature.

## Scenario 5 — Cross-room isolation (FR-008 / SC-006)

1. From Tab 1, create a room (`ROOM-A`).
2. From Tab 2, create a different room (`ROOM-B`).
3. From Tab 1:

   ```bash
   curl "http://localhost:3001/rooms/ROOM-A?participantId=<alice-id>"
   ```

   **Expected**: only `ROOM-A` participants are returned. No `ROOM-B` data leaks.
4. Repeat for `ROOM-B`.

## Scenario 6 — Refresh on /lobby keeps you on /lobby

1. While in the lobby (Tab 1), hit the browser refresh button.
2. **Expected**: page reloads on `/lobby` with the same room snapshot rehydrated and polling resumed. You are not redirected to the start page.

## What "done" looks like

All six scenarios pass without modification, and `specs/001-room-setup-lobby/checklists/requirements.md` remains fully checked off. After implementation, run `/speckit.implement` (or just execute `tasks.md`) and re-run this quickstart.
