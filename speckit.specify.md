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
- [ ] TSK009b Implement `POST /rooms/:code/start` in [backend/src/api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts) with host and participant-count validation.

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
nStart = isHost && room.participants.length >= 2;`
- Conditionally render/style or disable the "Start Game" button based on `isHost` and `canStart`. If not the host, disable the button and show a message "Waiting for host to start...".

#### 3. [pages/JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)
- Perform client-side check that code is not empty before sending API request. Reject with clear feedback.

---

## Verification & Testing Plan

### Automated Tests
- Run backend schema tests: `npm run test` (in `backend`).
- Add tests in `backend/src/api/schemas.test.ts` to verify code format validation.

### Manual Verification
- Start frontend and backend.
- Open Tab A: Create room with name "Alice". Verify Alice's screen shows the "Start Game" button, but it is disabled.
- Open Tab B: Join room code from Tab A with name "Bob".
- Verify Tab A (Alice) automatically updates to show Bob in the list within 2 seconds without clicking manual refresh.
- Verify Alice's "Start Game" button becomes enabled.
- Verify Bob's screen shows a disabled "Start Game" button or hides it, with message "Waiting for host to start...".
d MUST enforce that starting the game requires `participants.length >= 2` and that only the `hostId` can trigger the start.

## Success Criteria

### Measurable Outcomes
- **SC-001**: 100% of room creations assign the creator's ID as the `hostId`.
- **SC-002**: Automatic lobby refreshes occur within 2000ms ± 200ms of any participant joining.
- **SC-003**: A non-host participant is programmatically blocked from triggering the start game endpoint or navigating past lobby unilaterally.
- **SC-004**: Entering a blank room code returns immediate validation feedback.

## Assumptions
- **Host Persistence:** Once a host is assigned, they remain the host for the duration of that lobby session.
- **In-Memory Store:** The server retains the lobby state in memory; any server restart resets all active rooms.
