# Tasks — Result, Restart & Final Validation

**Feature dir**: `specs/004-result-restart/` · **Branch**: `scribble-lab` · **Plan**: [plan.md](./plan.md)

Tasks are ordered for execution. **[P]** means parallel-safe with the previous **[P]**-tagged tasks in the same phase (different files, no shared mutation). Story labels **[US1] / [US2]** map to `spec.md`. Setup, Foundational, and Polish phases carry no story label.

Every task lists the exact file path(s) it touches and cites the relevant `FR-###`. Tests follow the project's house style: pure-helper unit tests in `roomStore.test.ts`, Express integration tests via `fetch` against `app.listen` in `rooms.test.ts`, Zod schema tests in `schemas.test.ts`, and React component tests via `react-dom/client` + `act()` (the pattern established by `GuessPanel.test.tsx`).

---

## Phase 1 — Setup

**Purpose**: Confirm the baseline from features 001 + 002 + 003 is green before extending the room lifecycle.

- [ ] T001 Confirm `backend/` and `frontend/` test suites pass on `scribble-lab` by running `npm test` in each package; this task is a verification gate with **no file change**. Required baseline: **82** backend tests + **54** frontend tests = **136** passing.

---

## Phase 2 — Foundational (blocking)

**Purpose**: Widen `RoomStatus` to `"lobby" | "round" | "result"` across the wire and adjust the existing word-reveal rule so the new state is observable. **No US-tagged work may begin until this phase is green.**

- [ ] T002 Extend the `RoomStatus` union in `backend/src/models/game.ts` from `"lobby" | "round"` to `"lobby" | "round" | "result"`. No other field changes. Cite **FR-001**.
- [ ] T003 [P] Mirror the union widening in `frontend/src/services/api.ts` (`RoomSnapshot.status: "lobby" | "round" | "result"`). Cite **FR-001**.
- [ ] T004 In `backend/src/services/roomStore.ts` → `toRoomSnapshot`: when `room.status === "result"` AND `room.round !== null`, **always** include `round.secretWord` (drop the drawer-only filter for this status). The existing drawer-only rule for `status === "round"` MUST remain unchanged. The `availableWords` field MUST remain `[]` while `room.round !== null`, regardless of status. Cite **FR-003**.

**Checkpoint**: Both packages compile; existing 136 tests still pass; the `"result"` value is a legal but unreached status; no new endpoints yet.

---

## Phase 3 — User Story 1: End Round → Result state (Priority: P1)

**Story goal**: The host clicks **End Round** during an active round. Within one ~2 s poll, every tab (drawer + every guesser + anonymous) shows the cleartext secret word, the final scoreboard, and the full ordered guess feed. Guesses submitted after End Round are rejected with `409`.

**Independent test**: Two browser tabs, host = Alice (drawer), guest = Bob (guesser). Start the round, submit one wrong + one correct guess from Bob, click **End Round** in Alice's tab. Within ≤ 2 s **both** tabs show: banner *"Round 1 ended — the word was ROCKET"*, scoreboard `Alice 0 — Bob 100`, the chronological feed, and **no** guess input.

### Tests for User Story 1

- [ ] T005 [P] [US1] In `backend/src/api/schemas.test.ts`, add cases for a new `endRoundSchema`: valid `{ participantId: "p1" }` parses; missing `participantId` → throws; empty `participantId` (`""`) → throws. Cite **FR-002**.
- [ ] T006 [P] [US1] In `backend/src/services/roomStore.test.ts`, add cases for a new `endRound(code, requesterId)` service function:
  - returns `{ ok: false, reason: "not_found" }` for unknown rooms;
  - returns `{ ok: false, reason: "not_host" }` for a participant who is not the host (regardless of room status);
  - returns `{ ok: false, reason: "not_active" }` when the room is in `"lobby"`;
  - on the happy path (room in `"round"`, caller = host): returns `{ ok: true, room }` with `room.status === "result"` and `room.round` untouched (same `secretWord`, same `guesses`, same `scores`, same `lockedParticipantIds`);
  - **idempotent**: a second call by the host when the room is already in `"result"` returns `{ ok: true, room }` with the same body and **no** `updatedAt` bump.
  
  Cite **FR-002, FR-007**.
