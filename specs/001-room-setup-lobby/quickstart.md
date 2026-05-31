# Quickstart: Room Setup & Lobby

## Backend Changes

### 1. Update data models (`backend/src/models/game.ts`)
- Add `hostId: string` to `Room`
- Add `score: number` to `Participant` (default 0)
- Expand `RoomStatus` type to include `"playing"`, `"round_end"`, `"game_over"`

### 2. Update schemas (`backend/src/api/schemas.ts`)
- Make `playerName` required and add `.min(1).trim()` validation
- Add `startGameSchema` for the start endpoint

### 3. Update room store (`backend/src/services/roomStore.ts`)
- `createRoom()`: set `hostId` to creator's participant ID
- `joinRoom()`: validate room status is "lobby"; normalize code to uppercase
- `getRoom()`: make code lookup case-insensitive
- Add `startGame(code, participantId)`: validate host + ≥2 players, update status
- `toRoomSnapshot()`: include `hostId` and `isHost` flag

### 4. Update rooms router (`backend/src/api/rooms.ts`)
- Add `POST /rooms/:code/start` endpoint
- Update create/join to use validated schemas

## Frontend Changes

### 1. Update API service (`frontend/src/services/api.ts`)
- Add `startGame(code, participantId)` method
- Update types to include `hostId`, `isHost`, `score`

### 2. Update room store (`frontend/src/state/roomStore.ts`)
- Add `startGame()` action
- Update `RoomState` to include `isHost`

### 3. Update lobby page (`frontend/src/pages/LobbyPage.tsx`)
- Add `useEffect` with `setInterval` for 2s polling via `fetchRoom()`
- Show "Start Game" button only if `isHost` and participants ≥ 2
- Navigate to `/game` when room status changes to "playing"
- Clean up interval on unmount

### 4. Update create/join pages
- Add frontend validation for empty names before submit

## Testing

- Backend: Update `roomStore.test.ts` for new host and validation logic
- Backend: Add test for `startGame()` — host check, player count check
- Backend: Update `schemas.test.ts` for required name validation
- Frontend: Update `api.test.ts` for new `startGame` method
