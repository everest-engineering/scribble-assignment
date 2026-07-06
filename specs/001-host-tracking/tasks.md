---

description: "Task list for host tracking on room creation feature"
---

# Tasks: Host Tracking on Room Creation

**Input**: Design documents from `specs/001-host-tracking/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included to validate backend and frontend changes. Run builds after completion.

**Organization**: Tasks are grouped by phase. Single user story (US1 - P1).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 for user story tasks
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/src/__tests__/` (or alongside source)
- **Frontend**: `frontend/src/`
- Paths reflect the actual web app structure from plan.md

## Phase 1: Setup (Brownfield Discovery)

**Purpose**: Read and understand existing code patterns before making changes

- [x] T001 Read existing backend types in `backend/src/models/game.ts` to understand current interface shapes
- [x] T002 Read existing backend room logic in `backend/src/services/roomStore.ts` to understand createRoom and joinRoom flow
- [x] T003 Read existing frontend types in `frontend/src/services/api.ts` and UI components in `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx`, `frontend/src/components/Scoreboard.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend type changes that MUST complete before frontend work can begin

- [x] T004 [P] Add `isHost: boolean` to Participant interface in `backend/src/models/game.ts`
- [x] T005 [P] Add `hostId: string` to Room interface in `backend/src/models/game.ts`
- [x] T006 [P] Add `isHost: boolean` to Participant interface in `frontend/src/services/api.ts`
- [x] T007 Update `createParticipant()` in `backend/src/services/roomStore.ts` to accept and set `isHost` parameter (default `false`)
- [x] T008 Update `createRoom()` in `backend/src/services/roomStore.ts` to set `isHost: true` on the creator participant and store `hostId` on the Room

**Checkpoint**: Backend + frontend types accept new fields; backend assigns host on create. Backend compiles and tests pass.

---

## Phase 3: User Story 1 - Host Label on Room Creation (Priority: P1) 🎯 MVP

**Goal**: The room creator sees a "Host" label next to their name, and all other players see it too.

**Independent Test**: Create a room in Tab 1, join it in Tab 2. Tab 1 shows "Host" next to creator's name. Tab 2 shows "Host" next to creator's name but not next to joiner's name.

- [x] T009 [P] [US1] Add "Host" badge next to host's name in participant list in `frontend/src/pages/LobbyPage.tsx` (conditionally render when `participant.isHost` is true)
- [x] T010 [P] [US1] Add "Host" badge in player info sidebar in `frontend/src/pages/GamePage.tsx` (conditionally render when viewer or any participant `isHost` is true)
- [x] T011 [US1] Update `frontend/src/components/Scoreboard.tsx` to render participant names with host label (replace static placeholder with dynamic list from `room.participants`, showing "Host" next to the host's name)

**Checkpoint**: Host label displays on Lobby, Game page, and Scoreboard. Two-browser test passes for all screens.

---

## Phase 4: Tests & Validation

**Purpose**: Update existing tests to cover new fields, and verify builds

- [x] T012 [P] Update backend tests in `backend/src/services/roomStore.test.ts` to assert `isHost` and `hostId` are set correctly on room creation and join
- [x] T013 [P] Update frontend API tests in `frontend/src/services/api.test.ts` to verify `isHost` field is present in response types

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and final verification

- [x] T014 [P] Run `cd backend && npm run build` to verify backend compiles without errors
- [x] T015 [P] Run `cd frontend && npm run build` to verify frontend compiles without errors
- [ ] T016 Run two-browser validation per `specs/001-host-tracking/quickstart.md` to verify all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — review only, can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (types must be available)
- **Tests & Validation (Phase 4)**: Depends on US1 implementation
- **Polish (Phase 5)**: Depends on all other phases complete

### User Story Dependencies

- **User Story 1 (P1)**: Only user story — no cross-story dependencies

### Within Each Phase

- Types before logic (Phase 2: T004/T005/T006 before T007/T008)
- Core implementation before tests (Phase 3 before Phase 4)

### Parallel Opportunities

- T004, T005, T006 are independent type changes — can run in parallel
- T009, T010 are independent UI changes (different files) — can run in parallel
- T012, T013 are independent test files — can run in parallel
- T014, T015 are independent build commands — can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (read existing code)
2. Complete Phase 2: Foundational (types + backend logic)
3. Complete Phase 3: User Story 1 (frontend UI)
4. **STOP and VALIDATE**: Two-browser test per quickstart.md
5. Run Phase 4 and Phase 5 for final validation

### Iterative Delivery

1. Types + Backend logic (Phases 1-2) → Foundation ready
2. Lobby host badge (T009) → Partial MVP — host visible in lobby
3. Game + Scoreboard host badges (T010, T011) → Full MVP
4. Tests + Build validation (Phases 4-5) → Done

### Parallel Execution Example

```bash
# Launch all type changes together (Phase 2):
Task: "T004 Add isHost to backend Participant"
Task: "T005 Add hostId to backend Room"
Task: "T006 Add isHost to frontend Participant"

# Launch all UI changes together (Phase 3):
Task: "T009 Add host badge to LobbyPage"
Task: "T010 Add host badge to GamePage"
```

---

## Notes

- No new files need to be created — all changes extend existing interfaces and components
- `toRoomSnapshot()` uses `{ ...participant }` spread — new `isHost` field propagates automatically
- `joinRoom()` does NOT need changes — `createParticipant` defaults `isHost` to `false`
- No new endpoints — existing POST /rooms, POST /rooms/:code/join, and GET /rooms/:code handle the new field
- Follow existing mutation patterns (in-place push in joinRoom) per Brownfield principle
- Commit after each meaningful slice: types commit, backend logic commit, each UI component commit
