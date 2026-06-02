# Discovery Notes — Scribble Assignment

## Completed Behaviours

### Backend

- **Create room** (`POST /api/rooms`): generates a unique 4-character code, stores the room in memory, creates the first participant, returns `{ participantId, room }`.
- **Join room** (`POST /api/rooms/:code/join`): adds a new participant to an existing room; returns 404 if the code is unknown.
- **Fetch room snapshot** (`GET /api/rooms/:code`): returns current room state as a `RoomSnapshot`; accepts an optional `participantId` query param (ignored today).
- **In-memory store**: `Map<string, Room>` with structural clone on read/write to prevent accidental mutation.
- **Zod validation** on all request bodies and route params; centralized `HttpError` + error handler in `router.ts`.
- **Seed data**: 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and 2 roles (`drawer`, `guesser`) returned on every snapshot.
- **Code generation**: avoids ambiguous characters (no `0/O`, `1/I`); retries on collision.

### Frontend

- **Routing**: five pages wired via React Router v6 — Start, Create Room, Join Room, Lobby, Game.
- **Create room flow**: form → `roomStore.createRoom()` → navigate to `/lobby`.
- **Join room flow**: form (name + code) → `roomStore.joinRoom()` → navigate to `/lobby`.
- **Lobby participant list**: renders `room.participants` from the last fetched snapshot.
- **Manual refresh**: "Refresh Room" button in Lobby calls `roomStore.fetchRoom()` and shows loading state.
- **Guard redirects**: Lobby and Game pages redirect to `/` when no room is in state.
- **`RoomStore`**: custom observable store (class + `useSyncExternalStore`); handles loading flag and error state; provided via `RoomStoreProvider` context.
- **Typed API service** (`api.ts`): thin `fetch` wrapper with typed generics and error extraction from JSON body.
- **AppShell / PageHeader / Card / RoomCodeBadge**: shared presentational components in place.

---

## Incomplete Behaviours

| Area                       | What is missing                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Game model**             | `RoomStatus` is typed only as `"lobby"`. No `"playing"` or `"finished"` states; no fields for active round, current drawer, chosen word, guesses, or scores.  |
| **Host role**              | No host concept exists. `participants[0]` is the creator but there is no flag or permission check. "Start Game" is visible and clickable by all participants. |
| **Start game flow**        | The "Start Game" button in `LobbyPage` navigates directly to `/game`; it makes no API call and performs no server-side state transition.                      |
| **Lobby polling**          | Only a manual refresh exists. No `setInterval`-based polling is wired in `LobbyPage` or `RoomStore`.                                                          |
| **Drawer assignment**      | `toRoomSnapshot` receives `viewerParticipantId` but immediately discards it (`void viewerParticipantId`). No drawer is ever assigned or surfaced.             |
| **Secret word visibility** | The chosen word is never stored or conditionally exposed. Every snapshot returns the full `availableWords` list to everyone.                                  |
| **Drawing canvas**         | `GamePage` renders a static `<div>` with "Waiting for drawer…". No `<canvas>` element, no drawing event handlers, no stroke data model.                       |
| **Clear canvas**           | No action exists client- or server-side.                                                                                                                      |
| **Guess submission**       | `GuessForm.handleSubmit` calls `event.preventDefault()` and nothing else. Guesses are never sent to the server or stored.                                     |
| **Guess history / sync**   | No guess list in the room model; `ResultPanel` is a static placeholder.                                                                                       |
| **Scoreboard**             | `Scoreboard` renders hardcoded "Waiting for players… 0". No score field exists in the model.                                                                  |
| **Round tracking**         | "Round 1" is hardcoded in `GamePage`. No round counter in the model.                                                                                          |
| **Result state**           | No end-of-round or end-of-game result transition exists anywhere.                                                                                             |
| **Restart flow**           | No API endpoint or UI action to reset/restart a room.                                                                                                         |

---

## Assumptions (inferred from code)

