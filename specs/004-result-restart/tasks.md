# Tasks: Result, Restart & Final Validation

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Parent tasks**: [001-scribble-game/tasks.md](../001-scribble-game/tasks.md)

**Prerequisites**: [003-gameplay-interaction/tasks.md](../003-gameplay-interaction/tasks.md) complete.

## Phase 6: User Story 4 — Result, Restart & Final Validation (P4)

**Goal**: Result display, host-only restart, state reset, lobby redirect, E2E validation.

**Independent Test**: Correct guess → result UI; host restart → both back in lobby with players kept.

### Implementation

- [x] T026 [US4] Reveal secretWord to everyone in toRoomSnapshot when status is result in backend/src/services/roomStore.ts
- [x] T027 [US4] Implement restartRoom service method in backend/src/services/roomStore.ts and mount POST /rooms/:code/restart route in backend/src/api/rooms.ts
- [x] T028 [US4] Add test cases for restart logic in backend/src/services/roomStore.test.ts
- [x] T029 [US4] Add restartRoom store action in frontend/src/state/roomStore.ts
- [x] T030 [US4] Add redirect to LobbyPage when room status transitions to lobby in frontend/src/pages/GamePage.tsx
- [x] T031 [US4] Render result panel with scores, revealed word, and host-restricted restart button in frontend/src/pages/GamePage.tsx
- [x] T032 [US4] Run full backend/frontend test suites and execute end-to-end happy path validation in browser

**Checkpoint**: Full round lifecycle complete.
