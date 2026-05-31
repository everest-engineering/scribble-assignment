# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rooms.md, research.md

**Tests**: No test tasks generated — spec requests manual two-tab acceptance testing only (existing 4 unit tests confirm no regressions).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Verify build baseline before any changes.

- [x] T001 Verify TypeScript builds pass: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared data model and validation schema in backend.
All three user stories depend on these type additions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `Guess` interface (`id`, `participantId`, `participantName`, `text`, `isCorrect`, `submittedAt`) to `backend/src/models/game.ts`
- [x] T003 Add `guesses: Guess[]` and `scores: Record<string, number>` to `Room` interface in `backend/src/models/game.ts`
- [x] T004 Add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T005 Add `submitGuessSchema` (`participantId: z.string().trim().min(1)`, `text: z.string()`) to `backend/src/api/schemas.ts`

**Checkpoint**: Data model and schema updated — backend service and frontend types can now be extended.

---

## Phase 3: User Story 1 — Guess Submission and Scoring (Priority: P1) 🎯 MVP

**Goal**: Guesser submits a guess; backend trims, compares case-insensitively, scores 100/0,
appends to history, and returns updated snapshot. Empty guesses rejected client and server.

**Independent Test**: One-tab test — after starting a game (two tabs for setup), submit
"ROCKET" and confirm it is marked correct with 100 points. Submit "wrong" and confirm 0 points.
Submit empty and confirm inline error with no network call.

### Implementation for User Story 1

