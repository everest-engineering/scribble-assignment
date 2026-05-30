---
description: "Task list for Gameplay Interaction (Scenario 3)"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Backend Vitest tasks included per plan testing strategy; manual two-browser validation in Polish phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Scenario 2 baseline and artifact alignment before gameplay work

- [x] T001 Review `specs/003-gameplay-interaction/plan.md`, `spec.md`, and `contracts/rooms-api.md` against acceptance criteria
- [x] T002 Confirm Scenario 2 flows (create, join, start, game poll, drawer role, drawer-only word) work on branch `003-gameplay-interaction`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared gameplay model, snapshot shape, and score initialization at game start

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `Stroke` and `Guess` interfaces in `backend/src/models/game.ts`
- [x] T004 Extend internal `Participant` with `score: number` and `Room` with `strokes`, `guesses`, and `scoredParticipantIds` in `backend/src/models/game.ts`
- [x] T005 Extend `RoomSnapshot` with `strokes` and `guesses` arrays and `ParticipantSnapshot` with `score` in `backend/src/models/game.ts`
- [x] T006 Initialize `strokes = []`, `guesses = []`, `scoredParticipantIds = []`, and each participant `score = 0` in `startRoom()` in `backend/src/services/roomStore.ts`
- [x] T007 Include `strokes`, `guesses`, and `participants[].score` in `toRoomSnapshot()` when `status === "playing"` in `backend/src/services/roomStore.ts`
- [x] T008 [P] Mirror `Stroke`, `Guess`, and extended snapshot/participant types in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — snapshots expose gameplay fields; scores zeroed on start

---

## Phase 3: User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer draws on interactive canvas and clears it; strokes sync to all participants via polling

**Independent Test**: Two tabs — drawer draws and clears; guesser sees same strokes/clear within ~3s; guesser cannot draw

### Implementation for User Story 1

- [x] T009 [US1] Implement `addStroke(code, participantId, stroke)` with drawer-only guard in `backend/src/services/roomStore.ts`
- [x] T010 [US1] Implement `clearCanvas(code, participantId)` with drawer-only guard in `backend/src/services/roomStore.ts`
- [x] T011 [P] [US1] Add `addStrokeSchema` and `clearCanvasSchema` in `backend/src/api/schemas.ts`
- [x] T012 [US1] Add `POST /rooms/:code/strokes` and `POST /rooms/:code/canvas/clear` routes in `backend/src/api/rooms.ts`
- [x] T013 [P] [US1] Add `addStroke` and `clearCanvas` API methods in `frontend/src/services/api.ts`
- [x] T014 [US1] Add `addStroke` and `clearCanvas` actions to `frontend/src/state/roomStore.ts`
- [x] T015 [US1] Create `DrawingCanvas` with drawer pointer capture, local render, and guesser read-only replay in `frontend/src/components/DrawingCanvas.tsx`
- [x] T016 [US1] Replace canvas placeholder, wire `DrawingCanvas`, and add Clear Canvas button in `frontend/src/pages/GamePage.tsx`
- [x] T017 [P] [US1] Add vitest cases for drawer-only stroke append and clear in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Drawer can draw/clear; guesser sees synced canvas via existing game poll

---

## Phase 4: User Story 2 — Guessers Submit Valid Guesses (Priority: P2)

**Goal**: Guessers submit trimmed guesses; empty/whitespace rejected; drawer cannot guess; guesses recorded in session

**Independent Test**: Guesser submits `"  pizza  "` (accepted trimmed), `""` and `"   "` (rejected); drawer has no guess form

### Implementation for User Story 2

- [x] T018 [US2] Implement `submitGuess(code, participantId, guessText)` with trim, empty reject, drawer reject, and guess append (no score change yet) in `backend/src/services/roomStore.ts`
- [x] T019 [P] [US2] Add `submitGuessSchema` with trimmed non-empty validation in `backend/src/api/schemas.ts`
- [x] T020 [US2] Add `POST /rooms/:code/guesses` route with error mapping in `backend/src/api/rooms.ts`
- [x] T021 [P] [US2] Add `submitGuess` API method in `frontend/src/services/api.ts`
- [x] T022 [US2] Add `submitGuess` action to `frontend/src/state/roomStore.ts`
- [x] T023 [US2] Wire form submit with client trim, empty rejection, and `roomStore.submitGuess` in `frontend/src/components/GuessForm.tsx`
- [x] T024 [US2] Pass `onSubmitGuess` handler and disable when not guesser from `frontend/src/pages/GamePage.tsx` to `GuessForm.tsx`
- [x] T025 [P] [US2] Add vitest cases for empty guess rejection and drawer cannot guess in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Valid guesses recorded server-side; invalid submissions rejected with clear errors

---

## Phase 5: User Story 3 — Guess History Syncs to All Players (Priority: P3)

**Goal**: All participants see shared chronological guess history updated via ~2s polling