1. **All game state must stay in `Room`** — the only server-side entity. Any new fields (round, drawer, word, scores, guesses) must be added to the `Room` model and exposed selectively through `RoomSnapshot`.
2. **`viewerParticipantId` was stubbed for role-based visibility** — the parameter is intentionally plumbed through `GET /rooms/:code` and `toRoomSnapshot` but not yet used, signalling that per-viewer filtering is the intended pattern for word secrecy.
3. **No host enforcement is possible without a host flag** — any participant can trigger host-only actions; a `hostId` field (or marking `participants[0]`) is needed before gating UI controls.
4. **Polling interval is undefined** — the README states polling is required but no target interval is specified. A reasonable default (e.g. 3–5 s) will need to be chosen and made configurable.
5. **Player names are optional** — the backend defaults to `"Player"` when none is supplied; the UI does not enforce a non-empty name.
6. **Room codes are case-insensitive by convention** — the backend normalises to uppercase on lookup (`code.toUpperCase()`); the join form mirrors this in the UI.
7. **Rooms are never cleaned up** — no TTL or eviction logic exists; the in-memory `Map` grows indefinitely while the server is running.

### Known Bug in Starter

`frontend/src/services/api.ts` line 23:

```ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";
```

The fallback URL contains `/bug`, which means every API call will hit `/bug/rooms/…` and fail unless `VITE_API_URL` is set in a `.env` file (e.g. `VITE_API_URL=http://localhost:3001/api`). This is a deliberate starter defect.

---

## Relevant Files

### Backend

| File                                | Purpose                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `backend/src/models/game.ts`        | Core types: `Room`, `Participant`, `RoomSnapshot`, `RoomSessionResponse`, `RoomStatus`, `ParticipantRole` |
| `backend/src/services/roomStore.ts` | All in-memory room state; `createRoom`, `joinRoom`, `getRoom`, `saveRoom`, `toRoomSnapshot`               |
| `backend/src/api/rooms.ts`          | Route handlers for `POST /`, `POST /:code/join`, `GET /:code`                                             |
| `backend/src/api/schemas.ts`        | Zod schemas for request validation; `HttpError` class                                                     |
| `backend/src/api/router.ts`         | Mounts `/rooms` router; `notFoundHandler`, `errorHandler`                                                 |
| `backend/src/seed/starterData.ts`   | `STARTER_WORDS` and `STARTER_ROLES` seed constants                                                        |
| `backend/src/app.ts`                | Express app setup (middleware, router mounting)                                                           |
| `backend/src/server.ts`             | HTTP server entry point                                                                                   |

### Frontend

| File                                        | Purpose                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `frontend/src/services/api.ts`              | Typed `fetch` wrapper; `createRoom`, `joinRoom`, `fetchRoom` calls; **contains the `/bug` defect** |
| `frontend/src/state/roomStore.ts`           | Observable `RoomStore` class + React context + `useRoomState` / `useRoomStore` hooks               |
| `frontend/src/routes/index.tsx`             | React Router route tree                                                                            |
| `frontend/src/pages/CreateRoomPage.tsx`     | Create room form and submission                                                                    |
| `frontend/src/pages/JoinRoomPage.tsx`       | Join room form (name + code)                                                                       |
| `frontend/src/pages/LobbyPage.tsx`          | Participant list, manual refresh, "Start Game" button (nav-only)                                   |
| `frontend/src/pages/GamePage.tsx`           | Game layout shell — canvas placeholder, `GuessForm`, `Scoreboard`, `ResultPanel`                   |
| `frontend/src/pages/StartPage.tsx`          | Landing page                                                                                       |
| `frontend/src/components/GuessForm.tsx`     | Guess input — submit is a no-op                                                                    |
| `frontend/src/components/Scoreboard.tsx`    | Static placeholder                                                                                 |
| `frontend/src/components/ResultPanel.tsx`   | Static placeholder (labelled "Activity")                                                           |
| `frontend/src/components/RoomCodeBadge.tsx` | Displays room code                                                                                 |
| `frontend/src/components/Card.tsx`          | Generic card wrapper                                                                               |
| `frontend/src/components/AppShell.tsx`      | Top-level layout shell                                                                             |

### Tests

| File                                     | Purpose                        |
| ---------------------------------------- | ------------------------------ |
| `backend/src/services/roomStore.test.ts` | Unit tests for `roomStore`     |
| `backend/src/api/schemas.test.ts`        | Unit tests for Zod schemas     |
| `frontend/src/services/api.test.ts`      | Unit tests for the API service |
