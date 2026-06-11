# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec — manual two-tab validation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths reflect existing project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure — no changes needed. Existing backend/frontend structure is reused.

No setup tasks required. Existing project structure already established.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Extend Room status enum to include `"round_end"` and `"game_over"` in `backend/src/models/game.ts`; remove `"finished"` (replace with `"round_end"`)
- [x] T002 [P] Add `RoundResult` and `FinalStanding` TypeScript interfaces in `backend/src/models/game.ts`
- [x] T003 [P] Add `roundCounter`, `maxRounds`, `currentDrawerIndex`, `wordIndex` fields to Room model in `backend/src/models/game.ts`
- [x] T004 Add Zod schemas for return-to-lobby, start-round, and leave request bodies in `backend/src/api/schemas.ts`
- [x] T005 Update room snapshot to include new fields (`roundCounter`, `maxRounds`, `roundResult`, `finalStandings`) in `backend/src/api/rooms.ts`; update status type references from `"finished"` to `"round_end"` / `"game_over"`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - View Round Results (Priority: P1) 🎯 MVP

**Goal**: When a round ends, the room transitions to `round_end` state and all participants see a results screen with the secret word, scores, and correct guessers.

**Independent Test**: Complete a round (all guessers guess correctly) and verify all participants see the results screen with the secret word and final scores within 2 seconds.

### Implementation for User Story 1

- [x] T006 [US1] Implement round-end logic in `backend/src/services/roomStore.ts`: on round end, compute `RoundResult`, set `status = "round_end"`, include `roundResult` in next snapshot
- [x] T007 [US1] Adapt `ResultPanel.tsx` in `frontend/src/components/ResultPanel.tsx` to display `roundResult` data (secret word, scores, correct guessers, endedEarly indicator, allCorrect indicator)
- [x] T008 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to handle `status === "round_end"` by rendering `ResultPanel` instead of the game screen
- [x] T009 [US1] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` to capture and expose `roundResult` from the room snapshot

**Checkpoint**: After a round ends, all participants see a results screen within 2 seconds

---

## Phase 4: User Story 2 - Return to Lobby After Round (Priority: P1)

**Goal**: From the results screen, the host can transition everyone back to the lobby. Non-host participants see a waiting message.

**Independent Test**: Complete a round, have the host click "Back to Lobby", and verify all participants see the lobby screen with the same participant list within 2 seconds.

### Implementation for User Story 2

- [x] T010 [P] [US2] Implement `return-to-lobby` route in `backend/src/api/router.ts` — `POST /rooms/:code/return-to-lobby`
- [x] T011 [P] [US2] Implement `returnToLobby` logic in `backend/src/services/roomStore.ts`: validate host, validate `round_end` state, transition to `lobby`, validate `roundCounter < maxRounds`
- [x] T012 [P] [US2] Add `returnToLobby` API function in `frontend/src/services/api.ts`
- [x] T013 [US2] Add "Back to Lobby" button to `ResultPanel.tsx` in `frontend/src/components/ResultPanel.tsx` — visible only for host
- [x] T014 [US2] Add waiting message in `ResultPanel.tsx` for non-host participants ("Waiting for host to return to lobby...")
- [x] T015 [US2] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` to handle transition from `round_end` to `lobby` on poll

**Checkpoint**: Host can return all participants to lobby with a single click

---

## Phase 5: User Story 3 - Start a New Round from Lobby (Priority: P2)

**Goal**: From the lobby, the host can start a new round with a different drawer, different word, and blank canvas. Cumulative scores carry forward.

**Independent Test**: Complete a round, return to lobby, start a new round — verify a different drawer is assigned, a different word is shown, scores are cumulative, and canvas is blank.

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement `start-round` route in `backend/src/api/router.ts` — `POST /rooms/:code/start-round`
- [x] T017 [P] [US3] Implement drawer rotation logic in `backend/src/services/roomStore.ts`: `nextIndex = (currentDrawerIndex + 1) % participants.length`, assign drawer role, update `currentDrawerIndex`
- [x] T018 [P] [US3] Implement word selection logic in `backend/src/services/roomStore.ts`: advance `wordIndex` through starter word list, skip if matches previous word, assign secret word
- [x] T019 [US3] Implement per-round state reset in `backend/src/services/roomStore.ts`: clear `guessLog`, clear canvas state, reset `roundEnded` to `false`, increment `roundCounter`, set `status = "playing"`
- [x] T020 [US3] Validate round limit in `start-round` logic: reject if `roundCounter >= maxRounds` or `participants.length < 2`
- [x] T021 [P] [US3] Add `startNewRound` API function in `frontend/src/services/api.ts`
- [x] T022 [US3] Add "Start New Round" button to `Lobby.tsx` in `frontend/src/components/Lobby.tsx` — visible only for host, disabled when `roundCounter >= maxRounds`
- [x] T023 [US3] Add "Game Complete" message in `Lobby.tsx` when `roundCounter >= maxRounds` — "Start New Round" not available
- [x] T024 [US3] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` to handle transition from `lobby` to `playing` on poll, reset frontend canvas state

**Checkpoint**: New rounds can be started from lobby with correct drawer, word, and cumulative scores

---

## Phase 6: User Story 5 - End-of-Game Standings (Priority: P2)

**Goal**: After the final round, participants see a final standings screen ranking cumulative scores with the winner highlighted.

**Independent Test**: Play through all N rounds. After the last round ends, verify all participants see the final standings screen with ranked scores and winner highlighted.

### Implementation for User Story 5

- [x] T025 [US5] Implement final round detection in `backend/src/services/roomStore.ts`: when round ends and `roundCounter >= maxRounds`, set `status = "game_over"` and compute `finalStandings` from cumulative scores (sorted descending, ties broken by join order)
- [x] T026 [US5] Add `finalStandings` to room snapshot in `backend/src/api/rooms.ts` — included when `status === "game_over"`
- [x] T027 [P] [US5] Create `FinalStandings.tsx` component in `frontend/src/components/FinalStandings.tsx` — displays ranked scores with winner highlighted
- [x] T028 [P] [US5] Add `LeaveButton.tsx` component in `frontend/src/components/LeaveButton.tsx` — visible on final standings screen for all participants
- [x] T029 [US5] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to render `FinalStandings` when `status === "game_over"`; hide "Back to Lobby" and "Start New Round" actions
- [x] T030 [US5] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` to capture and expose `finalStandings` from the room snapshot

