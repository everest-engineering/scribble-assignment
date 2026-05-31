# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm branch, design artifacts, and Scenarios 1–3 baseline.

- [x] T001 Confirm branch `004-result-state-host` and review spec.md, plan.md, and contracts/rooms-api.md in specs/004-result-restart/
- [x] T002 Verify Scenarios 1–3 baseline (lobby, start game, drawing, guessing, scoring, gameplay polling) before result/restart work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared `result` status type required before all user stories.

- [x] T003 Add `"result"` to `RoomStatus` in backend/src/models/game.ts
- [x] T004 [P] Extend frontend `RoomSnapshot.status` with `"result"` in frontend/src/services/api.ts

**Checkpoint**: Types compile; existing lobby/playing flows unchanged.

---

## Phase 3: User Story 1 — Round End Transition (Priority: P1) 🎯 MVP

**Goal**: First correct guess ends the round; drawing and guessing blocked afterward; clients reach result view.

**Independent Test**: Two tabs — correct guess → both on `/result` within ~5 s; draw/guess rejected after.

### Implementation for User Story 1

- [x] T005 [US1] Set `room.status = "result"` on correct guess in `submitGuess()` in backend/src/services/roomStore.ts
- [x] T006 [P] [US1] Add Vitest case for correct guess transitioning to result in backend/src/services/roomStore.test.ts
- [x] T007 [P] [US1] Add Vitest cases rejecting draw/guess when status is result in backend/src/services/roomStore.test.ts
- [x] T008 [US1] Redirect to `/result` when polled or submitted room status is result in frontend/src/pages/GamePage.tsx
- [x] T009 [US1] Redirect to `/result` from lobby polling when status is result in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: quickstart.md §2 passes — round ends on correct guess; mutations blocked.

---

## Phase 4: User Story 2 — Shared Result Display (Priority: P2)

**Goal**: All participants see secret word, final scores, and full guess history on result screen.

**Independent Test**: Two tabs on `/result` — identical word, scores, and history.

### Implementation for User Story 2

- [x] T010 [US2] Extend `toRoomSnapshot()` to expose word, scores, guesses, and strokes to all viewers when status is result in backend/src/services/roomStore.ts
- [x] T011 [P] [US2] Add Vitest case for result snapshot revealing secretWord to non-drawer in backend/src/services/roomStore.test.ts
- [x] T012 [US2] Create `ResultPage` showing word, `Scoreboard`, and `GuessHistory` in frontend/src/pages/ResultPage.tsx
- [x] T013 [US2] Add ~2000ms result polling with cleanup in frontend/src/pages/ResultPage.tsx
- [x] T014 [US2] Register `/result` route in frontend/src/routes/index.tsx
- [x] T015 [US2] Guard `/result` — redirect to `/game` or `/lobby` when status is not result in frontend/src/pages/ResultPage.tsx

**Checkpoint**: quickstart.md §3 passes — shared result content across tabs.

---

## Phase 5: User Story 3 — Host Restart to Lobby (Priority: P3)

**Goal**: Host restarts from result; all players return to lobby with round state cleared and participants preserved.

**Independent Test**: Host restart → both tabs on lobby; new round has no prior strokes/guesses.

### Implementation for User Story 3

- [x] T016 [US3] Implement `restartRoom()` clearing round fields and setting status to lobby in backend/src/services/roomStore.ts
- [x] T017 [US3] Add `restartRoomSchema` in backend/src/api/schemas.ts
- [x] T018 [US3] Add `POST /rooms/:code/restart` route in backend/src/api/rooms.ts
- [x] T019 [P] [US3] Add Vitest cases for host-only restart and field reset in backend/src/services/roomStore.test.ts
- [x] T020 [P] [US3] Add `restartRoom` client method in frontend/src/services/api.ts
- [x] T021 [US3] Add `restartRoom` action in frontend/src/state/roomStore.ts
- [x] T022 [US3] Add host-only restart control on frontend/src/pages/ResultPage.tsx
- [x] T023 [US3] Redirect to `/lobby` when polled status becomes lobby after restart in frontend/src/pages/ResultPage.tsx

**Checkpoint**: quickstart.md §4 passes — restart syncs all tabs; new round is clean.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full-loop validation and Scenarios 1–3 regression.

- [x] T024 Run full manual checklist in specs/004-result-restart/quickstart.md including Scenarios 1–3 regression notes
- [x] T025 [P] Run `npm test` in backend/ and `npm run build` in backend/ and frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **US1 → US2 → US3** (US2 snapshot work can start after T005; US3 after US1 result transition exists)
- **Polish (Phase 6)** — after US1–US3

### User Story Dependencies

| Story | Depends on | Independently testable after |
|-------|------------|------------------------------|
| US1 (P1) | Foundational + Scenario 3 | Phase 3 — round end + redirects |
| US2 (P2) | US1 result status + T010 snapshot | Phase 4 — result page content |
| US3 (P3) | US1 result status | Phase 5 — restart to lobby |

### Parallel Opportunities

- **Foundational**: T004 ∥ T003
- **US1**: T006 ∥ T007 (test files after T005)
- **US2**: T011 ∥ T012 (test vs ResultPage scaffold after T010)
- **US3**: T019 ∥ T020 (tests vs API client after T016–T018)
- **Polish**: T025 parallel builds

---

## Parallel Example: User Story 1

```bash
T005 → T008 → T009

# Parallel tests after T005:
T006: correct guess → result
T007: mutations blocked in result
```

---

## Parallel Example: User Story 3

```bash
T016 → T017 → T018

# Parallel:
T019: restartRoom Vitest
T020: api.ts restartRoom

# Sequential frontend:
T021 → T022 → T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup  
2. Phase 2: Foundational  
3. Phase 3: User Story 1  
4. **STOP and VALIDATE**: quickstart.md §2  

### Incremental Delivery

1. Setup + Foundational → `result` type ready  
2. US1 → round end + navigation  
3. US2 → result page with shared outcomes  
4. US3 → host restart  
5. Polish → full loop + builds  

### Suggested Commit Slices

| Commit scope | Tasks |
|--------------|-------|
| Result status + round end | T003–T009 |
| Result display | T010–T015 |
| Host restart | T016–T023 |
| Validation | T024–T025 |

---

## Notes

- Backend Vitest tasks included per plan.md testing strategy.
- `joinRoom` already rejects non-lobby status (including `result`) via existing Scenario 1 logic.
- Depends on Scenarios 1–3 implementation on the branch.
