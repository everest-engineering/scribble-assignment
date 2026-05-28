# Implementation Checklist: Room Setup & Lobby

**Purpose**: Verify and track implementation details for Scenario 1, ensuring all requirements, edge cases, and success criteria are met.
**Created**: 2026-05-28
**Feature**: [speckit.specify.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.specify.md)

## 1. Backend Code Verification

- [ ] CHK001 Enforce `hostId` field in `Room` and `RoomSnapshot` TypeScript interfaces ([backend/src/models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)).
- [ ] CHK002 Ensure `createRoom` automatically sets the creator's ID as the `hostId` in `roomStore.ts`.
- [ ] CHK003 Verify `toRoomSnapshot` correctly serializes `hostId` so it's sent to the client.
- [ ] CHK004 Implement 4-character uppercase alphanumeric Zod validation for room code parameter in `schemas.ts`.
- [ ] CHK005 Update the join endpoint (`/rooms/:code/join`) to sanitize room code inputs (trim and uppercase) and handle bad formatting with 400 Bad Request.

## 2. Frontend Interface and Logic

- [ ] CHK006 Add `hostId` to `RoomSnapshot` interface in the frontend API client.
- [ ] CHK007 Enforce client-side validation on room code in `JoinRoomPage.tsx` (trim, reject empty, match 4-character format, show feedback).
- [ ] CHK008 Set up automatic polling interval (2000ms) in `LobbyPage.tsx` using React hooks, ensuring the timer is cleared on unmount.
- [ ] CHK009 Update state logic to determine if the local user is the host: `isHost = room.hostId === participantId`.
- [ ] CHK010 Conditionally disable the "Start Game" button in `LobbyPage.tsx` if the player count is less than 2.
- [ ] CHK011 Show a clear "Waiting for host to start..." instruction to non-host participants.

## 3. Verification & Automated Tests

- [ ] CHK012 Verify that the backend test suite builds and executes successfully.
- [ ] CHK013 Add unit tests in `schemas.test.ts` to verify Zod validations on room codes.
- [ ] CHK014 Perform manual multiplayer test using two separate browser windows (Host vs Guest) and confirm:
  - Host has "Start Game" button disabled with only 1 player.
  - Joining player appears automatically on Host screen within 2 seconds.
  - "Start Game" button becomes active for the Host once the guest joins.
  - Guest screen does not show/allow starting the game.
