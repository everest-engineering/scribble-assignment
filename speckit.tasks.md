# Spec Kit Tasks: Room Setup & Lobby

## 1. Discovery & Analysis
- [x] TSK001 Inspect current backend routes (`rooms.ts`), services (`roomStore.ts`), and models (`game.ts`).
- [x] TSK002 Inspect current frontend routing, room state (`roomStore.ts`), and page screens (`LobbyPage.tsx` and `JoinRoomPage.tsx`).
- [x] TSK003 Document gaps and assumptions in `speckit.discovery.md`.

## 2. Specification & Design
- [x] TSK004 Create `speckit.specify.md` with prioritized user stories, acceptance criteria, and edge cases.
- [x] TSK005 Create `speckit.plan.md` outlining state model changes, API routes, and file updates.

## 3. Backend Implementation
- [ ] TSK006 Update the backend `Room` and `RoomSnapshot` interfaces in [backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts) to include `hostId`.
- [ ] TSK007 Update [backend/src/services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts) to set `hostId` when creating a room, and include it in `toRoomSnapshot()`.
- [ ] TSK008 Update [backend/src/api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts) to validate that room codes match a 4-character uppercase alphanumeric regex, and trim/reject empty values.
- [ ] TSK009 Update [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) to trim and uppercase code parameters, and handle schema validation errors gracefully.

## 4. Frontend Implementation
- [ ] TSK010 Add `hostId` to the frontend `RoomSnapshot` interface in [frontend/src/services/api.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/services/api.ts).
- [ ] TSK011 Implement Client-side validation in [frontend/src/pages/JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx) to trim and reject empty or invalid room code patterns, displaying clear error feedback before sending a request.
- [ ] TSK012 Implement polling (2000ms interval) in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to fetch the latest room status from the backend periodically.
- [ ] TSK013 Restrict "Start Game" button in [frontend/src/pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx):
  - Only show/enable if the user's `participantId` matches `room.hostId`.
  - Disable it if the player count is less than 2.
  - Show a message to non-hosts: "Waiting for host to start the game."

## 5. Verification & Testing
- [ ] TSK014 Verify backend tests pass via `npm run test` in the `backend/` directory.
- [ ] TSK015 Add unit tests in [backend/src/api/schemas.test.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.test.ts) for the new room code Zod validation.
- [ ] TSK016 Manually test the full flow in a browser with two separate windows/tabs to verify automatic lobby polling and host-only Start Game controls.
