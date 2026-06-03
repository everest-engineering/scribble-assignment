# Tasks — Feature Group 1 (Room Setup & Lobby)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [ ] T1. Add `hostId` to `Room` and `RoomSnapshot` (`models/game.ts`). _(no deps)_
- [ ] T2. Set `hostId` in `createRoom`, include it in `toRoomSnapshot`, confirm
      `joinRoom` preserves it (`services/roomStore.ts`). _(needs T1)_
- [ ] T3. Tighten `roomCodeParamsSchema` to the 4-char code shape and return a
      specific "Room not found" message (`api/schemas.ts`, `api/rooms.ts`).
      _(no deps)_
- [ ] T4. Unit tests: `hostId` set on create and preserved on join; schema
      rejects malformed codes (`services/roomStore.test.ts`, `api/schemas.test.ts`).
      _(needs T2, T3)_

## Frontend

- [ ] T5. Add `hostId` to the `RoomSnapshot` type (`services/api.ts`). _(needs T1)_
- [ ] T6. Client-side empty/whitespace code rejection with "Enter a room code."
      and clear API error surfacing (`pages/JoinRoomPage.tsx`). _(needs T3)_
- [ ] T7. Automatic ~2s lobby polling with cleanup on unmount
      (`pages/LobbyPage.tsx`, `state/roomStore.ts`). _(needs T5)_
- [ ] T8. Host-only start gate: enable "Start Game" only for host with ≥2
      players; explanatory text otherwise (`pages/LobbyPage.tsx`). _(needs T5)_

## Validation

- [ ] T9. `npm run build` + `npm test` green on both sides.
- [ ] T10. Manual two-tab check of AC4 (isolation), AC5 (polling), AC6 (start
      gate); record result.

## Dependency order

T1 → T2 → T4; T3 → T4; T1 → T5 → {T7, T8}; T3 → T6; then T9 → T10.
