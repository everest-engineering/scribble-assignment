# Tasks: Gameplay Interaction

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Parent tasks**: [001-scribble-game/tasks.md](../001-scribble-game/tasks.md)

**Prerequisites**: [002-game-start-drawer/tasks.md](../002-game-start-drawer/tasks.md) complete.

## Phase 5: User Story 3 — Gameplay Interaction (P3)

**Goal**: Interactive canvas, draw sync, guess validation, scoring, round end on correct guess.

**Independent Test**: Draw on host; sync to guest; correct guess → 100 points and `result` status.

### Implementation

- [x] T019 [US3] Implement submitDraw logic in backend/src/services/roomStore.ts and mount POST /rooms/:code/draw route in backend/src/api/rooms.ts
- [x] T020 [US3] Implement submitGuess logic with scoring (correct guess ends round) in backend/src/services/roomStore.ts and mount POST /rooms/:code/guess route in backend/src/api/rooms.ts
- [x] T021 [US3] Add test cases for draw and guess logic in backend/src/services/roomStore.test.ts
- [x] T022 [US3] Add submitDraw and submitGuess methods to frontend/src/services/api.ts and frontend/src/state/roomStore.ts
- [x] T023 [US3] Build interactive painting canvas component and clear button in frontend/src/pages/GamePage.tsx
- [x] T024 [US3] Add automatic 2s polling in frontend/src/pages/GamePage.tsx to sync canvas and guesses
- [x] T025 [US3] Connect Scoreboard.tsx and ResultPanel.tsx to display scores and guess logs in frontend/src/pages/GamePage.tsx

**Checkpoint**: Drawing, guessing, and scoring complete.
