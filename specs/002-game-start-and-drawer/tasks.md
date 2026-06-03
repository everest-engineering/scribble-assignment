# Tasks — Feature Group 2 (Game Start & Drawer Flow)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [ ] T1. Widen `RoomStatus`; add `drawerId`/`secretWord` to `Room` and
      `drawerId`/`word` to `RoomSnapshot` (`models/game.ts`). _(no deps)_
- [ ] T2. Add `selectWord` pure deterministic picker + unit test
      (`services/wordSelection.ts`, `wordSelection.test.ts`). _(no deps)_
- [ ] T3. Initialize new fields to `null` on create; set per-viewer `word` in
      `toRoomSnapshot`; add `startGame(code, participantId)` with host + `lobby`
      + ≥2-player checks (`services/roomStore.ts`). _(needs T1, T2)_
- [ ] T4. `playerName` trimmed + non-empty; add `startGameSchema`
      (`api/schemas.ts`); add `POST /:code/start` route with specific error codes
      (`api/rooms.ts`). _(needs T3)_
- [ ] T5. Unit tests: start assigns drawer + word, word hidden from guessers,
      preconditions (non-host 403 / <2 players) rejected; name schema rejects
      empty/whitespace (`services/roomStore.test.ts`, `api/schemas.test.ts`).
      _(needs T3, T4)_

## Frontend

- [ ] T6. Update `RoomSnapshot` type (status/drawerId/word); add
      `startGame(code, id)` (`services/api.ts`) and a `startGame` store action
      (`state/roomStore.ts`). _(needs T1)_
- [ ] T7. Client-side name trim + "Enter a player name." on create and join
      (`pages/CreateRoomPage.tsx`, `pages/JoinRoomPage.tsx`). _(needs T6)_
- [ ] T8. Lobby "Start Game" calls `startGame` then navigates; poll navigates
      guessers to `/game` when `status==="playing"` (`pages/LobbyPage.tsx`).
      _(needs T6)_
- [ ] T9. Game screen shows drawer name; shows the word only to the drawer
      (`pages/GamePage.tsx`). _(needs T6)_

## Validation

- [ ] T10. `npm run build` + `npm test` green on both sides.
- [ ] T11. Manual two-tab check of AC2/AC3/AC5/AC6; record result.

## Dependency order

T1 → T3; T2 → T3 → T4 → T5; T1 → T6 → {T7, T8, T9}; then T10 → T11.
