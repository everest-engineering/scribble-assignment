# Group 1 — Room Setup & Lobby Tasks

## Phase 1: Discovery & Artifacts
- [x] 1.1 Read and document starter code gaps (discovery notes)
- [x] 1.2 Create constitution
- [x] 1.3 Create spec, plan, tasks for Group 1

## Phase 2: Feature Group 1 — Room Setup & Lobby (Backend)
- [x] 2.1 Update `models/game.ts`: add `hostId` to Room, `score` to Participant
- [x] 2.2 Update `schemas.ts`: add name validation (trim, reject empty)
- [x] 2.3 Update `roomStore.ts`: set hostId on createRoom, add start game validation
- [x] 2.4 Update `rooms.ts`: add POST /:code/start endpoint (host-only, min 2 players)
- [x] 2.5 Update `toRoomSnapshot`: include hostId in snapshot

## Phase 3: Feature Group 1 — Room Setup & Lobby (Frontend)
- [x] 3.1 Update `api.ts`: add startGame method, update RoomSnapshot type
- [x] 3.2 Update `roomStore.ts`: add startGame action, auto-polling logic
- [x] 3.3 Update `LobbyPage.tsx`: auto-poll, host badge, start game button
