# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: No automated tests — manual browser validation per constitution (spec does not request TDD). Quickstart.md provides all manual test scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup (Data Model Types)

**Purpose**: Add the new type definitions to the backend model file. These types underpin both US2 and US3 and must exist before any service logic is written.

- [X] T001 Add `GuessEntry` interface and extend `CurrentRound` with `guesses: GuessEntry[]` and `scores: Record<string, number>` fields in `backend/src/models/game.ts`

**Checkpoint**: `GuessEntry` and the extended `CurrentRound` type compile cleanly — all dependent service and API code can import them.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend service bootstrap and schema additions that every user story depends on. US2 and US3 both require `startGame()` to initialize the new fields; the Zod schema is required for US2's endpoint.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Extend `startGame()` in `backend/src/services/roomStore.ts` to initialize `guesses: []` and `scores: Object.fromEntries(room.participants.map(p => [p.id, 0]))` on `CurrentRound`
- [X] T003 [P] Add `submitGuessSchema` (`participantId: z.string().min(1)`, `guessText: z.string()`) to `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — `npm run dev` in `backend/` compiles without errors; user story implementation can now begin.

---

## Phase 3: User Story 1 — Drawer Uses the Canvas (Priority: P1) 🎯 MVP

**Goal**: The designated drawer sees an interactive HTML5 canvas with a Clear button; guessers see only a placeholder message. No backend changes needed — the canvas is local-only this sprint.

**Independent Test**: With a round started, open the game screen as the drawer. Draw strokes, verify they appear immediately. Click Clear, verify the canvas blanks. Open a second tab as a guesser, verify no canvas or drawing controls are shown. (See quickstart.md § US1.)

### Implementation for User Story 1

- [X] T004 [US1] Create `DrawingCanvas` component in `frontend/src/components/DrawingCanvas.tsx` — `useRef<HTMLCanvasElement>`, `isDrawing` ref, `handleMouseDown` / `handleMouseMove` / `handleMouseUp` event handlers using `offsetX`/`offsetY`, and a **Clear** button calling `ctx.clearRect(0, 0, w, h)`
- [X] T005 [US1] Update `frontend/src/pages/GamePage.tsx` to conditionally render `<DrawingCanvas />` when `isDrawer` is true and a `"Drawer is drawing…"` placeholder `<p>` when false (the `isDrawer` boolean is already computed at line 25 of this file)

**Checkpoint**: US1 fully functional — drawer draws and clears; guessers see placeholder only. Validate against quickstart.md § US1 before proceeding.

---

## Phase 4: User Story 2 — Guesser Submits a Guess (Priority: P1)

**Goal**: Non-drawer players can submit guesses via the `GuessForm`. Empty/whitespace submissions are rejected inline before any network request. Valid guesses hit the new `POST /rooms/:code/guesses` endpoint, are stored in `CurrentRound.guesses`, and the guesser's score is updated.

**Independent Test**: With an active round, submit empty, whitespace-only, incorrect, and correct guesses from a guesser tab. Verify each case (inline error, 0-point record, 100-point record). Use curl smoke tests from quickstart.md § US2 for backend verification.

### Implementation for User Story 2

- [X] T006 [P] [US2] Add `submitGuess(code, participantId, rawText)` to `backend/src/services/roomStore.ts`: trim `rawText`, throw `empty-guess` if blank, throw `drawer-cannot-guess` if guesser is drawer, compute `isCorrect`, update `scores[participantId]` by +100 if correct, append `GuessEntry` to `currentRound.guesses`, return `{ guess, newScore }`
- [X] T007 [US2] Add `router.post("/:code/guesses", ...)` handler in `backend/src/api/rooms.ts`: validate body with `submitGuessSchema`, call `submitGuess()`, map thrown error codes to HTTP 400 / 403 / 404 / 409 / 422 responses per `contracts/api.md`
- [X] T008 [P] [US2] Add `GuessEntry` TypeScript interface (matching `data-model.md`) and `submitGuess(code, participantId, guessText)` fetch function to `frontend/src/services/api.ts` — `POST /api/rooms/:code/guesses`, returns `{ guess: GuessEntry; newScore: number }`
- [X] T009 [US2] Update `frontend/src/components/GuessForm.tsx` to call `submitGuess()` from `api.ts` on form submission: client-side trim + empty check shows inline `"Guess cannot be empty"` error without a network request; on API error display the error code inline; clear the input field on success
- [X] T010 [US2] Update `frontend/src/pages/GamePage.tsx` to render `<GuessForm />` for guessers only (when `!isDrawer`) and pass the submit handler; the drawer must not see the guess form (complements T005 canvas conditional)

**Checkpoint**: US2 fully functional — all guess submission scenarios pass (see quickstart.md § US2). Validate before proceeding to US3.

---

## Phase 5: User Story 3 — Guess History Visible to All Players (Priority: P2)

**Goal**: All players (drawer and guessers) see a continuously updated list of submitted guesses and current scores. The frontend polls `GET /rooms/:code/guesses` every 2 seconds and passes the results to `ResultPanel` and `Scoreboard`.

**Independent Test**: With two tabs open (drawer + guesser), submit a guess from the guesser tab and verify the history appears on the drawer tab within 2 seconds without a page reload. Submit a mix of correct/incorrect guesses and verify they are visually distinguishable. (See quickstart.md § US3.)

### Implementation for User Story 3

- [X] T011 [P] [US3] Add `getGuesses(code)` to `backend/src/services/roomStore.ts`: look up room by code, throw `not-found` or `not-in-progress` as needed, return `{ guesses: currentRound.guesses, scores: currentRound.scores }`
- [X] T012 [US3] Add `router.get("/:code/guesses", ...)` handler in `backend/src/api/rooms.ts`: call `getGuesses()`, map errors to 404 / 409 responses per `contracts/api.md`, return `GuessesResponse` JSON
- [X] T013 [P] [US3] Add `fetchGuesses(code)` fetch function to `frontend/src/services/api.ts` — `GET /api/rooms/:code/guesses`, returns `{ guesses: GuessEntry[]; scores: Record<string, number> }`
- [X] T014 [P] [US3] Update `frontend/src/components/ResultPanel.tsx` to accept and render a `guesses: GuessEntry[]` prop — list each entry showing `guesserName` and `guessText`; visually distinguish correct guesses (e.g. green / ✓) from incorrect (e.g. red / ✗)
- [X] T015 [P] [US3] Update `frontend/src/components/Scoreboard.tsx` to accept and render a `scores: Record<string, number>` prop along with the participants list, displaying each player's name and current score
- [X] T016 [US3] Add a `useEffect` with `setInterval` (2000 ms, matching lobby poll interval in `LobbyPage.tsx`) to `frontend/src/pages/GamePage.tsx` that calls `fetchGuesses()` and stores the result in component state; pass `guesses` state to `<ResultPanel />` and `scores` state to `<Scoreboard />`; clean up interval on unmount

**Checkpoint**: US3 fully functional — guess history syncs across all tabs within 2 seconds. Validate against quickstart.md § US3 before proceeding.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final edge-case validation across all three user stories.

- [X] T017 Run all edge-case spot-checks from quickstart.md (whitespace-only trimming, two guessers scoring correct, same guesser double-correct, polling with no new guesses, mixed-case secret word)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must compile) — **blocks all user stories**
- **US1 (Phase 3)**: Frontend only — can begin once Phase 2 is complete; **no backend deps**
- **US2 (Phase 4)**: Depends on Phase 2 (T002 for score init, T003 for schema) — must validate US1 first per constitution
- **US3 (Phase 5)**: Depends on Phase 2 (T002 for round state) and Phase 4 (US2 must be validated first — US3 displays guesses that US2 creates)
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — fully independent (frontend only)
- **US2 (P1)**: Can start after Phase 2 — backend + frontend work; no dependency on US1 backend code
- **US3 (P2)**: Can start after Phase 2; frontend display depends on US2 having seeded data — validate US2 before testing US3 end-to-end

### Within Each User Story

- Models/types before services (T001 before T006/T011)
- Services before route handlers (T006 before T007, T011 before T012)
- API client before component update (T008 before T009, T013 before T014/T015)
- Component updates before GamePage wiring (T009 before T010, T014+T015 before T016)

### Parallel Opportunities

Within **Phase 2**:
- T002 and T003 touch different files (`roomStore.ts` vs `schemas.ts`) — run in parallel

Within **Phase 4**:
- **Backend track**: T006 → T007
- **Frontend track**: T008 → T009 → T010
- T006 (backend) and T008 (frontend) are independent files — start both simultaneously

Within **Phase 5**:
- **Backend track**: T011 → T012
- **Frontend track**: T013 → (T014 ∥ T015) → T016
- T011 (backend) and T013 (frontend) are independent files — start both simultaneously
- T014 and T015 touch different component files — run in parallel after T013

---

## Parallel Example: User Story 2

```
# Start backend and frontend tracks simultaneously:

