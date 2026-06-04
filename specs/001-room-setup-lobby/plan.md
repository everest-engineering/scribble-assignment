# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-05

## Summary
Implement an in-memory room management flow supporting room creation, joining with strict name validation, multi-room isolation, a host-only start action (2-player minimum), host-to-drawer assignment on game start, drawer-only secret word visibility, and client-side short-polling (~2s) for lobby updates.

## Technical Context
- Language/Version: Node.js 18, TypeScript
- Backend: Express, Zod for request validation, in-memory state (no DB)
- Frontend: React 18 functional components, Vite, short-polling for lobby updates (<= 2s)

## Data Model (in-memory)

TypeScript interfaces used across backend and frontend:

interface Participant {
  id: string;           // UUID
  name: string;         // normalized display name (trimmed, collapsed whitespace)
  joinedAt: string;     // ISO timestamp
}

interface Room {
  id: string;           // internal UUID
  code: string;         // short human-friendly code (case-insensitive)
  hostId: string;       // participant id of host
  participants: Participant[];
  currentDrawer: string; // participant id of the current drawer once game starts
   secretWord?: string;   // internal word visible only to the drawer
   guesses?: {
      participantId: string;
      text: string;
      timestamp: string;
      correct: boolean;
   }[];
   scores?: Record<string, number>;
  availableWords: string[]; // seed words for the drawing game
  gameStarted: boolean;  // true when game leaves lobby
  createdAt: string;
}

All rooms are held in a process-scoped Map<string /*code*/ , Room>.

## Backend state management flow

1. Room creation (`POST /rooms`)
   - Validate `playerName` (non-empty after trim) via Zod.
   - Normalize `playerName`: trim, collapse internal whitespace, reject if empty.
   - Create `Participant` with UUID and timestamp.
   - Create `Room` with generated `code`, set `hostId = participant.id`, `participants = [participant]`, `gameStarted = false`.
   - Store in `rooms` map keyed by normalized code (uppercased).
   - Return 201 with `{ participantId, room: toRoomSnapshot(room, participantId) }`.

2. Join room (`POST /rooms/:code/join`)
   - Validate `code` path and `playerName` body.
   - Normalize incoming `playerName` (trim, collapse, to display case preserved but normalized for comparisons by lowercasing).
   - Lookup room by normalized code; if not found return 404.
   - Check duplicate names case-insensitively among existing participants; if duplicate, return 400.
   - Create `Participant`, append to `participants` array, return `{ participantId, room: toRoomSnapshot(...) }`.
   - Note: operations execute synchronously in Node event loop. To avoid rare race conditions in concurrent joins, perform name-check + push as an atomic synchronous step and re-check before returning if necessary.

3. Fetch room snapshot (`GET /rooms/:code[?participantId=]`)
   - Validate `code` and optional `participantId`.
   - Return sanitized `room` snapshot (exclude any sensitive internal-only fields); include participant list, hostId, code, status fields.

4. Start game (`POST /rooms/:code/start`)
   - Require `participantId` from requester (header or body as existing patterns).
   - Verify `participantId === room.hostId`; else 403.
   - Verify `participants.length >= 2`; else 400 insufficient players.
   - Set `room.gameStarted = true` and `room.currentDrawer = room.hostId`.
   - Select a `secretWord` from the available word list and store it in `room.secretWord`.
   - Return an updated room snapshot where the drawer response includes `secretWord` and non-drawer responses omit it.
   - Ensure `toRoomSnapshot` can conditionally expose `secretWord` based on viewer identity.

   5. Guess submission (`POST /rooms/:code/guesses`)
      - Accept `{ participantId, text }` and validate `text` by trimming and rejecting empty or whitespace-only submissions.
      - Normalize the submitted text by trimming and comparing case-insensitively to `room.secretWord`.
      - Append the guess to `room.guesses` with `{ participantId, text, timestamp, correct }`.
      - If the guess is correct, increment `room.scores[participantId]` by `100`. Initialize `scores` entries to `0` as participants join.
      - Return the updated room snapshot so clients observing via polling will see new guesses and updated scores.

   6. Gameplay polling
      - Continue using the 2s short-polling mechanism during gameplay to sync `guesses` and `scores` for all participants.
      - The client-side store and UI should append or replace displayed guess history on each poll.

