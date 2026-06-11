# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per constitution (Test-First NON-NEGOTIABLE). Write tests before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup

**Purpose**: Project initialization — no new infrastructure needed, all existing.

- [X] T001 Verify backend compiles and tests pass: `cd backend && npx tsc --noEmit && npm test`
- [X] T002 [P] Verify frontend compiles and tests pass: `cd frontend && npx tsc --noEmit && npm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type changes that ALL stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Update `RoomStatus` type in `backend/src/models/game.ts` — add `"result"` to the union
- [X] T004 [P] Update `RoomSnapshot.status` type in `frontend/src/services/api.ts` — add `"result"` to the union

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 - Round Results Display (Priority: P1) 🎯 MVP

**Goal**: When a round ends (auto or manual reveal), all participants see the correct word, final scores per participant, and the complete guess history.

**Independent Test**: Start a game with 2+ players, have all guessers submit correct guesses (room stays in "playing"). Host clicks "Reveal & End Round". Poll `GET /api/rooms/:code` — verify `status === "result"`, and `guesses`, `scores` contain complete round data. On the frontend, verify each participant's screen shows the correct word, scores, and guess history.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T005 [P] [US1] Test auto round-end detection in `backend/src/services/roomStore.test.ts` — all guessers correct transitions to result
- [X] T006 [P] [US1] Test host reveal transitions to result in `backend/src/services/roomStore.test.ts`
- [X] T007 [P] [US1] Test result snapshot data (word, scores, guesses) in `backend/src/services/roomStore.test.ts`
- [X] T008 [P] [US1] Test reveal endpoint validation in `backend/src/api/schemas.test.ts`
- [X] T009 [US1] Test frontend API client reveal call in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [X] T010 [P] [US1] Add `revealRound` function to `backend/src/services/roomStore.ts` — set status to `"result"`
- [X] T011 [P] [US1] Add `isRoundComplete` function to `backend/src/services/roomStore.ts` — check all non-drawer participants have a correct guess
- [X] T012 [US1] Wire auto-detection in `submitGuess` handler in `backend/src/services/roomStore.ts` — after each guess, check and auto-reveal
- [X] T013 [US1] Add `POST /api/rooms/:code/reveal` endpoint in `backend/src/api/rooms.ts` — host-only, requires `"playing"` status
- [X] T014 [US1] Add Zod schema for reveal request in `backend/src/api/schemas.ts`
- [X] T015 [P] [US1] Add `revealRound` method to `frontend/src/services/api.ts`
- [X] T016 [P] [US1] Add `revealRound` method to `frontend/src/state/roomStore.ts`
- [X] T017 [US1] Create `ResultView` component in `frontend/src/components/ResultView.tsx` — display correct word, participant scores, guess history
- [X] T018 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — add "Reveal & End Round" button for host during playing state; when `room.status === "result"`, render `ResultView`; when `room.status === "lobby"` after restart, navigate to `/lobby`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Restart to Lobby (Priority: P2)

**Goal**: After result state is displayed, the host can restart. All participants return to lobby with players preserved and all round state cleared.

**Independent Test**: After a round ends in result state, call `POST /api/rooms/:code/restart?participantId=<hostId>`. Verify `status === "lobby"`, `roundNumber === null`, `drawerId === null`, `strokes === []`, `guesses === []`, `scores === {}`, participants unchanged. On frontend, verify all participants see lobby view.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T019 [P] [US2] Test restart clears all round data in `backend/src/services/roomStore.test.ts`
- [X] T020 [P] [US2] Test restart preserves participants in `backend/src/services/roomStore.test.ts`
- [X] T021 [P] [US2] Test non-host cannot restart in `backend/src/services/roomStore.test.ts`
- [X] T022 [P] [US2] Test restart fails if not in result state in `backend/src/services/roomStore.test.ts`
- [X] T023 [US2] Test frontend API client restart call in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Add `restartGame` function to `backend/src/services/roomStore.ts` — clear rounds, set status to `"lobby"`, preserve participants
- [X] T025 [US2] Add `POST /api/rooms/:code/restart` endpoint in `backend/src/api/rooms.ts` — host-only, requires `"result"` status
- [X] T026 [US2] Add Zod schema for restart request in `backend/src/api/schemas.ts`
- [X] T027 [P] [US2] Add `restartGame` method to `frontend/src/services/api.ts`
- [X] T028 [P] [US2] Add `restartGame` method to `frontend/src/state/roomStore.ts`
- [X] T029 [US2] Add "Restart" button to `ResultView` component — only visible to host; calls `roomStore.restartGame()` which triggers lobby navigation via GamePage's status watch
- [X] T030 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — when polling detects `status === "lobby"` after restart, navigate to lobby page

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Validation

**Purpose**: End-to-end validation and cleanup.

- [X] T031 Run `cd backend && npx tsc --noEmit` — verify no type errors
- [X] T032 [P] Run `cd frontend && npx tsc --noEmit` — verify no type errors
- [X] T033 Run `cd backend && npm test` — verify all backend tests pass
- [X] T034 Run `cd frontend && npm test` — verify all frontend tests pass
- [X] T035 Run backend + frontend together and validate against quickstart scenarios in `specs/004-result-restart/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational
  - US1 and US2 can proceed in parallel (different concerns)
  - Or sequentially in priority order (US1 → US2)
- **Polish (Final Phase)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — independently implementable from US1 (only needs result state to already exist)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/type changes before services
- Services before endpoints
- Backend before frontend integration
- Story complete before moving to next

### Parallel Opportunities

| Task IDs | Rationale |
|----------|-----------|
| T001, T002 | Different packages, no deps |
| T003, T004 | Different files, no deps |
| T005–T008 | All different test files, no deps |
| T010, T011 | Different functions in same file but independent |
| T015, T016 | Different frontend files, no deps |
| T019–T022 | All different test cases, no deps |
| T027, T028 | Different frontend files, no deps |
| T031, T032 | Different packages, same concern |

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phases 1–2: Setup + Foundational
2. Phase 3: User Story 1 (Round Results Display)
3. **STOP and VALIDATE**: Test US1 independently
4. Deploy/demo if ready — players can see round results

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Round Results Display) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Restart to Lobby) → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories
