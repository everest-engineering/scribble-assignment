---
description: "Task list for Result, Restart & Final Validation (Group 4)"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included — the plan's testing strategy and constitution quality gates require automated
tests for the reveal projection and restart gates.

**Organization**: Grouped by user story (US1–US3). US1/US2 are P1; US3 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (result reveal), US2 (host restart), US3 (game→lobby auto-nav)
- All paths are repo-relative.

## Path Conventions

Web app: `backend/src/`, `frontend/src/` (per plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Groups 1–3 are complete before extending result/restart behavior.

- [ ] T001 Verify Groups 1–3 baseline: run `npm test` and `npm run build` in `backend/`, and `npm run build` in `frontend/` (must pass before Group 4 changes).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new model shapes — Group 4 is behavior-only on existing `Room`/`RoundState`/`RoomSnapshot`.
This phase is a checkpoint only; proceed directly to user stories after T001.

**Checkpoint**: Baseline green — user story work can begin.

---

## Phase 3: User Story 1 - Everyone sees the round result (Priority: P1) 🎯 MVP

**Goal**: When `round.ended` is true, every participant's snapshot includes `secretWord`; the game screen shows a result view with word, scores, and history; play controls stay locked.

**Independent Test**: In two tabs after a correct guess, both show the same secret word, scores, and guess history; guesser no longer has drawer-only word visibility.

### Tests for User Story 1

- [ ] T002 [P] [US1] Add reveal-projection tests in `backend/src/services/roomStore.test.ts`: while active (`round.ended` false), guesser snapshot omits `secretWord`; after ended, guesser snapshot includes `secretWord`; drawer still sees word during play; room A ended does not affect room B.

### Implementation for User Story 1

- [ ] T003 [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `secretWord` when `viewerParticipantId === round.drawerId` **or** `round.ended === true` (preserve drawer-only while active).
- [ ] T004 [US1] Update `frontend/src/pages/GamePage.tsx` to render a result view when `room.roundEnded`: show revealed `secretWord` to all players, reuse `Scoreboard` and `ResultPanel` for final scores/history, keep canvas/guess disabled (depends on T003).

**Checkpoint**: Result reveal works server-side and in the UI for all participants.

---

## Phase 4: User Story 2 - Host restarts to a clean lobby (Priority: P1)

**Goal**: Host restarts an ended round via `POST /rooms/:code/restart`; room returns to lobby with `round` cleared and participants preserved; non-host and mid-round restarts rejected.

**Independent Test**: Host restarts after round end → lobby, same players, no word/strokes/guesses; non-host gets 403; restart during active round gets 409.

### Tests for User Story 2

- [ ] T005 [P] [US2] Add `restartRoom` tests in `backend/src/services/roomStore.test.ts`: host on ended round → `status` lobby, `round` null, participants preserved; non-host → `forbidden`; active round → `not-ended`; idempotent when already lobby; restart in room A leaves room B unchanged; `startRoom` after restart yields fresh round (scores 0, empty strokes/guesses).
- [ ] T006 [P] [US2] Add `restartRoomSchema` tests in `backend/src/api/schemas.test.ts`: requires non-empty `participantId`; rejects empty.

### Implementation for User Story 2

- [ ] T007 [US2] Add `RestartRoomResult` type and `restartRoom(code, participantId)` in `backend/src/services/roomStore.ts` with gates (`not-found` / `forbidden` / `not-ended` / `ok`) and idempotency when already lobby with `round === null`.
- [ ] T008 [US2] Add `restartRoomSchema` to `backend/src/api/schemas.ts` (`participantId` non-empty).
- [ ] T009 [US2] Add `POST /:code/restart` route in `backend/src/api/rooms.ts`, mapping results to 200/400/403/404/409 per `contracts/rooms-api.md` (depends on T007, T008).
- [ ] T010 [P] [US2] Add `restartRoom` method to `frontend/src/services/api.ts` and `restartGame` action to `frontend/src/state/roomStore.ts` (POST `/rooms/:code/restart`, store returned snapshot).
- [ ] T011 [P] [US2] Add `api.restartRoom` URL/body test in `frontend/src/services/api.test.ts`.
- [ ] T012 [US2] Add host-only **Restart** button to `frontend/src/pages/GamePage.tsx` (visible when `roundEnded`, calls `restartGame`; hidden/disabled for non-hosts) (depends on T004, T010).

**Checkpoint**: Restart resets round state; guards enforced; host can trigger from the game screen.

---

## Phase 5: User Story 3 - All clients return to the lobby after restart (Priority: P2)

**Goal**: Game-screen tabs auto-navigate to `/lobby` when polling observes `status === "lobby"` after restart.

**Independent Test**: Three tabs on `/game` after round end; host restarts; all land on `/lobby` within ~2s with the same participant list.

### Implementation for User Story 3

- [ ] T013 [US3] Add auto-navigation in `frontend/src/pages/GamePage.tsx`: when `room.status === "lobby"`, `navigate("/lobby", { replace: true })` (mirror `LobbyPage.tsx` game navigation); ensure existing poll interval is cleared on unmount (depends on T012).

**Checkpoint**: No tab stranded on the game screen after restart.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 Run full automated suite: `npm test` and `npm run build` in `backend/`, `npm run build` in `frontend/`; fix any failures.
- [ ] T015 Execute `specs/004-result-restart/quickstart.md` multi-tab validation (steps 1–9) and confirm SC-001…SC-005.
- [ ] T016 Add a brief "Implementation Notes & Deviations (post-execution)" section to `specs/004-result-restart/plan.md` recording any decisions made during implementation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Checkpoint only after Setup.
- **US1 (Phase 3)**: After Setup — reveal projection before result UI.
- **US2 (Phase 4)**: After US1 reveal (result UI can show Restart once US2 backend is done); T012 depends on T004 + T010.
- **US3 (Phase 5)**: After US2 (restart must work before lobby auto-nav is meaningful).
- **Polish (Phase 6)**: After all stories.

### Within Each User Story

- Tests written first (expected to fail until implementation).
- Backend store before routes; api before state; state before UI.

### Parallel Opportunities

- US1 test T002 can run in parallel with nothing else in US1 until T003.
- US2 tests T005/T006 parallel; T010/T011 parallel once backend route exists.
- Backend US2 (T007–T009) can proceed after US1 T003 (different concerns, same file `roomStore.ts` — run T003 then T007 sequentially in that file).

---

## Parallel Example: User Story 2

```bash
# Tests together:
Task: "restartRoom tests in backend/src/services/roomStore.test.ts"
Task: "restartRoomSchema tests in backend/src/api/schemas.test.ts"

# Frontend api + api.test in parallel after route exists:
Task: "restartRoom in frontend/src/services/api.ts"
Task: "api.restartRoom test in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup → US1 reveal (T002–T004) → US2 restart (T005–T012).
2. Validate result + restart in two tabs.
3. Add US3 auto-nav (T013) for the full Scenario 4 loop.

### Incremental Delivery

1. US1 → everyone sees the result after a correct guess.
2. US2 → host can restart to a clean lobby.
3. US3 → all tabs return to lobby automatically.
4. Polish → quickstart + plan notes.

---

## Notes

- [P] = different files, no incomplete dependencies; `roomStore.ts` edits for T003 and T007 should be sequential.
- No `backend/src/models/game.ts` changes expected (behavior-only per plan).
- Reuse Group 3 `Scoreboard` and `ResultPanel` for result display; do not reimplement history/scoring UI.
- After this group, the four-scenario lab flow is complete; reflection report is a separate deliverable.
