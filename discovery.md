# Discovery Notes

## Known Bug

### API base URL has a `/bug` typo — all requests fail in dev by default
`frontend/src/services/api.ts:22`:
```ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";
```
The fallback contains a spurious `/bug` path segment. Every API call will 404 unless `VITE_API_URL` is explicitly set. The correct fallback is `"http://localhost:3001"`.

---

## Incomplete Behaviors

### 1. Room Setup & Lobby (Scenario 1)
There is no `hostId` on the `Room` model, so host identity is never tracked and host-only permissions cannot be enforced. The "Start Game" button in `LobbyPage.tsx` is visible to every participant and navigates directly to `/game` with no 2-player minimum check. Lobby refresh is manual (button click only) — there is no polling interval, so new joiners are invisible until a player clicks Refresh.

### 2. Game Start & Drawer Flow (Scenario 2)
The `RoomStatus` type only allows `"lobby"`, so the backend cannot represent a game in progress. There is no start-game endpoint, no drawer assignment, and no secret-word selection. Player name validation (reject empty/whitespace-only) is absent on both the client and the backend schemas.

### 3. Gameplay Interaction (Scenario 3)
`GamePage.tsx` renders a static `<div>` placeholder where the canvas should be — no `<canvas>`, no drawing tools, no clear-canvas action. `GuessForm.tsx` captures input but `handleSubmit` only calls `event.preventDefault()` and returns; no guess is sent to the backend. There is no guess endpoint, no guess history, and no scoring logic. `Scoreboard.tsx` and `ResultPanel.tsx` are hardcoded stubs with no live state.

### 4. Result, Restart & Final Validation (Scenario 4)
There is no result state on the backend or frontend. `RoomSnapshot` carries no `drawer`, `secretWord`, `guesses`, or `scores` fields, so the end-of-round view and the restart flow have nothing to display or reset.

---

## Assumptions

### A. The room creator is always the host
The spec says "the creator is automatically the host," but the model has no host field. I am assuming a `hostId: string` will be added to `Room`, set to the first participant's `id` at creation time, and surfaced in `RoomSnapshot` so the frontend can gate the Start button.

### B. Deterministic word selection means index-based, not random
Scenario 2 requires "deterministically selected" secret words. Since there is no round counter or seed in the current model, I am assuming selection uses a fixed index into the starter list (e.g., index 0 for the first round), not `Math.random()`.

---

## Relevant Files

| File | Role |
|------|------|
| `backend/src/models/game.ts` | Core data types: `Room`, `Participant`, `RoomSnapshot`, `RoomStatus` |
| `backend/src/services/roomStore.ts` | In-memory store: create, join, get, save, snapshot |
| `backend/src/api/rooms.ts` | Express router: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` |
| `backend/src/api/schemas.ts` | Zod validation schemas for request bodies and params |
| `backend/src/seed/starterData.ts` | Seed word list and roles |
| `frontend/src/services/api.ts` | Typed fetch wrappers — **`/bug` typo on line 22** |
| `frontend/src/state/roomStore.ts` | Client-side state store (`RoomStore` class + React context) |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI — manual refresh, no polling, no host-gated Start |
| `frontend/src/pages/GamePage.tsx` | Game UI — canvas placeholder, no drawer/guesser distinction |
| `frontend/src/components/GuessForm.tsx` | Guess input — no submission logic |
| `frontend/src/components/Scoreboard.tsx` | Hardcoded stub |
| `frontend/src/components/ResultPanel.tsx` | Hardcoded stub |
| `frontend/src/pages/CreateRoomPage.tsx` | Create room form — no client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Join room form — no empty-code or empty-name guard |
