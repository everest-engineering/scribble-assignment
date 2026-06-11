# Tasks — Gameplay Interaction

**Feature dir**: `specs/003-gameplay-interaction/` · **Branch**: `scribble-lab` · **Plan**: [plan.md](./plan.md)

Tasks are ordered for execution. **[P]** means parallel-safe with the previous **[P]**-tagged tasks in the same phase (different files, no shared mutation). Story labels **[US1] / [US2] / [US3]** map to `spec.md`. Setup, Foundational, and Polish phases carry no story label.

Every task lists the exact file path(s) it touches and cites the relevant `FR-###`. Tests follow the project's house style: pure-helper unit tests + Express integration tests via `fetch` against `app.listen` (the pattern established in `backend/src/api/rooms.test.ts`).

---

## Phase 1 — Setup

**Purpose**: Confirm the baseline from features 001 + 002 is green before extending the round.

- [X] T001 Confirm `backend/` and `frontend/` test suites pass on `scribble-lab` by running `npm test` in each package; this task is a verification gate with **no file change**. Required baseline: 45 backend tests + 35 frontend tests = 80 passing.

---

## Phase 2 — Foundational (blocking)

**Purpose**: Extend the shared wire shape so all three user stories can compile. **No US-tagged work may begin until this phase is green.**

- [X] T002 Extend `backend/src/models/game.ts`: add `interface Guess { id: string; participantId: string; displayName: string; text: string; isCorrect: boolean; submittedAt: string }`; extend `Round` with `guesses: Guess[]`, `scores: Record<string, number>`, `lockedParticipantIds: string[]`; extend `RoundView` with `guesses: GuessView[]`, `scores: Record<string, number>`, `lockedParticipantIds: string[]`; export `interface GuessView` (structurally identical to `Guess`). Cite **FR-006**.
- [X] T003 [P] In `backend/src/services/roomStore.ts`, update `startRoom` so the new `Round` is created with `guesses: []`, `scores: Object.fromEntries(room.participants.map(p => [p.id, 0]))`, and `lockedParticipantIds: []`. Cite **FR-009**.
- [X] T004 [P] In `backend/src/services/roomStore.ts`, update `toRoomSnapshot` so `RoundView` (when `room.round !== null`) includes the three new fields verbatim from `room.round` (no per-viewer filtering — they are public). Keep the existing `secretWord` drawer-only rule from feature 002. Cite **FR-006**.
- [X] T005 [P] Mirror the wire types in `frontend/src/services/api.ts`: add `interface GuessView { ... }`; extend `RoundView` with `guesses: GuessView[]`, `scores: Record<string, number>`, `lockedParticipantIds: string[]`. Cite **FR-006**.

**Checkpoint**: Both packages compile; existing 80 tests still pass; new fields exist on the wire with safe defaults (`guesses=[]`, `scores={...:0}`, `lockedParticipantIds=[]`) but no new behavior yet.

---

## Phase 3 — User Story 1: Submit a guess and see it in everyone's feed (Priority: P1)

**Story goal**: A guesser submits a guess; everyone (drawer + every guesser) sees the new feed entry within one ~2s poll. Drawer cannot submit. Empty / too-long / unknown-participant / unknown-room submissions are rejected with structured 4xx envelopes.

**Independent test**: Two browser tabs; in the guesser tab submit `cat` and observe the feed entry appear in both tabs within ≤ 2 seconds. Submit empty / 51-char text / use the drawer's `participantId` and verify the four documented 4xx responses.

### Tests for User Story 1

