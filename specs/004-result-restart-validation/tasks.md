# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature artifacts are aligned before implementation starts.

- [X] T001 Confirm feature docs are present and aligned in `specs/004-result-restart-validation/plan.md`, `specs/004-result-restart-validation/spec.md`, `specs/004-result-restart-validation/research.md`, `specs/004-result-restart-validation/data-model.md`, `specs/004-result-restart-validation/contracts/room-result-restart-api.md`, and `specs/004-result-restart-validation/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add `result` room status and restart-aware snapshot fields in `backend/src/models/game.ts`
- [X] T003 [P] Add restart request and room-snapshot validation schemas in `backend/src/api/schemas.ts`
- [X] T004 [P] Add `result` room status and restart-capable snapshot types in `frontend/src/services/api.ts`
- [X] T005 [P] Update room-store polling state to accept `result` snapshots and restore lobby state after restart in `frontend/src/state/roomStore.ts`
- [X] T017 [P] Persist and restore the active `roomCode` and `participantId` so a hard refresh or reconnect during result state resumes polling and shows the same final result in `frontend/src/state/roomStore.ts` and `frontend/src/pages/LobbyPage.tsx`
- [X] T006 Add shared result/restart transition helpers in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in order

---

## Phase 3: User Story 1 - Final Result State (Priority: P1)

**Goal**: Every player sees the final word, final scores, and full ordered guess history after a round ends.

**Independent Test**: End a round and verify that every connected player sees the same final word, score table, and guess history on the next refresh.

### Implementation for User Story 1

- [X] T007 [US1] Expose the revealed secret word to every viewer while `room.status === "result"` in `backend/src/services/roomStore.ts`
- [X] T008 [P] [US1] Render the final result panel with the revealed word, ordered guess history, and final scores in `frontend/src/components/ResultPanel.tsx`
- [X] T009 [US1] Keep `frontend/src/pages/GamePage.tsx` in read-only result mode so drawing and guess-entry affordances are hidden after the round ends

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Host Restarts Room (Priority: P1)

**Goal**: The host can restart the finished room and send everyone back to the lobby without recreating the room or losing the player list.

**Independent Test**: Complete a round, restart as the host, and verify that every connected player returns to the lobby with the same participants still present.

### Implementation for User Story 2

- [X] T010 [US2] Implement host-only restart handling in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts` so restart only succeeds from the result state
- [X] T011 [P] [US2] Add `restartRoom` to `frontend/src/services/api.ts`
- [X] T012 [P] [US2] Wire the host-only Restart / Play Again button into `frontend/src/components/ResultPanel.tsx` and `frontend/src/pages/GamePage.tsx`
- [X] T013 [US2] Update `frontend/src/state/roomStore.ts` so a successful restart returns every connected player to the lobby on the next poll

**Checkpoint**: User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Clear Round State on Restart (Priority: P1)

**Goal**: Restarting the room clears round-specific state so the lobby starts clean and the next round begins from a blank slate.

**Independent Test**: Restart the room and verify that drawing, guess history, the current word, the current drawer, and round scores are cleared while the player list remains.

### Implementation for User Story 3

- [X] T014 [US3] Reset drawing, guess history, current word, current drawer, player scores, and `hasGuessedCorrectly` flags while preserving the participant list in `backend/src/services/roomStore.ts`
- [X] T015 [P] [US3] Reset the local result view when the post-restart lobby snapshot arrives so `frontend/src/components/ResultPanel.tsx` unmounts and no previous round result data remains visible in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 3 should be fully functional and testable independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T016 [P] Verify the end-to-end result/restart flow against `specs/004-result-restart-validation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on completion of desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational phase - no dependency on later restart work
- **User Story 2 (P1)**: Can start after User Story 1 because restart only makes sense once the result state exists
- **User Story 3 (P1)**: Can start after User Story 2 because it finalizes the reset behavior used by restart

### Within Each User Story

- Implement backend state and API changes before frontend consumption
- Update polling consumers after snapshot shape changes
- Keep each story independently verifiable before moving on

### Parallel Opportunities

- T002-T005 can run in parallel because they touch different files
- T008-T009 can run in parallel after T007 lands
- T011-T012 can run in parallel after T010 lands

---

## Implementation Strategy

### MVP First

1. Complete Setup
2. Complete Foundational work
3. Complete User Story 1
4. Validate the final result state before expanding restart behavior

### Incremental Delivery

1. Add the shared result view first
2. Add host-only restart behavior next
3. Finish with round-state reset cleanup
4. Validate the full lobby-return flow after restart

### Parallel Team Strategy

1. One developer owns backend room-state and restart logic
2. One developer owns frontend result/restart UI
3. Another developer can verify polling and lobby restoration once the snapshot shape is ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Avoid out-of-scope work: no WebSockets, databases, auth, deployment, Docker, new state/routing libs, multiple rounds, drawer rotation, timers, bonuses, custom word packs, spectator mode, room moderation, room passwords, or starter rewrites
