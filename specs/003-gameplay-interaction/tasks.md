# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api-contracts.md ✓, quickstart.md ✓

**Tests**: MANDATORY per Constitution Principle III (Vitest ≥ 80% coverage). TDD cycle required: write failing test → implement → refactor.

**Organization**: Tasks grouped by user story for independent implementation, testing, and delivery.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Seed constant needed by all gameplay operations before any implementation begins.

- [x] T001 Add `ROUND_DURATION_SECONDS = 90` constant export to `backend/src/seed/starterData.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Zod contracts (Constitution VI — defined before implementation), TypeScript model updates, and core roomStore extensions that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Contracts First (Constitution Principle VI)

- [x] T002 [P] Update `roomStatusSchema` to `z.enum(["lobby", "in-progress", "finished"])` in `shared/schemas/room.ts`
- [x] T003 [P] Add `guessSnapshotSchema` (fields: `id`, `participantId`, `participantName`, `text`, `correct: z.boolean()`, `submittedAt`) and export `GuessSnapshot` type in `shared/schemas/room.ts`
- [x] T004 Extend `roomSnapshotSchema` with five new fields — `canvasDataUrl: z.string().nullable()`, `guesses: z.array(guessSnapshotSchema)`, `scores: z.record(z.string(), z.number())`, `roundEndsAt: z.string().nullable()`, `hasGuessedCorrectly: z.boolean()` — in `shared/schemas/room.ts` (depends on T002, T003)

### TypeScript Model Updates

- [x] T005 [P] Add `Guess` interface (`id: string`, `participantId: string`, `text: string`, `correct: boolean`, `submittedAt: string`) to `backend/src/models/game.ts`
- [x] T006 Extend `Room` interface with `canvasDataUrl: string | null`, `guesses: Guess[]`, `scores: Record<string, number>`, `correctGuessers: Set<string>`, `roundStartedAt: string | null` in `backend/src/models/game.ts` (depends on T005)

### Request Schemas

- [x] T007 [P] Add `updateCanvasSchema` (`participantId`, `canvasDataUrl: z.string()`), `clearCanvasSchema` (`participantId`), and `submitGuessSchema` (`participantId`, `text`) Zod schemas to `backend/src/api/schemas.ts`

### Core roomStore — TDD (Tests First)

- [x] T008 [P] Write failing tests for extended `startRoom()` verifying it initializes `canvasDataUrl: null`, `guesses: []`, `scores` as `{ [p.id]: 0 }` for all participants, `correctGuessers` as empty Set, and `roundStartedAt` as ISO timestamp in `backend/src/services/roomStore.test.ts`
- [x] T009 [P] Write failing tests for `checkRoundExpiry()` — transitions `status` to `"finished"` when current time exceeds `roundStartedAt + ROUND_DURATION_SECONDS`, no-op when not in-progress or not yet expired — in `backend/src/services/roomStore.test.ts`
- [x] T010 [P] Write failing tests for extended `toRoomSnapshot()` verifying it returns `canvasDataUrl`, `guesses` array with `participantName` resolved from participants list, `scores`, `roundEndsAt` (ISO string when active, null otherwise), and `hasGuessedCorrectly` (true iff viewer is in `correctGuessers`) in `backend/src/services/roomStore.test.ts`
- [x] T011 Extend `startRoom()` to initialize all five new gameplay fields (`canvasDataUrl`, `guesses`, `scores`, `correctGuessers`, `roundStartedAt`) in `backend/src/services/roomStore.ts` — makes T008 pass
- [x] T012 Implement `checkRoundExpiry(room: Room): void` helper that sets `room.status = "finished"` when expired in `backend/src/services/roomStore.ts` — makes T009 pass
- [x] T013 Extend `toRoomSnapshot()` to populate all five new snapshot fields (resolve participant names for `guesses`, compute `roundEndsAt` from `roundStartedAt + ROUND_DURATION_SECONDS`, compute `hasGuessedCorrectly` from `correctGuessers.has(viewerParticipantId)`) in `backend/src/services/roomStore.ts` — makes T010 pass

**Checkpoint**: Foundational data model, contracts, and core roomStore complete. All user stories can now begin.

---

## Phase 3: User Story 1 — Drawer Interacts with Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw freehand strokes on the canvas and clear it at any time. Canvas state is persisted in-memory and the backend accepts/validates these operations.

**Independent Test**: Open two tabs. Tab 1 (host/drawer) starts game. Tab 1 draws on canvas — strokes appear on drawer's screen. Tab 1 clicks Clear — canvas blanks. Tab 2 (guesser) cannot interact with the canvas or reach the Clear button.

### Tests for User Story 1 — Write FIRST, ensure FAIL before implementing

- [x] T014 [P] [US1] Write failing tests for `updateCanvas(code, participantId, dataUrl)` — validates room exists (404), status is in-progress with lazy expiry check (400), participant equals drawerId (403), then sets `room.canvasDataUrl` — in `backend/src/services/roomStore.test.ts`
- [x] T015 [P] [US1] Write failing tests for `clearCanvas(code, participantId)` — same validations as updateCanvas, then sets `room.canvasDataUrl = null` — in `backend/src/services/roomStore.test.ts`
- [x] T016 [P] [US1] Write failing component test for `DrawingCanvas` in interactive mode: renders `<canvas>`, pointer events (pointerdown + pointermove) trigger drawing strokes, Clear button is present and enabled, `onClear` callback fires on Clear click in `frontend/src/components/DrawingCanvas.test.tsx`

### Implementation for User Story 1

- [x] T017 [US1] Implement `updateCanvas(code: string, participantId: string, canvasDataUrl: string)` in `backend/src/services/roomStore.ts` calling `checkRoundExpiry()` before validation — makes T014 pass
- [x] T018 [US1] Implement `clearCanvas(code: string, participantId: string)` in `backend/src/services/roomStore.ts` calling `checkRoundExpiry()` before validation — makes T015 pass
- [x] T019 [US1] Add `PUT /rooms/:code/canvas` route to `backend/src/api/rooms.ts`: parse `updateCanvasSchema`, call `updateCanvas()`, return 204 No Content on success
- [x] T020 [US1] Add `DELETE /rooms/:code/canvas` route to `backend/src/api/rooms.ts`: parse `clearCanvasSchema`, call `clearCanvas()`, return 204 No Content on success
- [x] T021 [P] [US1] Add `updateCanvas(code: string, participantId: string, canvasDataUrl: string): Promise<void>` to `frontend/src/services/api.ts` calling `PUT /rooms/:code/canvas`
- [x] T022 [P] [US1] Add `clearCanvas(code: string, participantId: string): Promise<void>` to `frontend/src/services/api.ts` calling `DELETE /rooms/:code/canvas`
- [x] T023 [US1] Add `updateCanvas(canvasDataUrl: string)` and `clearCanvas()` actions to `frontend/src/state/roomStore.ts` (each calls the api method then silently calls `fetchRoom()` to sync state)
- [x] T024 [US1] Create `frontend/src/components/DrawingCanvas.tsx` — freehand drawing via pointer events (`pointerdown`, `pointermove`, `pointerup`), calls `onCanvasChange(dataUrl)` with `canvas.toDataURL()` on `pointerup`, Clear button with `onClick={onClear}`, `aria-label="Drawing canvas"` on the `<canvas>` element, disabled/read-only when `isDrawer` is false — makes T016 pass
- [x] T025 [US1] Replace canvas placeholder in `frontend/src/pages/GamePage.tsx` with `<DrawingCanvas isDrawer={isDrawer} onCanvasChange={(dataUrl) => roomStore.updateCanvas(dataUrl)} onClear={() => roomStore.clearCanvas()} />` (only rendered when `room.status === "in-progress"`)

**Checkpoint**: Drawer can draw and clear. Backend persists canvas state. User Story 1 independently complete.

---

## Phase 4: User Story 2 — Guesser Views Live Drawing (Priority: P2)

**Goal**: Guessers see the drawer's evolving canvas, updated via polling within 3 seconds. Canvas is read-only for non-drawers.

**Independent Test**: Two tabs active — Tab 2 (guesser) sees canvas update within one polling cycle after Tab 1 (drawer) draws. Canvas element is rendered but pointer interactions are ignored.

### Tests for User Story 2 — Write FIRST

- [x] T026 [P] [US2] Write failing component test for `DrawingCanvas` in read-only mode: renders `<canvas>`, `canvasDataUrl` prop is drawn onto canvas via `drawImage`, no Clear button present, pointer events do not trigger stroke drawing in `frontend/src/components/DrawingCanvas.test.tsx`
- [x] T027 [P] [US2] Add test to `frontend/src/pages/GamePage.test.tsx` verifying that a `setInterval` polling call to `roomStore.fetchRoom()` is established when `GamePage` mounts with an active room

### Implementation for User Story 2

- [x] T028 [US2] Extend `DrawingCanvas.tsx` to accept `canvasDataUrl: string | null` prop and render it onto the canvas element via `drawImage` on an `<img>` in read-only mode; when `canvasDataUrl` is null, display a blank white canvas in `frontend/src/components/DrawingCanvas.tsx` — makes T026 pass
- [x] T029 [US2] Mount `DrawingCanvas` for guessers in `frontend/src/pages/GamePage.tsx` passing `canvasDataUrl={room.canvasDataUrl}` and `isDrawer={false}` when `!isDrawer && room.status === "in-progress"`
- [x] T030 [US2] Add `useEffect` in `frontend/src/pages/GamePage.tsx` that sets a `setInterval` polling every 2000 ms calling `roomStore.fetchRoom()` while `room.status === "in-progress"`, clears interval on unmount — makes T027 pass

**Checkpoint**: Guessers see live canvas updates via polling. User Story 2 independently complete.

---

## Phase 5: User Story 3 — Guesser Submits a Guess (Priority: P2)

**Goal**: Guessers can submit a guess that is trimmed, compared case-insensitively, and scored deterministically (100 pts correct / 0 pts incorrect). Guess input is disabled when drawer, already-correct, or round finished. Scoreboard shows live scores.

**Independent Test**: Guesser types " Rocket " → submits → sees 100 points in scoreboard and guess recorded. Guesser types "" → rejected. After correct guess, input is disabled. Drawer has no visible or accessible guess input.

### Tests for User Story 3 — Write FIRST

- [x] T031 [P] [US3] Write failing tests for `submitGuess(code, participantId, text)` covering: empty/whitespace rejection (400), drawer rejection (403), already-correct rejection (409), trim applied before comparison, case-insensitive match awards 100 pts, mismatch awards 0 pts, guess added to `room.guesses`, round transitions to `"finished"` when all guessers have guessed correctly — in `backend/src/services/roomStore.test.ts`
- [x] T032 [P] [US3] Write failing component test for `GuessForm`: submitting non-empty text calls `onSubmit` with trimmed text, input and button are disabled when `disabled` prop is true, displays no input when `isDrawer` is true — in `frontend/src/components/GuessForm.test.tsx`
- [x] T033 [P] [US3] Write failing component test for `Scoreboard` rendering a list of participant names each with their numeric score from a `scores: Record<string, number>` prop and `participants` array in `frontend/src/components/Scoreboard.test.tsx`

### Implementation for User Story 3

- [x] T034 [US3] Implement `submitGuess(code: string, participantId: string, text: string)` in `backend/src/services/roomStore.ts`: call `checkRoundExpiry()`, validate drawer/empty/already-correct, trim and compare case-insensitively, award 100 pts on match, add `Guess` to `room.guesses`, check all-correct round-end condition — makes T031 pass
- [x] T035 [US3] Add `POST /rooms/:code/guesses` route to `backend/src/api/rooms.ts`: parse `submitGuessSchema`, call `submitGuess()`, return 201 with `{ guess: GuessSnapshot }` built from the new guess entry
- [x] T036 [US3] Add `submitGuess(code: string, participantId: string, text: string): Promise<GuessSnapshot>` to `frontend/src/services/api.ts` parsing the response with `guessSnapshotSchema`
- [x] T037 [US3] Add `submitGuess(text: string)` action to `frontend/src/state/roomStore.ts` that calls `api.submitGuess()` with current room code and participantId, then calls `fetchRoom()` to refresh scores and history
- [x] T038 [US3] Update `GuessForm.tsx` to call `roomStore.submitGuess(text)` on submit, clear input on success, compute `disabled={isDrawer || hasGuessedCorrectly || room.status !== "in-progress"}` and hide the form entirely when `isDrawer` — makes T032 pass; update `GamePage.tsx` to pass `isDrawer`, `hasGuessedCorrectly={room.hasGuessedCorrectly}`, and `status={room.status}` to `GuessForm` in `frontend/src/components/GuessForm.tsx` and `frontend/src/pages/GamePage.tsx`
- [x] T039 [US3] Update `Scoreboard.tsx` to accept `participants` and `scores` props and render each participant's name alongside their score; update `GamePage.tsx` to pass `room.participants` and `room.scores` in `frontend/src/components/Scoreboard.tsx` and `frontend/src/pages/GamePage.tsx` — makes T033 pass

**Checkpoint**: Guess submission, scoring, and scoreboard all functional. User Story 3 independently complete.

---

## Phase 6: User Story 4 — Guess History Synced to All Players (Priority: P3)

**Goal**: All players see the full guess history including guesser name, guess text, and correct/incorrect outcome. Correct guess text is displayed in green. History updates via existing polling loop.

**Independent Test**: Two guessers submit guesses in sequence. Within the next polling cycle, both players see both guesses in the history. Correct entries appear in green.

### Tests for User Story 4 — Write FIRST

- [x] T040 [P] [US4] Write failing component test for `ResultPanel` verifying it renders a list of guess entries with `participantName`, `text`, correct entries have a green CSS class (e.g. `guess-entry--correct`), incorrect entries do not — in `frontend/src/components/ResultPanel.test.tsx`
- [x] T041 [P] [US4] Add test to `frontend/src/pages/GamePage.test.tsx` verifying `ResultPanel` re-renders with new guess entries when room snapshot is updated by a polling cycle

### Implementation for User Story 4

- [x] T042 [US4] Implement `ResultPanel.tsx` to accept `guesses: GuessSnapshot[]` prop and render each entry with participant name, guess text, and a `guess-entry--correct` CSS class (green text) when `correct === true` in `frontend/src/components/ResultPanel.tsx` — makes T040 pass
- [x] T043 [US4] Pass `room.guesses` to `ResultPanel` and wrap it in an `aria-live="polite"` region in `frontend/src/pages/GamePage.tsx` — makes T041 pass

**Checkpoint**: Guess history visible and synced to all players. User Story 4 independently complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility compliance (WCAG 2.1 AA per Constitution Principle IV), coverage gates, and manual end-to-end verification.

- [x] T044 [P] Add `aria-label="Drawing canvas"` to the `<canvas>` element and `aria-disabled` attribute to the Clear button (when inactive) in `frontend/src/components/DrawingCanvas.tsx`
- [x] T045 [P] Add axe-core accessibility scan (zero critical/serious violations) to `DrawingCanvas.test.tsx` and `GamePage.test.tsx` per Constitution Principle IV
- [x] T046 [P] Run full backend test suite with coverage: `cd backend && npm run test:coverage` — verify ≥ 80% line/branch coverage gate passes
- [x] T047 [P] Run full frontend test suite with coverage: `cd frontend && npm run test:coverage` — verify ≥ 80% line/branch coverage gate passes
- [x] T048 Run `quickstart.md` manual end-to-end verification: two browser tabs, create room, join, start game, drawer draws/clears, guesser sees update within 3 s, guesser submits "rocket", 100 pts awarded, input disabled, guess history shows green entry in both tabs, scoreboard updates

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (Phase 3): Can start once Phase 2 done
  - US2 (Phase 4): Depends on US1's `DrawingCanvas.tsx` existing — start after Phase 3
  - US3 (Phase 5): Can start in parallel with US2 after Phase 2
  - US4 (Phase 6): Depends on US3's `room.guesses` flowing into snapshot — start after Phase 5
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no story dependencies
- **US2 (P2)**: Starts after US1 — needs `DrawingCanvas.tsx` component scaffold
- **US3 (P2)**: Starts after Phase 2 — no story dependencies (parallel with US2)
- **US4 (P3)**: Starts after US3 — needs `room.guesses` in snapshot (foundational) and ResultPanel stub

### Within Each User Story

- TDD: tests MUST be written and verified to FAIL before implementation tasks begin
- Models and schemas before services
- Services before routes
- Routes before frontend API methods
- Frontend API before store actions
- Store actions before components
- Components before page wiring

---

## Parallel Opportunities

### Phase 2 (Foundational) — parallel within phase

```
Parallel group A (T002, T003):   roomStatusSchema + guessSnapshotSchema
Then T004:                        extend roomSnapshotSchema
Parallel group B (T005, T007):   Guess interface + request schemas
Then T006:                        extend Room interface
Parallel group C (T008, T009, T010): failing tests for startRoom / checkRoundExpiry / toRoomSnapshot
Then T011, T012, T013 sequentially: implement extensions
```

### Phase 3 (US1) — parallel within phase

```
Parallel group (T014, T015, T016): failing tests for updateCanvas / clearCanvas / DrawingCanvas
Then T017, T018 sequentially:      implement service functions
Parallel group (T019, T020):       PUT + DELETE routes
Parallel group (T021, T022):       api.ts methods
Then T023, T024, T025:             store actions → component → page wiring
```

### Phase 5 (US3) — can overlap with Phase 4 (US2)

```
US3 parallel start (T031, T032, T033): failing tests for submitGuess / GuessForm / Scoreboard
US3 T034–T039 sequential after tests
```

---

## Parallel Example: User Story 1

```bash
# Launch all failing tests for US1 together (TDD — must fail first):
Task: T014 "Write failing test for updateCanvas() in roomStore.test.ts"
Task: T015 "Write failing test for clearCanvas() in roomStore.test.ts"
Task: T016 "Write failing component test for DrawingCanvas interactive mode"

