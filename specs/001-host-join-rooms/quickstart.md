# Quickstart: Verify 001 Host and Join Rooms

## Prerequisites

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Frontend: `http://localhost:5173` (or Vite default). API: `http://localhost:3001`.

## Manual checklist (two browsers)

1. **Create**: Browser A → Create Room, name `Host` → lobby shows **prominent** 4-char code (easy to copy/share), **full participant list**, and host badge.
2. **Join**: Browser B → Join Room, same code (try lowercase), name `Guest` → within ~2s A sees Guest in list.
3. **Start gate**: A alone → Start disabled / message needs more players. After B joins → A can Start; B cannot.
4. **Isolation**: Browser C → join different room code → never sees A/B participants.
5. **Invalid join**: Wrong code → “room not found”; empty code → validation message.
6. **Full room**: (Optional load test) 10 joiners → 11th gets “room full.”
7. **Resume**: B refreshes lobby → same name/id in list without re-join form (sessionStorage).
8. **Empty room**: Close all tabs; wait ~30s; join old code → not found.

## Automated tests

```bash
cd backend && npm test
```

Target: `roomStore` unit tests for trim, cap, host, start gate, prune; API contract tests for status codes.

## Key files

| Area | Path |
|------|------|
| Routes | `backend/src/api/rooms.ts` |
| Logic | `backend/src/services/roomStore.ts` |
| Schemas | `backend/src/api/schemas.ts` |
| Model | `backend/src/models/game.ts` |
| Lobby UI | `frontend/src/pages/LobbyPage.tsx` |
| State | `frontend/src/state/roomStore.ts` |
| API client | `frontend/src/services/api.ts` |
