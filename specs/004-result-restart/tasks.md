---

description: "Task list for 004-result-restart"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. Plan §Testing Strategy and Constitution Principle V both call for backend and frontend Vitest coverage alongside the manual three-tab gate.

**Organization**: Tasks are grouped by user story (US1, US2) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- All paths below are repo-root-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup required — dev environment, lockfiles, and `.gitignore` carry through from Scenarios 1 + 2 + 3.

(intentionally empty — proceed to Phase 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Widen `RoomStatus` to include `"result"` on both ends so every US-specific task compiles.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Widen the `RoomStatus` type in `backend/src/models/game.ts` from `"lobby" \| "playing"` to `"lobby" \| "playing" \| "result"`. No other change in this file. Maps to Data Model §`RoomStatus` (extended).
- [X] T002 [P] Mirror the status widening in `frontend/src/services/api.ts`: change the `status` field of the local `RoomSnapshot` interface from `"lobby" \| "playing"` to `"lobby" \| "playing" \| "result"`. No runtime change.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - End Round + result-state reveal (Priority: P1) 🎯 MVP

**Goal**: The host triggers End Round; all clients transition to a result view that shows the secret word, every participant's final score, and the full guess history with the literal text of every entry — including correct entries that were redacted during play.

**Independent Test**: With three tabs in the game view at the end of Scenario 3 (Alice drawer, Bob guesser with score 100 from a correct `rocket`, Carol guesser with score 0 from one incorrect guess), have Alice press End Round. Within ~3 s all three tabs transition to the result view showing `rocket` as the secret word, the scoreboard (`Alice = 0, Bob = 100, Carol = 0`), and Bob's correct entry rendered with the literal text `rocket` (no `<correct guess>` placeholder). Carol's Network tab on the latest `GET /rooms/<code>` shows `room.currentRound.secretWord === "rocket"` and Bob's entry's `text === "rocket"` (NOT `null`).

### Tests for User Story 1

- [X] T003 [P] [US1] Extend `backend/src/services/roomStore.test.ts` with: (a) `endRound(code, hostId)` from `playing` returns `{room}` with `room.status === "result"` and preserves `currentRound`, `guesses`, scores; (b) `endRound(code, nonHostId)` returns `{error: "not-host"}`; (c) `endRound(code, hostId)` from a `lobby` room returns `{error: "wrong-state"}`; (d) `endRound(code, hostId)` from an already-`result` room returns `{error: "wrong-state"}`; (e) `endRound("ZZZZ", anyId)` returns `null`; (f) with a room in `status === "result"`, `toRoomSnapshot(room, anyViewerId).currentRound.secretWord === room.currentRound.secretWord` for the drawer, every guesser, and an unknown id; (g) with the same room, `toRoomSnapshot(room, anyViewerId).guesses[i].text === room.guesses[i].text` for every entry and every viewer — including correct entries that Scenario 3 would have redacted; (h) **regression**: with a room in `status === "playing"`, the Scenario 2 + Scenario 3 redactions still apply (secretWord null for non-drawer, text null for non-privileged correct entries). Maps to FR-001 → FR-005, FR-007, FR-015, SC-002, SC-004, SC-005, SC-007.
- [X] T004 [P] [US1] Add cases to `frontend/src/services/api.test.ts`: `api.endRound("ABCD", "host-id")` POSTs to `http://localhost:3001/rooms/ABCD/end` with body `{"participantId":"host-id"}`; surfaces a non-ok response's `message` verbatim (e.g., `"Only the host can end the round"`). Maps to contract `POST_rooms_code_end.md`.
- [X] T005 [P] [US1] Create `frontend/src/pages/ResultPage.test.tsx` (new file) using Vitest + jsdom + MemoryRouter, mirroring the harness from `GamePage.test.tsx`. Cover (US1-relevant cases only — US2 cases land in T017): (a) given a snapshot with `status: "result"`, `currentRound.secretWord: "rocket"`, three participants (Alice host with score 0, Bob with score 100, Carol with score 0), and two history entries (Bob correct `"rocket"`, Carol incorrect `"banana"`), mounting the page as any viewer renders `"rocket"` somewhere prominently; (b) the rendered DOM contains the scoreboard with `Alice 0`, `Bob 100`, `Carol 0`; (c) the rendered guess history contains the literal text `"rocket"` AND `"banana"` AND does NOT contain the placeholder string `"<correct guess>"`; (d) the host viewer sees a "Waiting for the host to restart" copy is NOT shown for the host (Restart button is US2 — that test lands in T017; here just assert the page does not crash on the host viewer). Maps to FR-005, FR-006, FR-007, SC-002, SC-003, SC-004.
- [X] T006 [P] [US1] Extend `frontend/src/pages/GamePage.test.tsx`: (a) when the viewer is the host and `room.status === "playing"`, the End Round control is rendered; (b) when the viewer is a guesser, the End Round control is NOT rendered at any point; (c) when `room.status` transitions to `"result"`, the GamePage's effect navigates to `/result` (use the same router-routes-probe pattern from `LobbyPage.test.tsx`'s status-transition test). Maps to FR-001, FR-004.

