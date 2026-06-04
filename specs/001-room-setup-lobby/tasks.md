# Tasks: Room Setup & Lobby

## Phase 1: Backend Model & Store Changes
- [ ] T001 Update Room model: add hostId, expand status type, add score to Participant in backend/src/models/game.ts
- [ ] T002 Add hostId assignment, name trimming, name validation in backend/src/services/roomStore.ts
- [ ] T003 Add POST /rooms/:code/start endpoint with host/permission checks in backend/src/api/rooms.ts

## Phase 2: Frontend Changes
- [ ] T004 Update api.ts types and add startGame() in frontend/src/services/api.ts
- [ ] T005 Add startGame method to store in frontend/src/state/roomStore.ts
- [ ] T006 Add auto-polling (setInterval ~2s) and host-only Start button in frontend/src/pages/LobbyPage.tsx
- [ ] T007 Add name validation on CreateRoomPage.tsx and JoinRoomPage.tsx

## Phase 3: Validation
- [ ] T008 Test with two browser tabs: create, join, see participants update via polling, host starts game
- [ ] T009 Test edge cases: empty names, invalid codes, non-host tries to start
