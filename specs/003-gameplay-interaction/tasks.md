# Tasks: Gameplay Interaction (003)

**Input**: Design documents from `specs/003-gameplay-interaction/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Note on tests**: Constitution Principle VIII requires unit tests for all new deterministic logic
(guess comparison, scoring, guard conditions). Test tasks in this file are **mandatory**, not
optional.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Brownfield Baseline)

**Purpose**: Confirm the baseline is green before any changes land.

- [x] T001 Verify `npm test` passes in `backend/` (all existing suites green before changes)
- [x] T002 [P] Verify `npm test` passes in `frontend/` (all existing suites green before changes)

**Checkpoint**: Both test suites green — safe to begin incremental changes.

---

## Phase 2: Foundational (Type Model — Blocks All User Stories)

**Purpose**: Extend the shared type contract with `Guess`, `guesses`, and `scores`. Both backend
and frontend types must be updated before any service or UI logic lands.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `Guess` interface (`participantId`, `participantName`, `text`, `correct`, `index`) to `backend/src/models/game.ts`; add `guesses: Guess[]` and `scores: Record<string, number>` to both `Room` and `RoomSnapshot` interfaces
- [x] T004 [P] Add `Guess` interface and add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [x] T005 [P] Add `submitGuessSchema = z.object({ participantId: z.string().uuid(), text: z.string() })` to `backend/src/api/schemas.ts`
- [x] T006 Add `guesses: []` and `scores: {}` to the `Room` object literal inside `createRoom()` in `backend/src/services/roomStore.ts` (fixes TypeScript compile error from T003)

**Checkpoint**: `npm run build` passes in both `backend/` and `frontend/` — type contract is complete.

---

## Phase 3: User Story 1 — Guesser Submits a Guess and Receives Feedback (Priority: P1) 🎯 MVP

**Goal**: Guessers can submit guesses; the backend validates, compares, scores, and appends to
history. The first correct guess transitions the room to `"ended"` and awards 100 points.
The frontend wires `GuessForm` to `roomStore.submitGuess()`. Snapshot always includes `guesses`
and `scores`.

**Independent Test**: Tab A (Alice/drawer) + Tab B (Bob/guesser). Bob types a wrong word — both
tabs show the guess in history within ~2s, Bob's score stays 0. Bob types the correct word —
100 points awarded, room status changes to "ended" in both tabs within ~2s.

### Implementation for User Story 1

- [x] T007 [US1] Implement exported function `submitGuess(code: string, participantId: string, text: string): Room` in `backend/src/services/roomStore.ts` — guards: 404 (not found), 409 (not active), 403 (participant not in room), 403 (drawer cannot guess), 400 (empty after trim); trim + lowercase comparison; append `Guess` to `room.guesses`; on correct: `room.scores[participantId] += 100`, `room.status = "ended"`
- [x] T008 [P] [US1] Update `startRoom()` in `backend/src/services/roomStore.ts` to initialize `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))` and `room.guesses = []` immediately after setting `room.status = "active"`
- [x] T009 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to: include `guesses: room.guesses.map(g => ({ ...g }))` and `scores: { ...room.scores }` in every response; add `isEnded = room.status === "ended"` constant; change `isDrawer` guard to `isActive && viewerParticipantId === room.drawerId`; add `...(isEnded ? { secretWord: room.secretWord } : {})` spread so the word is revealed to all when the game ends
- [x] T010 [P] [US1] Add `router.post("/:code/guess", ...)` route to `backend/src/api/rooms.ts` that parses `roomCodeParamsSchema` + `submitGuessSchema`, calls `submitGuess(code.toUpperCase(), participantId, text)`, and responds `{ room: toRoomSnapshot(room, participantId) }`; import `submitGuess` and `submitGuessSchema`
- [x] T011 [P] [US1] Add `submitGuess(code, participantId, text)` method to the `api` object in `frontend/src/services/api.ts` calling `POST /rooms/${code}/guess` with `{ participantId, text }` and returning `{ room: RoomSnapshot }`
- [x] T012 [US1] Add `async submitGuess(text: string)` method to `RoomStore` class in `frontend/src/state/roomStore.ts` — guards for missing room/participantId; calls `this.withLoading(() => api.submitGuess(...))`, then `this.setRoomSnapshot(response.room)` (same pattern as `startGame()`)
- [x] T013 [US1] Update `GuessForm.tsx` in `frontend/src/components/GuessForm.tsx` to: import `useRoomStore` and `useRoomState`; on submit call `roomStore.submitGuess(guessText)` and clear input on success; display `error` from store state below the form when non-null; keep existing `disabled` prop wiring

### Tests for User Story 1

- [x] T014 [P] [US1] Add `submitGuess` unit tests in `backend/src/services/roomStore.test.ts`: incorrect guess appended, 0 pts, status stays active; correct guess awards 100 pts, status transitions to `"ended"`; case-insensitive match (`"APPLE"` matches `"apple"`); whitespace-padded correct guess (`"  apple  "`) still correct; empty string throws `HttpError(400)`; whitespace-only string throws `HttpError(400)`; drawer submitting throws `HttpError(403, "Drawer cannot guess")`; unknown participantId throws `HttpError(403, "Participant not in room")`; submission when room is `"ended"` throws `HttpError(409)`
- [x] T015 [P] [US1] Add `toRoomSnapshot` additions in `backend/src/services/roomStore.test.ts`: active room snapshot includes `guesses: []` and `scores` with 0 for all participants; ended room snapshot exposes `secretWord` to both drawer and guesser viewers; ended room snapshot has no `wordPlaceholder`
- [x] T016 [P] [US1] Add a `submitGuess` test in `frontend/src/services/api.test.ts`: assert it sends a POST to `/rooms/:code/guess` with `{ participantId, text }` in the body (mirrors the existing createRoom/startGame/fetchRoom tests)

**Checkpoint**: `npm test` green in `backend/`. Tab B guess flow fully functional; both tabs update within ~2s.

---

## Phase 4: User Story 2 — Drawer Uses the Local Canvas (Priority: P1)

**Goal**: The drawer sees a freehand drawing canvas with a clear button. The canvas is local-only —
no data sent to server or visible to guessers. The guess form is absent from the drawer's screen.

**Independent Test**: Drawer's tab: draw strokes, confirm they appear; click clear, confirm
canvas is blank. Guesser's tab: confirm no canvas, no drawing content at any point.

### Implementation for User Story 2

- [x] T017 [US2] Create `frontend/src/components/DrawingCanvas.tsx`: `useRef<HTMLCanvasElement | null>(null)` for canvas; `useRef<boolean>(false)` for `isDrawing`; `onPointerDown` — `setPointerCapture`, begin path, `moveTo`, set `isDrawing=true`; `onPointerMove` — if drawing, `lineTo` + `stroke`; `onPointerUp` and `onPointerLeave` — `isDrawing=false`; "Clear" button calls `context.clearRect(0, 0, canvas.width, canvas.height)`; no props, no store writes, no API calls; return `<div>` containing `<canvas>` and `<button>`
- [x] T018 [P] [US2] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to: import `DrawingCanvas`; replace the `canvas-placeholder` `<div>` with `{isDrawer ? <DrawingCanvas /> : <div className="canvas-placeholder">Watch the drawer!</div>}`; move the `<Card title="Your Guess">` block so it only renders when `!isDrawer` (the drawer has no guess form)

**Checkpoint**: Drawer tab shows working canvas + clear button; guesser tab shows static placeholder; guess form absent from drawer view.

---

## Phase 5: User Story 3 — All Participants See Guess History and Running Scores (Priority: P2)

**Goal**: `Scoreboard` renders per-participant scores from live room data. `ResultPanel` renders
the ordered guess history. `GamePage` wires both and shows a "Round Ended" banner when the game
ends; the guess form is also hidden when `status === "ended"`.

**Independent Test**: Tab A + Tab B both on game screen. Bob submits an incorrect guess — both
tabs display the entry in history and Bob's score stays 0, within ~2s. Bob submits the correct
guess — both tabs update to show correct entry, Bob's score = 100, "Round Ended" banner visible.

### Implementation for User Story 3

- [x] T019 [US3] Update `Scoreboard.tsx` in `frontend/src/components/Scoreboard.tsx` to accept `interface ScoreboardProps { participants: Participant[]; scores: Record<string, number>; }` props; render one row per participant showing name and score (sorted by score descending); import `Participant` from `../services/api`; remove existing placeholder content
- [x] T020 [P] [US3] Update `ResultPanel.tsx` in `frontend/src/components/ResultPanel.tsx` to accept `interface ResultPanelProps { guesses: Guess[]; participants: Participant[]; }` props; render ordered list of guess entries each showing guesser's name (`guess.participantName`), guessed text, and a correct/incorrect indicator; import `Guess` and `Participant` from `../services/api`; render empty state message when `guesses.length === 0`
- [x] T021 [US3] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to: pass `participants={room.participants} scores={room.scores ?? {}}` to `<Scoreboard />`; pass `guesses={room.guesses ?? []} participants={room.participants}` to `<ResultPanel />`; add `isEnded = room.status === "ended"` constant; render a "Round Ended" banner (e.g., `<div className="game-banner game-banner--ended">Round Ended!</div>`) when `isEnded`, placed above the main layout; update the `<Card title="Your Guess">` condition to render only when `!isDrawer && !isEnded`

**Checkpoint**: Both tabs show live guess history and scores. "Round Ended" banner appears in both tabs after first correct guess. Guess form is gone for drawer and for all when ended.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full build validation, type safety check, and manual two-tab acceptance test.

- [x] T022 [P] Run `npm run build` in `backend/` — confirm zero TypeScript errors
- [x] T023 [P] Run `npm run build` in `frontend/` — confirm zero TypeScript errors
- [x] T024 Run `npm test` in `backend/` — all suites green (schemas, roomStore, api)
- [x] T025 [P] Run `npm test` in `frontend/` — all suites green
- [x] T026 Perform the two-tab acceptance test from `specs/003-gameplay-interaction/quickstart.md` — verify SC-001 (guess in history within 4s), SC-002 (correct guess = 100 pts), SC-003 (empty guess rejected), SC-004 (Round Ended banner within 4s), SC-005 (canvas clear immediate), SC-006 (no drawing data on guesser screen)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — run immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 green baseline — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — core guess/score backend + frontend wiring
- **Phase 4 (US2)**: Depends on Phase 2 — canvas is independent of US1 backend changes
- **Phase 5 (US3)**: Depends on Phase 3 (needs `room.guesses` and `room.scores` in snapshot)
- **Phase 6 (Polish)**: Depends on Phases 3–5 all complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2 or US3
- **US2 (P1)**: After Foundational — independent of US1 (different files: DrawingCanvas.tsx + GamePage canvas section)
- **US3 (P2)**: After US1 — requires `room.guesses` and `room.scores` populated in snapshot

### Within Phase 3 (US1)

```
T007 (submitGuess fn) ─┐
                        ├─→ T009 (toRoomSnapshot update)
