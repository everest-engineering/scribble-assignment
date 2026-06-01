# Tasks: Room Setup & Lobby

## Dependencies
None (first feature group).

## Task List
1. **Backend: Add hostId to Room model** — Add `hostId: string` to Room and RoomSnapshot interfaces in `game.ts`.
2. **Backend: Set hostId on room creation** — In `roomStore.ts`, set `hostId` to the creator's participant ID in `createRoom()`.
3. **Backend: Add name validation** — Trim names; reject empty/whitespace-only in both `createRoomSchema` and `joinRoomSchema`. Return 400 with message.
4. **Backend: Update tests** — Test hostId assignment, name validation.
5. **Frontend: Fix API base URL** — Change `/bug` to `/api` in `api.ts`.
6. **Frontend: Add hostId to room store** — Add `hostId` to store state and types.
7. **Frontend: Add lobby polling** — `fetchRoom` interval every 2s in LobbyPage, cleanup on unmount.
8. **Frontend: Host-only start button** — Show "Start Game" only for host; disable if <2 players with message.
9. **Frontend: Add name validation to forms** — Trim and reject empty on CreateRoomPage and JoinRoomPage.
10. **Frontend: Update tests** — API tests for new methods.