5. Room lifecycle and cleanup
   - Add TTL/cleanup job for inactive rooms if required (explicitly remove when empty or after X minutes). Keep in-memory only.

## Client-side 2-second short-polling flow

1. Lobby clients poll `GET /rooms/:code?participantId=...` on a default interval of 2000ms.
2. Implementation pattern: in `LobbyPage` use `useEffect` with a `setInterval` or recursive `setTimeout` that calls `roomStore.fetchRoom()`.
3. On error, surface a non-blocking UI message and implement exponential backoff that caps to a safe maximum (e.g., 10s) to avoid hammering the server.
4. When `fetchRoom` returns an updated snapshot, update local store via `setRoomSnapshot` and React will reconcile UI.

## Files to extend / update

Backend (primary):
- `backend/src/api/rooms.ts` — ensure start endpoint present and validations called; already implements create/join/get handlers.
- `backend/src/api/schemas.ts` — update/confirm `createRoomSchema`, `joinRoomSchema`, `roomCodeParamsSchema`, `roomViewerQuerySchema` include trimmed/normalized name requirements.
- `backend/src/services/roomStore.ts` — core in-memory room Map and helper functions (`createRoom`, `joinRoom`, `getRoom`, `toRoomSnapshot`, `startGame`) to implement flows above, including `currentDrawer` and `secretWord` state.
- `backend/src/models/game.ts` — add TypeScript model interfaces if helpful for shared types.

Frontend (primary):
- `frontend/src/services/api.ts` — expose `startGame` request and ensure base URL matches backend (already patched).
- `frontend/src/state/roomStore.ts` — ensure `fetchRoom`, `createRoom`, `joinRoom` implement polling/updating behaviors.
- `frontend/src/pages/LobbyPage.tsx` — add/use polling interval ~2000ms; handle backoff and show refresh status.
- `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx` — ensure names are normalized client-side before sending (trim/collapse) and surface validation messages returned by server.

## Feature Group 4 - Result & Restart Flow

1. Final result snapshot
   - The existing `GET /rooms/:code` snapshot already includes `guesses` and `scores`. The client should render a results view that highlights top scorers and recent correct guesses.

2. Restart endpoint (`POST /rooms/:code/restart`)
   - Requires `participantId` query parameter; validate caller is host.
   - Server operation must:
     - clear `room.guesses = []`
     - set `room.secretWord = null` and `room.currentDrawer = null`
     - reset `room.scores[participantId] = 0` for each participant in `room.participants`
     - set `room.gameStarted = false`
     - update `room.updatedAt` and persist to in-memory map
   - Return the viewer-aware snapshot after changes (drawer secret redaction rules still apply).

3. Client behavior
   - Provide a host-only control in the results view to call restart and then navigate players back to the lobby or to re-start flow.
   - Polling should continue so clients see the cleared state within ~2 seconds after restart.

Tests to add
- Backend unit/integration tests for: create-room, join-room duplicate-name rejection, multi-room isolation, start-game permission and min-player enforcement, snapshot shape.
- Frontend unit tests for `api` helper and `roomStore` behaviors; integration test to assert polling updates the lobby UI within ~2s in a simulated environment.

## Next steps
1. Implement/extend `backend/src/services/roomStore.ts` and wire `start` endpoint in `backend/src/api/rooms.ts`.
2. Add/adjust Zod schemas in `backend/src/api/schemas.ts` to enforce trimmed non-empty names and case-insensitive duplicate checks.
3. Update `frontend/src/services/api.ts` with `startGame` client method and ensure `VITE_API_URL` configuration is documented for local dev.
4. Implement 2s polling in `frontend/src/pages/LobbyPage.tsx` (use `setInterval` or recursive `setTimeout` with safe backoff on errors).
5. Add tests described above and run test suite.

## Constraints & Notes
- Follow repository constitution: Node.js 18, React functional components, HTTP short-polling <= 2s, in-memory storage only, strict validation.
- Keep changes minimal and fully typed; use `zod` for backend validation and TypeScript interfaces for shared types.