### Implementation for User Story 1

- [X] T007 [P] [US1] Update `backend/src/services/roomStore.ts`: (a) add `endRound(code: string, participantId: string)` that returns the discriminated union `null | {error: "not-host"} | {error: "wrong-state"} | {room}`; service-layer ordering: room exists → participantId === hostParticipantId else `not-host` → status === "playing" else `wrong-state` → set `room.status = "result"` (preserve `currentRound`, `guesses`, scores) and bump `updatedAt`; (b) extend `toRoomSnapshot(room, viewerParticipantId)` so the Scenarios 2 + 3 redactions are short-circuited when `room.status === "result"`: `currentRound.secretWord` becomes the real word for every viewer; every `guess.text` becomes the real text for every viewer. The conditional sits at the top of the privileged-viewer derivation per Plan §Phase 0 research. Existing Scenario 2 + 3 `playing`-state filtering MUST remain unchanged. Maps to FR-004, FR-005, FR-007.
- [X] T008 [P] [US1] Update `backend/src/api/schemas.ts`: export a new named alias `endRoundSchema` pointing at the same Zod object as `startRoomSchema` (i.e., `export const endRoundSchema = startRoomSchema;`). No new validation logic. Maps to Plan §Decision: schema reuse.
- [X] T009 [US1] Update `backend/src/api/rooms.ts` (depends on T007 + T008): add `POST /:code/end` route. Resolve errors per research §endpoint error precedence: parse `roomCodeParamsSchema` (400 "Enter a room code" for empty code) → parse `endRoundSchema` (400 "Invalid request payload" via existing errorHandler) → call `endRound(code.toUpperCase(), participantId)` → map sentinels: `null` → `HttpError(404, "Room not found")`, `{error: "not-host"}` → `HttpError(403, "Only the host can end the round")`, `{error: "wrong-state"}` → `HttpError(409, "Cannot end a round that is not in progress")` → success response: `{room: toRoomSnapshot(result.room, participantId)}`. Maps to FR-001, FR-002, FR-003, FR-015, contract `POST_rooms_code_end.md`.
- [X] T010 [P] [US1] Update `frontend/src/services/api.ts`: add `api.endRound(code: string, participantId: string)` that POSTs `{participantId}` to `/rooms/${encodeURIComponent(code)}/end` via the existing `request<{ room: RoomSnapshot }>` helper.
- [X] T011 [US1] Update `frontend/src/state/roomStore.ts` (depends on T010): add `async endRound()` action that requires `this.state.room` and `this.state.participantId` to be present, calls `api.endRound(room.code, participantId)`, and stores `response.room` via `setRoomSnapshot`. Surface server errors via the rejected promise (matching `startGame`/`submitGuess` patterns).
- [X] T012 [P] [US1] Create `frontend/src/pages/ResultPage.tsx` (new file). The page MUST render only when `room?.status === "result"`; if `room` is null OR status is `"lobby"`/`"playing"`, the page's `useEffect` MUST `navigate("/")` (or `navigate("/lobby", {replace: true})` if room is non-null but status is lobby — Restart is the path for that flow, but a stray load is safest to redirect to `/`). The layout per Plan §Decision: ResultPage layout: (1) header card with `"Round Over"` + the `RoomCodeBadge`; (2) `"The word was…"` card containing the literal `room.currentRound.secretWord` (no placeholder branch — secretWord is always non-null in result state); (3) the existing `<Scoreboard participants={room.participants} drawerParticipantId={room.currentRound?.drawerParticipantId} />` ; (4) a `"Full guess history"` card with the same sorted-by-`order` list pattern from GamePage but with NO placeholder branch (`text` is always non-null here); (5) for the host only, a "Waiting for the host to restart" copy is shown to non-hosts; the host's Restart button is added in T023. Reuse `useLobbyPolling(room?.code ?? null)` so the page stays in sync. Maps to FR-005, FR-006, FR-007, FR-014.
- [X] T013 [US1] Update `frontend/src/pages/GamePage.tsx` (depends on T011): (a) when `isHost && room.status === "playing"`, render an `End Round` button next to / below the `"You're the drawer"` card; wire its `onClick` to call `roomStore.endRound()` and surface errors via local state; (b) add a `useEffect` that watches `room?.status`: when it flips to `"result"`, call `navigate("/result", {replace: true})`. Non-host viewers MUST NOT see the End Round button. Maps to FR-001, FR-002, FR-004.
- [X] T014 [US1] Update `frontend/src/routes/index.tsx` (depends on T012): import `ResultPage` from `../pages/ResultPage` and add a `<Route path="/result" element={<ResultPage />} />` to the existing `<Routes>` block (between `/game` and the `*` catch-all). Maps to Plan §Phase 0 Decision: no new client routes besides `/result`.

