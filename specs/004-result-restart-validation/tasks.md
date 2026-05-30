# Tasks: Result, Restart & Final Validation (Scenario 4)

**Input**: Design documents from `specs/004-result-restart-validation/`  
**Prerequisites**: plan.md, spec.md; Scenarios 1–3 complete (`specs/001-room-setup-lobby/`, `specs/002-game-start-drawer-flow/`, `specs/003-gameplay-interaction/`)  
**Branch**: `scribble-lab`

**Organization**: Tasks grouped by user story (P1→P5) for independent implementation and two-tab validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1–US5) on story-phase tasks only
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield starter and Scenarios 1–3 prerequisites are ready.

- [X] T001 Confirm Scenarios 1–3 game flow works and starter files listed in `specs/004-result-restart-validation/plan.md` exist under `backend/src/` and `frontend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No cross-story foundational slice — `results` status and transitions are introduced per user story phase per plan.

**Checkpoint**: Proceed to Phase 3 (US1) after T001.

---

## Phase 3: User Story 1 — Round Ends After a Correct Guess (Priority: P1) 🎯 MVP

**Goal**: First case-insensitive correct guess transitions the room to `results`; strokes and guesses are rejected afterward.

**Independent Test**: Guesser submits correct guess — room status becomes `results`; subsequent guess and stroke attempts return errors; Vitest passes.

**Maps to**: FR-001, FR-002, FR-003, SC-001

### Implementation for User Story 1

- [X] T002 [US1] Add `"results"` to `RoomStatus` in `backend/src/models/game.ts`
- [X] T003 [US1] Set `room.status = "results"` when `isCorrect` in `submitGuess` in `backend/src/services/roomStore.ts`
- [X] T004 [US1] Add correct-guess→results, post-results guess rejection, and post-results stroke/clear rejection tests in `backend/src/services/roomStore.test.ts`

**Checkpoint**: User Story 1 independently testable via Vitest and API — correct guess ends the round; gameplay mutations blocked.

---

## Phase 4: User Story 2 — Result Shows Word, Scores, and History to All (Priority: P2)

**Goal**: Results snapshot reveals secret word to all viewers; Result page displays word, final scores, and full guess history.

**Independent Test**: After round ends, GET snapshot for guesser shows `secretWord`; Result page renders matching word, scores, and history.

**Maps to**: FR-004, FR-005, FR-006, SC-002

### Implementation for User Story 2

- [X] T005 [US2] Extend `toRoomSnapshot` with `results` branch — expose `secretWord` to all viewers, final `score`, and `guesses` in `backend/src/services/roomStore.ts`
- [X] T006 [US2] Add non-drawer viewer receives `secretWord` when status is `results` test in `backend/src/services/roomStore.test.ts`
- [X] T007 [P] [US2] Add `"results"` to `RoomStatus` in `frontend/src/services/api.ts`
- [X] T008 [US2] Create `ResultPage` with revealed word, `Scoreboard`, `ResultPanel`, and participant list in `frontend/src/pages/ResultPage.tsx`
- [X] T009 [P] [US2] Add result page layout and word-reveal styles in `frontend/src/styles/app.css`
- [X] T010 [US2] Register `/result` route pointing to `ResultPage` in `frontend/src/routes/index.tsx`

**Checkpoint**: User Stories 1 and 2 work — results snapshot and Result page display authoritative outcome data.

---

## Phase 5: User Story 3 — Result State Stays Synchronized via Polling (Priority: P3)

**Goal**: Result view polls ~2s; word, scores, and history stay consistent; poll errors surface without crashing.

**Independent Test**: Two tabs on `/result` show identical data; simulated poll failure shows error message; next poll reconciles.

**Maps to**: FR-007, SC-002

### Implementation for User Story 3

- [X] T011 [US3] Create `useResultPolling` hook with ~2s interval, lobby navigation on status change, and error state in `frontend/src/hooks/useResultPolling.ts`
- [X] T012 [US3] Wire `useResultPolling` and poll error display in `frontend/src/pages/ResultPage.tsx`

**Checkpoint**: User Stories 1–3 work — result data syncs across tabs via polling.

---

## Phase 6: User Story 4 — Host Restarts to Lobby with Round State Cleared (Priority: P4)

**Goal**: Host-only restart from `results` returns room to `lobby` with participants preserved and all round fields cleared.

**Independent Test**: Host restart → lobby snapshot has no round data; same participants remain; non-host gets 403; fresh start works.

**Maps to**: FR-008, FR-009, FR-010, FR-011, FR-012, SC-003, SC-004, SC-005

### Implementation for User Story 4

- [X] T013 [US4] Implement `restartGame` with host and `results` guards and round-field clearing in `backend/src/services/roomStore.ts`
- [X] T014 [US4] Add `restartGameSchema` in `backend/src/api/schemas.ts`
- [X] T015 [US4] Add `POST /:code/restart` route with 404/403/400 error mapping in `backend/src/api/rooms.ts`
- [X] T016 [US4] Add host restart, non-host rejection, and round-field-clear tests in `backend/src/services/roomStore.test.ts`
- [X] T017 [P] [US4] Add `restartRoom` API method in `frontend/src/services/api.ts`
- [X] T018 [US4] Add `restartRoom` store action in `frontend/src/state/roomStore.ts`
- [X] T019 [US4] Add host-only Restart button with error handling in `frontend/src/pages/ResultPage.tsx`

**Checkpoint**: User Stories 1–4 work — host can restart to a clean lobby; non-host cannot.

---

## Phase 7: User Story 5 — Clients Navigate Together Through End and Restart (Priority: P5)

**Goal**: All clients auto-navigate game→result on round end and result→lobby on restart via polling and immediate guess response.

**Independent Test**: Two tabs — correct guess moves both to `/result` within one poll; host restart moves both to `/lobby` without manual URL changes.

**Maps to**: FR-013, FR-014, FR-015, SC-006, SC-007

### Implementation for User Story 5

- [X] T020 [US5] Navigate to `/result` when polled snapshot status is `results` in `frontend/src/hooks/useGamePolling.ts`
- [X] T021 [US5] Redirect `playing`→`/game` and `results`→`/result` in initial check and poll in `frontend/src/hooks/useLobbyPolling.ts`
- [X] T022 [US5] Redirect to `/result` when `room.status === "results"` in `frontend/src/pages/GamePage.tsx`
- [X] T023 [US5] Navigate to `/result` when `submitGuess` response has `status === "results"` in `frontend/src/state/roomStore.ts`
- [X] T024 [US5] Navigate to `/lobby` after successful `restartRoom` in `frontend/src/state/roomStore.ts`

**Checkpoint**: All user stories complete — full round→result→lobby navigation sync across clients.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Tests, builds, and manual validation across all stories.

- [X] T025 [P] Update mocks for `results` status and `restartRoom` in `frontend/src/services/api.test.ts`
- [X] T026 Run backend Vitest suite in `backend/`
- [X] T027 Run `npm run build` in `backend/` and `frontend/`
- [X] T028 Manual two-tab validation per Testing Strategy in `specs/004-result-restart-validation/plan.md` (round end, result sync, restart, fresh start, join-during-results rejected)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Informational only — proceed after T001
- **User Stories (Phase 3–7)**: Sequential by priority (US1 → US2 → US3 → US4 → US5)
- **Polish (Phase 8)**: Depends on all user story phases complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 (P1) | T001 | Backend round-end only — MVP |
| US2 (P2) | US1 | Needs `results` status and snapshot branch |
| US3 (P3) | US2 | Needs `ResultPage` to poll |
| US4 (P4) | US1 | Backend restart can follow US1; UI restart button needs `ResultPage` (US2) |
| US5 (P5) | US2, US3, US4 | Navigation ties game, result, and lobby views |

### Within Each User Story

- Backend model/service before routes
- Backend tests after service changes
- Frontend types before pages/hooks
- Pages before navigation wiring (US5 last)

### Parallel Opportunities

- **T007 + T009**: Frontend type and CSS (different files) after T005
- **T017 + T025**: API method and test mocks (different files) during US4/Polish
- US1 backend (T002–T004) can start immediately after T001 with no frontend work

---

## Parallel Example: User Story 2

```bash
# After T005–T006 (backend snapshot), launch in parallel:
Task T007: Add "results" to RoomStatus in frontend/src/services/api.ts
Task T009: Add result page styles in frontend/src/styles/app.css

