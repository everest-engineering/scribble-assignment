# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Existing Vitest tests in the project will be updated as needed. No new test files created unless specified per task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup

**Purpose**: Verify existing codebase state and confirm assumptions from research

- [x] T001 Verify existing Zod schemas already handle name trimming/validation in `backend/src/api/schemas.ts` (`.trim().min(1)`)
- [x] T002 Verify `createParticipant` in `backend/src/services/roomStore.ts` already calls `name.trim()`
- [x] T003 Verify existing `startRoom` handler in `backend/src/api/rooms.ts` already enforces minimum 2 players (line 80)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on. No user story work can begin until this phase is complete.

- [x] T004 [P] Add `drawerId: string | null` field to `Room` interface in `backend/src/models/game.ts`
- [x] T005 [P] Add `drawerId: string | null` and `currentWord: string | null` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T006 [P] Add `drawerId: string | null` and `currentWord: string | null` fields to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [x] T007 Add `selectWordForRound(roundNumber: number)` function in `backend/src/services/roomStore.ts` that returns `STARTER_WORDS[(roundNumber - 1) % STARTER_WORDS.length]`
- [x] T008 Modify `startRoom(code: string)` in `backend/src/services/roomStore.ts` to set `room.drawerId = room.hostId` and select the word using `selectWordForRound(1)`, storing it on the room
- [x] T009 Modify `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `drawerId` and conditionally set `currentWord` only when `viewerParticipantId === room.drawerId` (null otherwise)

**Checkpoint**: Foundation ready — drawer assignment, word selection, and snapshot gating are in place

---

## Phase 3: User Story 1 — Join Game with Valid Name (Priority: P1) 🎯

**Goal**: Player names are trimmed and validated; empty/whitespace-only names are rejected with a visible error message.

**Independent Test**: Submit various name inputs (valid, empty, whitespace-only, with surrounding spaces) via create/join forms and verify acceptance/rejection behavior.

**Note**: Backend validation (Zod `.trim().min(1)`) and server-side trimming (`createParticipant`) are already implemented. Frontend forms already call `.trim()` before submission. This phase is verification-only.

### Verification for User Story 1

- [x] T010 [US1] Run existing backend tests (`backend/src/api/schemas.test.ts`) to confirm Zod name validation passes for empty/whitespace inputs
- [x] T011 [US1] Run existing backend tests (`backend/src/services/roomStore.test.ts`) to confirm `createParticipant` trims names correctly
- [x] T012 [US1] Manually verify frontend forms (`frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`) reject whitespace-only names before submission

**Checkpoint**: User Story 1 verified — name validation is already working correctly

---

## Phase 4: User Story 2 — Start First Round with Drawer Assignment (Priority: P1) 🎯

**Goal**: Host becomes the drawer for round 1, a secret word is deterministically selected, and the word is visible only to the drawer via the snapshot.

**Independent Test**: Start a game with 2+ players and verify (1) `drawerId` is set to host's ID in the snapshot, (2) `currentWord` is visible to the drawer, (3) `currentWord` is null for guessers.

### Implementation for User Story 2

- [x] T013 [US2] Add guard in `POST /rooms/:code/start` handler in `backend/src/api/rooms.ts` that throws 500 error if `STARTER_WORDS` is empty (FR-010)
- [x] T014 [US2] Verify `startRoom` response includes `drawerId` and drawer-gated `currentWord` by inspecting the snapshot returned from the `/start` endpoint
- [x] T015 [US2] Update `roomStore.test.ts` in `backend/src/services/roomStore.test.ts` to test that `startRoom` assigns `drawerId` to `hostId` and stores the selected word

**Checkpoint**: User Story 2 functional — drawer is assigned, word selected, visibility gated server-side

---

## Phase 5: User Story 3 — Drawer Views Secret Word (Priority: P2)

**Goal**: The assigned drawer sees the secret word prominently displayed in their game interface.

**Independent Test**: As the drawer, start a game and verify the word is visible on screen. As a guesser, verify the word is not visible.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create `DrawerWordDisplay` component in `frontend/src/components/DrawerWordDisplay.tsx` that accepts `word` and renders it prominently (hidden when word is null)
- [x] T017 [US3] Add helper in `frontend/src/pages/GamePage.tsx` to derive `isDrawer` boolean by comparing `participantId` with `room.drawerId`
- [x] T018 [US3] Integrate `DrawerWordDisplay` into `GamePage.tsx` sidebar, passing `room.currentWord` as prop (only renders when `isDrawer` is true)

**Checkpoint**: User Story 3 functional — drawer sees their word, guessers do not

---

## Phase 6: User Story 4 — Non-Drawer Player Experience (Priority: P3)

**Goal**: All players see who the drawer is. Non-drawer players see a clear guessing-mode indicator.

**Independent Test**: Join as a non-drawer player during an active round and verify the UI shows the drawer's name and a "Guess the word!" prompt.

### Implementation for User Story 4

- [x] T019 [US4] Add drawer identification display in `GamePage.tsx` header — derive `drawerName` by finding participant where `id === room.drawerId` and show "{drawerName} is drawing"
- [x] T020 [US4] Add guessing-mode indicator in `GamePage.tsx` sidebar that displays "Guess the word!" when `!isDrawer` (complements the existing `GuessForm` component)
- [x] T021 [US4] Update canvas placeholder in `GamePage.tsx` to show "Waiting for {drawerName} to draw..." instead of generic "Waiting for drawer..."

**Checkpoint**: All user stories functional — complete game start and drawer flow

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 Run full test suite (`npm test` in backend and frontend) and fix any regressions
- [x] T023 Run TypeScript compiler (`npx tsc --noEmit`) in both backend and frontend to verify zero type errors
- [x] T024 [P] Update `frontend/src/services/api.test.ts` to verify `RoomSnapshot` type includes `drawerId` and `currentWord` fields
- [ ] T025 Run quickstart.md manual testing guide to validate end-to-end flow — manual step for user
- [x] T026 Run lint checks (`npm run lint`) in both backend and frontend — N/A (no lint scripts configured)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup verification — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is verification-only — can be validated in parallel with other stories
  - US2 (P1) depends on Foundational — implements backend start flow
  - US3 (P2) depends on US2 — needs drawer assignment and word in snapshot
  - US4 (P3) depends on US2 — needs `drawerId` in snapshot for display
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Already implemented — verification only, no blocking dependencies
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 3 (P2)**: Depends on US2 completing (needs `currentWord` in snapshot)
- **User Story 4 (P3)**: Depends on US2 completing (needs `drawerId` in snapshot)

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before UI integration
- Story complete before moving to next priority

### Parallel Opportunities

- T004, T005, T006 (Phase 2 model/type changes) can run in parallel — different files, no cross-dependencies
- T010, T011, T012 (US1 verification) can run in parallel — independent verifications
- T016 (US3 component creation) can start in parallel with T013-T015 (US2 backend) — different codebases, but integration (T018) requires US2 to be done
- T022, T023, T024, T025, T026 (Polish) — T024 can run in parallel with T022-T023

---

## Parallel Example: Foundational Phase

```bash
# Launch all model/type changes together:
Task: "Add drawerId to Room interface in backend/src/models/game.ts"
Task: "Add drawerId + currentWord to RoomSnapshot in backend/src/models/game.ts"
Task: "Add drawerId + currentWord to RoomSnapshot in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 2 Only — since US1 is already done)

1. Complete Phase 1: Setup (quick verification)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 4: User Story 2 (drawer assignment + word selection)
4. **STOP and VALIDATE**: Test that `POST /rooms/:code/start` returns `drawerId` and drawer-gated `currentWord`
5. Continue to US3 + US4 for full UI experience

### Incremental Delivery

1. Setup + Foundational → model and service layer ready
2. Add US2 → Backend drawer assignment + word gating works (API-level test)
3. Add US3 → Drawer sees word in UI
4. Add US4 → All players see drawer identity + guessing mode
5. Each step adds value without breaking previous steps

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (backend start flow)
   - Developer B: User Story 3 (drawer word component) — can scaffold component while waiting for backend
3. After US2: Developer A or B handles User Story 4
4. Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1 is already implemented — tasks are verification only
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- TypeScript compiler must pass with zero errors before any commit
