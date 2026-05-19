# Tasks: Phase 3 Gameplay Interaction

**Input**: Design documents from `/specs/004-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Verification tasks are REQUIRED. This feature includes backend unit tests where practical plus explicit two-browser manual validation for drawing behavior and multiplayer sync.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Current Starter Coverage

- Phase 2 already provides `drawerId`, `guesserIds`, `secretWord`, viewer-specific room snapshots, room session restore, and the `/game` route shell.
- `frontend/src/pages/GamePage.tsx` already shows drawer identity, viewer role, secret-word visibility, refresh, and leave-room behavior.
- `frontend/src/state/roomStore.ts` already contains the 2-second polling pattern, but only for lobby rooms.
- `backend/src/services/roomStore.test.ts` already exists from Phase 2 and should be extended instead of introducing a brand-new test harness.
- The Phase 3 gaps are still open: real canvas interaction, clear-canvas action, guess submission endpoint and validation, shared guess history, score tracking, `result` status, and active game polling.
- `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, and `frontend/src/components/ResultPanel.tsx` are present but still placeholder-level.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature artifacts and test surfaces before implementation

- [ ] T001 Review Phase 3 design artifacts and trace requirements to planned files in `specs/004-gameplay-interaction/spec.md`, `specs/004-gameplay-interaction/plan.md`, `specs/004-gameplay-interaction/data-model.md`, and `specs/004-gameplay-interaction/contracts/rooms.yaml`
- [ ] T002 Review current gameplay implementation gaps in `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/state/roomStore.ts`, and `frontend/src/services/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core room-state and contract changes that block all Phase 3 stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Extend Phase 3 backend model types for `result`, `GuessEntry`, score state, winner metadata, and widened room snapshots in `backend/src/models/game.ts`
- [ ] T004 [P] Add guess-submission request validation and any widened schema helpers in `backend/src/api/schemas.ts`
- [ ] T005 [P] Extend frontend API types and add `submitGuess` client support in `frontend/src/services/api.ts`
- [ ] T006 Implement foundational room-store helpers for guess normalization, score initialization, correctness checks, and result-state transitions in `backend/src/services/roomStore.ts`
- [ ] T007 Implement backend room snapshot widening for shared guess history, score rows, winner identity, and continued drawer-only `secretWord` visibility in `backend/src/services/roomStore.ts`
- [ ] T008 Add the `POST /rooms/:code/guesses` route and align existing room routes to the widened snapshot contract in `backend/src/api/rooms.ts`
- [ ] T009 Extend frontend room-store state and derivations for active game polling, score/history data, winner data, and guess-submission permissions in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Draw Locally as the Drawer (Priority: P1) 🎯 MVP

**Goal**: Give the drawer a real local canvas and a clear action while keeping drawing non-interactive for guessers

**Independent Test**: Start a two-player room, draw visible marks as the drawer, clear them, and confirm the guesser cannot draw and no shared room state changes

### Tests for User Story 1

- [ ] T010 [US1] Add explicit manual validation steps for local drawer drawing and clear behavior in `specs/004-gameplay-interaction/quickstart.md`

### Implementation for User Story 1

- [ ] T011 [US1] Replace the placeholder canvas area with a real local drawing surface in `frontend/src/pages/GamePage.tsx`
- [ ] T012 [US1] Add local drawing event handling and clear-canvas behavior in `frontend/src/pages/GamePage.tsx`
- [ ] T013 [US1] Gate canvas interactivity and clear controls by viewer round role in `frontend/src/pages/GamePage.tsx`
- [ ] T014 [P] [US1] Update `frontend/src/components/Scoreboard.tsx` to show room participants with zeroed scores during active rounds
- [ ] T015 [P] [US1] Update `frontend/src/components/ResultPanel.tsx` to stop being a placeholder and prepare to show shared guess activity without Phase 4 result rendering
- [ ] T016 [US1] Adjust game-page status copy and layout around the live canvas, drawer identity, and clear control in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 1 should now be independently testable as a local drawer-only interaction slice

---

## Phase 4: User Story 2 - Submit and Share Guesses (Priority: P2)

**Goal**: Let guessers submit trimmed guesses and keep shared guess history synced across players by polling

**Independent Test**: In a started room, reject blank guesses, accept trimmed guesses, and confirm new history entries appear for all players within about 2 seconds

### Tests for User Story 2

- [ ] T017 [P] [US2] Extend backend unit tests for guess normalization and guesser-only submission guards in `backend/src/services/roomStore.test.ts`
- [ ] T018 [US2] Add manual multiplayer validation steps for blank-guess rejection, trimmed storage, and guess-history sync in `specs/004-gameplay-interaction/quickstart.md`

### Implementation for User Story 2

- [ ] T019 [US2] Extend backend room state initialization and guess-history storage for active rooms in `backend/src/services/roomStore.ts`
- [ ] T020 [US2] Implement Phase 3 guess submission service flow with trimmed storage and room-scoped history append in `backend/src/services/roomStore.ts`
- [ ] T021 [US2] Wire `frontend/src/components/GuessForm.tsx` to local validation, disabled states, and actual room-store submission behavior
- [ ] T022 [US2] Add guess submission and active game polling methods to `frontend/src/state/roomStore.ts`
- [ ] T023 [US2] Adapt the existing 2-second visible-tab polling pattern for active game rooms from `frontend/src/state/roomStore.ts` into `frontend/src/pages/GamePage.tsx`
- [ ] T024 [US2] Render shared guess history with player names and correct stale-data/error behavior in `frontend/src/components/ResultPanel.tsx`
- [ ] T025 [US2] Surface guess-submission errors and loading states in `frontend/src/components/GuessForm.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently; shared guesses should sync without affecting other rooms