- [x] T006 [US1] In `backend/src/services/roomStore.ts` — `createRoom()`: initialise `guesses: [], scores: {}` on new room
- [x] T007 [US1] In `backend/src/services/roomStore.ts` — `startRoom()`: add `guesses: [], scores: Object.fromEntries(room.participants.map(p => [p.id, 0]))` to the saved room
- [x] T008 [US1] In `backend/src/services/roomStore.ts` — add exported `submitGuess(code, participantId, text)` function: null-check room, status guard, drawer guard, trim+empty guard, participant lookup, case-insensitive comparison, score update, append guess, return `saveRoom()`
- [x] T009 [US1] In `backend/src/api/rooms.ts` — import `submitGuess` and `submitGuessSchema`; add `router.post("/:code/guesses", ...)` handler with 400/403/404 error mapping; respond `{ room: toRoomSnapshot(room, participantId) }`
- [x] T010 [P] [US1] In `frontend/src/services/api.ts` — add `Guess` interface; add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot`; add `submitGuess(code, participantId, text)` method calling `POST /rooms/:code/guesses`
- [x] T011 [US1] In `frontend/src/state/roomStore.ts` — add `submitGuess(text)` action: trim+empty guard, call `api.submitGuess()` via `withLoading`, call `setRoomSnapshot(response.room)`
- [x] T012 [US1] In `frontend/src/components/GuessForm.tsx` — add `useRoomStore()` and `useRoomState()` calls; on submit: trim+empty check → inline error if blank; call `roomStore.submitGuess(text)`; clear input on success; show API error on failure; pass `disabled` when viewer is drawer

**Checkpoint**: US1 independently verifiable. Correct/incorrect guesses scored. Empty guesses blocked. API response contains updated guess history and scores.

---

## Phase 4: User Story 2 — Guess History and Score Sync (Priority: P1)

**Goal**: All players see the same live guess history and scores, updated every 2 seconds
without manual action. `Scoreboard` and `ResultPanel` stubs activated.

**Independent Test**: Two-tab test — guesser submits a correct guess. Within 2 seconds,
confirm both tabs show the guess in history and the guesser's score shows 100.
Confirm the polling interval stops when navigating away (no console errors after leaving).

### Implementation for User Story 2

- [x] T013 [US2] In `backend/src/services/roomStore.ts` — `toRoomSnapshot()`: include `guesses: room.guesses.map(g => ({ ...g }))` and `scores: { ...room.scores }` in the returned snapshot
- [x] T014 [P] [US2] In `frontend/src/components/Scoreboard.tsx` — use `useRoomState()` to read `room.participants` and `room.scores`; render each participant's name with `scores[participant.id] ?? 0`
- [x] T015 [P] [US2] In `frontend/src/components/ResultPanel.tsx` — use `useRoomState()` to read `room.guesses`; render each guess with participant name, guessed text, and correct/incorrect indicator (most recent first)
- [x] T016 [US2] In `frontend/src/pages/GamePage.tsx` — add `useRoomStore()` call; add `useEffect` with `setInterval` polling `roomStore.fetchRoom()` every 2000ms; add `clearInterval` in cleanup — mirrors LobbyPage pattern exactly

**Checkpoint**: US2 independently verifiable. Both tabs converge on same history and scores within 2s. No runaway intervals after navigation.

---

## Phase 5: User Story 3 — Interactive Drawing Canvas (Priority: P2)

**Goal**: Drawer sees a `<canvas>` they can draw on with mouse press-and-drag. Clear button
resets the canvas. Guessers see the existing placeholder.

**Independent Test**: Single-tab test on drawer's tab — draw strokes, confirm they appear.
Click Clear, confirm canvas goes blank. On guesser's tab, confirm canvas area shows placeholder.

### Implementation for User Story 3

- [x] T017 [US3] In `frontend/src/pages/GamePage.tsx` — add `useRef<HTMLCanvasElement | null>(null)` and `useState<boolean>` for `isDrawing`; replace canvas placeholder `<div>` with conditional render: `<canvas>` + "Clear Canvas" button when `isDrawer`, existing placeholder `<div>` when not drawer
- [x] T018 [US3] In `frontend/src/pages/GamePage.tsx` — implement mouse handlers on the `<canvas>`: `onMouseDown` (set isDrawing true, begin path, moveTo cursor), `onMouseMove` (if isDrawing: lineTo + stroke), `onMouseUp` + `onMouseLeave` (set isDrawing false); implement Clear handler calling `ctx.clearRect(0, 0, canvas.width, canvas.height)`

**Checkpoint**: US3 independently verifiable. Drawer draws freely and clears. Guesser sees placeholder.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T019 Run TypeScript build: `cd backend && npx tsc --noEmit` — zero errors
- [x] T020 [P] Run TypeScript build: `cd frontend && npx tsc --noEmit` — zero errors
- [x] T021 Run existing unit tests: `cd backend && npm test` — all 4 pass
- [x] T022 Manual acceptance: two-tab test — correct guess → both tabs show history + score within 2s; incorrect guess → 0 pts; empty guess → inline error, no network call
- [x] T023 DevTools check: `POST /rooms/:code/guesses` response contains `guesses[]` and `scores{}`; guesser's `GET` response does NOT contain `secretWord`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (T002–T005 must be complete)
- **US2 (Phase 4)**: Depends on US1 complete — `toRoomSnapshot` must include guesses/scores (T013) and the frontend types must have `Guess` and `scores` (T010)
- **US3 (Phase 5)**: Independent of US1/US2 after Phase 2 — canvas is purely frontend
- **Polish (Phase 6)**: Depends on all user story phases complete

### Within Each User Story

- Backend model (T002–T005) before backend service (T006–T009, T013)
- Backend service before frontend type/store (T010–T011, T014–T015)
- Frontend types before component wiring (T012, T016)
- US1 complete before US2 (US2 relies on guesses/scores being in snapshots)

### Parallel Opportunities

- T010 (frontend api.ts types + method) runs in parallel with T006–T009 (backend service + route)
- T014 (Scoreboard) and T015 (ResultPanel) run in parallel — different files
- T019 and T020 (TypeScript builds) run in parallel
- T017 and T018 (canvas) are sequential — T18 adds handlers to the element created in T17

---

## Parallel Example: User Story 1

```bash
# Backend service + frontend type update can run in parallel:
Task T006–T009: "Extend roomStore.ts + add rooms.ts route"
Task T010:      "Add Guess type + submitGuess to api.ts"

# Then sequentially (depends on both):
Task T011: "Add submitGuess action to state/roomStore.ts"
Task T012: "Wire GuessForm.tsx submit + validation"
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 — core game loop)

1. Complete Phase 1: Verify build baseline
2. Complete Phase 2: Extend data model ← CRITICAL gate
3. Complete Phase 3: US1 — guess submission and scoring
4. **STOP and VALIDATE**: Correct/incorrect guesses scored; empty blocked
5. Complete Phase 4: US2 — history sync + scoreboard
6. **STOP and VALIDATE**: Both tabs converge within 2s
7. Complete Phase 5: US3 — canvas
8. **STOP and VALIDATE**: Drawer draws, guessers see placeholder
9. Complete Phase 6: Build checks + full acceptance

---

## Notes

- No new npm dependencies — native Canvas API only (per constitution Principle V)
- All game-rule logic (scoring, comparison) lives in backend only (per constitution Principle II)
- Canvas sync to guessers is explicitly out of scope for Scenario 3 (per README)
- `toRoomSnapshot()` change (T013) is the key unlock for US2 polling — must be done before US2 components
- Commit granularly: one commit per phase or logical group, traceable to task IDs
