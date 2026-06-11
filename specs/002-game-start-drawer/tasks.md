# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Manual two-tab validation per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` at repository root
- Adjust paths based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**No setup tasks needed** — project infrastructure (Express, React, Vite, Vitest, TypeScript, Zod) is already initialized from the starter.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend game start logic that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. The `startRoom` function has two bugs to fix: (1) assigns non-host as drawer, (2) always picks `STARTER_WORDS[0]`.

- [ ] T001 Fix drawer assignment in `startRoom()` in `backend/src/services/roomStore.ts` — change to `participants.find(p => p.id === hostId)` per FR-001
- [ ] T002 [P] Fix word selection in `startRoom()` in `backend/src/services/roomStore.ts` — use `charCodeSum(room.code) % 5` index per FR-002
- [ ] T003 [P] Add role‑aware `secretWord` filtering in `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — strip `secretWord` when `viewerParticipantId !== drawer.id` per FR-003
- [ ] T004 Update `backend/src/services/roomStore.test.ts` — assert drawer is host, word varies by room code, secretWord hidden for guessers

**Checkpoint**: Foundation ready — backend correctly assigns host=drawer, selects word deterministically, and hides word from guessers in snapshots.

---

## Phase 3: User Story 1 — Start Game and See Game Screen (Priority: P1) 🎯 MVP

**Goal**: Host starts a game from the lobby; all participants see the game screen with their role clearly identified and the drawer sees a canvas with drawing tools.

**Independent Test**: Create a room with two browser tabs (host + one other), host clicks "Start Game", verify both tabs show the game screen with correct role indicators within 3 seconds.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create `Canvas` component in `frontend/src/components/Canvas.tsx` — HTML5 `<canvas>` with freehand brush (mousedown/mousemove/mouseup) and 8-color palette picker
- [ ] T006 [P] [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — add `useEffect` to start polling via `roomStore.startPolling()` on mount when room status is `"playing"`
- [ ] T007 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — role‑based rendering: render `Canvas` (interactive) for drawer, render `Canvas` (view-only, no brush handlers) for guessers
- [ ] T008 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — show current viewer's role badge (drawer/guesser) and drawer's participant name from room snapshot
- [ ] T009 [US1] Update `RoomStore` in `frontend/src/state/roomStore.ts` — expose `viewerRole` and `drawerName` computed from room snapshot participants
- [ ] T010 [US1] Add canvas and role‑badge CSS classes in `frontend/src/styles/app.css`

**Checkpoint**: Two‑tab test passes — both tabs show game screen; drawer tab has interactive canvas; guesser tab has view‑only canvas.

---

## Phase 4: User Story 2 — Drawer Word Visibility (Priority: P1)

**Goal**: The secret word is visible to the drawer only. Guessers cannot see the word at any point during the round.

**Independent Test**: Create a room with two tabs, start the game, verify the drawer tab shows the word prominently and the guesser tab shows no word.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create `WordDisplay` component in `frontend/src/components/WordDisplay.tsx` — renders the secret word prominently (large text, colored badge) when `viewer.role === "drawer"`
- [ ] T012 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — render `WordDisplay` only when viewer is drawer; hide word entirely for guessers (no placeholder or hidden text)
- [ ] T013 [US2] Add word‑display CSS classes in `frontend/src/styles/app.css`

**Checkpoint**: Two‑tab test passes — drawer sees "rocket" (or other word) prominently; guesser sees no trace of the word.

---

## Phase 5: User Story 3 — Deterministic Drawer Assignment (Priority: P2)

**Goal**: The host is always the first drawer when the game starts, even if the original host has left and a new host was assigned.

**Independent Test**: Create a room with 3 participants, start the game, verify the host is always the drawer. Then have the host leave and verify the new host becomes drawer.

### Implementation for User Story 3

- [ ] T014 [P] [US3] Add backend test in `backend/src/services/roomStore.test.ts` — verify `startRoom` assigns host as drawer with 2, 3, and 4 participants
- [ ] T015 [US3] Add backend test in `backend/src/services/roomStore.test.ts` — verify host‑transfer scenario: original host leaves, new host assigned, start game → new host is drawer

**Checkpoint**: `npm test` in `backend/` passes. Host is always drawer regardless of participant count or host changes.

---

## Phase 6: User Story 4 — Deterministic Word Selection (Priority: P2)

**Goal**: The same word is always selected for the same room code, ensuring reproducible game behavior.

**Independent Test**: Create a room, note the word, recreate the same room (same code), verify the same word is selected.

### Implementation for User Story 4

- [ ] T016 [P] [US4] Add backend test in `backend/src/services/roomStore.test.ts` — verify `startRoom` selects word deterministically: same room code → same word; different codes may produce different words
- [ ] T017 [US4] Add backend test in `backend/src/services/roomStore.test.ts` — verify word is always from `STARTER_WORDS` list (`["rocket", "pizza", "castle", "guitar", "sunflower"]`)

**Checkpoint**: `npm test` in `backend/` passes. Word selection is deterministic and within the starter word list.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and validation.

- [ ] T018 Verify page refresh returns player to correct game state (use polling to restore role, drawer identity, word if applicable)
- [ ] T019 Verify non‑drawer participants cannot interact with canvas (canvas controls hidden/disabled for guessers)
- [ ] T020 Verify display names are trimmed of leading/trailing whitespace in game UI
- [ ] T021 Run `quickstart.md` validation scenarios with two browser tabs
- [ ] T022 Run both builds: `cd backend && npm run build` and `cd frontend && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already initialized
- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 3+)**:
  - US1 (Phase 3): Depends on Foundational (Phase 2)
  - US2 (Phase 4): Depends on Foundational (Phase 2) — shares GamePage with US1 but can be implemented in parallel if needed
  - US3 (Phase 5): Depends on Foundational (Phase 2) — backend tests only, no frontend dependencies
  - US4 (Phase 6): Depends on Foundational (Phase 2) — backend tests only, no frontend dependencies