**Checkpoint**: After the final round, participants see ranked standings with winner

---

## Phase 7: User Story 4 - Leave Room After Completion (Priority: P3)

**Goal**: A participant can leave from the results screen, lobby, or final standings. The host transfers to the next participant if the host leaves.

**Independent Test**: A participant clicks "Leave Room" from the results screen; other participants see the updated participant list within 3 seconds.

### Implementation for User Story 4

- [x] T031 [P] [US4] Implement `leave` route in `backend/src/api/router.ts` — `POST /rooms/:code/leave`
- [x] T032 [P] [US4] Implement host transfer logic in `backend/src/services/roomStore.ts`: on host leave, assign `hostId` to first remaining participant by join order; on non-host leave, simply remove participant
- [x] T033 [US4] Implement leave validation in `backend/src/services/roomStore.ts`: reject if `status === "playing"` and participant is drawer; reject if participant not found
- [x] T034 [US4] Add `leaveRoom` API function in `frontend/src/services/api.ts`
- [x] T035 [US4] Wire up `LeaveButton.tsx` in `frontend/src/components/LeaveButton.tsx` to call `leaveRoom` API and redirect user away from room
- [x] T036 [US4] Update `roomStore.ts` in `frontend/src/state/roomStore.ts` to handle participant list changes on poll
- [x] T037 [US4] Add host-transfer awareness in `roomStore.ts`: if `hostId` changes, frontend updates to show/hide host controls accordingly

**Checkpoint**: Participants can leave cleanly; host transfers automatically

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T038 [P] Add CSS styles for final-standings, leave-button, waiting-message in `frontend/src/styles/app.css`
- [x] T039 [P] Add backend unit tests for multi-round, drawer rotation, word cycling, host transfer, leave logic in `tests/backend/roomStore.test.ts`
- [x] T040 Add inline error handling on all host-action buttons (Back to Lobby, Start New Round) — show error message, preserve button for retry
- [x] T041 Update all `status === "finished"` checks in frontend to `status === "round_end"` or `status === "game_over"` as appropriate
- [x] T042 Verify round-end no longer sets `status = "finished"` in `roomStore.ts` — must set `status = "round_end"` or `"game_over"`
- [x] T043 Run quickstart.md validation scenarios 1-7

**Checkpoint**: All features complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — existing structure reused
- **Foundational (Phase 2)**: BLOCKS all user stories — model types and snapshot extensions needed first
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) are sequential (US2 needs US1's round_end state)
  - US3 (Phase 5) depends on US2 (lobby return needed before new round)
  - US5 (Phase 6) depends on US3 (needs multi-round play to reach game_over)
  - US4 (Phase 7) is independent of other stories — can start after Foundational
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 - View Round Results (P1)**: Can start after Foundational — independent
- **US2 - Return to Lobby (P1)**: Depends on US1 (needs round_end state) — sequential
- **US3 - Start New Round (P2)**: Depends on US2 (needs lobby return) — sequential
- **US5 - End-of-Game Standings (P2)**: Depends on US3 (needs multi-round) — sequential
- **US4 - Leave Room (P3)**: Can start after Foundational — independent (can run in parallel with US1-3)

### Within Each User Story

- Models before services
- Services before routes/endpoints
- Backend before frontend (frontend needs API to work against)
- Story complete before moving to next priority

### Parallel Opportunities

- T001-T005 (Foundational) — all marked [P], can run in parallel
- US4 (Leave Room) can run in parallel with US1-3
- Within each user story: API route, service logic, and frontend component tasks marked [P] can run in parallel where they touch different files

---

## Parallel Example: User Story 1

```bash
# Backend & frontend can be done in parallel:
Task: "T006 Implement round-end logic in backend/src/services/roomStore.ts"
Task: "T007 Adapt ResultPanel.tsx in frontend/src/components/ResultPanel.tsx"
Task: "T008 Update GamePage.tsx in frontend/src/pages/GamePage.tsx"
Task: "T009 Update roomStore.ts in frontend/src/state/roomStore.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (model types, schemas, snapshot)
2. Complete Phase 3: User Story 1 (View Round Results)
3. **STOP and VALIDATE**: Test US1 independently — complete a round, verify results screen
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 (View Round Results) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Return to Lobby) → Test independently → Deploy/Demo
4. Add US3 (Start New Round) → Test independently → Deploy/Demo
5. Add US5 (End-of-Game Standings) → Test independently → Deploy/Demo
6. Add US4 (Leave Room) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: US1 through US3 (sequential core gameplay flow)
   - Developer B: US4 (Leave Room — can start in parallel) + US5 (after US3)
3. Stories integrate independently via shared room model and snapshot

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Breaking change: `"finished"` status is replaced by `"round_end"` and `"game_over"` — must update all existing `status === "finished"` checks in frontend
- Manual two-tab validation is the primary testing approach per spec