---

## Phase 5: User Story 3 - End the Round on the First Correct Guess (Priority: P3)

**Goal**: Score the first correct guess, transition the room to `result`, and keep final room state consistent across refreshes

**Independent Test**: Submit incorrect guesses with no score change, then submit the first correct guess with mixed casing and confirm winner score `100`, room status `result`, and shared final state on refresh

### Tests for User Story 3

- [ ] T026 [P] [US3] Extend backend unit tests for case-insensitive correctness checks, first-correct winner assignment, and `result` transition in `backend/src/services/roomStore.test.ts`
- [ ] T027 [US3] Add manual multiplayer validation steps for winner scoring, `result` transition, refresh persistence, and room isolation in `specs/004-gameplay-interaction/quickstart.md`

### Implementation for User Story 3

- [ ] T028 [US3] Initialize and maintain per-participant score state, winner metadata, and `endedAt` on the backend in `backend/src/services/roomStore.ts`
- [ ] T029 [US3] Implement case-insensitive secret-word comparison and first-correct scoring rules in `backend/src/services/roomStore.ts`
- [ ] T030 [US3] Transition room status from `playing` to `result` on the first correct guess and keep guesser snapshots word-safe in `backend/src/services/roomStore.ts`
- [ ] T031 [US3] Extend `frontend/src/state/roomStore.ts` derivations for result-state winner name, final scores, and continued refresh behavior after round end
- [ ] T032 [US3] Update `frontend/src/components/Scoreboard.tsx` to render final scores and winner emphasis from derived room state
- [ ] T033 [US3] Update `frontend/src/components/ResultPanel.tsx` to render ended-round winner/activity context without implementing Phase 4 restart flow
- [ ] T034 [US3] Update `frontend/src/pages/GamePage.tsx` to preserve the game route in `result`, show ended-round status, and stop redirecting away from Phase 3 result state

**Checkpoint**: All user stories should now be independently functional and refresh-safe

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across stories

- [ ] T035 [P] Align Phase 3 contract and state wording across `specs/004-gameplay-interaction/plan.md`, `specs/004-gameplay-interaction/data-model.md`, and `specs/004-gameplay-interaction/contracts/rooms.yaml` if implementation details changed
- [ ] T036 [P] Run required backend verification in `backend` with `npm run build` and `npm test`
- [ ] T037 [P] Run required frontend verification in `frontend` with `npm run build`
- [ ] T038 Run the full manual validation flow from `specs/004-gameplay-interaction/quickstart.md` and record completion in `specs/004-gameplay-interaction/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational - MVP slice
- **User Story 2 (P2)**: Starts after Foundational and benefits from US1 game-page updates, but remains independently testable
- **User Story 3 (P3)**: Starts after Foundational and depends on guess submission/history from US2

### Within Each User Story

- Manual or automated verification tasks are defined before or alongside implementation
- Backend room-state changes precede UI integration when the story depends on shared state
- Store/API integration precedes component wiring
- Story validation completes before moving to the next checkpoint

### Parallel Opportunities

- `T004` and `T005` can run in parallel during Foundational work
- `T014` and `T015` can run in parallel during US1
- `T017` and `T018` can run in parallel during US2 setup
- `T021` and `T024` can run in parallel once backend guess flow is ready
- `T026` and `T027` can run in parallel during US3 setup
- `T032` and `T033` can run in parallel during US3 UI work
- `T036` and `T037` can run in parallel in the final phase

---

## Parallel Example: User Story 2

```bash
# Launch verification preparation together:
Task: "Add backend unit tests for guess normalization and guesser-only submission guards in backend/src/services/roomStore.test.ts"
Task: "Add manual multiplayer validation steps for blank-guess rejection, trimmed storage, and guess-history sync in specs/004-gameplay-interaction/quickstart.md"

# Launch independent frontend component work together after store/API support exists:
Task: "Wire frontend/src/components/GuessForm.tsx to local validation, disabled states, and actual room-store submission behavior"
Task: "Render shared guess history with player names and correct stale-data/error behavior in frontend/src/components/ResultPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate drawer drawing/clear behavior independently

### Incremental Delivery

1. Finish Setup + Foundational
2. Add User Story 1 and validate local canvas behavior
3. Add User Story 2 and validate shared guess history sync
4. Add User Story 3 and validate final scoring plus `result` transition
5. Finish Polish and full quickstart validation

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then split by concern:
   - Developer A: backend room-state and route changes
   - Developer B: frontend store/API integration
   - Developer C: game-page and component rendering

---

## Notes

- [P] tasks = different files, no blocking dependency on incomplete work
- [US1], [US2], [US3] labels map tasks to user stories for traceability
- Manual validation is required for canvas interaction because browser-local drawing is not practical to prove fully from backend tests alone
- Keep secret-word privacy intact for guessers in both `playing` and `result`
- Do not introduce live stroke sync, restart flow, or Phase 4 result-screen behavior while completing these tasks
