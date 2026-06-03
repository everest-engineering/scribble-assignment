# Plan 001 — Room Setup & Lobby

## State model

### Backend (`backend/src/models/game.ts`)
```
RoomStatus = "lobby" | "playing" | "results"

Participant { id, name, joinedAt, score }      // score added now, used in group 3
Room {
  code, status, hostId,
  participants: Participant[],
  round: Round | null,                          // null until group 2
  createdAt, updatedAt
}
```
Snapshot grows so the client can render host/role without leaking secrets:
```
ParticipantView { id, name, score, isHost, isDrawer }
ViewerView      { participantId, isHost, isDrawer, role }
RoomSnapshot {
  code, status, hostId,
  participants: ParticipantView[],
  drawerId, guesses, strokes, word,             // populated in later groups
  availableWords, roles,
  viewer: ViewerView | null
}
```

### Frontend (`frontend/src/state/roomStore.ts`)
- Existing `RoomState { room, participantId, error, isLoading }` is reused.
- Add a `startGame()` action calling `POST /rooms/:code/start`.
- Add a reusable polling hook `useRoomPolling(intervalMs)` that calls
  `store.fetchRoom()` on an interval and cleans up on unmount.

## Data flow

```
Create:  CreateRoomPage → store.createRoom → POST /rooms        → {participantId, snapshot(hostId=creator)}
Join:    JoinRoomPage   → store.joinRoom   → POST /rooms/:code/join
Lobby:   useRoomPolling(2000) → store.fetchRoom → GET /rooms/:code?participantId=…  (every 2s)
Start:   LobbyPage (host) → store.startGame → POST /rooms/:code/start → snapshot(status="playing")
```
The lobby reads `viewer.isHost` and `participants.length` to decide whether the
Start control is enabled. Authorization is re-checked server-side.

## File-level plan

Backend:
- `models/game.ts` — extend `RoomStatus`, `Participant.score`, `Room.hostId`,
  `Round` placeholder, richer `RoomSnapshot`/`ViewerView`/`ParticipantView`.
- `services/roomStore.ts` — set `hostId` + `score:0` on create; `score:0` on join;
  add `startRound()` guard (host, ≥2, status==lobby) — round internals stubbed
  here, fully filled in group 2; rewrite `toRoomSnapshot` to be viewer-aware.
- `api/schemas.ts` — `roomCodeParamsSchema` validates the 4-char alphabet;
  `startRoomSchema { participantId }`.
- `api/rooms.ts` — `POST /:code/start` handler; map store errors to status codes
  via `HttpError`.
- `api/router.ts` — surface the first Zod issue message instead of a generic
  "Invalid request payload".

Frontend:
- `services/api.ts` — **fix** base URL (`/bug` → root); add `startGame(code, participantId)`.
- `state/roomStore.ts` — `startGame()` action + `useRoomPolling` hook.
- `pages/LobbyPage.tsx` — auto-poll, host-aware Start button (disabled < 2),
  navigate to `/game` when status becomes `playing`.
- `pages/JoinRoomPage.tsx` — block empty code submission, show server message.

## Testing strategy

- Backend unit tests: `createRoom` sets `hostId`; `startRound` rejects non-host
  (403), <2 players (400), and double-start (409); two rooms stay isolated.
- Schema test: `roomCodeParamsSchema` rejects 3-char / illegal codes.
- Manual: two tabs, second player auto-appears within ~2s; non-host has no enabled
  Start; host start with 2 players transitions to the game.

## Risks / mitigations

- **Polling churn / stale closures:** centralise interval logic in
  `useRoomPolling` with proper cleanup to avoid leaks and double-intervals under
  React StrictMode.
- **Snapshot shape drift:** front and back share identical TypeScript shapes,
  edited together so the compiler catches mismatches.
- **Scope creep into group 2:** the start endpoint only *gates* here; drawer/word
  assignment is deliberately deferred to keep commits traceable.
