# Technical Plan: Room Setup, Lobby, & Game Start

**Feature Branch**: `002-game-start-drawer-flow`

**Created**: 2026-05-28

**Status**: Draft

## State Model Changes

### Backend Changes

1.  **Room Model (`Room` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Update `status: "lobby" | "game" | "results"`.
    - Add `drawerId: string | null` (designates who is drawing).
    - Add `secretWord: string | null` (designates secret word for the round).
2.  **Room Snapshot (`RoomSnapshot` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Update `status: "lobby" | "game" | "results"`.
    - Add `drawerId: string | null`.
    - Add optional/nullable `secretWord: string | null` (exposed ONLY to the drawer).

### Frontend Changes

- `RoomSnapshot` in `api.ts` updated to match backend definition.

---

## API Design & Data Flow

### 1. Start Game (`POST /rooms/:code/start`)
- Request body: `{ participantId: string }`
- Backend checks:
  - Caller must exist and be the room's host (`participantId === room.hostId`).
  - Room must have at least 2 participants.
- Action:
  - Transitions `status` to `"game"`.
  - Sets `drawerId` to the host's ID.
  - Deterministically selects secret word: `STARTER_WORDS[character_sum(code) % STARTER_WORDS.length]`.
- Response: returns room snapshot.

### 2. Fetch Room Snapshot (`GET /rooms/:code?participantId=...`)
- Backend `toRoomSnapshot` masks `secretWord` unless `participantId === room.drawerId`.

---

## File-by-File Changes

### Backend

#### 1. [models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)
- Update `RoomStatus` to `"lobby" | "game" | "results"`.
- Update `Room` and `RoomSnapshot` interfaces to include `drawerId: string | null` and `secretWord: string | null`.

#### 2. [services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts)
- Update `createRoom()` to initialize `drawerId: null` and `secretWord: null`.
- Update `toRoomSnapshot()` to hide `secretWord` if the requesting `viewerParticipantId !== room.drawerId`.

#### 3. [api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts)
- Add `startGameSchema` validating `{ participantId: z.string() }`.

#### 4. [api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts)
- Add `POST /rooms/:code/start` route handler.

### Frontend

#### 1. [services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts)
- Update `RoomSnapshot` interface.
- Add `api.startGame()` method.

#### 2. [state/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts)
- Add `startGame` action.

#### 3. [pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- Call `roomStore.startGame()` on Start button click.
- Add redirect `useEffect` navigating to `/game` if `room.status === "game"`.

#### 4. [pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx)
- Add 2s polling hook calling `roomStore.fetchRoom()`.
- Add redirect `useEffect` navigating to `/lobby` if `room.status === "lobby"`.
- Identify drawer and display secret word for drawer; show guesser view otherwise.

---

## Verification & Testing Plan

### Automated Tests
- Run `npm run test` in backend.
- Add a test in `roomStore.test.ts` to verify that `toRoomSnapshot` masks `secretWord` for guessers and reveals it to the drawer.

### Manual Verification
- Open two tabs.
- Let Host Alice start the game. Verify Bob is redirected automatically.
- Verify role assignments and word visibility match their status.