- [ ] T007 [P] [US1] In `backend/src/services/roomStore.test.ts`, extend the existing `submitGuess` suite with one case: when the room is in `"result"`, `submitGuess(code, guesserId, "rocket")` returns `{ ok: false, reason: "no_round" }` and `room.round.guesses` is unchanged. Cite **FR-004, D6**.
- [ ] T008 [P] [US1] In `backend/src/services/roomStore.test.ts`, extend the `toRoomSnapshot` suite with one case: when `room.status === "result"`, the snapshot returned to a **guesser** viewer AND to an **anonymous** viewer (no `participantId`) MUST contain `round.secretWord` (full reveal). Cite **FR-003**.
- [ ] T009 [P] [US1] In `backend/src/api/rooms.test.ts`, add integration tests for `POST /rooms/:code/end`:
  - `200` happy path: response body has `room.status === "result"` and `room.round.secretWord === "rocket"`;
  - `200` idempotent re-end: a second POST by the host returns the same body shape and `room.status` is still `"result"`;
  - `400` `"Invalid request"` for empty `participantId`;
  - `403` `"Only the host can end the round"` when called with a non-host id;
  - `404` `"Room not found"` for an unknown code;
  - `409` `"No active round to end"` when called against a lobby-state room;
  - one raw-text guard: in `"result"`, `GET /rooms/:code?participantId=<guesser>` returns a JSON body that **does** contain the literal substring `"secretWord":"rocket"` (mirror image of the leak guard from feature 003).
  
  Cite **FR-002, FR-003, FR-007**.
- [ ] T010 [P] [US1] In `backend/src/api/rooms.test.ts`, add one integration test for the extended `POST /rooms/:code/guesses` behaviour: after `POST /end`, a subsequent guess by Bob returns `409 "No round in progress"` and the room's `guesses` array length is unchanged. Cite **FR-004**.
- [ ] T011 [P] [US1] In `frontend/src/services/api.test.ts`, add cases for `api.endRound(code, participantId)`: success returns `{ room }`; on `403`, throws `ApiError` with `status === 403` and the server's `message`. Cite **FR-002**.
- [ ] T012 [P] [US1] Create `frontend/src/components/ResultView.test.tsx`: render the new `<ResultView />` against a fixture room with `status: "result"`, `round.secretWord: "rocket"`, `round.scores: { p-alice: 0, p-bob: 100 }`, and one correct + one wrong guess. Assert that the rendered DOM:
  - contains the literal `"ROCKET"` (uppercased reveal banner);
  - lists both guesses in chronological order with `Correct` / `Wrong` verdicts;
  - shows the scoreboard for every participant;
  - does **not** render a `<canvas>`, an `<input>`, or a Start button;
  - renders a **Restart** button **only** when the `viewerIsHost` prop is `true` (and not when `false`).
  
  Cite **FR-009, FR-010**.

### Implementation for User Story 1

- [ ] T013 [US1] In `backend/src/api/schemas.ts`, export `export const endRoundSchema = z.object({ participantId: z.string().min(1) });`. Cite **FR-002**.
- [ ] T014 [US1] In `backend/src/services/roomStore.ts`, export a typed `endRound(code, requesterId)` function returning the discriminated outcome `{ ok: true, room: Room } | { ok: false, reason: "not_found" | "not_host" | "not_active" }`:
  - normalize the code with the existing `normalizeCode` helper;
  - if the room is missing → `not_found`;
  - if `requesterId !== room.hostParticipantId` → `not_host` (the host check runs **before** the status check);
  - if `room.status === "lobby"` → `not_active`;
  - if `room.status === "round"`: set `room.status = "result"`, bump `room.updatedAt`, return `{ ok: true, room: cloneRoom(room) }`;
  - if `room.status === "result"` (idempotent re-call): return `{ ok: true, room: cloneRoom(room) }` **without** mutating `updatedAt`.
  
  Cite **FR-002, FR-007**.
