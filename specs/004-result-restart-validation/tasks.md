---
description: "Task list for Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between marked tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in all descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Brownfield Baseline Verification)

**Purpose**: Confirm the existing project builds cleanly before any changes are introduced

- [X] T001 Verify baseline build passes: run `npm run build` in `backend/` and `npm run build` in `frontend/`

---

## Phase 2: Foundational (Type System — Blocking Prerequisites)

**Purpose**: Extend the shared data model with the `"finished"` status and `RoundResult` type. All user story tasks depend on these types existing.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add `"finished"` to the `RoomStatus` union type in `backend/src/models/game.ts`
- [X] T003 Add `RoundResult` interface (`revealedWord`, `scores`, `guesses`) in `backend/src/models/game.ts`
- [X] T004 Add optional `result?: RoundResult` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [X] T005 [P] Mirror `"finished"` status value and `RoundResult` type (inline or imported) in `frontend/src/services/api.ts`

**Checkpoint**: Type system updated — user story implementation can now begin

---

## Phase 3: User Story 1 — Host Ends Round, All Players See Result (Priority: P1) 🎯 MVP

**Goal**: The host can end an active round via `POST /rooms/:code/end-round`. The room transitions to `"finished"` and every polling client receives a snapshot containing the revealed secret word, per-player final scores, and the full ordered guess history.

**Independent Test**: With a round in progress (host tab + guesser tab), click "End Round" as the host. Verify both tabs transition to the result screen within ~3 seconds and display the correct word, all scores, and the complete guess list (including an empty list if no guesses were submitted).

### Implementation for User Story 1

- [X] T006 [P] [US1] Add `EndRoundBody` Zod schema (`{ participantId: string }`) in `backend/src/api/schemas.ts`
- [X] T007 [US1] Implement `endRound(code, participantId)` in `backend/src/services/roomStore.ts`: validate `status === "in-progress"` (409), validate host (403), set `status = "finished"`, refresh `updatedAt`, return snapshot
- [X] T008 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts`: when `status === "finished"`, expose `secretWord` to all participants and populate the `result` field from `currentRound`
- [X] T009 [US1] Add `POST /rooms/:code/end-round` route handler in `backend/src/api/rooms.ts` using `EndRoundBody` schema and calling `endRound()`
- [X] T010 [P] [US1] Add `endRound(code: string, participantId: string)` fetch function in `frontend/src/services/api.ts`
- [X] T011 [US1] Add `endRound()` action in `frontend/src/state/roomStore.ts` that calls the API function and updates local room state
- [X] T012 [US1] Add room-status polling (2 s interval) and a host-only "End Round" button to `frontend/src/pages/GamePage.tsx`; navigate to `/result` when polled `room.status === "finished"`
- [X] T013 [P] [US1] Create `frontend/src/pages/ResultPage.tsx`: display `room.result.revealedWord`, per-player scores table from `room.result.scores`, and ordered guess list from `room.result.guesses`; poll `GET /rooms/:code` every 2 s
- [X] T014 [US1] Register `/result` route pointing to `ResultPage` in `frontend/src/routes/index.tsx`

**Checkpoint**: US1 complete — host can end round and all clients see the result screen independently

---

## Phase 4: User Story 2 — Host Restarts, All Players Return to Lobby (Priority: P1)

**Goal**: From the result screen, the host can trigger `POST /rooms/:code/restart`. The room returns to `"lobby"` with all participants preserved and all round data cleared. Non-host players transition automatically via polling.

**Independent Test**: From the result screen (host tab + guesser tab), click "Restart" as the host. Verify both tabs return to the lobby within ~3 seconds showing the same players, with no scores, guesses, secret word, or drawer visible.

### Implementation for User Story 2

- [X] T015 [P] [US2] Add `RestartBody` Zod schema (`{ participantId: string }`) in `backend/src/api/schemas.ts`
- [X] T016 [US2] Implement `restartGame(code, participantId)` in `backend/src/services/roomStore.ts`: if `status === "lobby"` return current snapshot (no-op); validate host (403); set `currentRound = undefined`, `status = "lobby"`, refresh `updatedAt`; return snapshot
- [X] T017 [US2] Add `POST /rooms/:code/restart` route handler in `backend/src/api/rooms.ts` using `RestartBody` schema and calling `restartGame()`
- [X] T018 [P] [US2] Add `restartGame(code: string, participantId: string)` fetch function in `frontend/src/services/api.ts`
- [X] T019 [US2] Add `restartGame()` action in `frontend/src/state/roomStore.ts` that calls the API function and updates local room state
- [X] T020 [US2] Add "Restart" button and lobby-status poll to `frontend/src/pages/ResultPage.tsx`; navigate to `/lobby` when polled `room.status === "lobby"`

**Checkpoint**: US2 complete — host can restart and all clients return to lobby independently

---

## Phase 5: User Story 3 — Host-Only Restart Button (Priority: P2)

**Goal**: The "Restart" button in `ResultPage.tsx` is visible and interactive only for the host. Non-host players see the result data but no room-state-changing control.

**Independent Test**: On the result screen, confirm the host tab shows the "Restart" button and the non-host tab does not. Confirm a direct `curl` call to `/restart` with a non-host `participantId` returns HTTP 403.

### Implementation for User Story 3

- [X] T021 [US3] Gate the "Restart" button in `frontend/src/pages/ResultPage.tsx` with a condition that compares the stored `participantId` against `room.hostId`; non-host view renders no restart control

**Checkpoint**: US3 complete — restart access is fully restricted to the host

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression verification and manual end-to-end validation across all stories

- [X] T022 [P] Run backend test suite (`npm test` in `backend/`) and confirm all existing tests pass with the new `"finished"` status and new endpoints in place
- [X] T023 [P] Run frontend test suite (`npm test` in `frontend/`) and confirm no regressions in existing service and component tests
- [ ] T024 Execute all six manual verification scenarios from `specs/004-result-restart-validation/quickstart.md` (Tests 1–6: end round, restart, host-only button, non-host API rejection, zero-guess result, idempotent restart)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational completion; integrates with US1's ResultPage (T013, T020)
- **US3 (Phase 5)**: Depends on US2 completion (T020 must exist before gating the button in T021)
- **Polish (Phase 6)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: No inter-story dependencies — starts after Foundational
- **US2 (P1)**: No hard dependency on US1; shares `ResultPage.tsx` (T013 must be created before T020 adds the restart button)
- **US3 (P2)**: Depends on US2 (T020 must exist so T021 can add the gate)

### Within Each User Story

- Models/types before services
- Services before route handlers
- Route handlers before frontend API calls
- Frontend API before state store
- State store before page components
- New pages before route registration

### Parallel Opportunities

- **Foundational**: T005 (frontend types) can run in parallel with T002–T004 (backend types) — different codebases
- **US1**: T006 + T010 + T013 can all start in parallel once Phase 2 is complete (different files)
- **US2**: T015 + T018 can start in parallel once Phase 2 is complete (different files)
- **Polish**: T022 + T023 can run in parallel (different test suites)

---

## Parallel Example: User Story 1

```bash
# Once Phase 2 is complete, launch these three in parallel:
Task T006: Add EndRoundBody schema in backend/src/api/schemas.ts
Task T010: Add endRound() in frontend/src/services/api.ts
Task T013: Create frontend/src/pages/ResultPage.tsx (result display only, no restart yet)

