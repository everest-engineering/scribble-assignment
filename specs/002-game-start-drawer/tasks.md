# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm Scenario 1 baseline and review Scenario 2 design.

- [x] T001 Confirm branch `002-game-start-drawer` and review spec.md, plan.md, and contracts/rooms-api.md in specs/002-game-start-drawer/
- [x] T002 Verify Scenario 1 baseline: lobby start + two-tab navigation to game works (`npm test` and manual smoke in backend/ and frontend/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model/type extensions for round state (required before US2/US3).

**⚠️ CRITICAL**: US2 and US3 backend work depends on this phase. US1 can proceed in parallel after T003–T004 only.

- [x] T003 Extend `Room` and `RoomSnapshot` with `drawerId`, `secretWord`, and `scores` in backend/src/models/game.ts
- [x] T004 [P] Mirror new snapshot fields on `RoomSnapshot` in frontend/src/services/api.ts

**Checkpoint**: Types compile; lobby snapshots may use null/empty defaults for new fields.

---

## Phase 3: User Story 1 — Valid Player Names (Priority: P1) 🎯 MVP

**Goal**: Trim and reject empty/whitespace names on create and join.

**Independent Test**: Submit empty name on create/join → error; `"  Alex  "` → stored as `Alex`.

### Implementation for User Story 1

- [x] T005 [US1] Add trimmed `playerNameSchema` to create/join in backend/src/api/schemas.ts
- [x] T006 [US1] Replace `displayName()` fallback with trim + reject empty in backend/src/services/roomStore.ts
- [x] T007 [US1] Return 400 with clear message for invalid names from backend/src/api/rooms.ts
- [x] T008 [P] [US1] Add client-side name trim/empty validation in frontend/src/pages/CreateRoomPage.tsx
- [x] T009 [P] [US1] Add client-side name trim/empty validation in frontend/src/pages/JoinRoomPage.tsx
- [x] T010 [P] [US1] Add Vitest cases for blank and trimmed names in backend/src/services/roomStore.test.ts

**Checkpoint**: quickstart.md §1 passes — name validation on create and join.

---

## Phase 4: User Story 2 — Drawer Assignment (Priority: P2)

**Goal**: Host becomes drawer at round start; all players see who is drawing.

**Independent Test**: Two tabs after start — both show host as drawer on game screen.

### Implementation for User Story 2

- [x] T011 [US2] Set `drawerId = hostId` in `startGame()` in backend/src/services/roomStore.ts
- [x] T012 [US2] Include `drawerId` in `toRoomSnapshot()` in backend/src/services/roomStore.ts
- [x] T013 [P] [US2] Add Vitest case that host is drawer after start in backend/src/services/roomStore.test.ts
- [x] T014 [US2] Show drawer role/label on game screen using `room.drawerId` in frontend/src/pages/GamePage.tsx
- [x] T015 [US2] Differentiate canvas placeholder for drawer vs guesser in frontend/src/pages/GamePage.tsx
- [x] T016 [US2] Redirect to `/lobby` when `room.status !== "playing"` in frontend/src/pages/GamePage.tsx

**Checkpoint**: quickstart.md §2 passes — both tabs identify the same drawer.

---

## Phase 5: User Story 3 — Secret Word Visibility (Priority: P3)

**Goal**: Deterministic word selection; drawer-only visibility in API and UI; scores start at 0.

**Independent Test**: Drawer tab shows word; guesser tab and guesser API poll omit `secretWord`.

### Implementation for User Story 3

- [x] T017 [US3] Create `selectSecretWord(code)` in backend/src/services/wordSelection.ts
- [x] T018 [P] [US3] Add Vitest cases for deterministic word selection in backend/src/services/wordSelection.test.ts
- [x] T019 [US3] Assign `secretWord` and initialize `scores` to 0 for all participants in `startGame()` in backend/src/services/roomStore.ts
- [x] T020 [US3] Filter snapshot: include `secretWord` only for drawer viewer; omit `availableWords` when playing in backend/src/services/roomStore.ts
- [x] T021 [P] [US3] Add Vitest cases for drawer vs guesser snapshot filtering in backend/src/services/roomStore.test.ts
- [x] T022 [US3] Show secret word panel for drawer only in frontend/src/pages/GamePage.tsx
- [x] T023 [US3] Add ~2000ms game polling with cleanup in frontend/src/pages/GamePage.tsx
- [x] T024 [US3] Render participant scores from `room.scores` in frontend/src/components/Scoreboard.tsx

**Checkpoint**: quickstart.md §3–§5 pass — word hidden from guesser, scores at 0, deterministic word in tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and Scenario 1 regression.

- [x] T025 Run full manual checklist in specs/002-game-start-drawer/quickstart.md including Scenario 1 regression notes
- [x] T026 [P] Run `npm test` in backend/ and `npm run build` in backend/ and frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** and **US1 (Phase 3)** can overlap after T002
- **US1 (Phase 3)** — independent of US2/US3 (name validation only)
- **US2 (Phase 4)** — depends on Foundational (T003–T004)
- **US3 (Phase 5)** — depends on US2 `startGame` path (T011) for round fields
- **Polish (Phase 6)** — after US1–US3

### User Story Dependencies

| Story | Depends on | Independently testable after |
|-------|------------|------------------------------|
| US1 (P1) | Setup | Phase 3 — forms only |
| US2 (P2) | Foundational | Phase 4 — drawer label after start |
| US3 (P3) | US2 backend start + Foundational | Phase 5 — word + scores |

### Parallel Opportunities

- **Foundational**: T004 ∥ T003 (frontend types after backend model defined — T004 parallel once T003 done)
- **US1**: T008 ∥ T009 ∥ T010 (pages + tests after T005–T007)
- **US2**: T013 ∥ T014 (test vs UI after T011–T012)
- **US3**: T018 ∥ T021 (test files); T022–T024 sequential on GamePage/Scoreboard
- **Polish**: T026 parallel backend/frontend builds

---

## Parallel Example: User Story 1

```bash
# Backend chain:
T005 → T006 → T007

# Then in parallel:
T008: CreateRoomPage validation
T009: JoinRoomPage validation
T010: roomStore Vitest name cases
```

---

## Parallel Example: User Story 3

```bash
T017 → T019 → T020

# Parallel tests:
T018: wordSelection.test.ts
T021: snapshot filter tests in roomStore.test.ts

# Frontend (sequential):
T022 → T023 → T024
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup  
2. Phase 3: User Story 1 (skip Foundational if only testing names in lobby)  
3. **STOP and VALIDATE**: Empty name rejected; trimmed names display correctly  

### Incremental Delivery

1. Setup + US1 → name validation  
2. Foundational + US2 → drawer visible after start  
3. US3 → word visibility + scores + game polling  
4. Polish → quickstart + builds  

### Suggested Commit Slices

| Commit scope | Tasks |
|--------------|-------|
| Name validation | T005–T010 |
| Round model + drawer | T003–T004, T011–T016 |
| Secret word + scores | T017–T024 |
| Validation | T025–T026 |

---

## Notes

- Backend Vitest tasks included per plan.md (not mandatory TDD, but specified in plan).
- Canvas drawing and guess submission remain Scenario 3 scope.
- Depends on Scenario 1 (`001-room-setup-lobby`) implementation being present on this branch.
