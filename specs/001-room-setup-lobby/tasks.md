# Tasks: Room Setup & Lobby (US1)

## Phase 1: Backend

- [X] T001 Expand `RoomStatus` union to `"lobby" | "playing" | "result"` in `backend/src/models/game.ts`
- [X] T002 Add `hostId` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [X] T003 Tighten `playerName` schema to `z.string().trim().min(1)` in `backend/src/api/schemas.ts`
- [X] T004 Remove `displayName()` fallback; set `hostId: participant.id` in `createRoom`; expose in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [X] T005 Add tests: `createRoom sets hostId`, schema rejects empty/whitespace, schema trims name in `backend/src/services/roomStore.test.ts`
- [X] T006 Run `cd backend && npm test` — expect green

## Phase 2: Frontend

- [X] T007 Add `hostId` to frontend `RoomSnapshot` type in `frontend/src/services/api.ts`
- [X] T008 Add client-side name guard in `CreateRoomPage.tsx` — `if (!playerName.trim()) { setError("Name cannot be empty"); return; }`
- [X] T009 Add client-side name guard in `JoinRoomPage.tsx` — same pattern
- [X] T010 Add lobby auto-polling — `setInterval(fetchRoom, 2000)` with `clearInterval` cleanup in `LobbyPage.tsx`
- [X] T011 Add host-only Start button — `isHost = room.hostId === participantId`; disabled when `participants.length < 2` in `LobbyPage.tsx`

## Validation

- [X] T012 Manual two-tab test: Tab 2 appears in Tab 1 within ~2s; Start button absent on Tab 2; empty name rejected
