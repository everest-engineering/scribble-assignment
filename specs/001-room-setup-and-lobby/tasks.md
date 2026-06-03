# Tasks — Feature Group 1 (Room Setup & Lobby)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [x] T1. Add `hostId` to `Room` and `RoomSnapshot` (`models/game.ts`). _(no deps)_
- [x] T2. Set `hostId` in `createRoom`, include it in `toRoomSnapshot`, confirm
      `joinRoom` preserves it (`services/roomStore.ts`). _(needs T1)_
- [x] T3. Tighten `roomCodeParamsSchema` to the 4-char code shape and return a
      specific "Room not found" message (`api/schemas.ts`, `api/rooms.ts`).
      _(no deps)_
- [x] T4. Unit tests: `hostId` set on create and preserved on join; schema
      rejects malformed codes (`services/roomStore.test.ts`, `api/schemas.test.ts`).
      _(needs T2, T3)_

## Frontend

- [x] T5. Add `hostId` to the `RoomSnapshot` type (`services/api.ts`). _(needs T1)_
- [x] T6. Client-side empty/whitespace code rejection with "Enter a room code."
      and clear API error surfacing (`pages/JoinRoomPage.tsx`). _(needs T3)_
- [x] T7. Automatic ~2s lobby polling with cleanup on unmount
      (`pages/LobbyPage.tsx`, `state/roomStore.ts`). _(needs T5)_
- [x] T8. Host-only start gate: enable "Start Game" only for host with ≥2
      players; explanatory text otherwise (`pages/LobbyPage.tsx`). _(needs T5)_

## Validation

- [x] T9. `npm run build` + `npm test` green on both sides.
- [x] T10. Manual two-tab check of AC4 (isolation), AC5 (polling), AC6 (start
      gate); record result.

## Dependency order

T1 → T2 → T4; T3 → T4; T1 → T5 → {T7, T8}; T3 → T6; then T9 → T10.

## Validation result

- T9: `npm run build` + `npm test` green on both sides (backend 8 tests, frontend 2).
- T10: backend ACs validated via API — AC1 host == creator, AC2 host preserved on
  join, AC3 empty/malformed code → 400 and unknown code → 404 "Room not found.",
  AC4 two rooms isolated. AC5 (auto-poll) and AC6 (host-only start with ≥2
  players) implemented in `LobbyPage` and verified in-browser.
