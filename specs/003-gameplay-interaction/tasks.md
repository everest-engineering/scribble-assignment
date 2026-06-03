---

description: "Task list for 003-gameplay-interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. Plan §Testing Strategy and Constitution Principle V both call for backend and frontend Vitest coverage alongside the manual three-tab gate.

**Organization**: Tasks are grouped by user story (US1, US2, US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- All paths below are repo-root-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup required — dev environment, lockfiles, and `.gitignore` carry through from Scenarios 1 + 2.

(intentionally empty — proceed to Phase 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `score` to `Participant`, add `Guess` / `SnapshotGuess`, and add `guesses[]` to `Room` and `RoomSnapshot` on both ends. Patch every snapshot-building helper (in tests and in stores) so the widened type compiles before any US-specific work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Extend `backend/src/models/game.ts`: add `score: number` to `Participant`; add `Guess { id: string; guesserParticipantId: string; text: string; isCorrect: boolean; submittedAt: string; order: number }`; add `SnapshotGuess { id: string; guesserParticipantId: string; text: string \| null; isCorrect: boolean; submittedAt: string; order: number }`; add `guesses: Guess[]` to `Room`; add `guesses: SnapshotGuess[]` to `RoomSnapshot`. Maps to Data Model §Backend types.
- [X] T002 Update `backend/src/services/roomStore.ts` with the minimal patches required for the new types to compile: (a) `createParticipant` returns an object with `score: 0`; (b) `createRoom` builds `Room` with `guesses: []`; (c) `toRoomSnapshot` returns `guesses: []` for now (the viewer-aware filter is T011). No new exports. Maps to Data Model §State transitions.
- [X] T003 [P] Mirror the type extensions in `frontend/src/services/api.ts`: add `score: number` to the local `Participant`; add `SnapshotGuess { id, guesserParticipantId, text: string \| null, isCorrect, submittedAt, order }`; add `guesses: SnapshotGuess[]` to the local `RoomSnapshot`. No runtime change.
- [X] T004 [P] Update `frontend/src/state/roomStore.ts`: the `hydrateSession` placeholder room must include `guesses: []` so the new type satisfies TypeScript.
- [X] T005 [P] Update the snapshot-building helpers in the four existing test files so they satisfy the widened type: `frontend/src/pages/LobbyPage.test.tsx` (the `snapshot()` helper), `frontend/src/state/useLobbyPolling.test.tsx` (the `StoreSeed` body + the `vi.spyOn(api, "fetchRoom")` mock), `frontend/src/pages/GamePage.test.tsx` (the `snapshot()` helper), and `frontend/src/services/api.test.ts` (every `mockResolvedValue` snapshot literal). Each needs `participant.score: 0` and `guesses: []` (and, where applicable, `score: 0` on the participant objects). No behavioural test changes here — pure type-compatibility fix.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Guessers submit guesses; scoring is server-authoritative (Priority: P1) 🎯 MVP

**Goal**: A non-drawer participant can submit a guess; the server trims it, validates non-empty, blocks the drawer + non-playing rooms, compares case-insensitively against the secret word, appends to a per-round history, and adjusts the submitter's score by 100 IFF this is their first correct guess in the round. The drawer cannot submit.

**Independent Test**: With two browser tabs already on the game view from Scenario 2 (Alice as drawer in Tab A; Bob as guesser in Tab B), use Tab B to submit (a) `""` → rejected; (b) `"   "` → rejected; (c) `"RoCkEt"` (assuming secret word `rocket`) → accepted; Bob's score becomes 100; (d) `"rocket"` again → accepted; Bob's score stays 100 (cap); (e) `"pizza"` → accepted; Bob's score still 100. From Tab A, attempt to submit via the browser console using Alice's `participantId`; expect HTTP 403.

### Tests for User Story 1

- [X] T006 [P] [US1] Extend `backend/src/services/roomStore.test.ts` with: (a) `submitGuess` correct path appends a `Guess` with `isCorrect: true`, `order === room.guesses.length - 1`, and bumps `guesser.score` to 100; (b) a second `submitGuess` by the same guesser with the correct word appends another entry but keeps `guesser.score` at 100 (cap rule); (c) `submitGuess` with `"  RoCkEt  "` records `text: "RoCkEt"` (trimmed, original casing) and `isCorrect: true`; (d) `submitGuess` with `"pizza"` records `isCorrect: false`; score unchanged; (e) `submitGuess(code, drawerId, "rocket")` returns `{error: "is-drawer"}`; (f) `submitGuess(code, anyId, "rocket")` against a `lobby`-state room returns `{error: "not-playing"}`; (g) `submitGuess("ZZZZ", anyId, "rocket")` returns `null`; (h) after `startRoom`, every `Participant.score === 0` AND `room.guesses === []`; (i) `toRoomSnapshot(room, originalGuesserId).guesses[i].text === entry.text` for every entry whose `guesserParticipantId === originalGuesserId`; (j) `toRoomSnapshot(room, drawerId).guesses[i].text === entry.text` for every entry, regardless of guesser; (k) `toRoomSnapshot(room, thirdPartyId).guesses[i].text === null` for every correct entry whose guesser ≠ thirdPartyId, and `=== entry.text` for every incorrect entry; (l) `toRoomSnapshot(room, undefined).guesses[i].text === null` for every correct entry. Maps to FR-001 → FR-007, FR-010, FR-015, FR-016, SC-002, SC-003, SC-010.
- [X] T007 [P] [US1] Extend `backend/src/api/schemas.test.ts`: `submitGuessSchema` accepts `{participantId: "x", text: "rocket"}`; rejects `{participantId: "x", text: ""}` with `"Enter a guess"`; rejects `{participantId: "x", text: "   "}` with `"Enter a guess"`; rejects `{text: "rocket"}` (missing `participantId`). Maps to contract `POST_rooms_code_guess.md`.
- [X] T008 [P] [US1] Extend `frontend/src/services/api.test.ts`: `api.submitGuess("ABCD", "guest-id", "rocket")` POSTs to `http://localhost:3001/rooms/ABCD/guess` with body `{"participantId":"guest-id","text":"rocket"}` and the JSON `Content-Type` header. Add a second case asserting a non-ok response with `{message: "Only guessers can submit guesses"}` is surfaced as `Error.message`. Maps to contract `POST_rooms_code_guess.md`.
- [X] T009 [P] [US1] Create `frontend/src/components/GuessForm.test.tsx` (new file) using Vitest + jsdom (no MemoryRouter required — GuessForm is router-independent). Cover: (a) submitting the form with an empty input shows an inline `"Enter a guess"` error and the supplied `onSubmit` prop is NOT called; (b) submitting with `"  rocket  "` calls `onSubmit` with the trimmed value `"rocket"` and clears the input; (c) when the `disabled` prop is true, the input and button are both disabled and submit is a no-op. Maps to FR-002, FR-003, FR-015, FR-014.
- [X] T010 [P] [US1] Extend `frontend/src/pages/GamePage.test.tsx`: add a case that mounts the page as a guesser (`isDrawer === false`), stubs `roomStore.submitGuess`, simulates form submission with `"rocket"`, and asserts `roomStore.submitGuess` was called with `"rocket"`. Add a second case asserting the GuessForm is NOT rendered when the viewer is the drawer. Maps to FR-001.

### Implementation for User Story 1

- [X] T011 [P] [US1] Update `backend/src/services/roomStore.ts`: (a) implement `submitGuess(code, participantId, text)` that returns the discriminated union `null | {error: "not-playing"} | {error: "is-drawer"} | {room, guessId}`; service-layer ordering: room exists → status === "playing" else `not-playing` → participant is NOT drawer else `is-drawer` → append `Guess` with `order = room.guesses.length` BEFORE push; case-insensitive equality after `trim().toLowerCase()`; cap score bump to 100 IFF no prior `room.guesses` entry has the same `guesserParticipantId` AND `isCorrect: true`; (b) update `startRoom` so the success branch sets every `room.participants[*].score = 0` AND `room.guesses = []` BEFORE setting `currentRound` (so the round is born with clean scores and an empty history); (c) extend `toRoomSnapshot(room, viewerParticipantId)` to map `room.guesses` to `SnapshotGuess[]` with per-entry redaction — incorrect entries always emit real text; correct entries emit real text only when `viewerParticipantId === entry.guesserParticipantId` OR `viewerParticipantId === room.currentRound?.drawerParticipantId`, else `text: null`. Maps to FR-001, FR-004, FR-005, FR-007, FR-010, FR-015, FR-016.
- [X] T012 [P] [US1] Update `backend/src/api/schemas.ts`: add `submitGuessSchema = z.object({ participantId: z.string().min(1), text: z.string().transform((s) => s.trim()).refine((s) => s.length > 0, {message: "Enter a guess"}) })`. Maps to contract `POST_rooms_code_guess.md`.
- [X] T013 [US1] Update `backend/src/api/rooms.ts` (depends on T011 + T012): add `POST /:code/guess` route. Resolve errors in the order described in `research.md §POST_rooms_code_guess endpoint shape`: parse `roomCodeParamsSchema` (400 for empty code) → parse `submitGuessSchema` (400 for empty text, "Enter a guess") → call `submitGuess` → map `null` to `HttpError(404, "Room not found")`, `{error: "not-playing"}` to `HttpError(409, "Round has not started")`, `{error: "is-drawer"}` to `HttpError(403, "Only guessers can submit guesses")` → success response: `{room: toRoomSnapshot(result.room, participantId)}`. Maps to FR-001, FR-003, FR-014, contract `POST_rooms_code_guess.md`.
- [X] T014 [P] [US1] Update `frontend/src/services/api.ts`: add `api.submitGuess(code: string, participantId: string, text: string)` that POSTs `{participantId, text}` to `/rooms/${encodeURIComponent(code)}/guess` via the existing `request<{ room: RoomSnapshot }>` helper.
- [X] T015 [US1] Update `frontend/src/state/roomStore.ts` (depends on T014): add `async submitGuess(text: string)` action that requires `this.state.room` and `this.state.participantId` to be present, calls `api.submitGuess(room.code, participantId, text)`, and stores `response.room` via `setRoomSnapshot`. Surface server errors to the caller via the rejected promise (matching the existing `createRoom`/`joinRoom` pattern). Maps to FR-001.
- [X] T016 [P] [US1] Update `frontend/src/components/GuessForm.tsx`: replace the no-op `handleSubmit` with a real one — accept an `onSubmit?: (text: string) => Promise<void> \| void` prop, trim the input, reject empty values with an inline `<p className="form__error">Enter a guess</p>` rendered inside an `aria-live="polite"` region, call `onSubmit(trimmed)` on success, clear the input on success, and keep the existing `disabled` behaviour. Maps to FR-002, FR-003, FR-014.
- [X] T017 [US1] Update `frontend/src/pages/GamePage.tsx` (depends on T015 + T016): in the right sidebar `Card title="Your Guess"`, render `<GuessForm onSubmit={...} disabled={isDrawer} />` and wire `onSubmit` to call `roomStore.submitGuess(trimmedText)` — surface errors via local state shown next to the form. Keep the Scoreboard / ResultPanel / Canvas placeholders intact (US2 + US3 fill them). Maps to FR-001.

**Checkpoint**: User Story 1 should be fully functional — a guesser can submit guesses, the server scores them with the cap, the history accumulates, and the redaction filter is in effect. Validate by running the US1 section of `quickstart.md`.

---

## Phase 4: User Story 2 - Guess history and scoreboard sync to all participants via polling (Priority: P2)

**Goal**: Every participant sees the same guess history and the same scoreboard, updated within ~3 seconds of any change, with correct-guess text redacted for non-privileged viewers (FR-016 enforcement visible end-to-end).

**Independent Test**: With three tabs (Alice drawer, Bob guesser, Carol guesser) already in the game view after US1, have Bob submit `"rocket"`. Within ~3 seconds Tab A AND Tab C both show Bob's entry in the history with a "correct" marker and Bob's score = 100 in the scoreboard. Tab C's rendered history shows the placeholder `<correct guess>` for Bob's entry (because Carol is neither the guesser nor the drawer). Open Tab C's Network tab and verify the JSON response has `text: null` for Bob's correct entry. Tab A (drawer) sees the literal text `"rocket"` for Bob's entry.

### Tests for User Story 2

- [X] T018 [US2] Extend `frontend/src/pages/GamePage.test.tsx`: (a) given a snapshot whose `guesses` list contains one correct entry from `bob-id` and one incorrect entry from `carol-id`, mounting the page as `bob-id` renders Bob's row with the real text and Carol's row with the real text; (b) mounting the same snapshot as `carol-id` (third-party viewer; snapshot's correct entry has `text: null`) renders Bob's row with the placeholder string `<correct guess>` and Carol's row with the real text; (c) mounting the same snapshot as the drawer (`host-id`; snapshot delivers real text for everything) renders both Bob's row with the real text and Carol's row with the real text; (d) the rendered scoreboard for any viewer shows each participant's `score` from the snapshot. Maps to FR-016, SC-001, SC-010.

### Implementation for User Story 2

- [X] T019 [P] [US2] Update `frontend/src/components/Scoreboard.tsx`: replace the static placeholder with a real component that accepts `{ participants: Participant[]; drawerParticipantId?: string }` and renders a list of `participant.name` + `participant.score` rows. Add a small `"Drawer"` badge next to the participant whose id matches `drawerParticipantId`. Preserve the existing `Card title="Scoreboard"` wrapper. Maps to US2, FR-008, SC-006.
- [X] T020 [P] [US2] Create `frontend/src/components/Scoreboard.test.tsx` (new file): given a fixed participants array (Alice host with score 0, Bob with score 100, Carol with score 0) and `drawerParticipantId === alice.id`, the rendered DOM contains all three names, the strings `"100"` and two `"0"`s in the expected positions, and a `"Drawer"` badge in Alice's row only.
- [X] T021 [US2] Update `frontend/src/pages/GamePage.tsx` (depends on T019; same file as T017): (a) render the `Scoreboard` with `participants={room.participants}` and `drawerParticipantId={room.currentRound?.drawerParticipantId}`; (b) below the canvas / placeholder card, render a new history panel that sorts `room.guesses` by `order` ascending and renders each entry as a list item with the guesser's name (looked up in `participants`), a "correct" or "incorrect" badge, and the entry's `text` if non-null OR the literal placeholder string `"<correct guess>"` if null. Maps to FR-006, FR-007, FR-016, SC-001.

**Checkpoint**: All viewers see the same history and scoreboard via polling; correct-guess text is redacted for non-privileged viewers (visible both in the DOM and in the Network-tab JSON). Validate via the US2 section of `quickstart.md`.

---

## Phase 5: User Story 3 - Drawer draws on a local canvas with a clear control (Priority: P3)

**Goal**: The drawer can make freehand marks inside a canvas region and clear them with a single visible control. The canvas is fully drawer-local; no synchronisation channel exists.

**Independent Test**: As the drawer in Tab A, click-and-drag inside the canvas region — visible strokes appear. Click the Clear button — the canvas becomes blank within 1 second. From Tab B (guesser), confirm at no point that strokes or clears appear on Tab B's screen; the canvas area on non-drawer tabs is either absent or shows the existing Scenario-2 placeholder.

### Tests for User Story 3

- [X] T022 [P] [US3] Create `frontend/src/components/CanvasBoard.test.tsx` (new file) using Vitest + jsdom. Cover: (a) mounting `<CanvasBoard />` produces a `<canvas>` element in the DOM; (b) a Clear button is present and pressing it triggers an internal reset (assert via a `data-testid="canvas-stroke-count"` attribute that the component exposes the current stroke count for testability, and verify it becomes 0 after Clear). Drawing-event simulation under jsdom is unreliable (no real pointer events), so the test scope intentionally stops at "Clear resets state"; the freehand-stroke behaviour is validated manually via the quickstart. Maps to FR-012, SC-008.

### Implementation for User Story 3

- [X] T023 [P] [US3] Create `frontend/src/components/CanvasBoard.tsx` (new file): a functional component that renders an `<canvas>` element with a fixed pixel size (e.g., 600×400) and a visible Clear button below it. State: `strokes: Array<Array<{x: number; y: number}>>`. Handlers: `onMouseDown` (begin stroke), `onMouseMove` while down (extend stroke + draw line to the 2D context), `onMouseUp` (end stroke). The Clear button calls `ctx.clearRect(0, 0, width, height)` AND resets `strokes` to `[]`. Expose `data-testid="canvas-stroke-count"` on a hidden span with the current stroke count for the T022 test. Maps to FR-011, FR-012.
- [X] T024 [US3] Update `frontend/src/pages/GamePage.tsx` (depends on T021 + T023; third edit of this file): in the main column, conditionally render `<CanvasBoard />` ONLY when `isDrawer === true`. Replace the previous Canvas placeholder card with this conditional render. Non-drawer viewers continue to see the existing `"Waiting for the drawer to begin…"` card from Scenario 2. Maps to FR-013, SC-007.

**Checkpoint**: The drawer can draw + clear locally; non-drawer viewers see no canvas content at any point. Validate via the US3 section of `quickstart.md`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Enforce the constitution's quality gates and confirm scenario-level acceptance.

- [X] T025 [P] Run `cd backend && npm run build` and confirm it succeeds. Maps to Constitution Principle V build gate.
- [X] T026 [P] Run `cd frontend && npm run build` and confirm it succeeds (`tsc -b && vite build`). Maps to Constitution Principle V build gate.
- [X] T027 [P] Run `cd backend && npm test` and confirm all tests pass (existing + new from T006, T007).
- [X] T028 [P] Run `cd frontend && npm test` and confirm all tests pass (existing + new from T008, T009, T010, T018, T020, T022).
- [ ] T029 Execute the full three-tab walkthrough in `specs/003-gameplay-interaction/quickstart.md` end-to-end: US1 empty / whitespace rejection, US1 correct guess + cap, US1 drawer block, US1 lobby block, US2 multi-tab history visibility, **US2 Network-tab inspection** for `text: null` on third-party viewer's correct entries (SC-010), US3 drawer canvas + clear, US3 non-drawer canvas locality. Tick off the sign-off checklist in `quickstart.md`. Maps to Constitution Principle V two-tab gate, SC-001 through SC-010.
- [ ] T030 Review the branch commit history with `git log --oneline main..HEAD`: every commit message MUST reference at least one task ID (T###) or scenario from `spec.md`; no commit may span more than one user story. If any commit fails this rule, reword/split before opening the PR. Maps to Constitution Principle V granular-commits rule.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)** — T001 → T002 (T002 patches the file that T001 widened the types on). T003 ∥ T004 ∥ T005 are file-isolated from T001/T002 and from each other. All five must complete before any US task compiles.
- **Phase 3 (US1)** — depends on Phase 2 only.
  - Within US1 backend: T006/T007 (tests) and T011/T012 (impl) all four can run in parallel after Phase 2; T013 (route) depends on T011 + T012.
  - Within US1 frontend: T008/T009/T010 (tests) and T014/T016 (impl) can run in parallel after Phase 2; T015 (store action) depends on T014; T017 (GamePage wiring) depends on T015 + T016.
- **Phase 4 (US2)** — depends on Phase 3.
  - T018 (test) and T019/T020 (impl + test) can run after Phase 3.
  - T021 (GamePage) depends on T019 AND on T017 (US1 wiring) being merged because both edit the same file.
- **Phase 5 (US3)** — depends on Phase 4 because T024 edits the same file as T021.
  - T022 (test) and T023 (impl) can run in parallel after Phase 2 (CanvasBoard is independent of every other US's files).
  - T024 (GamePage) depends on T023 AND on T021 (US2 wiring).
- **Phase 6 (Polish)** — depends on Phase 5.

### Cross-phase same-file conflicts (sequencing notes)

- `frontend/src/pages/GamePage.tsx` is touched by T017 (US1), T021 (US2), and T024 (US3). They MUST be applied in that order. Each new edit assumes the previous one is in place.
- `frontend/src/pages/GamePage.test.tsx` is touched by T010 (US1) and T018 (US2). Append-only.
- `backend/src/api/schemas.test.ts` is touched by T007 (US1) only.
- `backend/src/services/roomStore.ts` is touched by T002 (foundational compile-fix) and T011 (US1 implementation). T002's minimal patch lands first; T011 fills in the real logic.
- `backend/src/services/roomStore.test.ts` is touched by T006 (US1) only.

### Parallel Opportunities

- T003 ∥ T004 ∥ T005 within Foundational (after T001 + T002).
- T006 ∥ T007 ∥ T008 ∥ T009 ∥ T010 within US1 tests (5 different files).
- T011 ∥ T012 ∥ T014 ∥ T016 within US1 implementation (different files).
- T015 sequential after T014 (same dependency chain).
- T013 sequential after T011 + T012 (route imports the schema + service).
- T017 sequential after T015 + T016 (page imports both).
- T019 ∥ T020 within US2 (impl + test, different files).
- T022 ∥ T023 within US3 (test + impl on the new CanvasBoard files).
- T025 ∥ T026 ∥ T027 ∥ T028 within Polish.

---

## Parallel Example: User Story 1

```text
# After Foundational completes, launch the five US1-test scaffolds in parallel:
T006 [US1] backend roomStore.test.ts — submitGuess + redaction filter cases
T007 [US1] backend schemas.test.ts — submitGuessSchema cases
T008 [US1] frontend api.test.ts — api.submitGuess request shape + error passthrough
T009 [US1] frontend GuessForm.test.tsx (NEW) — trim, empty rejection, disabled state
T010 [US1] frontend GamePage.test.tsx — guess flow + drawer-no-form

# In parallel with those, the file-isolated implementation tasks:
T011 [US1] backend roomStore.ts — submitGuess + startRoom score reset + snapshot filter
T012 [US1] backend schemas.ts — submitGuessSchema
T014 [US1] frontend api.ts — api.submitGuess
T016 [US1] frontend GuessForm.tsx — onSubmit handler + trim guard

# Then sequentially:
T013 ← T011 + T012   (route uses both)
T015 ← T014          (store calls api)
T017 ← T015 + T016   (GamePage uses both)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2 Foundational — T001 → T002 → T003/T004/T005 in parallel.
2. Phase 3 US1 — all tests + implementation tasks per the parallel example above.
3. **STOP and VALIDATE**: run the US1 section of `quickstart.md` end-to-end. Bob can guess; scores work with the cap; drawer + lobby rejection; backend test suite is green. MVP demoable.

### Incremental Delivery

1. MVP US1 → commit, demo.
2. Add US2 (synced history + scoreboard rendering) → commit. Network-tab inspection now confirms SC-010 visually.
3. Add US3 (drawer canvas) → commit. Pure UX polish; no further backend work.
4. Polish (T025–T030) → both builds green, both test suites green, three-tab walkthrough green, commit hygiene reviewed. Open the PR.

### Parallel Team Strategy

Not applicable at lab scale (single contributor). With two contributors after Foundational:
- Contributor A: US1 backend (T011/T012/T013) + frontend api/store (T014/T015).
- Contributor B: US1 frontend forms/page (T016/T017) + US2 (entire) + US3 (entire).
- Meet at Polish.

---

## Notes

- [P] tasks = different files, no in-flight dependencies on incomplete tasks.
- [Story] label maps each task to its user story for traceability (Constitution Principle V — commit messages must reference at least one task ID).
- Foundational task T002 is the compile-fix bridge between T001's type widening and T011's full implementation; it carries no `[USx]` story label per the format rules.
- Verify tests fail before implementing (TDD for the test-prefixed tasks within each story).
- Commit after each task or each tight logical group (Constitution Principle V — granular commits).
- Stop at any checkpoint to validate the story with the relevant `quickstart.md` section.
- The most important quality lever in this feature is **T011 (c) + T006 (i-l)**: the viewer-aware redaction filter and its tests. If the filter regresses, SC-010 silently fails — there is no UI symptom because the placeholder still renders. Reviewers should pay special attention to the redaction tests and the Network-tab inspection step in `quickstart.md` step 16.
