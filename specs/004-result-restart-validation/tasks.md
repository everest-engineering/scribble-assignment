# Tasks: Result and Restart

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per constitution — service, schema, and API client tests for all new code.

**Organization**: Tasks grouped by user story for independent delivery.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lab deliverable and documentation pointer

- [X] T001 Create `reflection.md` at repo root covering Scenarios 1–4, AI usage, and tradeoffs (≥500 chars)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend restart + result snapshot — blocks all user stories

**⚠️ CRITICAL**: No user story work until this phase completes

- [X] T002 Add `RestartNotHostError` and `RestartInvalidStateError` in `backend/src/services/roomStore.ts`
- [X] T003 Implement `restartRoom(code, participantId)` in `backend/src/services/roomStore.ts`
- [X] T004 Update `toRoomSnapshot` to reveal `secretWord` to all viewers when `status === "result"` in `backend/src/services/roomStore.ts`
- [X] T005 [P] Add `restartRoomSchema` in `backend/src/api/schemas.ts`
- [X] T006 Wire POST `/rooms/:code/restart` and error mapping in `backend/src/api/rooms.ts`
- [X] T007 [P] Add `restartGame` API client in `frontend/src/services/api.ts`
- [X] T008 Add `restartGame` store action in `frontend/src/state/roomStore.ts`

**Checkpoint**: Restart endpoint callable; result snapshots reveal word to all

---

## Phase 3: User Story 1 - Shared result state (Priority: P1) 🎯 MVP

**Goal**: All players see revealed word, final scores, full guess history in result state

**Independent Test**: Two tabs after correct guess — both show word and history

### Tests for User Story 1

- [X] T009 [P] [US1] Tests for `toRoomSnapshot` word reveal in result vs playing in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Update `ResultPanel.tsx` with revealed word banner and result-state styling
- [X] T011 [US1] Update `GamePage.tsx` result layout: show revealed word card for all, disable draw/guess in result

**Checkpoint**: Result view complete for all participants

---

## Phase 4: User Story 2 - Host restart to lobby (Priority: P1)

**Goal**: Host-only Play Again clears round and returns all tabs to lobby

**Independent Test**: Host restarts; guest auto-redirects; participants preserved

### Tests for User Story 2

- [X] T012 [P] [US2] Tests for `restartRoom` happy/reject paths in `backend/src/services/roomStore.test.ts`
- [X] T013 [P] [US2] Restart schema tests in `backend/src/api/schemas.test.ts`
- [X] T014 [P] [US2] `restartGame` API client test in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [X] T015 [US2] Add host-only Play Again button on `GamePage.tsx` calling `restartGame` and navigating to `/lobby`
- [X] T016 [US2] Add `useEffect` on `GamePage.tsx` to redirect to `/lobby` when polled status becomes `lobby`
- [X] T017 [US2] Verify `LobbyPage.tsx` shows participants after restart via existing polling

**Checkpoint**: Full restart loop works in two tabs

---

## Phase 5: User Story 3 - Final validation (Priority: P1)

**Goal**: Complete Scenarios 1–4 walkthrough and precheck pass

**Independent Test**: quickstart.md two-tab flow; precheck green

### Implementation for User Story 3

- [X] T018 [US3] Run backend and frontend test suites and builds
- [X] T019 [US3] Run `node .github/scripts/pre-evaluation-check.mjs` and fix any failures
- [X] T020 [US3] Execute manual two-tab validation per `specs/004-result-restart-validation/quickstart.md`

**Checkpoint**: Lab complete — all four README scenarios validated

---

## Phase 6: Polish & Cross-Cutting

- [X] T021 Remove Scenario 4 placeholder copy from `ResultPanel.tsx` if any remains
- [X] T022 [P] Update `reflection.md` with Scenario 4 implementation notes

---

## Dependencies

```text
Phase 1 ──► Phase 2 ──► Phase 3 (US1) ──► Phase 4 (US2) ──► Phase 5 (US3) ──► Phase 6
```

## Parallel execution examples

- T005 + T007 after T004 (schema + API client in parallel)
- T009 + T012 + T013 + T014 after Phase 2 (all tests in parallel)
- T010 + T011 after T009/T004 (UI after snapshot behavior)

## MVP scope

User Story 1 (T009–T011) delivers visible result state; add US2 for restart loop.

## Independent test criteria

| Story | Test |
|-------|------|
| US1 | Both tabs show revealed word + history in result |
| US2 | Host restart → lobby both tabs; non-host blocked |
| US3 | Full quickstart + precheck pass |
