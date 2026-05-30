# Tasks — Scenario 4: Result, Restart & Final Validation

Tasks are ordered. Complete each one before starting the next.
Each task is a single commit.

---

## Group AE — Backend Model

### AE1 — Add "finished" to RoomStatus
- File: `backend/src/models/game.ts`
- Change `RoomStatus` from `"lobby" | "playing"` to `"lobby" | "playing" | "finished"`.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

---

## Group AF — Backend Schemas

### AF1 — Add endRoundSchema
- File: `backend/src/api/schemas.ts`
- Add `endRoundSchema = z.object({ participantId: z.string().min(1) })` and export it.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### AF2 — Add restartGameSchema
- File: `backend/src/api/schemas.ts`
- Add `restartGameSchema = z.object({ participantId: z.string().min(1) })` and export it.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

---

## Group AG — Backend Service

### AG1 — Update toRoomSnapshot to expose currentWord in finished state
- File: `backend/src/services/roomStore.ts`
- Change the `currentWord` line in `toRoomSnapshot` so it returns `room.currentWord` when `room.status === "finished"` OR when `viewerParticipantId === room.drawerId`, and `null` otherwise.
- No other changes.
- Verify: `npm run build` in `backend/` passes.

### AG2 — Add endRound service function
- File: `backend/src/services/roomStore.ts`
- Add an exported `endRound(code: string, participantId: string)` function.
- The function must return, in order:
  1. `null` if the room does not exist.
  2. `"not-host"` if `participantId` does not match `room.hostId`.
  3. `"not-playing"` if `room.status !== "playing"`.
- On success: set `room.status = "finished"`, save, return `toRoomSnapshot(cloneRoom(room), participantId)`.
- Verify: `npm run build` in `backend/` passes.

### AG3 — Add restartGame service function
- File: `backend/src/services/roomStore.ts`
- Add an exported `restartGame(code: string, participantId: string)` function.
- The function must return, in order:
  1. `null` if the room does not exist.
  2. `"not-host"` if `participantId` does not match `room.hostId`.
  3. `"not-finished"` if `room.status !== "finished"`.
- On success: reset `room.status = "lobby"`, `room.drawerId = null`, `room.currentWord = null`, `room.guesses = []`, and set every participant's `score = 0`. Preserve all participant `id`, `name`, and `joinedAt` fields. Save and return the updated snapshot.
- Verify: `npm run build` in `backend/` passes.

---

## Group AH — Backend Endpoints

### AH1 — Add POST /rooms/:code/end route handler
- File: `backend/src/api/rooms.ts`
- Import `endRoundSchema` and `endRound` from their respective modules.
- Add `router.post("/:code/end", ...)` handler that:
  1. Parses params with `roomCodeParamsSchema`.
  2. Parses body with `endRoundSchema`.
  3. Calls `endRound(code.toUpperCase(), participantId)`.
  4. Returns 404 if result is `null`.
  5. Returns 403 with "Only the host can end the round" if result is `"not-host"`.
  6. Returns 422 with "Game is not in progress" if result is `"not-playing"`.
  7. Returns 200 with `{ room: result }` on success.
- Verify: `npm run build` in `backend/` passes.

### AH2 — Add POST /rooms/:code/restart route handler
- File: `backend/src/api/rooms.ts`
- Import `restartGameSchema` and `restartGame`.
- Add `router.post("/:code/restart", ...)` handler that:
  1. Parses params with `roomCodeParamsSchema`.
  2. Parses body with `restartGameSchema`.
  3. Calls `restartGame(code.toUpperCase(), participantId)`.
  4. Returns 404 if result is `null`.
  5. Returns 403 with "Only the host can restart the game" if result is `"not-host"`.
  6. Returns 422 with "Round has not finished yet" if result is `"not-finished"`.
  7. Returns 200 with `{ room: result }` on success.
- Verify: `npm run build` in `backend/` passes.

---

## Group AI — Backend Tests

### AI1 — Test toRoomSnapshot exposes currentWord to all in finished state
- File: `backend/src/services/roomStore.test.ts`
- Start a game, call `endRound`, then call `toRoomSnapshot` with a guesser's `participantId`. Assert `currentWord` is non-null.
- Run: `npm test` in `backend/` — all tests pass.

### AI2 — Test toRoomSnapshot still hides currentWord from non-drawer in playing state
- File: `backend/src/services/roomStore.test.ts`
- Start a game (status = "playing"). Call `toRoomSnapshot` with a guesser's id. Assert `currentWord` is `null`.
- Run: `npm test` in `backend/` — all tests pass.

### AI3 — Test endRound: room not found
- File: `backend/src/services/roomStore.test.ts`
- Call `endRound("XXXX", "any")`. Assert result is `null`.
- Run: `npm test` in `backend/` — all tests pass.

