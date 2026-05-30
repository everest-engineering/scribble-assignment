---
description: "Task list for Result, Restart & Final Validation (Scenario 4)"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Backend Vitest tasks included per plan testing strategy; manual two-browser validation in Polish phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Scenario 3 baseline and artifact alignment before result/restart work

- [ ] T001 Review `specs/004-result-restart-validation/plan.md`, `spec.md`, and `contracts/rooms-api.md` against acceptance criteria
- [ ] T002 Confirm Scenario 3 flows (draw, guess, score, game poll) work on branch `004-result-restart-validation`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend room status model and snapshot shape for `result` state

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add `"result"` to `RoomStatus` type in `backend/src/models/game.ts`
- [ ] T004 [P] Mirror `RoomStatus` with `"result"` in `frontend/src/services/api.ts`
- [ ] T005 Update `toRoomSnapshot()` to expose `secretWord` to all viewers, include `guesses`/scores, and omit `strokes` when `status === "result"` in `backend/src/services/roomStore.ts`
- [ ] T006 Update `participantRole()` to return drawer/guesser roles when `status === "result"` in `backend/src/services/roomStore.ts`
- [ ] T007 Verify `addStroke`, `clearCanvas`, and `submitGuess` reject when `status !== "playing"` in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — `result` status modeled; snapshot and gameplay guards aligned with data-model.md

---

## Phase 3: User Story 1 — Host Ends the Round and Enters Result State (Priority: P1) 🎯 MVP

**Goal**: Host ends active round; session transitions to result state; gameplay controls disabled; all clients sync via poll

**Independent Test**: Two tabs — host clicks End Round; both transition in-place to result mode within ~3s; guess/draw disabled

### Implementation for User Story 1

- [ ] T008 [US1] Implement `endRoom(code, participantId)` with host-only and `playing` guards in `backend/src/services/roomStore.ts`
- [ ] T009 [P] [US1] Add `endRoomSchema` (participantId body) in `backend/src/api/schemas.ts`
- [ ] T010 [US1] Add `POST /rooms/:code/end` route with error mapping in `backend/src/api/rooms.ts`
- [ ] T011 [P] [US1] Add `endRoom` API method in `frontend/src/services/api.ts`
- [ ] T012 [US1] Add `endRoom` action to `frontend/src/state/roomStore.ts`
- [ ] T013 [US1] Extend poll effect to run when `room.status` is `"playing"` or `"result"` in `frontend/src/pages/GamePage.tsx`
- [ ] T014 [US1] Add host-only End Round button and `roomStore.endRoom` handler in `frontend/src/pages/GamePage.tsx`
- [ ] T015 [P] [US1] Add vitest cases for endRoom host guard, not_playing reject, and `playing` → `result` transition in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Host can end round; both clients reach result state via poll; gameplay POSTs rejected after end

---

## Phase 4: User Story 2 — All Players See the Shared Result (Priority: P2)

**Goal**: All participants see secret word, final scores, and full guess history in result mode; canvas hidden

**Independent Test**: After end round, both tabs show matching word/scores/history; guesser sees secret word; no canvas displayed

### Implementation for User Story 2

- [ ] T016 [US2] Branch `GamePage` layout for result mode — hide `DrawingCanvas`, Clear button, and `GuessForm` when `status === "result"` in `frontend/src/pages/GamePage.tsx`
- [ ] T017 [US2] Show secret word card to all participants (not drawer-only) when `status === "result"` in `frontend/src/pages/GamePage.tsx`
- [ ] T018 [US2] Update header/status copy for result mode (e.g., round ended) in `frontend/src/pages/GamePage.tsx`
- [ ] T019 [P] [US2] Add vitest asserting `secretWord` present for non-drawer viewer when `status === "result"` in `backend/src/services/roomStore.test.ts`
- [ ] T020 [P] [US2] Add vitest asserting `strokes` omitted from snapshot when `status === "result"` in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Result screen shows word, scores, history only — synchronized across clients

---

## Phase 5: User Story 3 — Host Restarts and Returns Everyone to the Lobby (Priority: P3)

**Goal**: Host restarts from result; all clients return to lobby; players preserved; round state cleared

**Independent Test**: Host clicks Restart; both tabs land on lobby within ~3s; scores zeroed; no secret word; `/game` redirects to lobby

### Implementation for User Story 3

