---

description: "Task list template for feature implementation"
---

# Tasks: Scribble Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅, quickstart.md ✅

**Tests**: Tests are MANDATORY for this project (constitution Principle III: Vitest ≥ 80% coverage). All test tasks use RED-GREEN-REFACTOR — tests MUST be written first and MUST FAIL before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between those tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in all descriptions

## Path Conventions

- **Shared schema**: `shared/schemas/`
- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the existing test suite is fully green before any changes are introduced.

- [X] T001 Run existing test suites to establish a green baseline (`cd backend && npm test` and `cd frontend && npm test`)

---

## Phase 2: Foundational (Contract First — Blocking Prerequisites)

**Purpose**: Update the shared Zod contract and TypeScript interfaces that ALL user story implementations depend on. No story work can begin until both are complete.

**⚠️ CRITICAL**: Constitution Principle VI — contracts before implementation. Both tasks touch different files and can be worked in parallel.

- [X] T002 [P] Add `drawerId: z.string().nullable()` and `currentWord: z.string().nullable()` to `roomSnapshotSchema` in `shared/schemas/room.ts`
- [X] T003 [P] Add `drawerId: string | null` and `currentWord: string | null` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`

**Checkpoint**: Shared contract updated — TypeScript compiler will now surface all call sites that need updating.

---

## Phase 3: User Story 1 — Host Starts the Game (Priority: P1) 🎯 MVP

**Goal**: The host clicks "Start Game", becomes the drawer, sees the secret word ("rocket"), and all other players see the drawer's name but receive `currentWord: null` from the server.

**Independent Test**: Spin up two players in a lobby, host presses Start, verify (a) `room.drawerId === hostId` in the returned snapshot, (b) drawer's snapshot has `currentWord: "rocket"`, (c) non-drawer's snapshot has `currentWord: null`, (d) the disabled button shows "Need at least 2 players" when only 1 player is present, (e) GamePage shows the drawer's name to all and the word only to the drawer.

### Tests for User Story 1 (MANDATORY — write FIRST, must FAIL before implementation)

> **RED phase**: Write these tests first; confirm they fail before writing any production code.

- [X] T004 [US1] Write failing tests for `startRoom()` drawer assignment (`drawerId === hostId`, `currentWord === "rocket"`), `already_started` 409 guard, `too_few_players` 400 guard, and `toRoomSnapshot()` viewer-based word filtering in `backend/src/services/roomStore.test.ts`
- [X] T005 [P] [US1] Write failing tests for LobbyPage rendering "Need at least 2 players" label on the disabled Start button when `participants.length < 2` in `frontend/src/pages/LobbyPage.test.tsx`
- [X] T006 [P] [US1] Write failing tests for GamePage showing drawer's name to all players and showing `currentWord` only when `participantId === drawerId` in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

> **GREEN phase**: Write the minimum production code to make each failing test pass.

- [X] T007 [US1] Implement `createRoom()` null initialization (`drawerId: null, currentWord: null`) and `startRoom()` drawer assignment (`drawerId: hostId`, `currentWord: STARTER_WORDS[0]`) plus `already_started` guard in `backend/src/services/roomStore.ts` (depends on T002, T003, T004)
- [X] T008 [US1] Implement `toRoomSnapshot(room, viewerParticipantId?)` viewer-based word filter — return `currentWord` only when `viewerParticipantId === room.drawerId`, otherwise `null` — in `backend/src/services/roomStore.ts` (depends on T007)
- [X] T009 [US1] Pass `participantId` from request body as `viewerParticipantId` to `toRoomSnapshot()` in the `POST /:code/start` handler in `backend/src/api/rooms.ts` (depends on T008)
- [X] T010 [P] [US1] Add "Need at least 2 players" visible label alongside the disabled Start button when `participants.length < 2` in `frontend/src/pages/LobbyPage.tsx` (depends on T002, T005)
- [X] T011 [P] [US1] Display drawer's name via `aria-live` region to all players, and show secret word prominently only when `participantId === snapshot.drawerId` in `frontend/src/pages/GamePage.tsx` (depends on T002, T006)

**Checkpoint**: At this point User Story 1 is fully functional. Run `cd backend && npm test` and `cd frontend && npm test` — all T004/T005/T006 tests must now be green.

---

## Phase 4: User Story 2 — Player Name Validation on Game Start (Priority: P2)

**Goal**: Player names that are empty or whitespace-only are rejected at join/create time with an inline error; names with leading/trailing whitespace are stored trimmed.

**Independent Test**: Attempt to create/join a room with name `"   "` — expect inline error "Name cannot be empty." Attempt with name `"  Alice  "` — expect it stored as `"Alice"`.

### Tests for User Story 2 (MANDATORY — write FIRST, must FAIL before implementation)

- [X] T012 [US2] Write failing tests for name trimming (stores `"Alice"` when `"  Alice  "` given) and empty-name rejection (returns an error for `""` or `"   "`) in `backend/src/services/roomStore.test.ts`
- [X] T013 [P] [US2] Write failing tests for inline "Name cannot be empty" error message on the join form in `frontend/src/pages/JoinRoomPage.test.tsx`
- [X] T014 [P] [US2] Write failing tests for inline "Name cannot be empty" error message on the create form in `frontend/src/pages/CreateRoomPage.test.tsx`

### Implementation for User Story 2

- [X] T015 [US2] Add name trim and empty-after-trim guard to the join/create room logic in `backend/src/services/roomStore.ts` (depends on T012)
- [X] T016 [P] [US2] Add inline "Name cannot be empty." validation error to the name field in `frontend/src/pages/JoinRoomPage.tsx` (depends on T013)
- [X] T017 [P] [US2] Add inline "Name cannot be empty." validation error to the name field in `frontend/src/pages/CreateRoomPage.tsx` (depends on T014)

**Checkpoint**: User Stories 1 AND 2 are independently functional. All new tests green.

---

## Phase 5: User Story 3 — Non-Host Players Cannot Start (Priority: P3)

**Goal**: The "Start Game" button is absent or disabled for non-host players; it remains visible and enabled (when 2+ players present) only for the host.

**Independent Test**: Join as a non-host player, view LobbyPage, confirm the Start Game button is not rendered or is disabled. Switch to the host view and confirm the button is present and active.

### Tests for User Story 3 (MANDATORY — write FIRST, must FAIL before implementation)

- [X] T018 [US3] Write failing tests for LobbyPage rendering no Start button (or a disabled button) for a non-host participant, and a visible/enabled button for the host (with 2+ players) in `frontend/src/pages/LobbyPage.test.tsx`

### Implementation for User Story 3

- [X] T019 [US3] Conditionally hide or disable the Start Game button in `frontend/src/pages/LobbyPage.tsx` when the current participant is not the host (`participantId !== snapshot.hostId`) (depends on T018)

**Checkpoint**: All three user stories are independently functional and testable. Full suite green.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Coverage gate, accessibility verification, and end-to-end manual validation.

- [X] T020 [P] Run backend coverage gate and confirm ≥ 80% line/branch coverage (`cd backend && npm run test:coverage`)
- [X] T021 [P] Run frontend coverage gate and confirm ≥ 80% line/branch coverage (`cd frontend && npm run test:coverage`)
- [ ] T022 Manual quickstart.md two-tab drawer flow validation — open two tabs, create room as "Alice", join as "Bob", host clicks Start, verify Tab 1 shows word "rocket" and Tab 2 network response has `currentWord: null`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion — can run in parallel with US1 if staffed, but should be done sequentially to avoid `roomStore.ts` conflicts
- **User Story 3 (Phase 5)**: Depends on US1 completion (both touch `LobbyPage.tsx`)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on US2 or US3
- **US2 (P2)**: Can start after Foundational — no dependency on US1 (touches different code paths in `roomStore.ts`)
- **US3 (P3)**: Must start after US1 — both modify `LobbyPage.tsx` and `LobbyPage.test.tsx`

### Within Each User Story

1. Tests MUST be written first (RED) and MUST FAIL before implementation starts
2. Foundational schema (T002, T003) before service logic
3. Service logic (T007, T008) before API handler (T009)
4. API handler before any frontend changes that depend on new snapshot fields
5. Tests green (GREEN) before refactor step

### Parallel Opportunities

| Parallel Group | Tasks | Condition |
|---|---|---|
| Foundational | T002, T003 | Start together after T001 |
| US1 Frontend tests | T005, T006 | Start together after T002, T003 |
| US1 Frontend impl | T010, T011 | Start together after T007-T009 and their tests |
| US2 Frontend tests | T013, T014 | Start together after T002, T003 |
| US2 Frontend impl | T016, T017 | Start together after T015 and their tests |
| Polish | T020, T021 | Start together after T022 or in parallel with it |

---

## Parallel Example: User Story 1

```bash
# Parallel: write foundational contracts together
Task T002: Update Zod schema in shared/schemas/room.ts
Task T003: Update TS interfaces in backend/src/models/game.ts