- [ ] T015 [US1] In `backend/src/services/roomStore.ts`, extend `submitGuess`: replace the existing guard `if (room.round === null)` with `if (room.status !== "round")`. The error reason remains `"no_round"` (the route already maps it to `409 "No round in progress"`). Cite **FR-004, D6**.
- [ ] T016 [US1] In `backend/src/api/rooms.ts`, add `POST /rooms/:code/end`: validate via `endRoundSchema` and the existing `roomCodeParamsSchema`, call `endRound(code, participantId)`, and translate the discriminated outcome to HTTP envelopes (`404 "Room not found"` / `403 "Only the host can end the round"` / `409 "No active round to end"` / `200` with `{ room: toRoomSnapshot(outcome.room, participantId) }`). Cite **FR-002, FR-007**.
- [ ] T017 [US1] In `frontend/src/services/api.ts`, export `endRoom: (code: string, participantId: string) => Promise<{ room: RoomSnapshot }>` *(naming: keep symmetry with `startRoom` — call the method `endRound`)* that POSTs to `/rooms/:code/end`. Cite **FR-002**.
- [ ] T018 [US1] In `frontend/src/state/roomStore.ts`, add a `endRound()` method that mirrors the existing `startRoom()` method: uses the current `room.code` and `participantId`, calls `api.endRound`, replaces `state.room` on success, sets `state.error` from `ApiError.message` on failure. Cite **FR-002, FR-008**.
- [ ] T019 [US1] Create `frontend/src/components/ResultView.tsx` accepting props `{ room: RoomSnapshot; viewerParticipantId: string | null; onRestart?: () => Promise<unknown> | unknown }`. The component:
  - returns `null` if `room.status !== "result"` or `room.round === null`;
  - renders a banner using `room.round.secretWord!.toUpperCase()` with `data-testid="result-banner"`;
  - re-uses the existing `<GuessPanel />` component with a new `readOnly` prop (added in T020) to render the scoreboard + chronological feed without an input;
  - renders a **Restart** button (`data-testid="restart-button"`) **only** when `room.viewerIsHost === true`; on click, calls `onRestart()`.
  
  Cite **FR-003, FR-009, FR-010**.
- [ ] T020 [US1] In `frontend/src/components/GuessPanel.tsx`, add an optional `readOnly?: boolean` prop. When `readOnly === true`, the component MUST NOT render the guess input form (even for a non-drawer non-locked viewer). The scoreboard + feed are always rendered. Existing tests must continue to pass unchanged (default `readOnly: false`). Cite **FR-009**.
- [ ] T021 [US1] In `frontend/src/components/RoundView.tsx`, when `state.mode === "drawer"` AND the viewer is the host, render an **End Round** button (`data-testid="end-round-button"`) below the drawer's word panel. The button accepts a new optional prop `onEndRound?: () => Promise<unknown> | unknown` on `<RoundView />`; clicking calls it. **No store wiring inside the component** — the prop is plumbed from `LobbyPage`. Cite **FR-010**.
- [ ] T022 [US1] In `frontend/src/pages/LobbyPage.tsx`:
  - import `ResultView`;
  - add a status-driven `switch` (or sibling conditionals) so that `room.status === "lobby"` renders the existing lobby UI, `room.status === "round"` renders `<RoundView ... onEndRound={() => roomStore.endRound()} />`, and `room.status === "result"` renders `<ResultView room={room} viewerParticipantId={participantId} onRestart={...} />` (the `onRestart` arg lands in T028);
  - pass `onEndRound` to `<RoundView />` only when the viewer is the host (`room.viewerIsHost === true`).
  
  Cite **FR-009, FR-010**.

**Checkpoint**: Quickstart Scenario 1 passes (manual two-tab walkthrough). Quickstart Scenario 3 cases for End Round pass (`400` / `403` / `404` / `409` / idempotent `200`). Quickstart leak-guard inverse: the guesser tab's `GET /rooms/:code?participantId=<guesser>` now contains `secretWord` in `"result"`. **No Restart yet**.

---

## Phase 4 — User Story 2: Host Restart → Lobby (Priority: P2)

**Story goal**: From the `"result"` state, the host clicks **Restart**. Within one ~2 s poll, every tab returns to the lobby with the participant list intact and zero round state. The host can immediately start a new round; the new round's scores and guess feed are both empty.

**Independent test**: With Scenario 1 complete, click **Restart** in the host tab. Within ≤ 2 s **both** tabs show `status: "lobby"`, the same participant list, no scoreboard, no guess feed, no banner. Click **Start Game** in the host tab; the new round has `scores = { Alice: 0, Bob: 0 }` and `guesses = []`.

