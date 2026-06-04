# Tasks: Game Start & Drawer Flow

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Parent tasks**: [001-scribble-game/tasks.md](../001-scribble-game/tasks.md)

**Prerequisites**: [001-room-setup-lobby/tasks.md](../001-room-setup-lobby/tasks.md) complete.

## Phase 4: User Story 2 — Game Start & Drawer Flow (P2)

**Goal**: Start game endpoint, drawer assignment, deterministic word, word masking, auto-redirect.

**Independent Test**: Host starts; both tabs on `/game`; secret word visible only to drawer.

### Implementation

- [x] T013 [US2] Implement startGame logic (assign drawer, select word deterministically) in backend/src/services/roomStore.ts
- [x] T014 [US2] Mount POST /rooms/:code/start route in backend/src/api/rooms.ts
- [x] T015 [US2] Add test cases for startGame validation and word masking in backend/src/services/roomStore.test.ts
- [x] T016 [US2] Add startGame method to frontend/src/services/api.ts and frontend/src/state/roomStore.ts
- [x] T017 [US2] Add automatic redirect to GamePage when room status changes to playing in frontend/src/pages/LobbyPage.tsx
- [x] T018 [US2] Display drawer role, name, and secret word (drawer-only) in frontend/src/pages/GamePage.tsx

**Checkpoint**: Scenarios 1 and 2 work independently.
