# Implementation Plan: Room Setup & Lobby

## Findings

Starter provides create/join/fetch endpoints and manual lobby refresh. Missing: `hostId`, start endpoint, polling, join validation.

## State Model Changes

```typescript
interface Room {
  hostId: string;  // participantId of creator
  // existing fields unchanged for lobby
}
interface RoomSnapshot {
  hostId: string;
  isHost: boolean;  // computed: viewerParticipantId === hostId
}
```

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/rooms/:code/start` | Body: `{ participantId }`. Host only, ≥2 players. Returns updated snapshot. |

## File Changes

### Backend
- `models/game.ts` — add `hostId` to Room and RoomSnapshot
- `services/roomStore.ts` — set `hostId` on create; add `startGame(code, participantId)`
- `api/schemas.ts` — validate room code non-empty; add `startGameSchema`
- `api/rooms.ts` — add start route

### Frontend
- `services/api.ts` — fix API base URL; add `startGame`; extend types
- `hooks/useRoomPolling.ts` — new hook, 2000ms interval
- `pages/LobbyPage.tsx` — polling, host badge, conditional start button
- `pages/CreateRoomPage.tsx`, `JoinRoomPage.tsx` — client-side code validation
- `state/roomStore.ts` — add `startGame()` action

## Data Flow

1. Create room → backend sets `hostId = participantId` → frontend stores session → navigate lobby
2. Lobby mounts → `useRoomPolling(2000)` → repeated `GET /rooms/:code?participantId=...`
3. Host clicks Start → `POST /rooms/:code/start` → navigate `/game` (full game logic in phase 2)

## Testing Strategy

- Unit: `createRoom` sets hostId; `startGame` rejects non-host and <2 players
- Manual: two tabs, verify auto-join visibility and host-only start

## Risks

- Polling continues after unmount if cleanup missed → use `useEffect` return cleanup
