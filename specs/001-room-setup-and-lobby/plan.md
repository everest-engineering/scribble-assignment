# Plan — Feature Group 1 (Room Setup & Lobby)

Traces the spec to concrete state, data flow, and file edits. Extends the
starter; no new dependencies.

## State model changes

Backend (`backend/src/models/game.ts`)
- `Room` gains `hostId: string` — the creator's participant id.
- `RoomSnapshot` gains `hostId: string` so clients can identify the host.

The in-memory store already holds one `Map<code, Room>`; isolation is inherent to
keying by code. No new collections are needed.

Frontend (`frontend/src/services/api.ts`)
- Mirror `hostId` on the `RoomSnapshot` type so the store and pages can read it.

No new frontend store fields are required for Group 1; host status is derived as
`room.hostId === participantId`.

## Data flow

1. Create: `POST /rooms` → `createRoom` sets `hostId = participant.id` →
   snapshot includes `hostId`. Client stores `participantId` + snapshot.
2. Join: `POST /rooms/:code/join` validates the code, appends a participant,
   leaves `hostId` unchanged, returns the snapshot.
3. Lobby poll: a `useEffect` interval (~2000ms) calls `roomStore.fetchRoom()`,
   which GETs `/rooms/:code` and replaces the snapshot; subscribers re-render.
   The interval is cleared on unmount.
4. Start gate: `LobbyPage` computes `isHost` and `enoughPlayers` from the
   snapshot to enable/disable "Start Game".

## File-level changes

Backend
- `models/game.ts` — add `hostId` to `Room` and `RoomSnapshot`.
- `services/roomStore.ts` — set `hostId` in `createRoom`; include `hostId` in
  `toRoomSnapshot`; confirm `joinRoom` preserves it.
- `api/schemas.ts` — tighten `roomCodeParamsSchema` to the 4-char code shape so
  malformed codes are rejected with a clear 4xx.
- `api/rooms.ts` — return a specific "Room not found" message on unknown code.
- `services/roomStore.test.ts` — assert `hostId` is set on create and preserved
  on join.

Frontend
- `services/api.ts` — add `hostId` to `RoomSnapshot`.
- `pages/JoinRoomPage.tsx` — reject empty/whitespace code client-side with
  "Enter a room code." before calling the API; surface API errors.
- `pages/LobbyPage.tsx` — add ~2s polling effect; derive `isHost` /
  `enoughPlayers`; disable "Start Game" accordingly with explanatory text.

## Testing strategy

- Unit: `roomStore` host assignment and preservation; code-shape schema rejects
  bad codes.
- Manual (two tabs): AC5 polling visibility and AC6 start-gate behavior; AC4
  isolation by creating two rooms.

## Risks / mitigations

- Polling leak if the interval is not cleared → clear in the effect cleanup.
- Over-tightening the code schema could reject valid codes → match the exact
  generator alphabet/length used in `roomStore.generateCode`.