### Tests for User Story 2

- [ ] T023 [P] [US2] In `backend/src/api/schemas.test.ts`, add cases for a new `restartRoomSchema`: valid `{ participantId: "p1" }` parses; missing → throws; empty → throws. Cite **FR-005**.
- [ ] T024 [P] [US2] In `backend/src/services/roomStore.test.ts`, add cases for a new `restartRoom(code, requesterId)` service function:
  - returns `{ ok: false, reason: "not_found" }` for unknown rooms;
  - returns `{ ok: false, reason: "not_host" }` for a non-host caller (regardless of room status);
  - returns `{ ok: false, reason: "not_ended" }` when the room is in `"round"`;
  - on the happy path (room in `"result"`, caller = host): returns `{ ok: true, room }` with `room.status === "lobby"`, `room.round === null`, `room.participants` byte-identical to the pre-restart array (same order, same IDs, same `hostParticipantId`);
  - **idempotent**: a second call by the host when the room is already in `"lobby"` returns `{ ok: true, room }` with the same body and **no** `updatedAt` bump;
  - **fresh start invariant** (SC-005): after `restartRoom` followed by `startRoom`, the new `room.round.scores` map equals `{ ...0 for every participant }` and `room.round.guesses` has length `0`.
  
  Cite **FR-005, FR-006, FR-007**.
- [ ] T025 [P] [US2] In `backend/src/api/rooms.test.ts`, add integration tests for `POST /rooms/:code/restart`:
  - `200` happy path: response body has `room.status === "lobby"`, `room.round === null`, `room.canStart === true` (when ≥ 2 participants);
  - `200` idempotent re-restart: a second POST by the host returns the same body and `room.status` is still `"lobby"`;
  - `400` for empty `participantId`;
  - `403` `"Only the host can restart the room"` for a non-host caller;
  - `404` `"Room not found"` for an unknown code;
  - `409` `"End the active round before restarting"` when called against a round-state room;
  - **end-to-end loop**: `POST /start` → `POST /guesses` → `POST /end` → `POST /restart` → `POST /start` produces a fresh round whose `scores` map values are all `0` and whose `guesses` array is empty (covers FR-006 + SC-005).
  
  Cite **FR-005, FR-006, FR-007**.