**Checkpoint**: User Story 1 should be fully functional — host can end the round, every tab transitions to the result view with the word + scores + history all revealed. Validate via the US1 section of `quickstart.md` (steps 7 through 24).

---

## Phase 4: User Story 2 - Host restarts and everyone returns to the lobby (Priority: P2)

**Goal**: From the result view, the host presses Restart; every client returns to the lobby for the same room with the same participants; every score is reset to 0; the guess history is empty; the current round is cleared.

**Independent Test**: From the end of US1 (Tab A on result view as host; Tabs B and C on result view as guessers), press Restart in Tab A. Within ~3 s all three tabs leave the result view for the lobby view. Tab A is still the host. The participant list shows Alice, Bob, Carol in the same order. Inspecting `GET /rooms/<code>`'s response in any tab shows `status: "lobby"`, `currentRound: null`, `guesses: []`, and every `participant.score === 0`. Pressing Start in Tab A begins a fresh round (Scenarios 2/3 flow) with all scores at 0 and an empty history.

### Tests for User Story 2

- [X] T015 [US2] Extend `backend/src/services/roomStore.test.ts` (same file as T003, so sequential): (a) `restartRoom(code, hostId)` from `result` returns `{room}` with `status === "lobby"`, `currentRound === null`, `guesses === []`, every `participant.score === 0`; (b) the same call preserves `participants` (length, order, ids, names) AND `hostParticipantId` verbatim from the pre-restart state; (c) `restartRoom(code, nonHostId)` from `result` returns `{error: "not-host"}`; (d) `restartRoom(code, hostId)` from `lobby` returns `{error: "wrong-state"}`; (e) `restartRoom(code, hostId)` from `playing` returns `{error: "wrong-state"}`; (f) `restartRoom("ZZZZ", anyId)` returns `null`. Maps to FR-008 → FR-011, SC-006, SC-008, SC-009, SC-010.
- [X] T016 [P] [US2] Add cases to `frontend/src/services/api.test.ts` (same file as T004, append after): `api.restart("ABCD", "host-id")` POSTs to `http://localhost:3001/rooms/ABCD/restart` with body `{"participantId":"host-id"}`; surfaces a non-ok response's `message` verbatim (e.g., `"Only the host can restart"`). Maps to contract `POST_rooms_code_restart.md`.
- [X] T017 [US2] Extend `frontend/src/pages/ResultPage.test.tsx` (same file as T005, append): (a) when the viewer is the host (`isHost === true`), the Restart button is rendered; (b) when the viewer is a guesser, the Restart button is NOT rendered at any point; (c) clicking the Restart button as the host calls a stubbed `roomStore.restart`; (d) when `room.status` transitions to `"lobby"`, the ResultPage's effect navigates to `/lobby` (use the same routes-probe pattern from `LobbyPage.test.tsx`). Maps to FR-008, FR-009, FR-012, SC-006.