### AI4 — Test endRound: non-host is rejected
- File: `backend/src/services/roomStore.test.ts`
- Start a game. Call `endRound` with the guesser's id. Assert result is `"not-host"`.
- Run: `npm test` in `backend/` — all tests pass.

### AI5 — Test endRound: room not in playing state
- File: `backend/src/services/roomStore.test.ts`
- Create a room (status = "lobby"). Call `endRound` with the host id. Assert result is `"not-playing"`.
- Run: `npm test` in `backend/` — all tests pass.

### AI6 — Test endRound: success sets status to finished
- File: `backend/src/services/roomStore.test.ts`
- Start a game with two players. Call `endRound` with the host id. Assert the returned snapshot has `status === "finished"`.
- Run: `npm test` in `backend/` — all tests pass.

### AI7 — Test restartGame: room not found
- File: `backend/src/services/roomStore.test.ts`
- Call `restartGame("XXXX", "any")`. Assert result is `null`.
- Run: `npm test` in `backend/` — all tests pass.

### AI8 — Test restartGame: non-host is rejected
- File: `backend/src/services/roomStore.test.ts`
- End a game. Call `restartGame` with the guesser's id. Assert result is `"not-host"`.
- Run: `npm test` in `backend/` — all tests pass.

### AI9 — Test restartGame: room not in finished state
- File: `backend/src/services/roomStore.test.ts`
- Start a game (status = "playing"). Call `restartGame` with the host id. Assert result is `"not-finished"`.
- Run: `npm test` in `backend/` — all tests pass.

### AI10 — Test restartGame: success resets round fields
- File: `backend/src/services/roomStore.test.ts`
- End a game. Call `restartGame` with the host id. Assert the returned snapshot has `status === "lobby"`, `drawerId === null`, `currentWord === null`, and `guesses.length === 0`.
- Run: `npm test` in `backend/` — all tests pass.

### AI11 — Test restartGame: participant scores reset to zero
- File: `backend/src/services/roomStore.test.ts`
- Submit a correct guess (score = 100). End the game. Restart. Assert all participant scores in the returned snapshot are `0`.
- Run: `npm test` in `backend/` — all tests pass.

### AI12 — Test restartGame: participants are preserved
- File: `backend/src/services/roomStore.test.ts`
- Create a room with two players. End and restart. Assert the participant names and ids in the returned snapshot match those from before the restart.
- Run: `npm test` in `backend/` — all tests pass.

### AI13 — Test endRoundSchema: missing participantId is rejected
- File: `backend/src/api/schemas.test.ts`
- Assert `endRoundSchema.parse({})` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

### AI14 — Test restartGameSchema: missing participantId is rejected
- File: `backend/src/api/schemas.test.ts`
- Assert `restartGameSchema.parse({})` throws a ZodError.
- Run: `npm test` in `backend/` — all tests pass.

---

## Group AJ — Frontend Types and Client

### AJ1 — Add "finished" to status in RoomSnapshot interface
- File: `frontend/src/services/api.ts`
- Change `status: "lobby" | "playing"` to `status: "lobby" | "playing" | "finished"` in the `RoomSnapshot` interface.
- No other changes.
- Verify: `npm run build` in `frontend/` passes.

### AJ2 — Add endRound client method
- File: `frontend/src/services/api.ts`
- Add `endRound(code: string, participantId: string)` to the `api` object.
- It calls `POST /rooms/:code/end` with body `{ participantId }` and returns `{ room: RoomSnapshot }`.
- Verify: `npm run build` in `frontend/` passes.

### AJ3 — Add restartGame client method
- File: `frontend/src/services/api.ts`
- Add `restartGame(code: string, participantId: string)` to the `api` object.
- It calls `POST /rooms/:code/restart` with body `{ participantId }` and returns `{ room: RoomSnapshot }`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AK — Frontend Store

### AK1 — Add endRound action to RoomStore
- File: `frontend/src/state/roomStore.ts`
- Add `endRound()` method that reads `room.code` and `participantId` from state, calls `api.endRound` inside `withLoading`, and calls `setRoomSnapshot` on success.
- Verify: `npm run build` in `frontend/` passes.

### AK2 — Add restartGame action to RoomStore
- File: `frontend/src/state/roomStore.ts`
- Add `restartGame()` method following the same pattern as `endRound()`, calling `api.restartGame`.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AL — Frontend GamePage: Result View

### AL1 — Add status-navigation useEffect to GamePage
- File: `frontend/src/pages/GamePage.tsx`
- Add a `useEffect` that calls `navigate("/lobby", { replace: true })` when `room?.status === "lobby"`.
- Dependency array: `[room?.status, navigate]`.
- This handles the restart navigation for all players (host navigates explicitly; non-hosts are driven by this effect on the next poll).
- No rendering changes.
- Verify: `npm run build` in `frontend/` passes.