- [ ] T026 [P] [US2] In `frontend/src/services/api.test.ts`, add cases for `api.restartRoom(code, participantId)`: success returns `{ room }`; `409` maps to `ApiError`. Cite **FR-005**.
- [ ] T027 [P] [US2] Extend `frontend/src/components/ResultView.test.tsx`: assert that clicking the **Restart** button calls the `onRestart` prop exactly once with no arguments; when `viewerIsHost === false`, the button is **not** rendered (already covered in T012's no-button case — extend the same suite with a host-click case). Cite **FR-010**.

### Implementation for User Story 2

- [ ] T028 [US2] In `backend/src/api/schemas.ts`, export `export const restartRoomSchema = z.object({ participantId: z.string().min(1) });`. Cite **FR-005**.
- [ ] T029 [US2] In `backend/src/services/roomStore.ts`, export a typed `restartRoom(code, requesterId)` function returning the discriminated outcome `{ ok: true, room: Room } | { ok: false, reason: "not_found" | "not_host" | "not_ended" }`:
  - if the room is missing → `not_found`;
  - if `requesterId !== room.hostParticipantId` → `not_host`;
  - if `room.status === "round"` → `not_ended`;
  - if `room.status === "result"`: set `room.round = null`, `room.status = "lobby"`, bump `room.updatedAt`, return `{ ok: true, room: cloneRoom(room) }`;
  - if `room.status === "lobby"` (idempotent re-call): return `{ ok: true, room: cloneRoom(room) }` **without** mutating `updatedAt`.
  
  Cite **FR-005, FR-006, FR-007**.
- [ ] T030 [US2] In `backend/src/api/rooms.ts`, add `POST /rooms/:code/restart`: validate via `restartRoomSchema` and `roomCodeParamsSchema`, call `restartRoom`, translate the discriminated outcome to HTTP envelopes (`404 "Room not found"` / `403 "Only the host can restart the room"` / `409 "End the active round before restarting"` / `200` with `{ room: toRoomSnapshot(outcome.room, participantId) }`). Cite **FR-005, FR-007**.
- [ ] T031 [US2] In `frontend/src/services/api.ts`, export `restartRoom(code: string, participantId: string)` that POSTs to `/rooms/:code/restart`, mirroring `startRoom` exactly. Cite **FR-005**.
- [ ] T032 [US2] In `frontend/src/state/roomStore.ts`, add a `restartRoom()` method that mirrors `startRoom()`: uses the current `room.code` and `participantId`, calls `api.restartRoom`, replaces `state.room` on success, sets `state.error` on failure. Cite **FR-005, FR-008**.
- [ ] T033 [US2] In `frontend/src/pages/LobbyPage.tsx`, wire the `onRestart` prop on `<ResultView />` (added in T022) to `() => roomStore.restartRoom()`. Cite **FR-010**.

**Checkpoint**: Quickstart Scenario 2 passes end-to-end. The full game loop now runs: create → join → start → guess → **end** → **restart** → start → … No persistence across backend restarts (in-memory by design).

---

## Phase 5 — Polish

**Purpose**: Documentation parity and a final green-test gate before declaring the feature done.

- [ ] T034 Update `README.md` — add a *"Implemented today (Scenario 4 — Result, Restart & Final Validation)"* sub-section after the existing Scenario 3 section, listing: the new `"result"` status, the two new endpoints, the host-only gating, the full-word reveal contract in `"result"`, idempotency on both endpoints, and the fact that Restart discards round state (no cumulative scoring). Also append `POST /rooms/:code/end` and `POST /rooms/:code/restart` to the *"API Included In The Starter"* endpoint list. Remove `result state` and `restart flow` from the *"Not implemented yet"* list. Cite **all FR-### in 004**.
- [ ] T035 Run `npm test` in **both** packages from a clean state; require both to be fully green. Target: **≥ 100** backend tests, **≥ 60** frontend tests, **0 failures**. This task has **no file change** — it is the final verification gate. Cite **Constitution §V (tests run on every change)**.
- [ ] T036 Mark all tasks in this file as `[X]` via a single `sed` pass (preserves the rest of the document untouched): `sed -i '' 's/- \[ \] T0/- [X] T0/g' specs/004-result-restart/tasks.md`. Verify the resulting `grep -c '^- \[X\] T'` count equals **36**. Documentation-only.

---

## Parallel-execution map

The `[P]` tags above mark tasks that touch **disjoint files** and may be executed by separate workers without merge conflict:

- **Phase 2** *(foundational, all sequential except T003)*: only T003 is `[P]` — frontend wire-type mirror, independent of T002/T004 which touch backend files.
- **Phase 3 — Tests for US1**: T005, T006, T007, T008, T009, T010, T011, T012 are mutually parallel-safe (eight different test files / suites).
- **Phase 3 — Implementation for US1**: strictly sequential by file-graph dependency (T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022).
- **Phase 4 — Tests for US2**: T023, T024, T025, T026, T027 are mutually parallel-safe.
- **Phase 4 — Implementation for US2**: strictly sequential (T028 → T029 → T030 → T031 → T032 → T033).
- **Phase 5**: sequential (T034 → T035 → T036).

---

## Story → Task index

| Story | Priority | Test tasks | Impl tasks | Total |
|---|---|---|---|---|
| **US1** End Round → Result | P1 | T005–T012 (8) | T013–T022 (10) | 18 |
| **US2** Host Restart → Lobby | P2 | T023–T027 (5) | T028–T033 (6) | 11 |
| **Setup / Foundational / Polish** | n/a | — | T001–T004, T034–T036 | 7 |
| **Total** | | | | **36** |

---

## Suggested MVP scope

**Stop after T022 (end of Phase 3)** — the room can now end and reveal. Restart can ship later as a follow-up; the host can hard-restart by restarting the backend (in-memory store wipes on process restart). This is **not recommended** because Restart is the only escape from `"result"` without a server bounce — but it is technically an independently testable slice per the spec's US1 independence claim.

The intended end-state is **all 36 tasks** through Phase 5.
