# Tasks — Scenario 1: Room Setup & Lobby

Tasks are ordered. Complete each one before starting the next.
Each task is a single commit.

---

## Group A — Backend Model

### A1 — Expand RoomStatus type
- File: `backend/src/models/game.ts`
- Change `RoomStatus` from the literal `"lobby"` to `"lobby" | "playing"`.
- No other changes.
- Verify: `npm run build` in `backend/` passes with no type errors.

### A2 — Add hostId to Room interface
- File: `backend/src/models/game.ts`
- Add `hostId: string` to the `Room` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes. Existing `RoomSnapshot` and service files will show type errors — those are fixed in A3 and A4.

### A3 — Add hostId to RoomSnapshot interface
- File: `backend/src/models/game.ts`
- Add `hostId: string` to the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

---

## Group B — Backend Validation

### B1 — Tighten playerName in createRoomSchema
- File: `backend/src/api/schemas.ts`
- Change `playerName` from `z.string().optional()` to required, trimmed, and non-empty (min 1 character after trim).
- No other schema changes in this task.
- Verify: `npm run build` in `backend/` passes.

### B2 — Tighten playerName in joinRoomSchema
- File: `backend/src/api/schemas.ts`
- Apply the same validation as B1 to `joinRoomSchema.playerName`.
- No other schema changes in this task.
- Verify: `npm run build` in `backend/` passes.

### B3 — Add startGameSchema
- File: `backend/src/api/schemas.ts`
- Add `startGameSchema = z.object({ participantId: z.string().min(1) })`.
- Export it alongside the existing schemas.
- Verify: `npm run build` in `backend/` passes.

---

## Group C — Backend Service

### C1 — Set hostId when creating a room
- File: `backend/src/services/roomStore.ts`
- In `createRoom`, assign `room.hostId = participant.id` before storing.
- Verify: `npm run build` in `backend/` passes.

### C2 — Include hostId in toRoomSnapshot
- File: `backend/src/services/roomStore.ts`
- In `toRoomSnapshot`, add `hostId: room.hostId` to the returned snapshot object.
- Verify: `npm run build` in `backend/` passes.

### C3 — Add startGame function to room service
- File: `backend/src/services/roomStore.ts`
- Add an exported `startGame(code: string, participantId: string)` function.
- The function must:
  1. Return `null` if the room does not exist.
  2. Return `"not-host"` if `participantId` does not match `room.hostId`.
  3. Return `"not-enough-players"` if `room.participants.length < 2`.
  4. Set `room.status = "playing"`, save, and return the updated room snapshot.
- Verify: `npm run build` in `backend/` passes.

---

## Group D — Backend Endpoint

### D1 — Add POST /rooms/:code/start route handler
- File: `backend/src/api/rooms.ts`
- Import `startGameSchema` and `startGame` from their respective modules.
- Add `router.post("/:code/start", ...)` handler that:
  1. Parses params with `roomCodeParamsSchema`.
  2. Parses body with `startGameSchema`.
  3. Calls `startGame(code, participantId)`.
  4. Returns 404 if result is `null`.
  5. Returns 403 with message "Only the host can start the game" if result is `"not-host"`.
  6. Returns 422 with message "Need at least 2 players to start" if result is `"not-enough-players"`.
  7. Returns 200 with `{ room: snapshot }` on success.
- Verify: `npm run build` in `backend/` passes.

---

## Group E — Backend Tests

### E1 — Test createRoomSchema rejects empty and whitespace-only names
- File: `backend/src/api/schemas.test.ts`
- Add test cases: empty string, whitespace-only string, valid name.
- Run: `npm test` in `backend/` — all tests pass.

### E2 — Test joinRoomSchema rejects empty and whitespace-only names
- File: `backend/src/api/schemas.test.ts`
- Add test cases matching E1 for `joinRoomSchema`.
- Run: `npm test` in `backend/` — all tests pass.

### E3 — Test createRoom sets hostId to first participant
- File: `backend/src/services/roomStore.test.ts`
- Add a test that calls `createRoom` and asserts `result.room.hostId === result.participantId`.
- Run: `npm test` in `backend/` — all passes.

### E4 — Test toRoomSnapshot includes hostId
- File: `backend/src/services/roomStore.test.ts`
- Add a test that creates a room, calls `toRoomSnapshot`, and asserts `snapshot.hostId` matches the creator's id.
- Run: `npm test` in `backend/` — all passes.

### E5 — Test startGame: room not found returns null
- File: `backend/src/services/roomStore.test.ts`
- Add a test calling `startGame("XXXX", "any-id")` and asserting the result is `null`.
- Run: `npm test` in `backend/` — all passes.

### E6 — Test startGame: non-host participant is rejected
- File: `backend/src/services/roomStore.test.ts`
- Create a room, call `startGame` with a different `participantId`, assert result is `"not-host"`.
- Run: `npm test` in `backend/` — all passes.

### E7 — Test startGame: fewer than 2 participants is rejected
- File: `backend/src/services/roomStore.test.ts`
- Create a room (1 participant), call `startGame` with the host id, assert result is `"not-enough-players"`.
- Run: `npm test` in `backend/` — all passes.

### E8 — Test startGame: succeeds with host and 2+ participants
- File: `backend/src/services/roomStore.test.ts`
- Create a room, join a second player, call `startGame` with the host id, assert returned snapshot has `status: "playing"`.
- Run: `npm test` in `backend/` — all passes.

---

## Group F — Frontend Types

### F1 — Add hostId and expand status in RoomSnapshot interface
- File: `frontend/src/services/api.ts`
- Add `hostId: string` to the `RoomSnapshot` interface.
- Change `status: "lobby"` to `status: "lobby" | "playing"`.
- No other changes.
- Verify: `npm run build` in `frontend/` passes (type errors in pages are expected until F2–F5 are done).