T008 (startRoom init) ─┘         │
                                  ├─→ T010 (POST route)   [P] ─┐
                                  │                              ├─→ T016 (route tests)
                                  └─→ T011 (api.ts method) [P] ─┘
                                           │
                                           └─→ T012 (RoomStore.submitGuess)
                                                     │
                                                     └─→ T013 (GuessForm wire)

T014 [P] submitGuess unit tests (after T007)
T015 [P] toRoomSnapshot tests (after T009)
```

### Within Phase 4 (US2)

```
T017 (DrawingCanvas component) → T018 (GamePage canvas + guard)
```

### Within Phase 5 (US3)

```
T019 (Scoreboard props) ─┐
                          ├─→ T021 (GamePage wiring + banner)
T020 (ResultPanel props) ─┘
```

### Parallel Opportunities

- T001 and T002 (baseline checks — different processes)
- T003 and T004 and T005 (different files: `game.ts` vs `api.ts` vs `schemas.ts`)
- T007 and T008 (both in `roomStore.ts` but non-overlapping functions — run sequentially in practice since same file)
- T010 and T011 (different files: `rooms.ts` vs `api.ts`)
- T014, T015, T016 (different test additions — can be appended independently)
- T017 and T018 (once T017 exists; T018 references it — run sequentially)
- T019 and T020 (different component files)
- T022 and T023 (different directories)
- T024 and T025 (different directories)

---

## Parallel Example: Phase 3 (US1)

```bash
# Sequential chain in roomStore.ts:
Task T007: "Implement submitGuess() in backend/src/services/roomStore.ts"
Task T008: "Update startRoom() in backend/src/services/roomStore.ts"   # parallel with T007
Task T009: "Update toRoomSnapshot() in backend/src/services/roomStore.ts"

