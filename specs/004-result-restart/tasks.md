# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/rooms-api.md ✅

**Tests**: Backend test tasks included (per request) at the **service level** (`backend/src/services/roomStore.test.ts`),
matching the Groups 1–3 pattern — no new test deps. Frontend behavior validated via [quickstart.md](./quickstart.md).

**Organization**: grouped by user story (US1 result, US2 restart). Builds on Groups 1–3 (full round playable).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different file, no dependency on an incomplete task
- **[Story]**: US1–US2 traceability

---

## Phase 1: Setup

- [ ] T001 Verify baseline: on `scribble-assignment`, `npm test` green in both packages, and the app runs through Group 3 (create → join → start → draw/guess/score).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `result` lifecycle state both stories build on.

- [X] T002 [P] In `backend/src/models/game.ts`: widen `RoomStatus` to `"lobby" | "active" | "result"`.
- [X] T003 [P] In `frontend/src/services/api.ts`: widen `RoomSnapshot.status` to `"lobby" | "active" | "result"`.

**Checkpoint**: model + snapshot can represent the result state.

---

## Phase 3: User Story 1 — Round-end result for everyone (Priority: P1)

**Goal**: Host ends the round → result state; word revealed to all + final scores + full history, synced (FR-001..005).

**Independent Test**: Host ends; both tabs show the same revealed word, final scores, and full history; non-host can't end.

### Tests for User Story 1

- [X] T004 [P] [US1] In `backend/src/services/roomStore.test.ts`: assert `endRound` throws 403 for a non-host and sets `status: "result"` for the host; after end, `toRoomSnapshot(room, guesserId).word === secretWord` (revealed to all at result), while during `active` a guesser snapshot still has no `word`.

### Implementation for User Story 1

- [X] T005 [US1] In `backend/src/api/schemas.ts`: add `participantActionSchema = z.object({ participantId: z.string().min(1) })` (shared by end + restart).
- [X] T006 [US1] In `backend/src/services/roomStore.ts`: add `endRound(code, participantId)` — 404 if missing; throw `HttpError(403, "Only the host can end the round.")` if not host; set `status = "result"`; return the saved room.
- [X] T007 [US1] In `backend/src/services/roomStore.ts`: in `toRoomSnapshot`, reveal `word` when the viewer is the drawer **OR** `room.status === "result"` (keeps Group 2 during-play secrecy).
- [X] T008 [US1] In `backend/src/api/rooms.ts`: add `POST /:code/end` parsing `participantActionSchema` and calling `endRound`, returning `{ room: toRoomSnapshot(...) }`.
- [X] T009 [P] [US1] In `frontend/src/services/api.ts`: add `endRound(code, participantId)` calling `POST /rooms/:code/end`.
- [X] T010 [US1] In `frontend/src/state/roomStore.ts`: add an `endRound()` action that calls `api.endRound(code, participantId)` and applies the snapshot.
- [X] T011 [US1] In `frontend/src/pages/GamePage.tsx`: show a host-only **End Round** button during `active`; when `status === "result"`, show a result view that reveals the word to everyone (the Scoreboard + Activity already show final scores + history).

**Checkpoint**: round ends to a shared result with the word revealed (quickstart V1–V2).

---

## Phase 4: User Story 2 — Host restart back to a clean lobby (Priority: P1)

**Goal**: Host restarts → lobby; players preserved; drawer/word/guesses cleared; scores reset 0; everyone returns to lobby (FR-006..010).

**Independent Test**: From result, host restarts; both tabs return to lobby with same players, fresh state; non-host can't restart.

### Tests for User Story 2

- [X] T012 [P] [US2] In `backend/src/services/roomStore.test.ts`: assert `restartGame` throws 403 for a non-host; for the host it sets `status: "lobby"`, clears `drawerId`/`secretWord`, empties `guesses`, resets every `score` to 0, and preserves `participants` (same ids and count).

### Implementation for User Story 2

- [X] T013 [US2] In `backend/src/services/roomStore.ts`: add `restartGame(code, participantId)` — 404 if missing; throw `HttpError(403, "Only the host can restart.")` if not host; set `status = "lobby"`, `drawerId = undefined`, `secretWord = undefined`, `guesses = []`, set each participant `score = 0`; return the saved room.
- [X] T014 [US2] In `backend/src/api/rooms.ts`: add `POST /:code/restart` parsing `participantActionSchema` and calling `restartGame`.
- [X] T015 [P] [US2] In `frontend/src/services/api.ts`: add `restartGame(code, participantId)` calling `POST /rooms/:code/restart`.
- [X] T016 [US2] In `frontend/src/state/roomStore.ts`: add a `restartGame()` action that calls `api.restartGame(code, participantId)` and applies the snapshot.
- [X] T017 [US2] In `frontend/src/pages/GamePage.tsx`: show a host-only **Restart** button in the result view; add a `useEffect` that navigates to `/lobby` when `room.status === "lobby"` (mirrors Group 1 auto-advance), so all clients return to the lobby after restart.

**Checkpoint**: full lifecycle works — start → end → result → restart → lobby (quickstart V3–V5).

---

## Phase 5: Polish & Cross-Cutting

- [ ] T018 Run [quickstart.md](./quickstart.md) V1–V6 with two browsers (full end-to-end + replay; V7 optional curl); record pass/fail.
- [ ] T019 [P] Confirm `npm test` passes in both `backend/` and `frontend/`.
- [ ] T020 Record any spec/implementation deviation in spec.md or plan.md (Principle VII); none expected.

---

## Dependencies & Execution Order

### Phase order
Setup → Foundational (blocks all) → US1 → US2 → Polish.

### Story dependencies
- **US1**: needs Foundational (`result` status). Core payoff (result reveal).
- **US2**: needs Foundational; reuses `participantActionSchema` from US1 (T005). Logically follows US1 (restart from result), though restart is also reachable from active.

### Within-file ordering (NOT parallel — same file)
- `backend/src/services/roomStore.ts`: **T006 → T007 → T013**.
- `backend/src/services/roomStore.test.ts`: **T004 → T012**.
- `frontend/src/services/api.ts`: **T003 → T009 → T015**.
- `frontend/src/state/roomStore.ts`: **T010 → T016**.
- `frontend/src/pages/GamePage.tsx`: **T011 → T017**.

### Parallel opportunities
- T002 [P] ∥ T003 [P] (backend model vs frontend type).

---

## Implementation Strategy

- **MVP**: US1 (result reveal) is the core conclusion; US2 (restart) completes the replay loop.
- One commit per task or tight group, scoped `feat(group4):`.

## Notes

- Backend tests live at the service layer (`roomStore.ts`) — end/restart/reveal all unit-testable without HTTP.
- Verify each new test fails before implementing the behavior it covers.
- `/speckit.analyze` runs before implementation — reconcile any flagged inconsistency there.
- This is the final group: after validation, write `REFLECTION.md` and open the single PR.