### F2 — Add startGame client method
- File: `frontend/src/services/api.ts`
- Add `startGame(code: string, participantId: string)` to the `api` object.
- It calls `POST /rooms/:code/start` with body `{ participantId }` and returns `{ room: RoomSnapshot }`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group G — Frontend Validation

### G1 — Add name validation to CreateRoomPage
- File: `frontend/src/pages/CreateRoomPage.tsx`
- Before calling the store, trim the player name.
- If the trimmed value is empty, set an inline error ("Player name is required") and return without calling the API.
- Verify: `npm run build` in `frontend/` passes.

### G2 — Add name validation to JoinRoomPage
- File: `frontend/src/pages/JoinRoomPage.tsx`
- Before calling the store, trim the player name.
- If trimmed name is empty, set an inline error ("Player name is required") and return.
- Verify: `npm run build` in `frontend/` passes.

### G3 — Add room code validation to JoinRoomPage
- File: `frontend/src/pages/JoinRoomPage.tsx`
- Before calling the store, trim the room code.
- If trimmed code is empty, set an inline error ("Room code is required") and return.
- Both name and code are checked; both errors can show independently.
- Verify: `npm run build` in `frontend/` passes.

---

## Group H — Frontend Store

### H1 — Add startGame action to RoomStore
- File: `frontend/src/state/roomStore.ts`
- Add a `startGame()` method to the `RoomStore` class.
- It reads `this.state.room.code` and `this.state.participantId` from current state.
- It calls `api.startGame(code, participantId)` inside `withLoading`.
- On success, calls `this.setRoomSnapshot(response.room)`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group I — Frontend Lobby

### I1 — Replace manual refresh with polling
- File: `frontend/src/pages/LobbyPage.tsx`
- Remove the `handleRefresh` function and the manual "Refresh Room" button.
- Add a `useEffect` that starts a `setInterval` calling `roomStore.fetchRoom()` every 2000ms.
- The cleanup function must call `clearInterval` to stop polling on unmount.
- Verify: `npm run build` in `frontend/` passes.

### I2 — Derive isHost and add host badge to participant list
- File: `frontend/src/pages/LobbyPage.tsx`
- Derive `isHost = room.hostId === participantId` using state from the store.
- In the participant list, render a "Host" badge next to the participant whose id matches `room.hostId`.
- Verify: `npm run build` in `frontend/` passes.

### I3 — Show Start Game button only to host
- File: `frontend/src/pages/LobbyPage.tsx`
- Render the "Start Game" button only when `isHost` is true.
- Non-host players see a static "Waiting for the host to start..." message instead.
- Verify: `npm run build` in `frontend/` passes.

### I4 — Disable Start Game when fewer than 2 players
- File: `frontend/src/pages/LobbyPage.tsx`
- Compute `canStart = room.participants.length >= 2`.
- Disable the button when `!canStart`.
- Show a reason below the button ("Need at least 2 players") when the button is disabled.
- Verify: `npm run build` in `frontend/` passes.

### I5 — Wire Start Game button to store action and navigate
- File: `frontend/src/pages/LobbyPage.tsx`
- On click, call `roomStore.startGame()`.
- On success, navigate to `/game`.
- On error, display the error message from the store (403 or 422 surface naturally via the existing error field).
- Verify: `npm run build` in `frontend/` passes.

---

## Group J — Frontend Tests

### J1 — Test api service: startGame sends correct request
- File: `frontend/src/services/api.test.ts`
- Add a test asserting `api.startGame` makes a `POST` to `/rooms/:code/start` with the correct body.
- Run: `npm test` in `frontend/` — all tests pass.

---

## Group K — Manual Validation

Run these checks in two browser tabs after all tasks are complete.
No code changes — validation only.

### K1 — Validate: empty name is rejected on Create Room
- Open Create Room, submit with empty name.
- Expected: inline error appears, no network request made.

### K2 — Validate: whitespace-only name is rejected on Create Room
- Open Create Room, submit with spaces only.
- Expected: inline error appears, no network request made.

### K3 — Validate: empty name is rejected on Join Room
- Open Join Room, submit with empty name and a valid code.
- Expected: inline error appears, no network request made.

### K4 — Validate: empty code is rejected on Join Room
- Open Join Room, submit with a valid name and empty code.
- Expected: inline error appears, no network request made.

### K5 — Validate: unknown room code shows error
- Open Join Room, submit with a valid name and a code that does not exist ("ZZZZ").
- Expected: error message shown, player stays on join screen.

### K6 — Validate: lobby polls automatically
- Tab 1: create a room, land in lobby.
- Tab 2: join the same room.
- Expected: Tab 1 participant list updates within ~2 seconds without any manual action.

### K7 — Validate: non-host does not see Start Game
- Tab 1: create a room (host). Tab 2: join the room.
- In Tab 2, confirm "Start Game" button is not visible.
- Expected: Tab 2 shows "Waiting for the host to start..." message.

### K8 — Validate: host cannot start with 1 player
- Tab 1: create a room, stay in lobby alone.
- Expected: "Start Game" button is disabled and shows the minimum player message.

### K9 — Validate: host can start with 2 players and navigates to game
- Tab 1: create a room. Tab 2: join the room.
- In Tab 1, click "Start Game".
- Expected: Tab 1 navigates to `/game`. No errors shown.

### K10 — Validate: rooms are isolated
- Create Room A in Tab 1. Create Room B in Tab 2.
- Join Room A in a third tab.
- Expected: Room B participant list is unaffected.