### AL2 — Add "End Round" button for host in playing state
- File: `frontend/src/pages/GamePage.tsx`
- In the playing layout, render an "End Round" button visible only when `isHost` is true.
- On click, call `roomStore.endRound()`. No explicit navigation — the status change causes the result view to render.
- Verify: `npm run build` in `frontend/` passes.

### AL3 — Add result view for finished state
- File: `frontend/src/pages/GamePage.tsx`
- When `room.status === "finished"`, render a result layout instead of the playing layout.
- The result layout must include:
  - The correct word (`room.currentWord`).
  - The final scoreboard (all participants with scores).
  - The complete guess history (all guesses in order).
- No "Play Again" button yet — added in AL4.
- Verify: `npm run build` in `frontend/` passes.

### AL4 — Add "Play Again" button for host on result view
- File: `frontend/src/pages/GamePage.tsx`
- On the result view, render a "Play Again" button visible only when `isHost` is true.
- Non-host players see a "Waiting for the host to restart..." message.
- On click: call `roomStore.restartGame()` and navigate to `/lobby` on success.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AM — Frontend LobbyPage

### AM1 — Add status-navigation useEffect to LobbyPage
- File: `frontend/src/pages/LobbyPage.tsx`
- Add a `useEffect` that calls `navigate("/game", { replace: true })` when `room?.status === "playing"`.
- Dependency array: `[room?.status, navigate]`.
- This auto-navigates non-host players to the game screen when the host starts a new game, and handles anyone arriving at the lobby mid-game.
- Verify: `npm run build` in `frontend/` passes.

---

## Group AN — Frontend Tests

### AN1 — Test api service: endRound sends correct request
- File: `frontend/src/services/api.test.ts`
- Assert `api.endRound("ABCD", "host-id")` makes a `POST` to `/rooms/ABCD/end` with `{ participantId: "host-id" }` in the body.
- Run: `npm test` in `frontend/` — all tests pass.

### AN2 — Test api service: restartGame sends correct request
- File: `frontend/src/services/api.test.ts`
- Assert `api.restartGame("ABCD", "host-id")` makes a `POST` to `/rooms/ABCD/restart` with `{ participantId: "host-id" }` in the body.
- Run: `npm test` in `frontend/` — all tests pass.

---

## Group AO — Manual Validation

Run these checks in two browser tabs after all tasks are complete.
No code changes — validation only.

### AO1 — Validate: only the host sees the End Round button
- Tab 1 (host, drawer): inspect the game screen during an active game.
- Tab 2 (guesser): inspect the game screen.
- Expected: Tab 1 shows "End Round" button. Tab 2 does not.

### AO2 — Validate: ending the round reveals the correct word to all players
- Tab 1 (host): click "End Round".
- Expected: both Tab 1 and Tab 2 transition to the result view within ~2 seconds. The correct word is visible on both screens.

### AO3 — Validate: result view shows final scores
- After AO2, inspect both screens.
- Expected: both tabs show the final score for every participant.

### AO4 — Validate: result view shows full guess history
- After AO2, inspect both screens.
- Expected: all guesses submitted during the round are visible in the result view on both tabs, in submission order, with correct/incorrect labels.

### AO5 — Validate: guesses cannot be submitted after the round ends
- After AO2 (status = "finished"), attempt to submit a guess directly via the API (e.g. curl or devtools).
- Expected: backend returns a 422 error. The guess form is not visible on the result view.

### AO6 — Validate: only the host sees Play Again
- After AO2, inspect both tabs on the result view.
- Expected: Tab 1 shows "Play Again". Tab 2 shows a waiting message.

### AO7 — Validate: host is navigated to lobby after restart
- Tab 1 (host): click "Play Again".
- Expected: Tab 1 navigates to the lobby screen immediately.

### AO8 — Validate: non-host players are navigated to lobby after restart
- After AO7, wait for Tab 2's next poll.
- Expected: Tab 2 navigates to the lobby within ~2 seconds without any manual action.

### AO9 — Validate: participants are preserved after restart
- After AO8, inspect both tabs on the lobby screen.
- Expected: both players appear in the participant list with their original names.

### AO10 — Validate: scores are reset to zero after restart
- After AO8, inspect the lobby or start a new game and check the scoreboard.
- Expected: all participant scores are 0.

### AO11 — Validate: round state is cleared after restart
- After AO8, inspect the room snapshot (via devtools or curl to GET /rooms/:code).
- Expected: `drawerId` is null, `currentWord` is null, `guesses` is an empty array, `status` is "lobby".

### AO12 — Validate: room code is unchanged after restart
- Compare the room code shown in Tab 1 lobby before and after restart.
- Expected: the same 4-character code is displayed.
