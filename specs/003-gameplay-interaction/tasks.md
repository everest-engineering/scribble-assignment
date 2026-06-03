# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per constitution — service, schema, and API client tests for all new code.

**Organization**: Tasks grouped by user story for independent delivery.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constants and shared types

- [X] T001 Add Stroke, Guess, score snapshot types and `result` status in `backend/src/models/game.ts`
- [X] T002 [P] Mirror gameplay types in `frontend/src/services/api.ts` RoomSnapshot types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend mutations and snapshot extensions — blocks all user stories

**⚠️ CRITICAL**: No user story work until this phase completes

- [X] T003 Add cap constants and gameplay error classes in `backend/src/services/roomStore.ts`
- [X] T004 Initialize scores (all 0) in `startRound` in `backend/src/services/roomStore.ts`
- [X] T005 Implement `appendStroke` in `backend/src/services/roomStore.ts`
- [X] T006 Implement `clearStrokes` in `backend/src/services/roomStore.ts`
- [X] T007 Implement `submitGuess` with A3 result transition in `backend/src/services/roomStore.ts`
- [X] T008 Extend `toRoomSnapshot` with strokes, guesses, scores in `backend/src/services/roomStore.ts`
- [X] T009 [P] Add Zod schemas for stroke and guess in `backend/src/api/schemas.ts`
- [X] T010 Wire POST `/rooms/:code/strokes`, `/strokes/clear`, `/guess` in `backend/src/api/rooms.ts`
- [X] T011 Map gameplay errors in `mapRoomStoreError` in `backend/src/api/rooms.ts`
- [X] T012 [P] Add `appendStroke`, `clearStrokes`, `submitGuess` API clients in `frontend/src/services/api.ts`
- [X] T013 Add store actions `appendStroke`, `clearStrokes`, `submitGuess` in `frontend/src/state/roomStore.ts`

**Checkpoint**: Backend endpoints callable; snapshots include gameplay fields

---

## Phase 3: User Story 1 - Drawer draws and clears (Priority: P1) 🎯 MVP

**Goal**: Interactive drawer canvas; strokes sync to all via polling

**Independent Test**: Drawer draws and clears; guest sees sync within one poll

### Tests for User Story 1

- [X] T014 [P] [US1] Tests for `appendStroke` happy/reject paths in `backend/src/services/roomStore.test.ts`
- [X] T015 [P] [US1] Tests for `clearStrokes` in `backend/src/services/roomStore.test.ts`
- [X] T016 [P] [US1] Stroke schema tests in `backend/src/api/schemas.test.ts`
- [X] T017 [P] [US1] `appendStroke` API client test in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Create `Canvas.tsx` with 600×400 drawer draw and read-only render in `frontend/src/components/Canvas.tsx`
- [X] T019 [US1] Wire Canvas and clear button on `GamePage.tsx` calling store actions
- [X] T020 [US1] Client-side point decimation before `appendStroke` in `frontend/src/components/Canvas.tsx`

**Checkpoint**: Two-tab stroke sync and clear works

---

## Phase 4: User Story 2 - Guess submission and history (Priority: P1)

**Goal**: Trimmed case-insensitive guesses; full history synced

**Independent Test**: Wrong guess in history both tabs; empty rejected

### Tests for User Story 2

- [X] T021 [P] [US2] Tests for `submitGuess` incorrect path in `backend/src/services/roomStore.test.ts`
- [X] T022 [P] [US2] Guess schema tests in `backend/src/api/schemas.test.ts`
- [X] T023 [P] [US2] `submitGuess` API client test in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Wire `GuessForm.tsx` with trim, empty validation, and `submitGuess` action
- [X] T025 [US2] Render guess history in `ResultPanel.tsx` from polled snapshot
- [X] T026 [US2] Disable guess form for drawer and when status is not `playing` in `GuessForm.tsx`

**Checkpoint**: Guess history visible to all; validation works

---

## Phase 5: User Story 3 - Scoring and round end (Priority: P1)

**Goal**: Scores start 0; correct +100; first correct → result

**Independent Test**: Correct guess ends round; further guesses rejected

### Tests for User Story 3

- [X] T027 [P] [US3] Tests for correct guess +100 and result transition in `backend/src/services/roomStore.test.ts`
- [X] T028 [P] [US3] Tests for score init on start in `backend/src/services/roomStore.test.ts`
- [X] T029 [P] [US3] Tests for guess rejected after result in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 3

- [X] T030 [US3] Wire `Scoreboard.tsx` to display scores from snapshot
- [X] T031 [US3] Update `GamePage.tsx` polling for `playing` and `result`; show status label
- [X] T032 [US3] Show minimal result hint in `ResultPanel.tsx` when status is `result` (no restart UI)

**Checkpoint**: Full Scenario 3 acceptance criteria pass

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T033 Run `cd backend && npm test && npm run build` per quickstart.md
- [X] T034 Run `cd frontend && npm test && npm run build` per quickstart.md
- [X] T035 Run `node .github/scripts/pre-evaluation-check.mjs`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (3–5) → Polish (6)
- US1 can start after Phase 2; US2/US3 depend on Phase 2 backend but frontend can parallel after T013

### User Story Dependencies

- **US1**: Requires T005–T013, T018–T020
- **US2**: Requires T007, T013, T024–T026
- **US3**: Requires T007, T030–T032

### Parallel Opportunities

- T002, T009, T012 in Phase 2 after T001
- All `[P]` test tasks within a story can run together
- T018–T020 (canvas) parallel with T024–T026 (guess UI) after foundational

---

## Parallel Example: User Story 1

```bash
# Tests together:
T014, T015, T016, T017
# Then Canvas implementation T018–T020
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phases 1–2
2. Complete Phase 3 (drawing)
3. Validate two-tab stroke sync

### Incremental Delivery

1. Foundation → Drawing → Guessing → Scoring → Polish builds

---

## Notes

- Total tasks: **35**
- US1: 7 tasks | US2: 6 tasks | US3: 6 tasks
- Do not implement restart endpoint or full Scenario 4 result UI