**Independent Test**: Guesser submits two guesses; both tabs show both entries with name and trimmed text within ~3s

### Implementation for User Story 3

- [x] T026 [US3] Render chronological guess list with participant name and trimmed text in `frontend/src/components/ResultPanel.tsx`
- [x] T027 [US3] Pass `room.guesses` from `frontend/src/pages/GamePage.tsx` to `ResultPanel.tsx`
- [x] T028 [US3] Show empty/waiting state when `guesses` is empty in `frontend/src/components/ResultPanel.tsx`
- [x] T029 [P] [US3] Add vitest asserting `toRoomSnapshot` includes appended guesses in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Activity panel reflects live guess history on all clients via poll

---

## Phase 6: User Story 4 — Correct Guesses Score Points Deterministically (Priority: P4)

**Goal**: Scores start at 0; case-insensitive correct match +100 once per participant; incorrect +0; scoreboard synced

**Independent Test**: Submit `"PIZZA"` (score 0), then `"Rocket"` (score 100); repeat correct guess does not stack; both tabs show same scoreboard

### Implementation for User Story 4

- [x] T030 [US4] Add case-insensitive match, `isCorrect` flag, +100 scoring, and `scoredParticipantIds` cap in `submitGuess()` in `backend/src/services/roomStore.ts`
- [x] T031 [US4] Render participant names and live scores from snapshot in `frontend/src/components/Scoreboard.tsx`
- [x] T032 [US4] Pass `room.participants` scores from `frontend/src/pages/GamePage.tsx` to `Scoreboard.tsx`
- [x] T033 [P] [US4] Add vitest cases for +100 correct, +0 incorrect, and first-correct cap in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Full Scenario 3 gameplay — draw, guess, history, scoring

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and build gates before Scenario 4

- [x] T034 Run manual two-browser validation per `specs/003-gameplay-interaction/quickstart.md`
- [x] T035 [P] Run `npm run build` in `backend/` and `frontend/` and fix any type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001–T002 — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (T003–T008)
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1 canvas UI (can parallel backend after Foundational)
- **User Story 3 (Phase 5)**: Depends on US2 guess recording (T018) for meaningful history data
- **User Story 4 (Phase 6)**: Depends on US2 `submitGuess` shell (T018); extends same function with scoring
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2–US4
- **US2 (P2)**: After Foundational — no dependency on US1 canvas (backend guess route independent)
- **US3 (P3)**: After US2 guess append — UI-only once guesses exist in snapshot
- **US4 (P4)**: After US2 submitGuess base — scoring extends T018 in same service function

### Within Each User Story

- Backend store logic before API routes
- API routes before frontend API client
- Frontend store before components
- Vitest after store logic for that story

### Parallel Opportunities

- T008 parallel with T006–T007 after T003–T005 types exist
- T011, T013 parallel (schemas vs frontend api) after T009–T010
- T017, T025, T029, T033 vitest tasks parallel by story (same file — sequence commits)
- T035 parallel backend/frontend builds
- US1 frontend (T015–T016) parallel with US2 backend (T018–T020) after Foundational

---

## Parallel Example: Foundational Phase

```bash
# After T003–T005 types exist:
Task T006: "Init gameplay fields in startRoom in backend/src/services/roomStore.ts"
Task T008: "Mirror types in frontend/src/services/api.ts"
```

---

## Parallel Example: User Story 1 + User Story 2 Backend

```bash
# After Foundational checkpoint:
Task T009: "addStroke in backend/src/services/roomStore.ts"
Task T018: "submitGuess base in backend/src/services/roomStore.ts"
Task T011: "stroke/clear schemas in backend/src/api/schemas.ts"
Task T019: "submitGuessSchema in backend/src/api/schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T008)
3. Complete Phase 3: User Story 1 (T009–T017)
4. **STOP and VALIDATE**: Drawer draws/clears; guesser sees synced canvas
5. Demo canvas slice before guess/score work

### Incremental Delivery

1. Setup + Foundational → gameplay model and snapshots ready
2. Add US1 → canvas draw/sync validated (MVP)
3. Add US2 → guess submission validated
4. Add US3 → shared history UI validated
5. Add US4 → scoring and scoreboard validated
6. Polish → quickstart + builds

### Suggested Commit Granularity

- Commit after Foundational (model + snapshot + frontend types)
- Commit after each user story phase passes its checkpoint
- Final commit after quickstart validation

---

## Notes

- Total tasks: **35** (Setup: 2, Foundational: 6, US1: 9, US2: 8, US3: 4, US4: 4, Polish: 2)
- MVP scope: Phases 1–3 (T001–T017)
- Round end, result reveal, and restart deferred to Scenario 4
- Game-screen polling from Scenario 2 reused — no new poll infrastructure
- Three new REST endpoints: strokes, canvas/clear, guesses per `contracts/rooms-api.md`
- Fixed canvas dimensions should be shared constants for coordinate alignment across clients
