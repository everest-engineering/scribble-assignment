# Plan: Room Setup & Lobby

## State Model Changes

Add to `Room` in `backend/src/models/game.ts`:
```typescript
hostId: string  // set to creator's participantId on createRoom
```

Add to `RoomSnapshot`:
```typescript
hostId: string
```

No status changes in this phase (remains `"lobby"` until Feature 002).

## Backend Changes

### `backend/src/models/game.ts`
- Add `hostId: string` to `Room` and `RoomSnapshot` interfaces

### `backend/src/services/roomStore.ts`
- In `createRoom`: set `room.hostId = participant.id`
- In `toRoomSnapshot`: include `hostId` in response

### `backend/src/api/schemas.ts`
- Add `ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/`
- Update `roomCodeParamsSchema` to validate 4-char alphanumeric after uppercasing
- Return 400 "Invalid room code format" for bad format

### `backend/src/api/rooms.ts`
- Validate code format before lookup on join and get routes

## Frontend Changes

### `frontend/src/services/api.ts`
- Fix default `API_BASE_URL` from `http://localhost:3001/bug` to `http://localhost:3001`
- Add `hostId` to `RoomSnapshot` type

### `frontend/src/hooks/useRoomPolling.ts` (new)
- Reusable hook: `useRoomPolling({ enabled, intervalMs })` calls `roomStore.fetchRoom()` on interval

### `frontend/src/pages/LobbyPage.tsx`
- Enable polling with `useRoomPolling({ enabled: true, intervalMs: 2000 })`
- Show "Host" badge when `participant.id === room.hostId`
- Show Start button only for host; disable if `< 2` participants
- Wire Start to `roomStore.startGame()` (stub until Phase 2, or implement endpoint)

### `frontend/src/state/roomStore.ts`
- Add `isHost()` getter based on `participantId === room.hostId`
- Add `startGame()` method calling API

## Data Flow

```
Create → POST /rooms → { hostId set, snapshot }
Join   → POST /rooms/:code/join → validate format → 404 if missing
Lobby  → GET /rooms/:code every 2s → update participant list
Start  → POST /rooms/:code/start (host, ≥2 players) → navigate /game
```

## Testing Strategy

- Unit: `roomStore.test.ts` — verify `hostId` equals creator on create
- Unit: `schemas.test.ts` — invalid code format throws 400
- Manual: two tabs, verify polling and host-only start gate

## Risks

- Start endpoint may land in Phase 2; Phase 1 can gate the button UI and call API when ready
