# Tasks 001 — Room Setup & Lobby

Ordered; later tasks depend on earlier ones.

## Backend
- [x] T1. Extend model types: `RoomStatus` union, `Participant.score`,
  `Room.hostId`, `Round` placeholder, viewer-aware `RoomSnapshot`
  (`hostId`, `ParticipantView`, `ViewerView`). *(depends on: none)*
- [x] T2. `roomStore.createRoom`: set `hostId` to creator id, `score: 0`,
  `round: null`. *(T1)*
- [x] T3. `roomStore.joinRoom`: initialise joiner `score: 0`. *(T1)*
- [x] T4. Rewrite `toRoomSnapshot` to be viewer-aware: compute `isHost`,
  `isDrawer`, `viewer`, and emit `hostId`. *(T1)*
- [x] T5. `roomStore.startRound(code, participantId)`: guard host (else 403),
  ≥2 players (else 400), status `lobby` (else 409); set status `playing`
  (round contents finished in group 2). *(T2,T4)*
- [x] T6. `schemas.ts`: 4-char alphabet validation for `roomCodeParamsSchema`;
  add `startRoomSchema { participantId }`. *(none)*
- [x] T7. `api/rooms.ts`: add `POST /:code/start`; translate not-found to 404
  `Room not found`. *(T5,T6)*
- [x] T8. `router.ts`: error handler returns the first Zod issue message. *(none)*

## Frontend
- [x] T9. **Fix** `api.ts` base URL defect (`/bug` → `http://localhost:3001`);
  add `startGame(code, participantId)`. *(none)*
- [x] T10. `roomStore`: add `startGame()` action and `useRoomPolling(intervalMs)`
  hook. *(T9)*
- [x] T11. `LobbyPage`: poll every 2000ms; host-aware Start button disabled until
  2 players; navigate to `/game` on `status==="playing"`. *(T10)*
- [x] T12. `JoinRoomPage`: block empty-code submit; show server error message. *(T9)*

## Tests / validation
- [x] T13. Backend tests: host set on create; `startRound` 403/400/409 paths;
  room isolation. *(T5)*
- [x] T14. Manual two-tab check: auto-appear within ~2s; non-host cannot start;
  host start with 2 players moves to game. *(T11)*
- [x] T15. `npm run build` + `npm test` green for backend and frontend. *(all)*
