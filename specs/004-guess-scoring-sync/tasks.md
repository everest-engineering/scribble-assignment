# Tasks: Guess Submission, Scoring, and History Sync

**Input**: Design documents from `specs/004-guess-scoring-sync/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Path Conventions (Web application — per plan.md)

- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Foundational (Shared Data Model)

**Purpose**: Add `Guess` and `Score` types to both backend and frontend. These are prerequisites for all three user stories. Backend and frontend files are different — both tasks can run in parallel.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Add `Guess` interface (id, guesserId, text, isCorrect, submittedAt) and `Score` interface (participantId, score) to `backend/src/models/game.ts`; add `guesses: Guess[]` to `Room`; add `guesses: Guess[]` and `scores: Score[]` to `RoomSnapshot`; initialize `guesses: []` in `createRoom()` in `backend/src/services/roomStore.ts`
- [x] T002 [P] Add `Guess` interface and `Score` interface to `frontend/src/services/api.ts`; add `guesses: Guess[]` and `scores: Score[]` to the frontend `RoomSnapshot` type

**Checkpoint**: Shared types defined — all three user stories can now proceed independently.

---

## Phase 2: User Story 1 — Drawer Uses the Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer sees a working HTML5 canvas on the game screen and can draw freehand and clear the canvas.

**Independent Test**: Tab A (host/drawer) opens the game screen. A white canvas is visible in the main area. Drawing with the mouse creates strokes. Clicking "Clear Canvas" removes all strokes. Tab B (guesser) still shows the static "Waiting for drawer to draw…" placeholder — no canvas on Tab B.

- [x] T003 [US1] Create `frontend/src/components/DrawingCanvas.tsx`: `useRef<HTMLCanvasElement>` + `useEffect` attaching `mousedown/mousemove/mouseup/mouseleave` listeners; track drawing state with `useRef<boolean>` (not React state, to avoid re-renders mid-stroke); `handleClear()` calls `ctx.clearRect(0, 0, canvas.width, canvas.height)`; render `<canvas>` with a "Clear Canvas" `<button>` below it
- [x] T004 [US1] Update `frontend/src/pages/GamePage.tsx`: for the drawer, replace the existing `<Card title="Word to Draw">` block (the secret-word display card in the main content area) with `<DrawingCanvas />`; import `DrawingCanvas` from `../components/DrawingCanvas`; the secret word card is no longer rendered for the drawer — the word is already shown in the "Your Role" sidebar card (depends on T003)

**Checkpoint**: US1 complete. Verify with two browser tabs before proceeding.

---

## Phase 3: User Story 2 — Guessers Submit Guesses (Priority: P1)

**Goal**: Guessers can submit validated guesses via the form; the server records each guess and scores it (100 for correct, 0 for incorrect). Empty/whitespace-only input is rejected client-side with an error message.

**Independent Test**: Tab B (guesser) types "  Rocket  " and submits — the form clears, no error. Then submits "   " — form stays, error "Please enter a guess." appears. Check backend: `POST /rooms/:code/guesses` with `{ guesserId, text: "  Rocket  " }` returns 201 with `{ guess: { text: "rocket", isCorrect: true } }`. Submitting "pizza" returns 201 with `{ guess: { isCorrect: false } }`.

- [x] T005 [P] [US2] Add `submitGuessSchema` to `backend/src/api/schemas.ts`: `z.object({ guesserId: z.string().uuid(), text: z.string().trim().min(1, "Guess text is required") })`
- [x] T006 [P] [US2] Add `submitGuess(code: string, guesserId: string, rawText: string)` to `backend/src/services/roomStore.ts`: get room (return `{ error: "not_found" }` if missing); return `{ error: "not_active" }` if `room.status !== "active"`; trim `rawText`; compare `text.toLowerCase()` to `STARTER_WORDS[0].toLowerCase()` for `isCorrect`; create `Guess` with `randomUUID()` id and `now()` timestamp; push to `room.guesses`; call `saveRoom(room)`; return the new `Guess` (depends on T001)
- [x] T007 [US2] Add `POST /:code/guesses` handler to `backend/src/api/rooms.ts`: parse `code` via `roomCodeParamsSchema`; parse body via `submitGuessSchema`; call `submitGuess(code, guesserId, text)`; respond 201 `{ guess }` on success; 404 if `not_found`; 409 `{ message: "Game is not active" }` if `not_active` (depends on T005, T006)
- [x] T008 [P] [US2] Add `submitGuess(code: string, guesserId: string, text: string): Promise<{ guess: Guess }>` to `frontend/src/services/api.ts`: POST to `/rooms/${encodeURIComponent(code)}/guesses` with body `{ guesserId, text }` (depends on T002)
- [x] T009 [US2] Add `submitGuess(text: string)` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: reads `this.state.room` and `this.state.participantId`; returns `null` if either is missing; calls `api.submitGuess(room.code, participantId, text)` via `this.withLoading()` (depends on T008)
- [x] T010 [US2] Update `frontend/src/components/GuessForm.tsx`: add `const store = useRoomStore()` and `const { participantId } = useRoomState()`; add `error` state (`useState<string | null>(null)`); on submit, trim `guessText` — if empty set error to `"Please enter a guess."` and return without calling the API; otherwise clear error, call `store.submitGuess(trimmedText)`, clear `guessText` on success (depends on T009)

**Checkpoint**: US2 complete. Verify guess submission and validation in two browser tabs before proceeding.

---

## Phase 4: User Story 3 — Guess History and Scores Sync (Priority: P2)

**Goal**: All players see the live scoreboard and guess history, refreshed every 2 seconds via polling.

**Independent Test**: Tab A (drawer) and Tab B (guesser) both have the game screen open. Tab B submits a correct guess. Within 2 seconds, Tab A's Activity panel shows the new guess (guesser name, text, ✓) and Tab A's Scoreboard shows Tab B's score updated to 100. Both tabs show all participants starting at 0 before any guesses.

- [x] T011 [US3] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts`: include `guesses: room.guesses.map(g => ({ ...g }))` in the returned snapshot; compute `scores` as `room.participants.map(p => ({ participantId: p.id, score: room.guesses.filter(g => g.guesserId === p.id && g.isCorrect).length * 100 }))` and include in snapshot; ensure `room.guesses` is initialized to `[]` if undefined (backward compat) (depends on T001, T006)
- [x] T012 [US3] Add polling to `frontend/src/pages/GamePage.tsx`: import `useRoomStore` at the top; add `const store = useRoomStore()`; add `useEffect(() => { const id = setInterval(() => { store.fetchRoom() }, 2000); return () => clearInterval(id) }, [store])` so the game screen polls every 2 seconds while mounted (depends on T002)
- [x] T013 [P] [US3] Update `frontend/src/components/Scoreboard.tsx`: add `const { room } = useRoomState()`; import `useRoomState` from `../state/roomStore`; replace the placeholder content with a list that maps `room?.scores ?? []` sorted descending by `score`, looking up each participant's name from `room.participants`, displaying name and score (depends on T002, T011)
- [x] T014 [P] [US3] Update `frontend/src/components/ResultPanel.tsx`: add `const { room } = useRoomState()`; import `useRoomState` from `../state/roomStore`; replace the placeholder content with an ordered list of `room?.guesses ?? []` showing each guess's guesser name (lookup from `room.participants`, fallback `"Unknown player"`), guess text, and a ✓ or ✗ indicator based on `isCorrect` (depends on T002, T011)