- [ ] T021 [US3] Implement `restartRoom(code, participantId)` with host-only and `result` guards plus round-field clearing in `backend/src/services/roomStore.ts`
- [ ] T022 [P] [US3] Add `restartRoomSchema` (participantId body) in `backend/src/api/schemas.ts`
- [ ] T023 [US3] Add `POST /rooms/:code/restart` route with error mapping in `backend/src/api/rooms.ts`
- [ ] T024 [P] [US3] Add `restartRoom` API method in `frontend/src/services/api.ts`
- [ ] T025 [US3] Add `restartRoom` action to `frontend/src/state/roomStore.ts`
- [ ] T026 [US3] Add host-only Restart button and `roomStore.restartRoom` handler when `status === "result"` in `frontend/src/pages/GamePage.tsx`
- [ ] T027 [US3] Navigate to `/lobby` when polled snapshot shows `status === "lobby"` in `frontend/src/pages/GamePage.tsx`
- [ ] T028 [P] [US3] Add vitest cases for restartRoom host guard, not_result reject, and field clearing in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Full restart loop — result → lobby with clean state and preserved roster

---

## Phase 6: User Story 4 — Full Game Loop Validates End-to-End (Priority: P4)

**Goal**: Complete four-scenario flow verifiable in two browsers with room isolation

**Independent Test**: lobby → play → result → restart → lobby → second start — all synchronized without manual refresh

### Implementation for User Story 4

- [ ] T029 [US4] Verify `startRoom()` after restart re-initializes fresh round state (scores 0, empty history) in `backend/src/services/roomStore.test.ts`
- [ ] T030 [US4] Confirm non-host cannot invoke end/restart via API (403) in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Backend guards and second-start behavior support full end-to-end acceptance criteria

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Manual validation and build gates for Scenario 4 completion

- [ ] T031 Run manual two-browser validation per `specs/004-result-restart-validation/quickstart.md` (full four-scenario loop)
- [ ] T032 [P] Run `npm run build` in `backend/` and `frontend/` and fix any type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001–T002 — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (T003–T007)
- **User Story 2 (Phase 4)**: Depends on US1 end-round transition (T008–T014) for meaningful result state
- **User Story 3 (Phase 5)**: Depends on US1 result state; independent of US2 UI polish
- **User Story 4 (Phase 6)**: Depends on US1–US3 backend transitions
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: After Foundational — delivers end-round transition and poll extension
- **US2 (P2)**: After US1 — result-mode UI requires `status === "result"` from endRoom
- **US3 (P3)**: After US1 — restart requires result state; UI can parallel US2 after T021 backend exists
- **US4 (P4)**: After US1–US3 — integration tests and manual quickstart

### Within Each User Story

- Backend store logic before API routes
- API routes before frontend API client
- Frontend store before GamePage UI
- Vitest after store logic for that story

### Parallel Opportunities

- T004 parallel with T003 (frontend vs backend types)
- T009, T011 parallel (schemas vs frontend api) after T008
- T015, T019, T020, T028 vitest tasks parallel by story (same file — sequence commits)
- T022, T024 parallel after T021
- T016–T018 (US2 UI) parallel with T021–T023 (US3 backend) after US1 checkpoint
- T032 parallel backend/frontend builds

---

## Parallel Example: Foundational Phase

```bash
# After T003 types exist:
Task T005: "Update toRoomSnapshot for result in backend/src/services/roomStore.ts"
Task T004: "Mirror RoomStatus in frontend/src/services/api.ts"
```

---

## Parallel Example: User Story 2 UI + User Story 3 Backend

```bash
# After US1 checkpoint (end-round works):
Task T016: "Result mode layout in frontend/src/pages/GamePage.tsx"
Task T021: "restartRoom in backend/src/services/roomStore.ts"
Task T022: "restartRoomSchema in backend/src/api/schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T007)
3. Complete Phase 3: User Story 1 (T008–T015)
4. **STOP and VALIDATE**: Host ends round; both clients reach result state; gameplay blocked
5. Demo end-round slice before result UI polish

### Incremental Delivery

1. Setup + Foundational → `result` status and snapshot ready
2. Add US1 → end-round transition validated (MVP)
3. Add US2 → shared result UI validated
4. Add US3 → restart to lobby validated
5. Add US4 → integration guards validated
6. Polish → full quickstart + builds

### Suggested Commit Granularity

- Commit after Foundational (status type + snapshot)
- Commit after US1 (end-round backend + frontend)
- Commit after US2 (result mode UI)
- Commit after US3 (restart flow)
- Final commit after quickstart validation

---

## Notes

- Total tasks: **32** (Setup: 2, Foundational: 5, US1: 8, US2: 5, US3: 8, US4: 2, Polish: 2)
- MVP scope: Phases 1–3 (T001–T015)
- Two new REST endpoints: `POST /rooms/:code/end`, `POST /rooms/:code/restart` per `contracts/rooms-api.md`
- No new routes on frontend — in-place result mode on `/game` per clarifications
- Guess race at end-round handled by synchronous `playing` guard — no extra locking
- `Scoreboard` and `ResultPanel` reused from Scenario 3; only visibility/layout changes in result mode
