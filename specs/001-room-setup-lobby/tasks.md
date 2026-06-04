# Tasks: Room Setup & Lobby

## Prerequisites
- All tasks are ordered — complete each before starting the next
- Verify with two browser tabs after each backend+frontend task pair

---

### T1: Backend — extend models and validation

**Files**: `backend/src/models/game.ts`, `backend/src/api/schemas.ts`

- Add `isHost: boolean` to `Participant`
- Extend `RoomStatus` to `"lobby" | "playing"`
- Make `playerName` required (`.min(1)`) in both `createRoomSchema` and `joinRoomSchema`
- Add `startGameSchema` with `participantId: z.string()`
- Add `startGameParamsSchema` with `code: z.string()`

**Verify**: `npm run build` passes in backend

---

### T2: Backend — add host creation and start game logic

**Files**: `backend/src/services/roomStore.ts`

- In `createParticipant`, accept and set `isHost` parameter
- In `createRoom`, mark creator participant as `isHost: true`
- Add `startGame(code, participantId)` function that:
  - Finds room (404 if not found)
  - Checks participant is host (403 if not)
  - Checks ≥2 participants (400 if not)
  - Sets room status to `"playing"`
  - Saves and returns cloned room

**Verify**: `npm run build` passes

---

### T3: Backend — add routes and normalization

**Files**: `backend/src/api/rooms.ts`

- Normalize room code: trim + uppercase in join and get routes
- Validate player name is non-empty in create and join routes (return 400 with message if empty)
- Add `POST /:code/start` route with host + player validation

**Verify**: `npm run build` passes

---

### T4: Frontend — update type definitions and API

**Files**: `frontend/src/services/api.ts`

- Add `isHost` to `Participant` type
- Extend room status union to `"lobby" | "playing"`
- Add `startGame(code, participantId)` to api object
- Fix `API_BASE_URL` fallback from `/bug` to empty string

**Verify**: `npm run build` passes in frontend

---

### T5: Frontend — update store with start game and clear

**Files**: `frontend/src/state/roomStore.ts`

- Add `startGame()` method that calls api.startGame and updates room
- Add `clearSession()` method to reset state (for leave room)
- Compute `isHost` derived from participantId matching room's host participant

**Verify**: `npm run build` passes

---

### T6: Frontend — lobby polling, host controls, leave button

**Files**: `frontend/src/pages/LobbyPage.tsx`

- Add `useEffect` with `setInterval` polling `fetchRoom` every 2s on mount; clear on unmount
- Conditionally enable/disable "Start Game" based on `isHost` and participant count
- Wire "Start Game" to call `roomStore.startGame()` then navigate to `/game`
- Add "Leave Room" button that calls `roomStore.clearSession()` and navigates to `/`
- Show host badge (e.g. 👑 or "(Host)") next to host participant name

**Verify**: `npm run build` passes

---

### T7: Frontend — client-side validation on create/join forms

**Files**: `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`

- Trim player name before submitting; show error if empty after trim
- On JoinRoomPage, trim room code before submitting; show error if empty after trim

**Verify**: `npm run build` passes

---

### T8: Verify with two browser tabs

- Open Tab A, create room → confirm host badge visible
- Open Tab B, join with same code → Tab A auto-updates via polling (~2s)
- Tab A sees "Start Game" enabled (2 players); Tab B sees it disabled
- Tab B clicks Start → nothing happens (no error or redirected)
- Tab A clicks Start → both tabs navigate to game page
- Tab A clicks "Leave Room" → returns to home, store cleared
