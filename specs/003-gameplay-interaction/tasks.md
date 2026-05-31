# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm branch, design artifacts, and Scenario 1–2 prerequisites.

- [x] T001 Confirm branch `003-gameplay-interaction-drawing` and review spec.md, plan.md, and contracts/rooms-api.md in specs/003-gameplay-interaction/
- [x] T002 Verify Scenarios 1–2 baseline on branch (`playing` status, startGame, drawerId, secretWord, scores, game polling) or merge/implement 001–002 before proceeding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared gameplay model fields required before US1–US3.

**⚠️ CRITICAL**: User story work depends on this phase.

- [x] T003 Add `Stroke`, `Guess`, `Point` types and extend `Room` with `strokes` and `guesses` in backend/src/models/game.ts
- [x] T004 Initialize empty `strokes` and `guesses` in `startGame()` in backend/src/services/roomStore.ts
- [x] T005 Extend `toRoomSnapshot()` with `strokes`, `guesses`, and `scores` when playing in backend/src/services/roomStore.ts
- [x] T006 [P] Mirror gameplay snapshot fields on `RoomSnapshot` in frontend/src/services/api.ts

**Checkpoint**: Types compile; GET snapshot can carry empty strokes/guesses arrays during an active round.

---

## Phase 3: User Story 1 — Drawer Drawing (Priority: P1) 🎯 MVP

**Goal**: Drawer draws on canvas; strokes persist server-side; guessers see drawing via polling.

**Independent Test**: Two tabs — drawer draws → guesser canvas matches within ~5 s.

### Implementation for User Story 1

- [x] T007 [US1] Implement `appendStroke()` with drawer-only and playing-only guards in backend/src/services/roomStore.ts
- [x] T008 [US1] Add stroke append Zod schemas in backend/src/api/schemas.ts
- [x] T009 [US1] Add `POST /rooms/:code/drawing/strokes` route in backend/src/api/rooms.ts
- [x] T010 [P] [US1] Add Vitest cases for drawer-only stroke append in backend/src/services/roomStore.test.ts
- [x] T011 [P] [US1] Add `appendStroke` client method in frontend/src/services/api.ts
- [x] T012 [US1] Add `appendStroke` action in frontend/src/state/roomStore.ts
- [x] T013 [US1] Create interactive `DrawingCanvas` component in frontend/src/components/DrawingCanvas.tsx
- [x] T014 [US1] Wire drawer canvas and stroke upload on pointer up in frontend/src/pages/GamePage.tsx
- [x] T015 [US1] Replay strokes on read-only guesser canvas from poll updates in frontend/src/pages/GamePage.tsx

**Checkpoint**: quickstart.md §1 passes — drawing syncs to guesser tab.

---

## Phase 4: User Story 2 — Clear Canvas (Priority: P2)

**Goal**: Drawer clears canvas; all participants see empty canvas after sync.

**Independent Test**: Drawer draws, clears → both tabs empty within ~5 s.

### Implementation for User Story 2

- [x] T016 [US2] Implement `clearStrokes()` with drawer-only and playing-only guards in backend/src/services/roomStore.ts
- [x] T017 [US2] Add `POST /rooms/:code/drawing/clear` route in backend/src/api/rooms.ts
- [x] T018 [P] [US2] Add Vitest cases for drawer-only clear in backend/src/services/roomStore.test.ts
- [x] T019 [P] [US2] Add `clearDrawing` client method in frontend/src/services/api.ts
- [x] T020 [US2] Add `clearDrawing` action in frontend/src/state/roomStore.ts
- [x] T021 [US2] Add drawer-only clear control in frontend/src/components/DrawingCanvas.tsx

**Checkpoint**: quickstart.md §2 passes — clear syncs to all tabs.

---

## Phase 5: User Story 3 — Guesses, History, and Scoring (Priority: P3)

**Goal**: Guessers submit validated guesses; history and scores sync via polling; drawer cannot guess.

**Independent Test**: Wrong then correct guess → history shows both; score +100 only on correct; drawer blocked.

### Implementation for User Story 3

