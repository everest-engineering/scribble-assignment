---
description: "Task list for Active Round Drawing, Guessing & Scoring"
---

# Tasks: Active Round Drawing, Guessing & Scoring

**Input**: Design documents from `specs/003-drawing-guessing-scoring/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Per the constitution, **manual two-browser validation is the primary acceptance gate** and automated tests are optional. Test tasks below are marked _(optional)_ and are NOT TDD-ordered. They are recommended for the scoring rules (FR-005/FR-007), the correct-guess masking invariant (FR-011/SC-008), and to preserve regression coverage (Constitution V).

**Organization**: Tasks are grouped by user story (priority order from spec.md). This is a **brownfield extension** of features 001/002 — tasks modify existing files and wire up the pre-scaffolded `GuessForm`/`Scoreboard`/`ResultPanel`; no rewrites. Builds on the active round (drawer + secret word) shipped in 002.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 maps to the spec's user stories
- Exact file paths included in every task

## Path Conventions

Web app layout (existing): `backend/src/...`, `frontend/src/...` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline before changes (brownfield — structure already exists).

- [X] T001 Capture a green baseline: `cd backend && npm install` / `cd frontend && npm install` (if needed), then `cd backend && npm run build` and `cd frontend && npm run build`.
- [X] T002 [P] Record the regression baseline by running existing tests: `cd backend && npm test` and `cd frontend && npm test` (all currently passing).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type and helper changes every story depends on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: These are blocking prerequisites.

- [X] T003 Extend domain types in `backend/src/models/game.ts`: add `interface Guess { id: string; playerId: string; playerName: string; text: string; correct: boolean; createdAt: string }`; add `interface GuessSnapshot { id: string; playerId: string; playerName: string; correct: boolean; text?: string }`; add `guesses: Guess[]` and `correctPlayerIds: string[]` to `Round`; add `guesses: GuessSnapshot[]` to `RoundSnapshot`; add `score: number` to `Participant`. (data-model)
- [X] T004 [P] Create the pure guess-evaluation helper `backend/src/services/guessEvaluation.ts`: export `normalizeGuess(text: string): string` (`text.trim().toLowerCase()`) and `isCorrect(text: string, word: string): boolean` (`normalizeGuess(text) === normalizeGuess(word)`). No side effects. (research D2, data-model)
- [X] T005 [P] Add the guess request schema in `backend/src/api/schemas.ts`: `export const submitGuessSchema = z.object({ participantId: z.string(), text: z.string().trim() })` (trims surrounding whitespace; emptiness is checked in the route so it can return a specific message — FR-002).
- [X] T006 [P] Update frontend types in `frontend/src/services/api.ts`: add `score: number` to `Participant`; add `interface GuessSnapshot { id: string; playerId: string; playerName: string; correct: boolean; text?: string }`; add `guesses: GuessSnapshot[]` to `RoundSnapshot`.

**Checkpoint**: Types compile (`cd backend && npm run build`, `cd frontend && npm run build`); stories can begin.

---

## Phase 3: User Story 1 - Guessers submit guesses and correct ones are scored (Priority: P1) 🎯 MVP

**Goal**: A guesser submits a guess; it is trimmed, empty rejected, compared case-insensitively; correct = 100 (once per round), incorrect = 0; the drawer cannot score; every accepted guess is recorded in the (masked-when-correct) history.

**Independent Test**: As the guesser, submit an incorrect guess (score stays 0, appears verbatim in Activity), an empty/spaces guess (rejected with a message, not recorded), then the word with odd casing/spaces (score becomes 100, appears as a masked "guessed the word!"). Submit the word again → score stays 100. As the drawer, a guess is blocked. All verifiable in the submitter's own browser from the immediate response. (FR-001–FR-008, FR-011, FR-014, SC-001/2/3/6/8)

- [X] T007 [US1] In `backend/src/services/roomStore.ts` `startGame`: when creating the round, initialize `round.guesses = []` and `round.correctPlayerIds = []`, and set every `participant.score = 0` (FR-006). Also default `score: 0` in `createParticipant`.
- [X] T008 [US1] In `backend/src/services/roomStore.ts`: add `submitGuess(code, participantId, text)` returning `{ room } | { failure: "not_found" | "not_active" | "drawer" }`. Guard: room exists (else `not_found`); `status === "playing"` and `room.round` set (else `not_active`); `participantId !== round.drawerId` (else `drawer`). Then evaluate with `isCorrect(text, round.word)` (import from `./guessEvaluation.js`); if correct and `participantId` not in `round.correctPlayerIds`, add `CORRECT_GUESS_POINTS` (100) to that participant's `score` and push the id into `correctPlayerIds` (FR-005, FR-007). Append `{ id: randomUUID(), playerId, playerName: <participant.name>, text, correct, createdAt: now() }` to `round.guesses` (FR-008, FR-010). Refresh the submitter's `lastSeenAt` (heartbeat) and `updatedAt`.
- [X] T009 [US1] In `backend/src/services/roomStore.ts` `toRoundSnapshot`: project `round.guesses` to `GuessSnapshot[]` preserving order — for each guess emit `{ id, playerId, playerName, correct }` and include `text` **only when `correct === false`** (omit the `text` key entirely for correct guesses → FR-011, SC-008). `participants[].score` already flows through the existing participants projection.
- [X] T010 [US1] In `backend/src/api/rooms.ts`: add `router.post("/:code/guess", ...)` — parse params + `submitGuessSchema`; if the trimmed `text` is empty, `throw new HttpError(400, "Please enter a guess.")` (FR-003, not recorded); call `submitGuess(code.toUpperCase(), participantId, text)`; map failures `drawer → 403 "The drawer cannot guess."`, `not_active → 409 "The round is not active."`, `not_found → 404 "Room not found"`; on success respond `{ room: toRoomSnapshot(result.room, participantId) }`.
- [X] T011 [US1] In `frontend/src/services/api.ts`: add `submitGuess(code, participantId, text)` posting `{ participantId, text }` to `/rooms/:code/guess` and returning `{ room: RoomSnapshot }` (mirror `startRoom`).
- [X] T012 [US1] In `frontend/src/state/roomStore.ts`: add `async submitGuess(text: string)` — guard `room`/`participantId`, call `api.submitGuess(code, participantId, text)`, then `setRoomSnapshot(response.room)`; surface errors via the existing `withLoading`/error state so the form can show the 400 message.
- [X] T013 [US1] Wire `frontend/src/components/GuessForm.tsx` to the store: on submit, block locally when `guessText.trim()` is empty (show "Please enter a guess."), otherwise call `roomStore.submitGuess(text)`, clear the input on success, and show server error text on failure. Disable the input/button when the viewer is the drawer (existing `disabled` prop) **or** when the viewer has already guessed correctly (derive from room state: a guess in `round.guesses` with `playerId === participantId && correct`).
- [X] T014 [P] [US1] Replace the placeholder in `frontend/src/components/Scoreboard.tsx`: read `useRoomState()` and render each participant with their `score`, sorted by score descending (mark the viewer and the drawer). Default shows everyone at 0.
- [X] T015 [P] [US1] Replace the placeholder in `frontend/src/components/ResultPanel.tsx` (Activity): read `useRoomState()` and render `round.guesses` in order — incorrect as `"{name}: {text}"`, correct (no `text`) as `"✅ {name} guessed the word!"` (FR-011). Empty state keeps the existing hint.
- [X] T016 [P] [US1] _(optional)_ In `backend/src/services/roomStore.test.ts`: assert a correct guess (mixed case + surrounding spaces) sets the guesser's `score` to 100 and records a `correct` guess; an incorrect guess leaves score 0 and records verbatim text; a second correct guess by the same player keeps score at 100 (FR-007); `submitGuess` by the drawer returns `{ failure: "drawer" }`; `submitGuess` when not `playing` returns `{ failure: "not_active" }`; and `toRoomSnapshot` omits `text` on correct guesses.
- [X] T017 [P] [US1] _(optional)_ Create `backend/src/services/guessEvaluation.test.ts`: assert `isCorrect("  ROCKET ", "rocket")` is `true`, `isCorrect("rockett", "rocket")` is `false`, and `normalizeGuess` trims + lowercases.

**Checkpoint**: A guesser can play and score against their own browser; the drawer is blocked; history records (masked when correct). US1 is independently demoable.

---

## Phase 4: User Story 2 - Shared guess history stays in sync for all players (Priority: P1)

**Goal**: Every player — drawer and guessers — sees the same ordered guess history and scores, updated automatically within ~2s without a manual refresh.

**Independent Test**: With two browsers in a round, submit guesses in Browser B; within ~2s Browser A's Activity feed and scoreboard show the same guesses (same order) and scores, and the correct guess shows masked on both. (FR-008, FR-009, FR-010, FR-011, SC-004, SC-005, SC-008)

- [X] T018 [US2] In `frontend/src/pages/GamePage.tsx`: add a `~2s` polling loop (mirror `LobbyPage`'s `setInterval` + `POLL_INTERVAL_MS` calling `roomStore.fetchRoom().catch(() => {})`, cleared on unmount, keyed on `room?.code`). This is currently **missing** on the game screen and is what propagates guesses/scores to non-submitting players; it also inherits the existing 404 → room-closed ejection in `state/roomStore.ts`.
- [X] T019 [P] [US2] _(optional)_ In `backend/src/services/roomStore.test.ts`: after several `submitGuess` calls, assert `toRoomSnapshot` returns the same `round.guesses` (same ids, same order) regardless of `viewerParticipantId`, with correct entries masked for every viewer (FR-010, SC-005, SC-008).

**Checkpoint**: US1 + US2 deliver the full multiplayer guessing loop — submit, score, and everyone stays in sync.

---

## Phase 5: User Story 3 - Drawer illustrates the word on a canvas (Priority: P2)

**Goal**: The drawer draws strokes on a canvas and can clear it; both render on the drawer's own screen. The canvas is drawer-local (not synced to guessers).

**Independent Test**: As the drawer, draw strokes (they render) and click Clear (canvas blanks). As a guesser, confirm the drawing is not received — only a "Waiting for the drawer…" placeholder is shown. (FR-012, FR-013, FR-015, SC-007)

- [X] T020 [P] [US3] Create `frontend/src/components/Canvas.tsx`: a native HTML `<canvas>` using Pointer Events for freehand strokes (drawer only) and a **Clear** button that wipes the 2D context. Props: `{ isDrawer: boolean; drawerName?: string }`. When `!isDrawer`, render a static "Waiting for {drawerName}…" placeholder and no drawing surface (drawer-local — no server/guesser sync; FR-015).
- [X] T021 [US3] In `frontend/src/pages/GamePage.tsx`: replace the Canvas-card placeholder with `<Canvas isDrawer={isDrawer} drawerName={drawer?.name} />`.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression safety, and confirming scoped-out behaviors.

- [X] T022 [P] Update `frontend/src/services/api.test.ts` if needed: add coverage that `submitGuess` POSTs `{ participantId, text }` to `/rooms/:code/guess`, and adjust any assertion on the `RoomSnapshot`/`RoundSnapshot` shape to include `score`/`guesses`.
- [X] T023 [P] Confirm scoped-out behaviors require **no code**: a correct guess does **not** end the round (FR-016 — `status` stays `playing`; no timer added), and feature 002's drawer-only `round.word` secrecy still holds for guessers. Note in a comment if helpful.
- [X] T024 Run the build + test gate: `cd backend && npm run build`, `cd frontend && npm run build`, `cd backend && npm test` — all green before raising a PR (Constitution: Build gate).
- [X] T025 Execute the two-browser acceptance script in [quickstart.md](./quickstart.md): US1 guess validation + scoring, US2 cross-browser history/score sync within ~2s + masked correct guess, US3 drawer-local canvas draw/clear with no guesser sync, plus the 001/002 regression checks. ✅ All 12 steps passed (manual two-browser pass, 2026-06-08).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (types + `guessEvaluation` + schema).
- **User Stories (Phase 3–5)**: All depend on Foundational.
- **Polish (Phase 6)**: Depends on the user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. Delivers the guess→score loop end-to-end (backend + submitter UI).
- **US2 (P1)**: After Foundational. **Depends on US1's backend** (guess recording/snapshot projection) to have data to sync; itself is just the `GamePage` poll loop. Sequence US1 → US2.
- **US3 (P2)**: After Foundational. Fully independent of US1/US2 (new `Canvas.tsx` + one `GamePage` mount line) — can be built in parallel with US1/US2.

### Within Each User Story

- Backend store/snapshot/route before frontend calls/rendering.
- `state/roomStore.submitGuess` (T012) before `GuessForm` wiring (T013).
- Optional tests can be written alongside or after the implementation they cover (not TDD-gated, per constitution).

### Parallel Opportunities

- Foundational T004, T005, T006 are different files → parallel (after T003 lands the shared backend types).
- Within US1: Scoreboard (T014) and ResultPanel (T015) are different files → parallel; optional tests T016/T017 are `[P]`.
- US3 (T020) is independent of US1/US2 → a second developer can build the canvas in parallel once Foundational is done.
- Polish T022 and T023 are parallel.

---

## Parallel Example: Foundational

```bash
# After T003 lands the shared backend types in game.ts:
Task: "Create backend/src/services/guessEvaluation.ts with normalizeGuess + isCorrect (T004)"
Task: "Add submitGuessSchema to backend/src/api/schemas.ts (T005)"
Task: "Add score/GuessSnapshot/guesses to frontend/src/services/api.ts (T006)"
```

## Parallel Example: cross-story staffing

```bash
# Once Foundational (T003–T006) is complete:
Developer A: US1 (T007–T015) then US2 (T018)   # shared backend + game UI
Developer B: US3 (T020–T021)                    # independent drawer-local canvas
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (submit + score + record) → **validate** in one browser: correct=100 once, incorrect=0, empty rejected, drawer blocked, history masked on correct.
3. This is the core "play and win" MVP.

### Incremental Delivery

1. Foundational ready.
2. US1 → demo guessing & scoring (the heart of the loop).
3. US2 → add the `GamePage` poll loop → demo multiplayer sync within ~2s.
4. US3 → add the drawer-local canvas.
5. Polish → build gate + quickstart + scoped-out confirmation.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- [Story] label maps each task to a spec user story for traceability.
- **Brownfield**: backend tasks modify existing functions except `guessEvaluation.ts` (new pure helper); frontend wires the pre-scaffolded `GuessForm`/`Scoreboard`/`ResultPanel` and adds one component (`Canvas.tsx`) — no rewrites (Constitution I).
- **Masking invariant (FR-011, SC-008)**: the `text` key must be *absent* from a correct `GuessSnapshot`, not blanked/nulled — verify in the network tab.
- **Polling, not real-time (Constitution III)**: cross-player sync rides the existing ~2s GET poll (US2 adds the missing `GamePage` loop); `POST /rooms/:code/guess` is an action endpoint like `/start`; the canvas is drawer-local and never streamed.
- **Scope (Constitution IV)**: a correct guess does **not** end the round (FR-016); no timers, no rotation, no canvas sync. No new dependencies, no persistence.
- Commit after each task or logical group; messages traceable to task IDs.
