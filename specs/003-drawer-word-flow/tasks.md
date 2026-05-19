# Tasks: Phase 2 Drawer Word Flow

**Input**: Design documents from `/specs/003-drawer-word-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Verification tasks are REQUIRED. Each user story includes explicit manual
validation tasks from `quickstart.md`, plus optional unit-level checks where the
plan identified practical pure helpers.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Current Starter Coverage

- Phase 1 already provides the lobby-to-`playing` transition, host-aware room
  state, host-only start validation, viewer `participantId` flow for room fetches,
  lobby polling, and `/game` navigation.
- The starter already includes the `STARTER_WORDS` list with `rocket` as the first
  item.
- The main Phase 2 gaps are round-state storage on `Room`, started-room snapshot
  fields for `drawerId` and viewer role, deterministic secret-word assignment on
  start, and viewer-specific snapshot secrecy in `toRoomSnapshot(...)`.
- Read the implementation tasks below as delta work on top of the current Phase 1
  baseline, not greenfield feature creation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the Phase 2 artifacts and checkpoints are aligned before code changes

- [X] T001 Review Phase 2 scope and manual validation flow in specs/003-drawer-word-flow/spec.md, specs/003-drawer-word-flow/plan.md, and specs/003-drawer-word-flow/quickstart.md
- [X] T002 Review the current starter implementation in backend/src/models/game.ts, backend/src/services/roomStore.ts, backend/src/api/rooms.ts, frontend/src/services/api.ts, frontend/src/state/roomStore.ts, frontend/src/pages/LobbyPage.tsx, and frontend/src/pages/GamePage.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract and state changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Update Phase 2 room and snapshot types in backend/src/models/game.ts
- [X] T004 [P] Extend the existing frontend room snapshot and response types with Phase 2 fields in frontend/src/services/api.ts
- [X] T005 [P] Keep the generated Phase 2 room API contract aligned with the implementation delta in specs/003-drawer-word-flow/contracts/rooms.yaml
- [X] T006 Extend backend room-store helpers for deterministic round setup and viewer-specific snapshot projection in backend/src/services/roomStore.ts
- [X] T007 Adapt the existing room routes to the Phase 2 viewer-specific snapshot shape in backend/src/api/rooms.ts
- [X] T008 Extend the existing frontend room-store derived state for started-round fields in frontend/src/state/roomStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Start a Round With a Visible Drawer (Priority: P1) 🎯 MVP

**Goal**: Starting the game assigns the host as drawer, marks everyone else as guessers, and shows the same drawer identity to all players

**Independent Test**: Create a two-player room, start as host, and confirm both clients move to `/game`, show the same drawer identity, and treat the host as drawer and the other player as guesser

### Tests for User Story 1 ⚠️

- [ ] T009 [P] [US1] Optionally add pure room-state assignment checks for host-as-drawer and non-host-as-guesser behavior in backend/src/services/roomStore.ts if helper extraction makes them practical
- [ ] T010 [US1] Use the existing manual multiplayer validation steps for host start, drawer identity, and guesser role in specs/003-drawer-word-flow/quickstart.md

### Implementation for User Story 1

- [X] T011 [US1] Extend the existing start-room mutation to assign drawerId and guesserIds in backend/src/services/roomStore.ts
- [X] T012 [US1] Extend POST /rooms/:code/start to return started-room drawer metadata in backend/src/api/rooms.ts
- [X] T013 [US1] Extend frontend started-room derivations for isDrawer, viewerRoundRole, and drawerName in frontend/src/state/roomStore.ts
- [X] T014 [US1] Confirm the existing lobby-to-game transition uses the new started-room snapshot metadata in frontend/src/pages/LobbyPage.tsx
- [X] T015 [US1] Render drawer identity, viewer round role, and visible started-room status in frontend/src/pages/GamePage.tsx

**Checkpoint**: User Story 1 should now be fully functional and testable independently

---

## Phase 4: User Story 2 - Start With a Deterministic Secret Word (Priority: P2)

**Goal**: Every fresh Phase 2 round selects the same starter word, `rocket`, when the host starts the game

**Independent Test**: Start multiple fresh two-player rooms and confirm each drawer sees `rocket`

### Tests for User Story 2 ⚠️

- [ ] T016 [P] [US2] Optionally add deterministic word-selection helper checks in backend/src/services/roomStore.ts if helper extraction makes them practical
- [ ] T017 [US2] Use the existing repeated fresh-room `rocket` validation flow in specs/003-drawer-word-flow/quickstart.md

### Implementation for User Story 2

- [X] T018 [US2] Extend the start transition to use the starter word list deterministically in backend/src/services/roomStore.ts
- [X] T019 [US2] Replace the current shared `availableWords` gameplay payload with active-word state in backend/src/services/roomStore.ts and backend/src/models/game.ts
- [X] T020 [US2] Keep the Phase 2 API contract aligned with deterministic active-word behavior in specs/003-drawer-word-flow/contracts/rooms.yaml
- [X] T021 [US2] Surface the drawer-visible deterministic word through frontend state and frontend/src/pages/GamePage.tsx

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Reveal the Secret Word Only to the Drawer (Priority: P3)

**Goal**: Only the drawer receives and sees the secret word; guessers never receive a secret-word field in any room snapshot they can access

**Independent Test**: Compare drawer and guesser views plus refreshes in the same started room and confirm only the drawer receives the secret word

### Tests for User Story 3 ⚠️

- [ ] T022 [P] [US3] Optionally add viewer-specific snapshot projection checks for drawer and guesser responses in backend/src/services/roomStore.ts if helper extraction makes them practical
- [ ] T023 [US3] Use the existing drawer-vs-guesser secrecy validation flow in specs/003-drawer-word-flow/quickstart.md

### Implementation for User Story 3

- [X] T024 [US3] Finalize viewer-specific secret-word omission rules in backend/src/services/roomStore.ts
- [X] T025 [US3] Ensure the existing fetch and start routes consistently pass viewerParticipantId for secrecy in backend/src/api/rooms.ts
- [X] T026 [US3] Align the frontend API snapshot typing so guessers do not expect a secret-word field in frontend/src/services/api.ts
- [X] T027 [US3] Render drawer-only secret word UI, guesser-safe fallback copy, and visible started-room status in frontend/src/pages/GamePage.tsx
- [X] T028 [US3] Extend started-room refresh handling to preserve drawer secrecy in frontend/src/state/roomStore.ts and frontend/src/pages/GamePage.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment, documentation, and verification across all Phase 2 stories

- [X] T029 [P] Refresh Phase 2 artifact details if implementation changes contract wording in specs/003-drawer-word-flow/plan.md, specs/003-drawer-word-flow/data-model.md, and specs/003-drawer-word-flow/contracts/rooms.yaml
- [X] T030 Run required backend build validation in backend/
- [X] T031 Run required frontend build validation in frontend/
- [ ] T032 Run the complete manual quickstart validation in specs/003-drawer-word-flow/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP round transition
- **User Story 2 (P2)**: Depends on US1 start-transition state existing
- **User Story 3 (P3)**: Depends on US1 and US2 because secrecy applies to the started round and active secret word

### Within Each User Story

- Verification tasks are defined before implementation
- Backend state mutation before frontend rendering
- Snapshot contract alignment before UI assumptions
- Story complete before moving to the next dependent story

### Parallel Opportunities

- T004 and T005 can run in parallel after T003 starts the backend contract changes
- T009 and T010 can run in parallel within US1
- T016 and T017 can run in parallel within US2
- T022 and T023 can run in parallel within US3
- T030 and T031 can run in parallel in the final phase

---

## Parallel Example: User Story 1

```bash
# Launch US1 verification work together:
Task: "Add or update pure room-state assignment checks for host-as-drawer and non-host-as-guesser behavior in backend/src/services/roomStore.ts"
Task: "Record the manual multiplayer validation steps for host start, drawer identity, and guesser role in specs/003-drawer-word-flow/quickstart.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Demo the started-round drawer flow

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP ready
3. Add User Story 2 → Test independently → deterministic word flow ready
4. Add User Story 3 → Test independently → secrecy rules ready
5. Finish polish tasks and full validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 after US1 start-state contract lands
   - Developer C: User Story 3 after US2 active-word contract lands
3. Merge on the shared room snapshot contract after each checkpoint

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story remains independently testable at its checkpoint
- Manual validation is required because Phase 2 behavior is multiplayer and viewer-specific
- Commit after each task or logical group
