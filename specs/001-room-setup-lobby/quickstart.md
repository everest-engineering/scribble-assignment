# Quickstart: Validate Room Setup & Lobby

**Feature**: 001-room-setup-lobby | **Prerequisites**: Node 18+, two browser tabs

## 1. Start services

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Confirm `http://localhost:3001/health` returns `{ "ok": true }`.

## 2. Host creates a room (Tab A)

1. Open `http://localhost:5173`
2. Click **Create Room**, enter name `Host`, submit
3. Verify lobby shows room code, **Host** in participant list with host indicator
4. Verify **Start Game** is disabled with message about needing more players

## 3. Guest joins (Tab B)

1. Open a second tab to `http://localhost:5173`
2. Click **Join Room**, enter name `Guest`, paste room code from Tab A
3. Verify both tabs show Host and Guest within ~3 seconds **without** clicking Refresh

## 4. Join validation (Tab B)

1. On Join Room, submit with empty room code → error before lobby
2. Submit code `ZZZZ` (nonexistent) → clear not-found error, stay on join page

## 5. Start-game gating

| Step | Tab | Expected |
|------|-----|----------|
| Guest views lobby | B | Start disabled; message that only host can start |
| Host with 2 players | A | Start enabled |
| Host clicks Start | A | Both tabs navigate to `/game` within ~3s |

## 6. Room isolation

1. Tab A: create Room 1
2. Tab B: create Room 2 (new tab or reset flow)
3. Join each room with different guests
4. Confirm participants in Room 1 never appear in Room 2 lobby

## 7. Polling cleanup

1. From lobby, navigate **Back** to start page
2. Open network tab — confirm room fetch stops (no repeating requests every 2s)

## 8. Game guard

1. With room still in `lobby`, manually open `/game` in address bar
2. Verify redirect to `/lobby` (or block) until host has started

## 9. Build check

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must complete without errors before marking Scenario 1 complete.
