---

description: "Task list for room setup and lobby readiness"

# Tasks: Room Setup and Lobby Readiness

**Input**: Design documents from `/specs/001-room-setup-lobby/`

## Phase 1: Backend — Host tracking and validation

- [ ] T001 Extend Participant model with `isHost: boolean` and `score: number` in `backend/src/models/game.ts`
- [ ] T002 Add `createRoomSchema` and `joinRoomSchema` with `z.string().trim().min(1)` in `backend/src/api/schemas.ts`
- [ ] T003 Add `roomCodeParamsSchema` with `z.string().min(1)` in `backend/src/api/schemas.ts`
- [ ] T004 Update `createRoom()` in `backend/src/services/roomStore.ts` to mark creator as host and return `participantId`
- [ ] T005 Update `joinRoom()` in `backend/src/services/roomStore.ts` to normalize room code to uppercase, return null for unknown codes, return `participantId`
- [ ] T006 Add `startRoom()` in `backend/src/services/roomStore.ts` with host-only check and 2-player minimum
- [ ] T006b Add `toRoomSnapshot()` in `backend/src/services/roomStore.ts` for polling-safe room responses
- [ ] T007 Wire `POST /:code/start` route in `backend/src/api/rooms.ts` with schema validation
- [ ] T008 Add `HttpError` class in `backend/src/api/schemas.ts` for typed error responses

## Phase 2: Frontend — API, polling, and session

- [ ] T009 Add `startGame()` method to API service in `frontend/src/services/api.ts`
- [ ] T010 Add polling (2s interval) with cleanup to room store in `frontend/src/state/roomStore.ts`
- [ ] T011 Add sessionStorage persistence for `roomCode`, `participantId`, `playerName` in `frontend/src/state/roomStore.ts`

## Phase 3: Frontend — UI validation and lobby

- [ ] T012 Add client-side trim + empty-name rejection to `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T013 Add client-side trim + empty-name and empty-code rejection to `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T014 Add host badge and start button gating to `frontend/src/pages/LobbyPage.tsx`
- [ ] T015 Wire lobby polling and host-only start flow in `frontend/src/pages/LobbyPage.tsx`

## Phase 4: Validation

- [ ] T016 Manual two-tab validation: create, join, polling, host badge, start gating, error messages
- [ ] T017 Run backend and frontend test suites