# After T009, run in parallel:
Task T010: "Add POST /:code/guess route in backend/src/api/rooms.ts"
Task T011: "Add submitGuess() to api in frontend/src/services/api.ts"
Task T014: "submitGuess unit tests in backend/src/services/roomStore.test.ts"
Task T015: "toRoomSnapshot tests in backend/src/services/roomStore.test.ts"

# After T011:
Task T012: "Add submitGuess() to RoomStore in frontend/src/state/roomStore.ts"
Task T013: "Wire GuessForm.tsx in frontend/src/components/GuessForm.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1 stories)

1. Phase 1: Baseline verification
2. Phase 2: Foundational type changes
3. Phase 3: US1 — guesser submits guess, scores, history
4. Phase 4: US2 — drawer canvas
5. **STOP and VALIDATE**: Two-tab acceptance test (SC-001 through SC-006)
6. Phase 5: US3 — scoreboard + result panel wiring + banner
7. Phase 6: Polish + full acceptance test

### Incremental Delivery

- After Phase 2: TypeScript compiles cleanly — no functional change yet
- After Phase 3: Full guess → score → history flow functional; snapshot updated
- After Phase 4: Drawer has working canvas; guess form hidden from drawer
- After Phase 5: Scoreboard and history display live data; banner on game end
- After Phase 6: Ready for Scenario 004

---

## Notes

- `submitGuess` must import `Guess` from `"../models/game.js"` — add to existing import in `roomStore.ts`
- `toRoomSnapshot` spread order matters: the `isEnded` branch (`...(isEnded ? { secretWord } : {})`) must come AFTER the `isActive && isDrawer` branch to avoid overwriting; since `isActive` and `isEnded` are mutually exclusive, order is safe
- `GuessForm.tsx` uses `useRoomState()` to read `error` — import both `useRoomStore` and `useRoomState` from `"../state/roomStore"`
- `GamePage.tsx` will have two sequential edits (T018 for US2, T021 for US3) — complete T018 fully before starting T021
- `room.guesses` and `room.scores` will be `undefined` in snapshots of rooms created before T006 lands (in-memory state reset on restart; no migration needed)
- Canvas `onPointerDown` should call `event.currentTarget.setPointerCapture(event.pointerId)` to ensure `pointermove` events continue outside the canvas boundary
