# Tasks: Room Setup & Lobby

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Parent tasks**: [001-scribble-game/tasks.md](../001-scribble-game/tasks.md) (Setup + Foundational phases)

**Prerequisites**: Phase 2 (Foundational) in parent feature complete.

## Phase 3: User Story 1 — Room Setup & Lobby (P1) 🎯 MVP

**Goal**: Room setup, name trimming, host tracking, lobby polling, host controls.

**Independent Test**: Connect 2 players in lobby; verify host badge, polling, host-only Start Game.

### Implementation

- [x] T005 [P] [US1] Enforce playerName trimming and non-empty schema validations in backend/src/api/schemas.ts
- [x] T006 [US1] Assign hostId and initialize player score to 0 on room creation in backend/src/services/roomStore.ts
- [x] T007 [US1] Trim playerName and initialize player score to 0 on join in backend/src/services/roomStore.ts
- [x] T008 [US1] Validate room codes (upper-case inputs) and return clear 404 errors for non-existent rooms in backend/src/api/rooms.ts
- [x] T009 [US1] Add test cases for creation/join validation and hostId assignment in backend/src/services/roomStore.test.ts
- [x] T010 [US1] Implement 2s automatic polling using setInterval in frontend/src/pages/LobbyPage.tsx
- [x] T011 [US1] Restrict Start Game button to host and enable when 2+ players are present in frontend/src/pages/LobbyPage.tsx
- [x] T012 [US1] Add crown Host badge to player list in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: Scenario 1 fully functional and testable independently.