Backend track:
  T006 → submitGuess() service in backend/src/services/roomStore.ts
  T007 → POST /rooms/:code/guesses handler in backend/src/api/rooms.ts (after T006)

Frontend track (parallel to backend):
  T008 → submitGuess() + GuessEntry in frontend/src/services/api.ts
  T009 → GuessForm update in frontend/src/components/GuessForm.tsx (after T008)
  T010 → GamePage GuessForm wiring in frontend/src/pages/GamePage.tsx (after T009)
```

## Parallel Example: User Story 3

```
# Start backend and frontend tracks simultaneously:

Backend track:
  T011 → getGuesses() service in backend/src/services/roomStore.ts
  T012 → GET /rooms/:code/guesses handler in backend/src/api/rooms.ts (after T011)

Frontend track (parallel to backend):
  T013 → fetchGuesses() in frontend/src/services/api.ts
  T014 ∥ T015 → ResultPanel.tsx + Scoreboard.tsx (parallel, after T013)
  T016 → GamePage polling useEffect (after T014 + T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 (data model + bootstrap)
2. Complete Phase 3 (US1 — canvas)
3. **STOP and VALIDATE**: Drawer draws, clears; guesser sees placeholder
4. Demo if ready — a working drawing surface is the core mechanic

### Incremental Delivery

1. Phase 1 + 2 → types and bootstrap ready
2. Phase 3 (US1) → validate → canvas works locally ✓
3. Phase 4 (US2) → validate → guesses submitted and scored ✓
4. Phase 5 (US3) → validate → history syncs across tabs ✓
5. Phase 6 (Polish) → edge-case sweep ✓

### Single-Developer Sequence

```
T001 → T002 ∥ T003 → T004 → T005
  → T006 ∥ T008 → T007 → T009 → T010
  → T011 ∥ T013 → T012 → T014 ∥ T015 → T016
  → T017
```

---

## Notes

- **[P]** tasks touch different files with no dependency on incomplete parallel work
- **[Story]** label maps each task to its user story for spec traceability
- Each user story phase is a complete, independently testable increment
- Commit after each task per Constitution Principle V (granular, meaningful commits)
- Stop at every phase **Checkpoint** to validate the story before starting the next
- No automated tests generated — validate manually using `quickstart.md` and curl smoke tests
