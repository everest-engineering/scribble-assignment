# Discovery Notes — Scribble Lab

**Date**: 2026-06-02
**Branch**: `scribble-lab`

## Relevant Files

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Core type definitions: Room, Participant, RoomStatus, ParticipantRole |
| `backend/src/services/roomStore.ts` | In-memory room store, code generation, CRUD operations |
| `backend/src/api/rooms.ts` | Route handlers for POST /rooms, POST /rooms/:code/join, GET /rooms/:code |
| `backend/src/api/router.ts` | Express router wiring |
| `backend/src/api/schemas.ts` | Zod validation schemas for request bodies |
| `backend/src/seed/starterData.ts` | Hardcoded word list and roles array |
| `backend/src/app.ts` | Express app setup, CORS, middleware |
| `backend/src/server.ts` | HTTP server entry point (port 3001) |
| `frontend/src/services/api.ts` | HTTP client wrapping all backend calls |
| `frontend/src/state/roomStore.ts` | Frontend room state (useSyncExternalStore) |
| `frontend/src/pages/CreateRoomPage.tsx` | Create room form and navigation to lobby |
| `frontend/src/pages/JoinRoomPage.tsx` | Join room by code form |
| `frontend/src/pages/LobbyPage.tsx` | Lobby screen with manual refresh button |
| `frontend/src/pages/GamePage.tsx` | Game screen — canvas and guess input are placeholders |
| `frontend/src/components/GuessForm.tsx` | Guess input — submit handler is a no-op |
| `frontend/src/components/Scoreboard.tsx` | Scoreboard — hardcoded placeholder, no data binding |
| `frontend/src/components/ResultPanel.tsx` | Activity feed — static placeholder text only |

---

## Incomplete Behaviors

### 1. No host tracking or host-only permissions

The `Room` model (`backend/src/models/game.ts`) has no `hostId` field. The first participant to create a room is not distinguished from others anywhere in the data model or API. As a result:

- There is no concept of a host in the backend.
- Any player can theoretically trigger game-start (no enforcement exists yet).
- `POST /rooms` returns a `participantId` but does not mark that participant as host.

**Files**: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`

---

### 2. No lobby polling — refresh is manual only

`LobbyPage.tsx` has a single "Refresh" button that calls `api.fetchRoom()` on demand. There is no `setInterval` or polling loop anywhere in the frontend. Players joining after the initial load are invisible to others until they manually refresh.

**Files**: `frontend/src/pages/LobbyPage.tsx`, `frontend/src/services/api.ts`

---

### 3. No start-game flow or game state transitions

`RoomStatus` is typed as the string literal `"lobby"` with no other values. There is no `POST /rooms/:code/start` endpoint and no state machine to transition a room from `"lobby"` to an active game state. The backend model carries no round, drawer, word, guesses, or scores fields.

**Files**: `backend/src/models/game.ts`, `backend/src/api/router.ts`

---

### 4. Drawing canvas is a static placeholder

`GamePage.tsx` renders a `<div>` with the text "Waiting for drawer..." in place of an interactive canvas. There is no `<canvas>` element, no pointer-event handlers, no stroke capture, and no mechanism to share drawing state with other players.

**Files**: `frontend/src/pages/GamePage.tsx`

---

### 5. Guess submission is a no-op

`GuessForm.tsx` calls `event.preventDefault()` in `handleSubmit` and does nothing else. No API call is made, no validation runs, and no backend endpoint exists to receive or persist guesses.

**Files**: `frontend/src/components/GuessForm.tsx`, `backend/src/api/router.ts`

---

### 6. Scoreboard and result panel have no data binding

`Scoreboard.tsx` renders hardcoded placeholder text ("Waiting for players..." / score "0"). `ResultPanel.tsx` renders "Game activity and guesses will appear here." Neither component receives props or reads from any store.

**Files**: `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`

---

## Assumptions

### A1. In-memory storage is the intended and only storage layer

The `roomStore` uses a `Map<string, Room>` with no persistence. The README explicitly states this and marks databases out of scope. All room state is lost on server restart. This is accepted as a deliberate constraint, not a gap to fill.

### A2. Polling (~2 s) is the only sync mechanism; WebSockets are out of scope

The frontend uses plain `fetch` with no WebSocket or SSE infrastructure. The README prohibits WebSockets. Lobby participant lists and game state (guesses, scores) will be kept in sync through client-side polling against `GET /rooms/:code`.

### A3. The first participant who creates a room becomes the host for that room's lifetime

There is no explicit host field or re-assignment mechanism in the starter. Since `POST /rooms` accepts a single player name and returns a single `participantId`, the simplest consistent rule is: the creator is the host, identified by storing `hostId` on the `Room` model at creation time.

### A4. Drawer assignment is deterministic and non-rotating within a single round

The README constrains the lab to one round with no drawer rotation or timers. The drawer will be the host (or first participant) and holds that role for the entire game session. This avoids needing a round-cycling algorithm.

### A5. Word selection uses the starter seed list deterministically

`STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"]`. The README specifies deterministic selection from this list. The simplest deterministic approach is index-based selection (e.g. room creation count or a fixed index), not `Math.random()`.

---

## Key Hardcoded Values

| Value | Location | Notes |
|-------|----------|-------|
| `STARTER_WORDS` | `backend/src/seed/starterData.ts:3` | 5 words; no custom word packs in scope |
| `STARTER_ROLES` | `backend/src/seed/starterData.ts:11` | `["drawer","guesser"]` — static, not per-participant |
| Room code alphabet | `backend/src/services/roomStore.ts:12` | Excludes I, O, S, L to avoid visual confusion |
| Default player name | `backend/src/services/roomStore.ts:33` | Falls back to `"Player"` if name omitted |
| Backend port | `backend/src/server.ts:3` | 3001; overridable via `PORT` env var |
| API base URL | `frontend/src/services/api.ts:22` | `http://localhost:3001`; overridable via `VITE_API_URL` |