# After T002+T003: parallel frontend test setup
Task T005: Write LobbyPage tests in frontend/src/pages/LobbyPage.test.tsx
Task T006: Write GamePage tests in frontend/src/pages/GamePage.test.tsx

# After backend is green (T007-T009): parallel frontend implementation
Task T010: Update LobbyPage.tsx for "Need at least 2 players" label
Task T011: Update GamePage.tsx for drawer name + word display
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: Foundational contracts (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (drawer assignment + word visibility)
4. **STOP and VALIDATE**: Run tests, manual quickstart.md walkthrough
5. Demo/ship the core game-start flow

### Incremental Delivery

1. Setup + Foundational → TypeScript contracts ready
2. User Story 1 → Core game start + drawer assignment working → **MVP demo**
3. User Story 2 → Name validation hardened → Deploy
4. User Story 3 → Role-based Start button → Deploy
5. Each story is independently shippable without breaking prior stories

### Parallel Team Strategy

With two developers after Foundational phase:
- **Dev A**: US1 backend (T004, T007, T008, T009) then US3 (T018, T019)
- **Dev B**: US1 frontend (T005, T006, T010, T011) then US2 frontend (T013, T014, T016, T017) plus US2 backend (T012, T015)

---

## Notes

- [P] tasks = different files, no blocking dependencies between them
- [USN] label maps each task to a specific user story for traceability
- Constitution Principle III: Vitest ≥ 80% — T020/T021 are the gate, not optional
- TDD is non-negotiable: never write production code before a failing test exists
- `STARTER_WORDS[0]` is `"rocket"` (from `backend/src/seed/starterData.ts`) — hardcoded expectation in T004 tests
- `toRoomSnapshot()` already accepts `viewerParticipantId` but currently ignores it (`void viewerParticipantId` on line 138 of `roomStore.ts`) — T008 removes the `void` and implements the filter
- US3 depends on US1 because both touch `LobbyPage.tsx` — implement US1 lobby changes (T010) before US3 lobby changes (T019)
