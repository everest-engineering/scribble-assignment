# Tasks: Room Setup & Lobby

## Dependencies

None — first feature group.

## Ordered Tasks

1. [ ] Fix frontend API base URL (`/bug` → correct port)
2. [ ] Add `hostId` to backend Room model and set on `createRoom`
3. [ ] Extend `toRoomSnapshot` with `hostId` and computed `isHost`
4. [ ] Add Zod validation for non-empty room code param
5. [ ] Implement `startGame(code, participantId)` in roomStore (host check, ≥2 players)
6. [ ] Add `POST /rooms/:code/start` route
7. [ ] Extend frontend API types and `startGame` method
8. [ ] Add `startGame` to frontend roomStore
9. [ ] Create `useRoomPolling` hook (2000ms, cleanup on unmount)
10. [ ] Update LobbyPage: polling, host badge, host-only start button
11. [ ] Add client-side empty room code validation on JoinRoomPage
12. [ ] Add backend unit tests for hostId and startGame preconditions
13. [ ] Validate with two browser tabs