### Implementation for User Story 2

- [X] T018 [P] [US2] Update `backend/src/services/roomStore.ts` (same file as T007, append): add `restartRoom(code: string, participantId: string)` that returns the discriminated union `null | {error: "not-host"} | {error: "wrong-state"} | {room}`; service-layer ordering: room exists → participantId === hostParticipantId else `not-host` → status === "result" else `wrong-state` → for each `room.participants[i]`, set `score = 0`; set `room.guesses = []`; set `room.currentRound = null`; set `room.status = "lobby"`; bump `updatedAt`. Maps to FR-008 → FR-011.
- [X] T019 [P] [US2] Update `backend/src/api/schemas.ts` (same file as T008): export a new named alias `restartRoomSchema` pointing at `startRoomSchema` (i.e., `export const restartRoomSchema = startRoomSchema;`). No new validation logic.
- [X] T020 [US2] Update `backend/src/api/rooms.ts` (depends on T018 + T019): add `POST /:code/restart` route. Resolve errors per the same precedence as `/end`: code params → body Zod → room lookup → host check → state check → service success. Map sentinels: `null` → `HttpError(404, "Room not found")`, `{error: "not-host"}` → `HttpError(403, "Only the host can restart")`, `{error: "wrong-state"}` → `HttpError(409, "Cannot restart from this state")` → success response: `{room: toRoomSnapshot(result.room, participantId)}`. Maps to FR-008 → FR-011, FR-015, contract `POST_rooms_code_restart.md`.
- [X] T021 [P] [US2] Update `frontend/src/services/api.ts` (same file as T010): add `api.restart(code: string, participantId: string)` that POSTs `{participantId}` to `/rooms/${encodeURIComponent(code)}/restart` via the existing `request<{ room: RoomSnapshot }>` helper.
- [X] T022 [US2] Update `frontend/src/state/roomStore.ts` (same file as T011; depends on T021): add `async restart()` action that requires `this.state.room` and `this.state.participantId` to be present, calls `api.restart(room.code, participantId)`, and stores `response.room` via `setRoomSnapshot`. Surface server errors via the rejected promise.
- [X] T023 [US2] Update `frontend/src/pages/ResultPage.tsx` (same file as T012; depends on T022): (a) replace the placeholder "Waiting for the host to restart" copy with a conditional render — when `isHost === true`, render a `Restart` button wired to `roomStore.restart()` with error handling via local state; when `isHost === false`, render the "Waiting for the host to restart" copy; (b) add a `useEffect` that watches `room?.status`: when it flips to `"lobby"`, call `navigate("/lobby", {replace: true})`. Maps to FR-008, FR-009, FR-012, SC-006, SC-009.

**Checkpoint**: All three tabs transition back to the lobby on host Restart; scores zeroed; history empty; round cleared; subsequent Start begins a fresh round. Validate via the US2 section of `quickstart.md` (steps 25 through 38).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Enforce the constitution's quality gates and confirm scenario-level acceptance.

