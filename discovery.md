# Discovery Notes

## Bug Fix

### API Base URL Misconfiguration (`frontend/src/services/api.ts`)

The default fallback value for `VITE_API_URL` included a `/bug` path segment:

```ts
// Before (broken)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

// After (fixed)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
```

All API calls (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`) were hitting `http://localhost:3001/bug/*`, which matched no registered route and returned the backend's `notFoundHandler` response: `{ "message": "Route not found" }`.

The fix removes `/bug` so calls resolve to the correct base URL.

---

## Incomplete Behaviors

1. **Automatic lobby polling** — The lobby screen has a manual refresh button but no polling. The spec requires ~2s polling to keep the participant list live.
2. **Host tracking and host-only start** — Room creation does not mark any participant as host. There is no enforcement that only the host can start the game, nor a minimum 2-player check before starting.
3. **Game start and drawer assignment** — No start-game endpoint or logic exists. Drawer assignment, secret word selection, and drawer-only word visibility are entirely absent.
4. **Guess submission and synced history** — There is no endpoint or state for submitting guesses, validating them (trim, case-insensitive), recording history, or syncing results to all players via polling.
5. **Result state and restart flow** — No result phase exists. There is no mechanism to display the correct word, final scores, and full guess history, nor to restart and return all players to the lobby with round state cleared.

---

## Assumptions

1. The backend room store is in-memory only; restarting the backend clears all rooms. No persistence is required or expected.
2. The `participantId` returned on room creation or join is the sole identity token for a player session. There is no authentication layer.

---

## Relevant Files

| File | Role |
|------|------|
| `frontend/src/services/api.ts` | API client — base URL config and all HTTP calls |
| `backend/src/api/router.ts` | Express router — mounts `/rooms` and error/not-found handlers |
| `backend/src/api/rooms.ts` | Route handlers for `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` |
| `backend/src/api/schemas.ts` | Zod schemas for request validation |
| `backend/src/services/roomStore.ts` | In-memory room state — create, join, get room |
| `backend/src/models/game.ts` | Room and participant type definitions |
| `backend/src/seed/starterData.ts` | Starter word list and roles |