# After tests confirmed failing, implement:
Task: T017 "Implement updateCanvas()"
Task: T018 "Implement clearCanvas()"

# Then routes and frontend in parallel:
Task: T019 "PUT /rooms/:code/canvas route"    (parallel with T020)
Task: T020 "DELETE /rooms/:code/canvas route"
Task: T021 "api.updateCanvas() method"        (parallel with T022)
Task: T022 "api.clearCanvas() method"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T013) — CRITICAL
3. Complete Phase 3: User Story 1 (T014–T025)
4. **STOP and VALIDATE**: Drawer draws, clears, backend persists canvas state
5. Demo: functional drawing surface

### Incremental Delivery

1. Setup + Foundational → contracts and core logic ready
2. Add US1 → drawer canvas works → validate independently → MVP
3. Add US2 → guessers see live canvas updates → validate
4. Add US3 (parallel with US2) → guess submission + scoring → validate
5. Add US4 → guess history synced to all → validate
6. Polish → accessibility, coverage gates, e2e

### Single-Developer Order

```
T001 → T002,T003 → T004 → T005,T007 → T006 →
T008,T009,T010 → T011 → T012 → T013 →
T014,T015,T016 → T017 → T018 → T019,T020 → T021,T022 → T023 → T024 → T025 →
T026,T027 → T028 → T029 → T030 →
T031,T032,T033 → T034 → T035 → T036 → T037 → T038 → T039 →
T040,T041 → T042 → T043 →
T044,T045,T046,T047 → T048
```

---

## Notes

- `[P]` tasks operate on different files — safe to run concurrently
- `[Story]` label maps each task to its user story for traceability
- Every story is independently testable via its checkpoint
- Always confirm tests FAIL before writing production code (Constitution Principle III)
- Commit after each logical group or task
- `checkRoundExpiry()` must be called at the start of every mutating operation (canvas write, guess submit)
- `correctGuessers` is `Set<string>` — server-internal only, not serialised to wire
- `canvasDataUrl` can be large; polling every 2 s with a full data URL is acceptable for ≤ 4 players
