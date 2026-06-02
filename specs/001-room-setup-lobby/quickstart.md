# Quickstart: Room Setup & Lobby Navigation

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02

---

## Prerequisites

- Node.js 24.13.0 (use `.nvmrc`: `nvm use`)
- Dependencies installed in both `backend/` and `frontend/`

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Dev Server

Run backend and frontend in separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

The frontend reads `VITE_API_URL` from `frontend/.env`. The default is `http://localhost:3001`.

---

## Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

Both use Vitest. Coverage is reported inline; the CI gate requires ≥ 80% line/branch coverage.

---

## Shared Schemas Setup

The `shared/` package must be importable by both `frontend/` and `backend/`. The implementation plan uses a path-mapped approach:

- `backend/tsconfig.json` — add path alias `"shared/*"` → `"../shared/*"`
- `frontend/tsconfig.json` / `vite.config.ts` — add Vite resolve alias `shared` → `../shared`

No additional build step is needed; both TypeScript configs resolve the alias at compile time and Vite resolves it at bundle time.

---

## Key Files for This Feature

| File | Purpose |
|------|---------|
| `shared/schemas/room.ts` | Zod schemas + inferred types (source of truth) |
| `backend/src/models/game.ts` | Internal Room/Participant types (extend with `hostId`, `in-progress`) |
| `backend/src/services/roomStore.ts` | Room CRUD + max-player enforcement + start transition |
| `backend/src/api/rooms.ts` | Express route handlers including new `POST /:code/start` |
| `backend/src/api/schemas.ts` | Request Zod schemas (tighten playerName/roomCode validation) |
| `frontend/src/services/api.ts` | HTTP client (fix URL bug, add Zod parse on responses) |
| `frontend/src/state/roomStore.ts` | Client state + `startGame()` method + polling wiring |
| `frontend/src/pages/LobbyPage.tsx` | Polling loop, host-only Start Game button, auto-navigate |
| `frontend/src/pages/CreateRoomPage.tsx` | Loading state, form validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Loading state, form validation |
| `frontend/src/components/PageErrorBoundary.tsx` | React error boundary for all route pages |

---

## Manual Test Flow

1. Open `http://localhost:5173` in Tab A. Enter a name, press **Create Room**. Note the room code.
2. Open `http://localhost:5173` in Tab B. Press **Join Room**, enter the code and a different name, press **Join Lobby**.
3. Observe Tab A's lobby participant list updates within ~2 seconds (polling).
4. In Tab A (host), confirm **Start Game** button is now enabled.
5. Press **Start Game** in Tab A. Both tabs should navigate to `/game`.
6. In Tab C, open `http://localhost:5173/lobby` directly — should redirect to `/`.