**Checkpoint**: US3 complete. Verify cross-tab sync in two browser tabs before proceeding.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and clean-up.

- [x] T015 Run full two-tab manual verification: open Tab A as host (drawer) and Tab B as guest (guesser); verify canvas draws and clears on Tab A; verify Tab B sees static placeholder; verify guess validation on Tab B; verify scores and activity sync within 2 seconds on both tabs; verify both `npm run build` commands pass in `backend/` and `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. T001 and T002 run in parallel.
- **US1 (Phase 2)**: Depends on T001 (for GamePage changes) and T002 (for DrawingCanvas component). T003 → T004 sequentially.
- **US2 (Phase 3)**: Depends on T001 and T002. T005 + T006 + T008 in parallel → T007 (needs T005+T006) → T009 (needs T008) → T010 (needs T009).
- **US3 (Phase 4)**: Depends on T001, T002, T006. T011 → T012 + T013 + T014 in parallel.
- **Polish (Phase 5)**: Depends on all prior phases.

### User Story Dependencies

- **US1 (P1)**: Independent — requires only Foundational types. No dependency on US2 or US3.
- **US2 (P1)**: Independent — requires only Foundational types. No dependency on US1 or US3.
- **US3 (P2)**: Builds on US2 backend (`submitGuess()` must exist for guesses to be in the snapshot). Frontend display is additive.

### Within Each User Story

- Backend before frontend for US2 (endpoint must exist for the client to call)
- Frontend types before frontend logic (T002 before T008/T009/T010)
- New component before page wiring (T003 before T004)

---

## Parallel Example: US2 (Guess Submission)

```bash
# These three tasks touch different files — launch in parallel:
Task T005: "Add submitGuessSchema to backend/src/api/schemas.ts"
Task T006: "Add submitGuess() to backend/src/services/roomStore.ts"
Task T008: "Add submitGuess() to frontend/src/services/api.ts"

# Then:
Task T007: "Add POST /:code/guesses to backend/src/api/rooms.ts"  ← needs T005 + T006

# Then:
Task T009: "Add submitGuess() to frontend/src/state/roomStore.ts"  ← needs T008

# Then:
Task T010: "Wire GuessForm.tsx"  ← needs T009
```

## Parallel Example: US3 (Sync)

```bash
# After T011 (toRoomSnapshot update):
Task T012: "Add polling useEffect to GamePage.tsx"
Task T013: "Update Scoreboard.tsx"        ← parallel
Task T014: "Update ResultPanel.tsx"       ← parallel
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Foundational types (T001, T002)
2. Complete Phase 2: US1 — Drawer Canvas (T003, T004)
3. Complete Phase 3: US2 — Guess Submission (T005–T010)
4. **STOP and VALIDATE**: Drawer draws, guessers submit, server scores
5. Add Phase 4: US3 — Sync (T011–T014)
6. Polish and build verification (T015)

### Incremental Delivery

- After Phase 1+2 (US1): Drawer has a working canvas.
- After Phase 3 (US2): Full guess submission with server scoring works.
- After Phase 4 (US3): All players see live guess history and scores via polling.
- Each phase is independently testable and demo-able.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps each task to its user story for spec traceability
- Canvas data is intentionally NOT sent to the server (research decision D-002)
- `toRoomSnapshot()` and `submitGuess()` both live in `roomStore.ts` — implement T006 first, then T011 to avoid merge conflicts on the same function
- Polling interval is exactly 2 seconds per constitution Principle IV
- Commit after each checkpoint (US1, US2, US3) with a message referencing the spec scenario