- [x] T022 [US3] Create `evaluateGuess()` with trim and case-insensitive compare in backend/src/services/guessService.ts
- [x] T023 [US3] Implement `submitGuess()` with guesser-only guard and score updates in backend/src/services/roomStore.ts
- [x] T024 [US3] Add guess submission Zod schema in backend/src/api/schemas.ts
- [x] T025 [US3] Add `POST /rooms/:code/guess` route in backend/src/api/rooms.ts
- [x] T026 [P] [US3] Add Vitest cases for trim, case, and +100/0 scoring in backend/src/services/guessService.test.ts
- [x] T027 [P] [US3] Add Vitest cases for drawer blocked from guessing in backend/src/services/roomStore.test.ts
- [x] T028 [P] [US3] Add `submitGuess` client method in frontend/src/services/api.ts
- [x] T029 [US3] Add `submitGuess` action in frontend/src/state/roomStore.ts
- [x] T030 [US3] Wire guess submit and empty-guess validation in frontend/src/components/GuessForm.tsx
- [x] T031 [P] [US3] Create `GuessHistory` component in frontend/src/components/GuessHistory.tsx
- [x] T032 [US3] Render participant scores from `room.scores` in frontend/src/components/Scoreboard.tsx
- [x] T033 [US3] Disable guess form for drawer and show guess history in frontend/src/pages/GamePage.tsx

**Checkpoint**: quickstart.md §3 passes — guesses, history, and scoring work across tabs.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and Scenario 1–2 regression.

- [x] T034 Run full manual checklist in specs/003-gameplay-interaction/quickstart.md including Scenario 1–2 regression notes
- [x] T035 [P] Run `npm test` in backend/ and `npm run build` in backend/ and frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **US1 → US2 → US3** (sequential recommended; US2/US3 depend on prior endpoints)
- **Polish (Phase 6)** — after US1–US3

### User Story Dependencies

| Story | Depends on | Independently testable after |
|-------|------------|------------------------------|
| US1 (P1) | Foundational + Scenarios 1–2 | Phase 3 — drawing sync |
| US2 (P2) | US1 stroke pipeline | Phase 4 — clear canvas |
| US3 (P3) | Foundational scores/secretWord from Scenario 2 | Phase 5 — guesses and scoring |

### Parallel Opportunities

- **Foundational**: T006 ∥ T003–T005 (frontend types after backend model)
- **US1**: T010 ∥ T011 (tests vs API client after T007–T009)
- **US2**: T018 ∥ T019 (tests vs API client after T016–T017)
- **US3**: T026 ∥ T027 ∥ T028 ∥ T031 (test files and components after T022–T025)
- **Polish**: T035 parallel backend/frontend builds

---

## Parallel Example: User Story 1

```bash
# Backend chain:
T007 → T008 → T009

# Then in parallel:
T010: roomStore Vitest stroke auth
T011: api.ts appendStroke

# Frontend sequential:
T012 → T013 → T014 → T015
```

---

## Parallel Example: User Story 3

```bash
T022 → T023 → T024 → T025

# Parallel:
T026: guessService.test.ts
T027: roomStore guess auth tests
T028: api.ts submitGuess
T031: GuessHistory.tsx

# Then:
T029 → T030 → T032 → T033
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup  
2. Phase 2: Foundational  
3. Phase 3: User Story 1  
4. **STOP and VALIDATE**: quickstart.md §1  

### Incremental Delivery

1. Setup + Foundational → model ready  
2. US1 → drawing sync  
3. US2 → clear canvas  
4. US3 → guesses, history, scores  
5. Polish → full quickstart + builds  

### Suggested Commit Slices

| Commit scope | Tasks |
|--------------|-------|
| Foundational model | T003–T006 |
| Drawing (US1) | T007–T015 |
| Clear canvas (US2) | T016–T021 |
| Guesses & scoring (US3) | T022–T033 |
| Validation | T034–T035 |

---

## Notes

- Backend Vitest tasks included per plan.md testing strategy.
- Round end and restart remain Scenario 4 scope.
- Depends on Scenarios 1–2 being present on the branch before gameplay endpoints.