- [X] T006 [P] [US1] In `backend/src/api/schemas.test.ts`, add cases for a new `submitGuessSchema`: empty `text` → fails; whitespace-only `text` (e.g., `"   "`) → fails (because schema trims first); 51-char `text` → fails; missing `participantId` → fails; valid `{ participantId: "...", text: "Rocket" }` → passes and the parsed `text` is **trimmed**. Cite **FR-002**.
- [X] T007 [P] [US1] In `backend/src/services/roomStore.test.ts`, add cases for a new `submitGuess(code, participantId, text)` service function: returns `{ ok: false, reason: "not_found" }` for unknown rooms; `{ ok: false, reason: "not_in_room" }` for an unknown `participantId`; `{ ok: false, reason: "is_drawer" }` when the caller is the drawer; `{ ok: false, reason: "no_round" }` when the room is in lobby; on the happy path returns `{ ok: true, room, guess }` with `guess.isCorrect` matching `text.trim().toLowerCase() === secret.toLowerCase()` and the guess appended to `room.round.guesses` in chronological order. Cite **FR-001, FR-003, FR-004**.
- [X] T008 [P] [US1] In `backend/src/api/rooms.test.ts`, add integration tests for `POST /rooms/:code/guesses`: `200` on the happy path (response body contains the new entry in `room.round.guesses`); `400` for empty / whitespace-only / 51-char `text` and for missing `participantId`; `403` with message `"Drawers cannot guess in their own round"` when the drawer's id is used; `403` with message `"Participant is not in the room"` for an unknown participant; `404` `"Room not found"` for unknown codes; `409` `"No round in progress"` when called against a lobby-state room. Cite **FR-001, FR-002, FR-004**.
- [X] T009 [P] [US1] Create `frontend/src/components/GuessPanel.test.tsx`: assert that for a `drawer` viewer the guess input is **not rendered** (no `<input>` element); for a `guesser` viewer the input is rendered, the submit button is disabled when the trimmed value is empty and when it exceeds 50 chars, and enabled in the [1,50] range; the rendered feed lists entries in chronological order showing `displayName — text — (Correct|Wrong)`; the cleartext secret word never appears in the rendered DOM for a guesser (use `room.round.maskedWord = "______"` and a wrong-guess feed in the fixture). Cite **FR-006, FR-008**.

### Implementation for User Story 1

- [X] T010 [US1] In `backend/src/api/schemas.ts`, export `export const submitGuessSchema = z.object({ participantId: z.string().min(1), text: z.string().trim().min(1).max(50) })`. Cite **FR-002**.
- [X] T011 [US1] In `backend/src/services/roomStore.ts`, export `isGuessCorrect(text: string, secretWord: string): boolean` returning `text.trim().toLowerCase() === secretWord.trim().toLowerCase()`. Cite **FR-003**.
- [X] T012 [US1] In `backend/src/services/roomStore.ts`, export a typed `submitGuess(code, requesterId, text)` function returning a discriminated outcome `{ ok: true, room, guess } | { ok: false, reason: "not_found" | "not_in_room" | "is_drawer" | "no_round" | "already_correct" }`. On the success path: build the `Guess` (UUID id, `displayName` snapshotted from the participant, `text` already trimmed by the schema, `isCorrect` from `isGuessCorrect`, `submittedAt = now()`), append to `room.round.guesses`, bump `room.updatedAt`, and return the cloned room. Do **not** modify scores or `lockedParticipantIds` here — those land in T018 (US2). Cite **FR-001, FR-003, FR-004**.
- [X] T013 [US1] In `backend/src/api/rooms.ts`, add `POST /rooms/:code/guesses`: validate via `submitGuessSchema`, normalize the code via the existing `roomCodeParamsSchema`, call `submitGuess`, and translate the discriminated outcome to HTTP envelopes (`404` `Room not found` / `403` `Drawers cannot guess in their own round` / `403` `Participant is not in the room` / `409` `No round in progress` / `200` with `{ room: toRoomSnapshot(room, requesterId) }`). Cite **FR-001, FR-002, FR-004**.
- [X] T014 [US1] In `frontend/src/services/api.ts`, export `submitGuess(code: string, participantId: string, text: string): Promise<{ room: RoomSnapshot }>` mirroring the existing `startRoom` pattern; map non-2xx responses to `ApiError` carrying the server `message`. Cite **FR-001**.
- [X] T015 [US1] In `frontend/src/state/roomStore.ts`, add a `submitGuess(text: string)` method on the store that uses the current `roomCode` and `participantId`, calls `api.submitGuess`, replaces `state.room` with the returned snapshot on success, and exposes a `guessError: string | null` field in the state for inline UI feedback. Cite **FR-007, FR-008**.
- [X] T016 [US1] Create `frontend/src/components/GuessPanel.tsx`: takes `{ room, viewerParticipantId }` props; renders an ordered feed `<ul>` of `room.round.guesses` for all viewers; renders a `<form>` with a single `<input>` and submit button **only** when the viewer is a non-drawer non-locked guesser; locally manages the input value, disables submit when `value.trim().length === 0 || value.trim().length > 50`; on submit calls `useRoomStore().submitGuess(value)` and clears the input on success. Cite **FR-006, FR-007, FR-008**.
- [X] T017 [US1] In `frontend/src/components/RoundView.tsx`, mount `<GuessPanel room={room} viewerParticipantId={viewerParticipantId} />` below the existing word panel for **both** drawer and guesser modes. (The panel itself decides whether to render the input.) Cite **FR-006**.