- **Polish (Phase 7)**: Depends on US1 and US2 being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start after Foundational
- **US2 (P1)**: No strict dependencies on other stories — `WordDisplay` is independent of `Canvas`
- **US3 (P2)**: No dependencies on other stories — pure backend tests
- **US4 (P2)**: No dependencies on other stories — pure backend tests
- US3 and US4 can be completed in any order after Foundational

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 2**: T002 and T003 are [P] — word selection and snapshot filtering are independent file changes
- **Phase 3**: T005 (Canvas) and T006 (GamePage polling) are [P] — different files, no cross-dependency
- **All phases**: US1, US2, US3, US4 can be worked on in parallel after Phase 2 completes

---

## Parallel Example: User Story 1

```bash
# Launch independent components together:
Task: "Create Canvas component in frontend/src/components/Canvas.tsx"
Task: "Update GamePage polling in frontend/src/pages/GamePage.tsx"

# Then wire together:
Task: "Role-based rendering in GamePage"
```

## Parallel Example: User Story 3 & 4 (P2)

```bash
# All backend tests are independent:
Task: "Drawer assignment tests in backend/src/services/roomStore.test.ts"
Task: "Word selection tests in backend/src/services/roomStore.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — P1 only)

1. Complete Phase 2: Foundational (backend logic)
2. Complete Phase 3: User Story 1 (frontend game screen + canvas)
3. Complete Phase 4: User Story 2 (word display)
4. **STOP and VALIDATE**: Run quickstart scenarios 1-3 with two browser tabs
5. MVP delivers: game start, role identification, canvas, word visibility

### Incremental Delivery

1. Phase 2 (Foundational) → Backend game start works correctly
2. Phase 3 (US1) → Game screen with role‑based canvas → Test independently
3. Phase 4 (US2) → Word display → Test independently
4. Phase 5 (US3) → Deterministic drawer tests → Verify
5. Phase 6 (US4) → Deterministic word tests → Verify
6. Phase 7 (Polish) → Edge cases + build validation

### Parallel Team Strategy

With multiple developers:
1. Complete Phase 2 (Foundational) together
2. Once Foundational is done:
   - Developer A: US1 (frontend game page + canvas)
   - Developer B: US2 (word display)
   - Developer C: US3 + US4 (backend tests)
3. US1 + US2 combine for MVP delivery

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No new dependencies or libraries — use HTML5 Canvas API (zero dependencies)
- Backend already has the `startRoom` and `toRoomSnapshot` functions — T001–T003 are fixes, not greenfield