# Then sequentially:
T007 → T008 → T009  (backend service + toRoomSnapshot + route)
T011 → T012         (frontend state store → GamePage integration)
T014                (route registration after ResultPage exists)
```

---

## Parallel Example: User Story 2

```bash
# Once Phase 2 is complete, launch these two in parallel:
Task T015: Add RestartBody schema in backend/src/api/schemas.ts
Task T018: Add restartGame() in frontend/src/services/api.ts

# Then sequentially:
T016 → T017         (backend service + route)
T019 → T020         (frontend state store → ResultPage restart integration)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 — both P1)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational type changes (CRITICAL — blocks everything)
3. Complete Phase 3: US1 — end round + result screen
4. **STOP and VALIDATE**: manually test via quickstart.md Test 1 + Test 5
5. Complete Phase 4: US2 — restart + return to lobby
6. **STOP and VALIDATE**: manually test via quickstart.md Test 2 + Test 6

### Incremental Delivery

1. Phase 1 + Phase 2 → Type system ready
2. Phase 3 (US1) → End round works, result screen visible to all (**MVP increment**)
3. Phase 4 (US2) → Restart works, players return to lobby
4. Phase 5 (US3) → Host-only restart button enforcement
5. Phase 6 → Full regression pass + manual validation

---

## Notes

- `[P]` tasks operate on different files and have no mutual dependencies within their phase
- `[Story]` label maps each task to a specific user story for traceability
- No new npm packages are introduced — all changes use existing Express, Zod, React, and TypeScript tooling
- Commit after each task (Constitution Principle V: granular commits)
- Validate each user story slice against its acceptance scenarios before starting the next (Constitution Principle III)
- Tests are not generated by default per the constitution — testing is manual via `quickstart.md` unless explicitly requested
