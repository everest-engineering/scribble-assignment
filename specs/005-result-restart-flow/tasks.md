# Tasks: Phase 4 Result State and Restart

**Input**: Design documents from `/specs/005-result-restart-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Verification tasks are REQUIRED. Each user story includes backend
tests where practical plus explicit manual multiplayer validation from
`quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Current Starter Coverage

- Phase 3 already provides `result` room status, `winnerId`, `guessHistory`,
  `scores`, `secretWord`, `drawerId`, and `endedAt`.
- `GamePage` already keeps active polling running for `playing` and `result`.
- Drawer canvas is already locked in `result`; Phase 4 must preserve that and clear
  local canvas state on restart/lobby return.
- Current backend snapshots still hide `secretWord` from guessers in `result`, and
  current `ResultPanel` still behaves like an activity panel instead of a dedicated
  shared result view.
- No restart endpoint or restart client/store flow exists yet.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review Phase 3 baseline and prepare Phase 4 artifacts for execution

- [ ] T001 Review Phase 4 spec, plan, research, contracts, and quickstart artifacts in specs/005-result-restart-flow/
- [ ] T002 Capture current Phase 3 baseline behavior for result snapshots and game polling in backend/src/services/roomStore.ts and frontend/src/state/roomStore.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract and state prerequisites that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update Phase 4 snapshot and restart contract types in backend/src/models/game.ts and frontend/src/services/api.ts
- [ ] T004 [P] Add restart request validation in backend/src/api/schemas.ts
- [ ] T005 [P] Extend API client with restartRoom() and result-state contract notes in frontend/src/services/api.ts
- [ ] T006 Add shared room-store derivations for result reveal and host-only restart state in frontend/src/state/roomStore.ts
- [ ] T007 [P] Extend backend room-store test coverage scaffolding for Phase 4 result/restart helpers in backend/src/services/roomStore.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Reveal Shared Result State (Priority: P1) 🎯 MVP

**Goal**: Every player in a finished room sees the same revealed word, final scores, and full guess history

**Independent Test**: Finish a round in two browser sessions and confirm both drawer and guesser see the same revealed word, same winner, same final scores, and full unredacted history while the canvas stays locked

### Tests for User Story 1 ⚠️

- [ ] T008 [P] [US1] Extend result-snapshot backend tests for shared secret-word and full-history reveal in backend/src/services/roomStore.test.ts
- [ ] T009 [US1] Add explicit manual validation steps for shared result reveal in specs/005-result-restart-flow/quickstart.md

### Implementation for User Story 1

- [ ] T010 [US1] Update result-state snapshot projection to reveal secretWord and full guess history to all viewers only in result state in backend/src/services/roomStore.ts
- [ ] T011 [US1] Align GET /rooms/:code and guess submission responses with Phase 4 result reveal semantics in backend/src/api/rooms.ts
- [ ] T012 [US1] Derive result-visible secret word and shared result-state display data in frontend/src/state/roomStore.ts
- [ ] T013 [US1] Convert frontend/src/components/ResultPanel.tsx from activity-only panel into the dedicated Phase 4 result view
- [ ] T014 [P] [US1] Adjust final-score and winner presentation for result state in frontend/src/components/Scoreboard.tsx
- [ ] T015 [US1] Wire Phase 4 result rendering and preserve result-state canvas lock in frontend/src/pages/GamePage.tsx
- [ ] T016 [US1] Ensure local canvas does not accept input and still reads correctly after the room enters result in frontend/src/pages/GamePage.tsx

**Checkpoint**: User Story 1 should now show a complete shared result reveal without restart

---

## Phase 4: User Story 2 - Restart From Result as Host (Priority: P2)

**Goal**: Host can restart a finished room back to lobby while preserving room code and participants and clearing round-owned state

**Independent Test**: Finish a room, confirm non-host restart stays visible but disabled, then restart as host and confirm all connected clients return to the lobby with the same players and no stale round data