**Checkpoint**: Quickstart Scenario 1 (wrong guess + correct guess + lockout) passes. Quickstart Scenario 2 (negative cases) passes. **No scoring yet.** Tests: ~12 new backend + ~4 new frontend.

---

## Phase 4 — User Story 2: Scoring on correct guesses (Priority: P2)

**Story goal**: A correct guess from an eligible guesser increments their room-scoped score by exactly `100` and locks them out from further guesses this round. Incorrect guesses add `0`. The scoreboard is visible to every participant.

**Independent test**: With US1 wired, submit one correct guess and observe `scores[bobId]` jump from `0` to `100` in all tabs within ≤ 2s; submit a second guess as the same player → `409` and the score stays at `100`.

### Tests for User Story 2

- [X] T018 [P] [US2] In `backend/src/services/roomStore.test.ts`, add cases asserting `submitGuess` with a correct guess sets `room.round.scores[participantId] === 100` and pushes the id into `room.round.lockedParticipantIds`; a second call from the same participant returns `{ ok: false, reason: "already_correct" }`; the drawer's score stays `0` throughout; an incorrect guess does not change `scores` or `lockedParticipantIds`. Cite **FR-005, FR-009**.
- [X] T019 [P] [US2] In `backend/src/api/rooms.test.ts`, add a case asserting that after one successful correct submission, calling `POST /rooms/:code/guesses` again with the same `participantId` returns `409` with body `{ message: "You have already guessed correctly this round" }` and the snapshot's `scores` is unchanged. Cite **FR-005**.
- [X] T020 [P] [US2] In `frontend/src/components/GuessPanel.test.tsx`, add a case asserting the rendered DOM includes a scoreboard row for every participant (keyed by `participantId`), with the per-participant numeric score, drawn from `room.round.scores`. Add a case asserting that when the viewer's id is in `room.round.lockedParticipantIds`, the input is replaced with a static line "You already guessed correctly this round." Cite **FR-006, FR-008**.

### Implementation for User Story 2

- [X] T021 [US2] In `backend/src/services/roomStore.ts`, extend `submitGuess`'s success path: when `isCorrect === true`, increment `room.round.scores[requesterId]` by `100` and append `requesterId` to `room.round.lockedParticipantIds`. Add a pre-check: if `room.round.lockedParticipantIds.includes(requesterId)` return `{ ok: false, reason: "already_correct" }` **before** building the guess. Cite **FR-005**.
- [X] T022 [US2] In `backend/src/api/rooms.ts`, map the new `already_correct` outcome to `409 { message: "You have already guessed correctly this round" }`. Cite **FR-005**.
- [X] T023 [US2] In `frontend/src/components/GuessPanel.tsx`, render a `<section className="scoreboard">` listing every entry in `room.round.scores` as `displayName: score` (look up the name from `room.participants`). When `viewerParticipantId` is in `room.round.lockedParticipantIds`, replace the input form with the lockout line. Cite **FR-005, FR-008**.

**Checkpoint**: Quickstart Scenarios 1, 2, 3, and 4 pass. **MVP for the gameplay loop is complete.**

---

## Phase 5 — User Story 3: Drawer canvas (Priority: P3)

**Story goal**: The drawer has a working freehand canvas with a Clear button, **local to their tab**. Guessers see no canvas. No network calls are issued by the canvas.

**Independent test**: In the drawer tab, drag the mouse and observe strokes; click Clear and observe an empty canvas; open DevTools → Network during draw/clear and observe only the existing ~2s `GET /rooms/:code` polls (no canvas-related POSTs). In a guesser tab, no `<canvas>` element exists.

### Tests for User Story 3

- [X] T024 [P] [US3] Create `frontend/src/components/DrawerCanvas.test.tsx`: render `<DrawerCanvas viewerIsDrawer={false} />` and assert no `<canvas>` element is mounted; render `<DrawerCanvas viewerIsDrawer={true} />` and assert exactly one `<canvas>` is mounted and a Clear button is present; simulate a Clear click and assert the canvas's `getImageData` pixels are all `0` (transparent). Cite **FR-010**.