- [X] T024 [P] Run `cd backend && npm run build` and confirm it succeeds. Maps to Constitution Principle V build gate.
- [X] T025 [P] Run `cd frontend && npm run build` and confirm it succeeds (`tsc -b && vite build`). Maps to Constitution Principle V build gate.
- [X] T026 [P] Run `cd backend && npm test` and confirm all tests pass (existing + new from T003, T015).
- [X] T027 [P] Run `cd frontend && npm test` and confirm all tests pass (existing + new from T004, T005, T006, T016, T017).
- [ ] T028 Execute the full three-tab walkthrough in `specs/004-result-restart/quickstart.md` end-to-end: US1 End Round + transition (SC-001), result-view word + scores + full history (SC-002, SC-003, SC-004), **Network-tab inspection** of Carol's payload showing `secretWord` and `text` populated (SC-004 enforcement), non-host end-round blocked with 403 (SC-005), wrong-state end-round blocked with 409 (SC-007), host refresh on result view (edge case), US2 non-host restart blocked with 403 (SC-006), wrong-state restart blocked with 409 (SC-008), US2 host restart + transition (SC-009), post-restart snapshot has cleared round state (SC-010), post-restart Start begins a fresh round (SC-011), polling stops on navigate away (SC-012), late join after restart succeeds (edge case). Tick off the sign-off checklist in `quickstart.md`.
- [ ] T029 Review the branch commit history with `git log --oneline main..HEAD`: every commit message MUST reference at least one task ID (T###) or scenario from `spec.md`; no commit may span more than one user story. If any commit fails this rule, reword/split before opening the PR. Maps to Constitution Principle V granular-commits rule.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)** — T001 → T002 (T002 mirrors T001 but they're different files and T002 doesn't strictly depend on T001 compiling, so they can run in parallel after both are merged together). Both must complete before any US task compiles.
- **Phase 3 (US1)** — depends on Phase 2 only.
  - Within US1 backend: T003 (test) and T007 (impl) / T008 (impl) can run in parallel after Phase 2; T009 (route) depends on T007 + T008.
  - Within US1 frontend: T004 / T005 / T006 (tests) and T010 / T012 (impl) can run in parallel after Phase 2; T011 (store action) depends on T010; T013 (GamePage wiring) depends on T011; T014 (route registration) depends on T012.
- **Phase 4 (US2)** — depends on Phase 3.
  - Within US2: T015 (test, same file as T003 — sequential) and T018 / T019 (impl) and T020 (route) all live in files US1 has already touched; sequence is T018 ∥ T019 → T020 with T020 depending on T009 having merged earlier (different route in same router).
  - Frontend US2: T016 (api test, same file as T004), T017 (ResultPage test, same file as T005), T021 (api impl, same file as T010), T022 (store action, same file as T011), T023 (ResultPage impl, same file as T012) — every one of these touches a file US1 already modified, so sequential within each file. Across files, T021 ∥ T023 in different files but T022 depends on T021 and T023 depends on T022.

### Cross-phase same-file conflicts (sequencing notes)

- `backend/src/services/roomStore.ts` is touched by T007 (US1 endRound + snapshot reveal) and T018 (US2 restartRoom). T018 appends a new function; sequence after T007.
- `backend/src/services/roomStore.test.ts` is touched by T003 (US1) and T015 (US2). Append-only.
- `backend/src/api/schemas.ts` is touched by T008 (US1 alias) and T019 (US2 alias). Append-only; trivial to land in either order, sequence after the start-game scenario's existing exports.
- `backend/src/api/rooms.ts` is touched by T009 (US1 route) and T020 (US2 route). Both are new routes in the same router; T020 sequential after T009 only because they edit the same file.
- `frontend/src/services/api.ts` is touched by T010 (US1) and T021 (US2). Append-only.
- `frontend/src/services/api.test.ts` is touched by T004 (US1) and T016 (US2). Append-only.
- `frontend/src/state/roomStore.ts` is touched by T011 (US1 endRound action) and T022 (US2 restart action). Append-only.
- `frontend/src/pages/ResultPage.tsx` is touched by T012 (US1, creates the file) and T023 (US2, adds Restart button + lobby transition). T023 sequential after T012.
- `frontend/src/pages/ResultPage.test.tsx` is touched by T005 (US1, creates the file) and T017 (US2 cases). T017 sequential after T005.
- `frontend/src/pages/GamePage.tsx` is touched by T013 (US1) only. No US2 conflict.
- `frontend/src/pages/GamePage.test.tsx` is touched by T006 (US1) only.
- `frontend/src/routes/index.tsx` is touched by T014 (US1) only.

### Parallel Opportunities

- T002 within Foundational (after T001).
- T003 ∥ T004 ∥ T005 ∥ T006 within US1 tests (4 independent files).
- T007 ∥ T008 ∥ T010 ∥ T012 within US1 implementation (4 different files).
- T016 within US2 (one file isolated from T015 and T017).
- T018 ∥ T019 ∥ T021 within US2 implementation.
- T024 ∥ T025 ∥ T026 ∥ T027 within Polish.

---

## Parallel Example: User Story 1

```text
# After Foundational completes, launch the four US1-test scaffolds in parallel:
T003 [US1] backend roomStore.test.ts — endRound + result-state snapshot reveal cases
T004 [US1] frontend api.test.ts — api.endRound request shape + error passthrough
T005 [US1] frontend ResultPage.test.tsx (NEW) — word + scoreboard + full history rendering
T006 [US1] frontend GamePage.test.tsx — End Round button visibility + transition to /result

# In parallel with those, the file-isolated implementation tasks:
T007 [US1] backend roomStore.ts — endRound() service + toRoomSnapshot result-state reveal
T008 [US1] backend schemas.ts — endRoundSchema alias
T010 [US1] frontend api.ts — api.endRound
T012 [US1] frontend ResultPage.tsx (NEW) — page layout (no Restart button yet)

# Then sequentially:
T009 ← T007 + T008  (route uses both)
T011 ← T010         (store calls api)
T013 ← T011         (GamePage uses store action)
T014 ← T012         (routes import the new page)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2 Foundational — T001 + T002 in parallel.
2. Phase 3 US1 — all tests + implementation tasks per the parallel example above.
3. **STOP and VALIDATE**: run the US1 section of `quickstart.md` end-to-end. Host can end the round; all tabs transition; result view shows the word + scores + full history; Network tab confirms the reveal. MVP demoable.

### Incremental Delivery

1. MVP US1 → commit, demo.
2. Add US2 (restart) → commit. The loop closes — Start → play → End Round → Restart → Start again.
3. Polish (T024–T029) → both builds green, both test suites green, three-tab walkthrough green, commit hygiene reviewed. Open the PR.

### Parallel Team Strategy

Not applicable at lab scale (single contributor). With two contributors after Foundational:
- Contributor A: US1 backend (T007/T008/T009) + frontend api/store (T010/T011).
- Contributor B: US1 frontend pages/route (T012/T013/T014) + US2 (entire).
- Meet at Polish.

---

## Notes

- [P] tasks = different files, no in-flight dependencies on incomplete tasks.
- [Story] label maps each task to its user story for traceability (Constitution Principle V — commit messages must reference at least one task ID).
- Verify tests fail before implementing (TDD for the test-prefixed tasks within each story).
- Commit after each task or each tight logical group (Constitution Principle V — granular commits).
- Stop at any checkpoint to validate the story with the relevant `quickstart.md` section.
- The most important quality lever in this feature is **T007 (b) + T003 (f)/(g)/(h)**: the result-state visibility override and its tests. The override is one conditional in one function, but it has to (a) reveal the secret word in result state regardless of viewer, (b) reveal every guess entry's real text in result state regardless of viewer, and (c) leave the Scenarios 2 + 3 redactions untouched when status is `"playing"`. Reviewers should pay special attention to test (h) — the regression that locks the playing-state behaviour — and the Network-tab inspection step in `quickstart.md` step 21.