### Tests for User Story 2 ⚠️

- [ ] T017 [P] [US2] Extend backend tests for host-only restart, result-only restart, and cleared-lobby invariants in backend/src/services/roomStore.test.ts
- [ ] T018 [US2] Add explicit manual restart validation steps to specs/005-result-restart-flow/quickstart.md

### Implementation for User Story 2

- [ ] T019 [US2] Implement restartRoom() and deterministic round-state reset helpers in backend/src/services/roomStore.ts
- [ ] T020 [US2] Add POST /rooms/:code/restart with correct error mapping in backend/src/api/rooms.ts
- [ ] T021 [US2] Add room-store restart action and host-only restart derivations in frontend/src/state/roomStore.ts
- [ ] T022 [US2] Show restart to all result-state viewers but disable it for non-host players with a clear reason in frontend/src/pages/GamePage.tsx
- [ ] T023 [US2] Clear local canvas state and rely on lobby redirect when the restarted room snapshot returns to lobby in frontend/src/pages/GamePage.tsx
- [ ] T024 [US2] Ensure result UI and scoreboard clear correctly when the room transitions from result back to lobby in frontend/src/components/ResultPanel.tsx and frontend/src/components/Scoreboard.tsx
- [ ] T025 [US2] Keep restarted lobby snapshots free of stale result data in frontend/src/state/roomStore.ts

**Checkpoint**: User Stories 1 and 2 should both work independently and together

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, contract alignment, and cleanup across both stories

- [ ] T026 [P] Sync Phase 4 API contract examples and schemas with implemented result/restart behavior in specs/005-result-restart-flow/contracts/rooms.yaml
- [ ] T027 [P] Sync Phase 4 data-model notes with the final implementation details in specs/005-result-restart-flow/data-model.md
- [ ] T028 Run backend test suite for Phase 4 coverage with backend/src/services/roomStore.test.ts via backend/package.json
- [ ] T029 Run required backend build validation in backend/package.json
- [ ] T030 Run required frontend build validation in frontend/package.json
- [ ] T031 Execute the full manual multiplayer validation flow in specs/005-result-restart-flow/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and integrates cleanly after US1
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - MVP for Phase 4
- **User Story 2 (P2)**: Can start after Foundational, but benefits from US1 result-view work being in place first

### Within Each User Story

- Backend tests/manual validation tasks defined before or alongside implementation
- Service-layer state changes before API route wiring
- Store/API updates before UI integration
- Story complete before final polish

### Parallel Opportunities

- `T004` and `T005` can run in parallel
- `T008` and `T009` can run in parallel
- `T013` and `T014` can run in parallel after store/state work begins
- `T017` and `T018` can run in parallel
- `T026` and `T027` can run in parallel
- `T029` and `T030` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch verification work for User Story 1 together:
Task: "Extend result-snapshot backend tests for shared secret-word and full-history reveal in backend/src/services/roomStore.test.ts"
Task: "Add explicit manual validation steps for shared result reveal in specs/005-result-restart-flow/quickstart.md"

# Launch UI work for User Story 1 together after state shaping starts:
Task: "Convert frontend/src/components/ResultPanel.tsx from activity-only panel into the dedicated Phase 4 result view"
Task: "Adjust final-score and winner presentation for result state in frontend/src/components/Scoreboard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm shared result reveal works independently

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 → Validate shared result reveal
3. Add User Story 2 → Validate restart and lobby return
4. Finish polish builds, tests, and quickstart validation

### Parallel Team Strategy

With multiple developers:

1. Complete Setup + Foundational together
2. After Foundational:
   - Developer A: backend snapshot/restart service work
   - Developer B: frontend result/restart UI work
   - Developer C: tests/contracts/docs alignment

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] and [US2] labels map tasks to user stories for traceability
- The current codebase already has Phase 3 result state and canvas lock; Phase 4 is a delta on top of that baseline
- Manual multiplayer validation remains required for final signoff