### Implementation for User Story 3

- [X] T025 [US3] Create `frontend/src/components/DrawerCanvas.tsx` exporting `<DrawerCanvas viewerIsDrawer={boolean} />`. When `viewerIsDrawer === false`, return a placeholder `<p>Waiting for the drawer…</p>`. When `true`, mount a `<canvas width={480} height={320}>` ref, attach `pointerdown` / `pointermove` / `pointerup` listeners for freehand drawing (track an `isDrawing` flag and the last `{x,y}` per stroke), and render a Clear button that calls `ctx.clearRect(0, 0, w, h)`. No `fetch` / `axios` calls. Cite **FR-010**.
- [X] T026 [US3] In `frontend/src/components/RoundView.tsx`, mount `<DrawerCanvas viewerIsDrawer={state.mode === "drawer"} />` between the existing word panel and the `<GuessPanel>`. Non-drawer mode renders the placeholder; drawer mode renders the canvas. Cite **FR-010**.

**Checkpoint**: Quickstart Scenarios 5 and 6 pass. All FR-001..010 implemented.

---

## Phase 6 — Polish & Cross-Cutting

- [X] T027 Run `npx tsc --noEmit` in `backend/` and `npx tsc -b --noEmit` in `frontend/`; resolve any type errors. No production code change expected — verification only.
- [X] T028 In `README.md`, update the "Implemented today" section to include a "Scenario 3 — Gameplay Interaction" bullet block listing: guess submission with trim + case-insensitive comparison, per-round scoring (+100 / +0) with lockout, drawer-local canvas with clear. Move stale "Not implemented yet" bullets accordingly. Cite **FR-001..010**.
- [X] T029 Run `npm test` in both packages and confirm the new total is **80 + 12 (US1) + 3 (US2) + 1 (US3) = 96** passing tests (count may shift by ±2 depending on how cases are bundled; the gate is **0 failures, 0 skipped**).
- [X] T030 Manual walk-through: execute Scenarios 1–6 in `quickstart.md` against `npm run dev` in both packages with two browser tabs. Record any UI gaps as follow-ups (not as task amendments). This is the only task that requires a human in the loop.

---

## Dependencies

```text
Phase 1 (T001)
    │
    ▼
Phase 2 — Foundational (T002 → T003,T004,T005 in parallel)
    │
    ▼
Phase 3 — US1 (tests T006..T009 parallel; impl T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017)
    │
    ▼
Phase 4 — US2 (tests T018..T020 parallel; impl T021 → T022 → T023)
    │
    ▼
Phase 5 — US3 (test T024; impl T025 → T026)
    │
    ▼
Phase 6 — Polish (T027 → T028 → T029 → T030)
```

US1 is the **MVP** — it delivers the multiplayer interaction. US2 and US3 are incremental on top.

## Parallel execution opportunities

- **Phase 2**: T003, T004, T005 are parallel-safe (different files / different functions).
- **Phase 3 tests**: T006, T007, T008, T009 are all parallel-safe (four different test files).
- **Phase 4 tests**: T018, T019, T020 are parallel-safe.
- **Implementation tasks within a story are mostly sequential** (each builds on the previous file's exports).

## Story-by-story task counts

| Phase | Story | Tasks |
|---|---|---|
| 1 | Setup | 1 (T001) |
| 2 | Foundational | 4 (T002–T005) |
| 3 | **US1** (P1, MVP) | 12 (T006–T017) |
| 4 | **US2** (P2) | 6 (T018–T023) |
| 5 | **US3** (P3) | 3 (T024–T026) |
| 6 | Polish | 4 (T027–T030) |
| **Total** | | **30** |

## MVP scope

Stop after **T023 (end of Phase 4)**: you have a working multiplayer round with submit/feed/sync/scoring. The drawer canvas (Phase 5) is a UI nicety that can ship in a follow-up commit without blocking anything else.

## Format validation

Every task above:

- begins with a markdown checkbox `- [ ]`,
- has a sequential ID `T###`,
- carries `[P]` only when it touches a file no other in-flight task is touching,
- carries `[USn]` for every Phase 3/4/5 task and **no** `[USn]` label for Setup / Foundational / Polish,
- references at least one exact file path,
- cites at least one `FR-###` (except the verification-only tasks T001, T027, T029, T030).
