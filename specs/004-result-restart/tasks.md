---
description: "Task list for Result, Restart & Final Validation (Scenario 4)"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Unit tests ARE included — required by Constitution Principle VI and plan.md Testing
Strategy (end/restart transitions, host-only, state clearing, score reset, result-time reveal).

**Organization**: Tasks grouped by user story. Priorities from spec.md — P1: US1, US2; P2: US3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 maps to spec.md user stories

## Path Conventions

Web app monorepo: `backend/src/`, `frontend/src/` (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean, runnable baseline before changing behavior.

- [X] T001 [P] Confirm backend baseline is green: `cd backend && npm test && npm run build`
- [X] T002 [P] Confirm frontend baseline is green: `cd frontend && npm test && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `result` status and host-only gating fields the user stories read. No story work
can begin until this is complete.

**⚠️ CRITICAL**: Blocks all user stories.

- [X] T003 [P] Extend `RoomStatus` to `"lobby" | "playing" | "result"`; add `canEndRound: boolean` and `canRestart: boolean` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T004 [P] Mirror the `status` union (`"result"`) and add `canEndRound`/`canRestart` on the frontend `RoomSnapshot` in `frontend/src/services/api.ts`

**Checkpoint**: Types support a result state and host-only gating.

---

## Phase 3: User Story 1 - Shared result when the round ends (Priority: P1) 🎯 MVP

**Goal**: The host ends the round; the room enters a result state and every player sees the
revealed word, final scores, and full guess history, synced via polling.

**Independent Test**: With a round in progress, the host ends it; both the host's and a guesser's
screen show the same word, scores, and history within ~2s.

### Tests for User Story 1

- [X] T005 [US1] Unit test in `backend/src/services/roomStore.test.ts`: `endRound` rejects a non-host and a non-playing room; on success sets `status:"result"`; a guesser's result snapshot reveals `secretWord` and shows correct-guess text; `canEndRound` is true only for the host while playing

### Implementation for User Story 1

- [X] T006 [US1] Add `endRoomSchema` (`{ participantId: z.string().min(1) }`) in `backend/src/api/schemas.ts`
- [X] T007 [US1] In `backend/src/services/roomStore.ts`: add `endRound(code, participantId)` (require host + `status === "playing"`, set `status = "result"`); in `toRoomSnapshot` reveal `secretWord` and correct-guess `text` to all viewers when `status === "result"`, and add `canEndRound = isHost && status === "playing"` and `canRestart = isHost && status === "result"` (depends on T003)
- [X] T008 [US1] Add `POST /rooms/:code/end` in `backend/src/api/rooms.ts` mapping outcomes to `200` / `400` / `403 "Only the host can end the round"` / `404 "Room not found"` / `409 "The round is not active"` (depends on T006, T007)
- [X] T009 [US1] Add `api.endRound(code, participantId)` in `frontend/src/services/api.ts` (depends on T004 — same file)
- [X] T010 [US1] Add `endRound(participantId)` to the store in `frontend/src/state/roomStore.ts`
- [X] T011 [US1] Add a `/result` route rendering `ResultPage` in `frontend/src/routes/index.tsx`
- [X] T012 [US1] Create `frontend/src/pages/ResultPage.tsx`: poll on mount/unmount; show the revealed word, the final `Scoreboard`, and the full guess history; navigate to `/lobby` when `status === "lobby"`, to `/game` when `status === "playing"`, and to `/` if no room
- [X] T013 [US1] In `frontend/src/pages/GamePage.tsx`, give the host an End-Round control (shown when `canEndRound`) that calls `store.endRound`, navigate everyone to `/result` when `status === "result"`, and remove the stray Exit-to-lobby button

**Checkpoint**: Host ends the round; all players see the synced result (MVP).

---

## Phase 4: User Story 2 - Restart returns everyone to the lobby (Priority: P1)

**Goal**: From the result state, the host restarts; everyone returns to the lobby with players
preserved and all round state cleared.

**Independent Test**: From a result state with two players, the host restarts; both land in the
lobby, participants unchanged, and round state cleared (no word/drawer/guesses/drawing, scores 0).

### Tests for User Story 2

- [X] T014 [US2] Unit test in `backend/src/services/roomStore.test.ts`: `restartRound` rejects a non-host and a non-result room; on success sets `status:"lobby"`, clears `drawerId`/`secretWord`/`guesses`/`drawing`, resets every score to 0, and preserves `participants` + `hostId` (depends on T005 — same file)

### Implementation for User Story 2

- [X] T015 [US2] Add `restartRoomSchema` (`{ participantId: z.string().min(1) }`) in `backend/src/api/schemas.ts` (depends on T006 — same file)
- [X] T016 [US2] In `backend/src/services/roomStore.ts`: add `restartRound(code, participantId)` (require host + `status === "result"`; set `status = "lobby"`; `drawerId = null`, `secretWord = null`, `guesses = []`, `drawing = null`; reset `scores[p.id] = 0` for all; keep participants + host) (depends on T007 — same file)
- [X] T017 [US2] Add `POST /rooms/:code/restart` in `backend/src/api/rooms.ts` mapping outcomes to `200` / `400` / `403 "Only the host can restart the game"` / `404 "Room not found"` / `409 "Restart is only available after a round"` (depends on T008 — same file)
- [X] T018 [US2] Add `api.restartRound(code, participantId)` in `frontend/src/services/api.ts` (depends on T009 — same file)
- [X] T019 [US2] Add `restartRound(participantId)` to the store in `frontend/src/state/roomStore.ts` (depends on T010 — same file)
- [X] T020 [US2] In `frontend/src/pages/ResultPage.tsx`, give the host a Restart control (shown when `canRestart`) that calls `store.restartRound`; the existing poll-driven navigation returns everyone to `/lobby` (depends on T012 — same file)

**Checkpoint**: Host restarts; everyone returns to a fresh lobby with players preserved.

---

## Phase 5: User Story 3 - Host-only end and restart (Priority: P2)

**Goal**: Only the host can end the round and restart; non-hosts never have these controls.

**Independent Test**: As a guesser, confirm there is no end-round or restart control; as the host,
confirm both appear at the right state.

### Tests for User Story 3

- [X] T021 [US3] Unit test in `backend/src/services/roomStore.test.ts`: a non-host's snapshot has `canEndRound === false` while playing and `canRestart === false` in the result state (depends on T014 — same file)
- [X] T022 [US3] Unit test in `backend/src/api/schemas.test.ts`: `endRoomSchema` and `restartRoomSchema` require `participantId`

**Note**: The host-only UI gating is implemented by T013 (`canEndRound`) and T020 (`canRestart`),
and the endpoints (T008/T017) enforce host-only server-side (403). This phase adds the tests that
lock that behavior in.

**Checkpoint**: End/restart are host-only in both the UI and the API.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and traceability; final lab close-out.

- [~] T023 [P] Run the full quickstart two-tab walkthrough (incl. the full loop, SC-008) in `specs/004-result-restart/quickstart.md` and confirm every row passes — full lifecycle API verified via smoke test (host end → result with word revealed; guesser end/restart 403; host restart → lobby, scores 0, players preserved); **browser two-tab full-loop pass still to be done by a human**
- [X] T024 [P] Run both builds and full test suites (`cd backend && npm run build && npm test`, `cd frontend && npm run build && npm test`); confirm green
- [X] T025 [P] Update `REFLECTION.md` "What I added" with the Scenario 4 changes (result state, end/restart, word reveal, host-only lifecycle) and note the lab is complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. T003 ‖ T004.
- **User Stories (Phases 3–5)**: Depend on Foundational. Ordered by priority (P1: US1, US2; then P2: US3).
- **Polish (Phase 6)**: Depends on all desired stories.

### Cross-file sequencing (same-file = not parallel)

- `backend/src/api/schemas.ts`: T006 → T015
- `backend/src/services/roomStore.ts`: T007 → T016
- `backend/src/services/roomStore.test.ts`: T005 → T014 → T021
- `backend/src/api/rooms.ts`: T008 → T017
- `frontend/src/services/api.ts`: T004 → T009 → T018
- `frontend/src/state/roomStore.ts`: T010 → T019
- `frontend/src/pages/ResultPage.tsx`: T012 → T020

### User Story Dependencies

- **US1 (P1)**: After Foundational. MVP — end round + shared result.
- **US2 (P1)**: After US1 (reuses `toRoomSnapshot`/endpoints/ResultPage; restart from the result state).
- **US3 (P2)**: After US1/US2 (its gating is implemented there; this phase adds the locking tests).

### Parallel Opportunities

- T001 ‖ T002; T003 ‖ T004; T023 ‖ T024 ‖ T025.
- Backend-only tasks can proceed alongside frontend-only tasks when they touch different files.

---

## Parallel Example: Foundational Phase

```bash
# T003 and T004 touch different files and can run together:
Task: "Add result status + canEndRound/canRestart in backend/src/models/game.ts"
Task: "Mirror status union + flags in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & validate**: the host ends
   the round and all players see the synced result (word + scores + history).

### Incremental Delivery

Foundation → US1 (end + shared result) → US2 (restart to lobby) → US3 (host-only locking tests) →
Polish. Each story is independently testable per its Independent Test. Finishing US2 completes the
full loop the rubric validates (SC-008).

### Notes

- Commit after each task or logical group (Constitution Principle V).
- Verify each new unit test fails before implementing, then passes after.
- The word reveal MUST be gated on `status === "result"` (T007) — verify a guesser snapshot is
  `null` while playing and revealed at result.
- `restartRound` MUST clear every round field and reset all scores (T016) — verify each in T014.
- Run the full-loop two-tab walkthrough (quickstart.md) before declaring the lab done.