# Then sequentially:
Task T008: Create ResultPage in frontend/src/pages/ResultPage.tsx
Task T010: Register /result route in frontend/src/routes/index.tsx
```

---

## Parallel Example: User Story 4

```bash
# After T013–T016 (backend restart), launch in parallel:
Task T017: Add restartRoom in frontend/src/services/api.ts
Task T016: (already done) restart tests in backend/src/services/roomStore.test.ts

# Then:
Task T018: restartRoom store action in frontend/src/state/roomStore.ts
Task T019: Restart button in frontend/src/pages/ResultPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (Setup)
2. Complete T002–T004 (US1 — round ends on correct guess)
3. **STOP and VALIDATE**: Vitest + manual API — correct guess returns `status: "results"`; mutations rejected

### Incremental Delivery

1. US1 → round-end transition (MVP backend)
2. US2 → result snapshot + Result page display
3. US3 → result polling sync
4. US4 → host restart to clean lobby
5. US5 → automatic navigation across views
6. Polish → builds + two-tab final validation

### Suggested Commit Slices

- After US1: `feat: end round on correct guess`
- After US2–US3: `feat: result page with polling sync`
- After US4–US5: `feat: host restart and navigation sync`
- After Polish: `chore: scenario 4 validation`

---

## Notes

- Join during `results` is already rejected by existing `joinRoom` lobby guard — no task required (FR-012)
- Optional polish: read-only `DrawingCanvas` with final strokes on `ResultPage` — not required for spec acceptance
- Do not add drawer rotation, timers, WebSockets, DB, or auth
- Verify Vitest passes after each backend phase before frontend navigation work
