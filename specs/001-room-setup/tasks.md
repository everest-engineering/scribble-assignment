# Tasks: Room Setup & Lobby (Scenario 1)

## Dependencies

```
T1 (model) → T2 (createRoom host) → T3 (startGame) → T4 (routes)
T5 (API fix) → T6 (frontend types) → T7 (lobby UI)
T4 + T7 → T8 (validation)
```

## Task List

### T1: Extend backend model
- [ ] Add `hostId: string` to `Room` interface
- [ ] Extend `RoomStatus` to `"lobby" | "playing" | "result"`
- [ ] Add `hostId` to `RoomSnapshot` interface
- **Files:** `backend/src/models/game.ts`

### T2: Set host on room creation
- [ ] In `createRoom`, set `hostId = participant.id`
- [ ] Include `hostId` in `toRoomSnapshot` output
- **Files:** `backend/src/services/roomStore.ts`

### T3: Implement startGame service
- [ ] Add `startGame(code, participantId)` function
- [ ] Validate: room exists, caller is host, status is "lobby", ≥2 participants
- [ ] Set status to "playing", update timestamp
- [ ] Return updated room or throw appropriate errors
- **Files:** `backend/src/services/roomStore.ts`

### T4: Add backend routes and validation
- [ ] Add room code format validation (4 alphanumeric chars) in schemas
- [ ] Add `startGameSchema` with participantId
- [ ] Add `POST /:code/start` route
- [ ] Improve join 404 message to "Room not found"
- **Files:** `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`

### T5: Fix frontend API base URL
- [ ] Change default from `http://localhost:3001/bug` to `http://localhost:3001`
- **Files:** `frontend/src/services/api.ts`

### T6: Extend frontend API and store
- [ ] Add `hostId` and extended status to RoomSnapshot type
- [ ] Add `startRoom(code, participantId)` API method
- [ ] Add `startGame()` to RoomStore
- **Files:** `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

### T7: Lobby polling and host-only start UI
- [ ] Add useEffect with 2000ms setInterval for fetchRoom
- [ ] Clear interval on unmount
- [ ] Show host badge next to host participant
- [ ] Show Start Game button only to host; disable if <2 players
- [ ] Non-host sees "Waiting for the host to start the game"
- [ ] Auto-navigate to /game when room.status becomes "playing"
- **Files:** `frontend/src/pages/LobbyPage.tsx`

### T8: Join form validation
- [ ] Reject empty/whitespace room code with "Room code is required"
- [ ] Reject invalid format with clear message
- **Files:** `frontend/src/pages/JoinRoomPage.tsx`

### T9: Backend tests
- [ ] Test hostId set on createRoom
- [ ] Test startGame rejects non-host
- [ ] Test startGame rejects when <2 players
- [ ] Test startGame succeeds with host + 2 players
- **Files:** `backend/src/services/roomStore.test.ts`

### T10: Manual validation
- [ ] Two-tab lobby flow per spec acceptance criteria
- [ ] Invalid code rejection
- [ ] Multi-room isolation spot check
