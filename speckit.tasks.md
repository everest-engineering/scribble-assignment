# Spec Kit Tasks: Room Setup, Lobby, & Game Start

## 1. Discovery & Analysis
- [x] TSK001 Inspect current backend routes (`rooms.ts`), services (`roomStore.ts`), and models (`game.ts`).
- [x] TSK002 Inspect current frontend routing, room state (`roomStore.ts`), and page screens (`LobbyPage.tsx` and `JoinRoomPage.tsx`).
- [x] TSK003 Document gaps and assumptions in `speckit.discovery.md`.

## 2. Specification & Design
- [x] TSK004 Create `speckit.specify.md` with prioritized user stories, acceptance criteria, and edge cases.
- [x] TSK005 Create `speckit.plan.md` outlining state model changes, API routes, and file updates.

## 3. Backend Implementation
### Scenario 1 — Room Setup & Lobby
- [x] TSK006 Update the backend `Room` and `RoomSnapshot` interfaces in [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) to include `hostId`.
- [x] TSK007 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to set `hostId` when creating a room, and include it in `toRoomSnapshot()`.
- [x] TSK008 Update [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) to validate that room codes match a 4-character uppercase alphanumeric regex, and trim/reject empty values.
- [x] TSK009 Update [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) to trim and uppercase code parameters, and handle schema validation errors gracefully.

### Scenario 2 — Game Start & Drawer Flow
- [ ] TSK017 Update `RoomStatus` enum options and add `drawerId` & `secretWord` properties in [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts).
- [ ] TSK018 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to initialize `drawerId` and `secretWord` as `null` on room creation.
- [ ] TSK019 Update `toRoomSnapshot()` in [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to hide/nullify `secretWord` unless the viewer is the drawer.
- [ ] TSK020 Define Zod validation schemas for starting a game in [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts).
- [ ] TSK021 Create route handler for `POST /rooms/:code/start` in [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts). Ensure it verifies host permissions, checks player counts, updates status to `"game"`, sets `drawerId` to host, and deterministically chooses a secret word.

## 4. Frontend Implementation
### Scenario 1 — Room Setup & Lobby
- [x] TSK010 Add `hostId` to the frontend `RoomSnapshot` interface in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts).
- [x] TSK011 Implement Client-side validation in [frontend/src/pages/JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx) to trim and reject empty or invalid room code patterns, displaying clear error feedback before sending a request.
- [x] TSK012 Implement polling (2000ms interval) in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to fetch the latest room status from the backend periodically.
- [x] TSK013 Restrict "Start Game" button in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx):
  - Only show/enable if the user's `participantId` matches `room.hostId`.
  - Disable it if the player count is less than 2.
  - Show a message to non-hosts: "Waiting for host to start the game."

### Scenario 2 — Game Start & Drawer Flow
- [ ] TSK022 Add `drawerId` and `secretWord` to `RoomSnapshot` interface in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts) and add `api.startGame()` POST action.
- [ ] TSK023 Implement `startGame` method in `roomStore.ts` to trigger starting the game via API.
- [ ] TSK024 Update [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to:
  - Invoke `roomStore.startGame()` when host clicks the start button.
  - Redirect all participants to `/game` using an active `useEffect` when `room.status === "game"`.
- [ ] TSK025 Implement 2-second polling in [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) to get updates on the active game, and redirect back to `/lobby` if status transitions back to lobby.
- [ ] TSK026 Update [frontend/src/pages/GamePage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/GamePage.tsx) to visually indicate the current drawer, show the drawer the secret word, and show guessers that they are a guesser with the secret word hidden.

## 5. Verification & Testing
- [x] TSK014 Verify backend tests pass via `npm run test` in the `backend/` directory.
- [x] TSK015 Add unit tests in [backend/src/api/schemas.test.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.test.ts) for the new room code Zod validation.
- [x] TSK016 Manually test the full flow in a browser with two separate windows/tabs to verify automatic lobby polling and host-only Start Game controls.
- [ ] TSK027 Add unit test in `roomStore.test.ts` to verify that `toRoomSnapshot()` masks `secretWord` for guessers and returns it for the drawer.
- [ ] TSK028 Manually verify game start transition and role visibility using multiple tabs.
