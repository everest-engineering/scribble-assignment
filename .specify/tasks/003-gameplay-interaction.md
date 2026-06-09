# Tasks: Gameplay Interaction

**Feature Group**: 003 — Gameplay Interaction
**Input**: `.specify/specs/003-gameplay-interaction.md`, `.specify/plans/003-gameplay-interaction.md`
**Tests**: Required (specified in plan)

## Format

`[ID] [P?] Description (Spec Ref)`

- **`[P]`**: Can run in parallel with other `[P]` tasks at the same phase level
- **Checkpoints**: Tasks within the same box can be done together; sequential
  arrows show hard dependencies

---

## Phase 1: Backend Foundation

**Dependency**: None — can start immediately

### 1a — Backend Model

- **T001** `[P]` Add `Guess` interface to `backend/src/models/game.ts`:
  - Fields: `id: string`, `participantId: string`, `text: string`,
    `isCorrect: boolean`, `timestamp: string`
  - Spec: FR-007 | AC-012

- **T002** `[P]` Extend `Participant` and room types in
  `backend/src/models/game.ts`:
  - Add `score: number` to `Participant`
  - Add `guesses: Guess[]` to `Room`
  - Add `guesses: Guess[]` to `RoomSnapshot`
  - Spec: FR-007, FR-008, FR-009 | AC-008, AC-010, AC-011

### 1b — Backend Schemas

- **T003** Add `submitGuessBodySchema` to `backend/src/api/schemas.ts`:
  - Fields: `participantId: z.string()`, `text: z.string().trim().min(1, ...)`
  - The `.trim().min(1)` chain rejects whitespace-only guesses at the
    schema layer
  - Spec: FR-004 | AC-004

---

## Phase 2: Backend Service

**Dependencies**: Phase 1 complete

- **T004** Update `createParticipant` in `backend/src/services/roomStore.ts`:
  - Add `score: 0` to the returned participant object
  - Every participant created during lobby or via join will carry score 0
    into the game
  - Spec: FR-009 | AC-010

- **T005** Update `startGame` in `backend/src/services/roomStore.ts`:
  - After setting `drawerId` and `secretWord`, initialize
    `room.guesses = []`
  - Ensure every participant's score is set to 0 (defensive double-init)
  - Import `Guess` type from models
  - Spec: FR-007, FR-009 | AC-010, AC-011

- **T006** Add `submitGuess` function to `backend/src/services/roomStore.ts`:
  - Signature: `submitGuess(code: string, participantId: string, text: string)`
  - Return type: discriminated union `{ ok: true, room } | { ok: false, status, message }`
  - Validation chain (in order):
    1. Room exists? → 404 if not
    2. Room status is `"playing"`? → 400 if not
    3. Requester is the drawer? → 403 if yes ("Only guessers can submit guesses")
    4. Text empty after trim? → 400 if empty (defensive — Zod already validates)
  - Comparison: `text.toLowerCase() === room.secretWord.toLowerCase()`
  - Create `Guess` record with randomUUID id, participantId, trimmed text
    (preserve original casing), isCorrect boolean, timestamp
  - If correct: increment participant's `score` by 100
  - Push guess to `room.guesses`, update `room.updatedAt`
  - Return `{ ok: true, room: cloneRoom(room) }`
  - Spec: FR-003, FR-004, FR-005, FR-006, FR-007, FR-008 | AC-003, AC-005,
    AC-006, AC-007, AC-008, AC-009, AC-011

- **T007** Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`:
  - Include `guesses: room.guesses` in the returned snapshot
  - No viewer filtering — all participants see the full guess history
  - Scores are already on each participant object from T004
  - Spec: FR-007 | AC-011, AC-012

---

## Phase 3: Backend Routes

**Dependencies**: Phase 2 complete

- **T008** Add `POST /:code/guess` route in `backend/src/api/rooms.ts`:
  - Import `submitGuess` from roomStore
  - Import `submitGuessBodySchema` from schemas
  - Validate params with `roomCodeParamsSchema`
  - Validate body with `submitGuessBodySchema`
  - Call `submitGuess(code.toUpperCase(), participantId, text)`
  - On `!result.ok`: throw `HttpError(result.status, result.message)`
  - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`
  - Wrap in try/catch with `next(error)`
  - Spec: FR-003, FR-004 | AC-003, AC-004, AC-005

---

## Phase 4: Backend Tests

**Dependencies**: Phase 2 and 3 complete

- **T009** Extend `backend/src/api/schemas.test.ts`:
  - Test that `submitGuessBodySchema` accepts valid `{ participantId, text }`
  - Test that empty text is rejected
  - Test that whitespace-only text is rejected
  - Spec: FR-004 | AC-004

- **T010** Add `submitGuess` tests in `backend/src/services/roomStore.test.ts`:
  - Test correct guess: submit matching word → `isCorrect: true`,
    score increments by 100
  - Test incorrect guess: submit wrong word → `isCorrect: false`,
    score unchanged
  - Test empty guess after trim: returns 400
  - Test drawer cannot guess: drawer ID submits → returns 403
  - Test unknown room code: returns 404
  - Test room not in playing state: returns 400
  - Spec: FR-003, FR-004, FR-005, FR-006, FR-008 | AC-003, AC-004,
    AC-005, AC-006, AC-007, AC-008, AC-009

- **T011** Add initialization tests in
  `backend/src/services/roomStore.test.ts`:
  - Test that `startGame` sets `guesses` to empty array
  - Test that `startGame` sets all participants' `score` to 0
  - Test that `toRoomSnapshot` includes `guesses` array
  - Test that `toRoomSnapshot` includes `score` on each participant
  - Test room isolation: guesses from Room A are not visible in Room B
  - Spec: FR-007, FR-009 | AC-010, AC-011

- **T012** Run backend test suite: `cd backend && npx vitest run`
  - All existing (FG1 + FG2) + new (FG3) tests pass

---

## Phase 5: Frontend API + Store

**Dependency**: Phase 1 complete (model types defined) — can start in parallel
with Phase 2

### 5a — Frontend API Types and Methods

- **T013** Update `frontend/src/services/api.ts`:
  - Add `Guess` interface matching backend shape
  - Add `score: number` to `Participant`
  - Add `guesses: Guess[]` to `RoomSnapshot`
  - Run `npx tsc --noEmit` to verify no stale references
  - Spec: FR-007, FR-008 | AC-011, AC-012

- **T014** Add `submitGuess` method to API client in
  `frontend/src/services/api.ts`:
  - `POST /rooms/{code}/guess` with `{ participantId, text }` body
  - Return `{ room: RoomSnapshot }`
  - Spec: FR-003 | AC-003

### 5b — Frontend Store Action

- **T015** Add `submitGuess` action in `frontend/src/state/roomStore.ts`:
  - Guard: return null if no room or no participantId
  - Call `api.submitGuess(room.code, participantId, text)` via `withLoading`
  - On success: call `setRoomSnapshot(response.room)` to update state
  - Errors (empty guess, drawer-guessing, not playing) are handled by
    `withLoading` setting error state
  - Spec: FR-003, FR-007, FR-008 | AC-003, AC-008, AC-011

---

## Phase 6: Frontend Canvas

**Dependency**: None — can start in parallel with any phase. The canvas is
purely frontend-local; drawing state is stored in the browser's
HTMLCanvasElement 2D rendering context (no backend API needed).

- **T016** Implement interactive drawing canvas in
  `frontend/src/pages/GamePage.tsx`:
  - Replace the canvas placeholder `<div>` with a real `<canvas>` element
  - Use a React ref to hold the canvas element reference
  - Add mouse event handlers:
    - `onMouseDown`: start stroke, record position
    - `onMouseMove`: continue stroke (only when button is held), draw line
      segments using Canvas 2D API (`beginPath`, `lineTo`, `stroke`)
    - `onMouseUp`: end stroke
    - `onMouseLeave`: end stroke (safety — mouse leaves canvas area)
  - Use a single dark stroke color (e.g., `#000`) with a reasonable line
    width (e.g., 3px) on a white background
  - Drawing is active only when the current participant is the drawer
    (`participantId === room.drawerId`)
  - For guessers: continue showing a read-only placeholder or a static
    representation of the canvas area
  - Spec: FR-001 | AC-001

- **T017** Add clear canvas button in `frontend/src/pages/GamePage.tsx`:
  - Render a "Clear Canvas" button visible only to the drawer
  - On click: clear the entire canvas (using `clearRect` on the 2D context)
  - Button should be disabled while a clear is in flight (no-op since it's
    synchronous, but consistent with UX patterns)
  - Spec: FR-002 | AC-002

---

## Phase 7: Frontend Components

**Dependencies**: Phase 5 complete (needs `submitGuess` store action and
updated types for scores/guesses)

- **T018** Rework `frontend/src/components/GuessForm.tsx`:
  - Accept an `onSubmitGuess: (text: string) => Promise<unknown>` callback
    prop (or use roomStore via context)
  - Add local state for `guessText` and `validationError`
  - Client-side validation: reject empty/whitespace-only guesses inline
    before calling the API
  - Wire `handleSubmit`:
    - `event.preventDefault()`
    - Validate non-empty
    - Call `onSubmitGuess(trimmedText)`
    - On success: clear input, clear error
    - On failure: set error message from caught exception
  - Disable input and submit button when `disabled` prop is true (drawer
    case)
  - Show validation and API errors inline below the input
  - Spec: FR-003, FR-004 | AC-003, AC-004

- **T019** Rework `frontend/src/components/Scoreboard.tsx`:
  - Accept `participants: Participant[]` prop
  - Display each participant's name and score in a list
  - Highlight the drawer participant (visual distinction, e.g., bold or
    accent color) — identify drawer by comparing participant IDs to a
    `drawerId` prop
  - Show empty state: "No participants" when the array is empty
  - Spec: FR-008 | AC-008, AC-009

- **T020** Rework `frontend/src/components/ResultPanel.tsx`:
  - Accept `guesses: Guess[]` and `participants: Participant[]` props
  - Display each guess in chronological order:
    - Guesser name (looked up from participants by `participantId`)
    - Guess text
    - Correct/incorrect indicator (e.g., green checkmark / red x)
    - Relative timestamp (e.g., "2s ago", "just now")
  - Show empty state: "No guesses yet" when the array is empty
  - Spec: FR-007 | AC-011, AC-012

---

## Phase 8: Frontend GamePage Integration

**Dependencies**: Phase 6 (canvas) and Phase 7 (components) complete

- **T021** Wire all components together in
  `frontend/src/pages/GamePage.tsx`:
  - Ensure canvas is rendered and interactive for the drawer (from T016)
  - Ensure clear canvas button is rendered for the drawer (from T017)
  - Pass `onSubmitGuess` callback to GuessForm that calls
    `roomStore.submitGuess(text)`
  - Set `disabled={isDrawer}` on GuessForm
  - Pass `participants` and `drawerId` to Scoreboard
  - Pass `guesses` and `participants` to ResultPanel
  - Remove any leftover hardcoded placeholder content
  - Verify that polling (from FG2) continues to update scores and guesses
  - Spec: FR-001, FR-002, FR-003, FR-007, FR-008 | AC-001, AC-002,
    AC-003, AC-011, AC-014

---

## Phase 9: Frontend Tests

**Dependencies**: Phase 5 complete (API methods and store action)

- **T022** Extend `frontend/src/services/api.test.ts`:
  - Test that `submitGuess` sends POST to `/rooms/{code}/guess` with
    `{ participantId, text }` in body
  - Spec: FR-003

- **T023** Extend `frontend/src/state/roomStore.test.ts`:
  - Test `submitGuess` calls API and updates snapshot on success
  - Test `submitGuess` sets error state on failure
  - Spec: FR-003, FR-007, FR-008 | AC-003, AC-008

- **T024** Run frontend test suite: `cd frontend && npx vitest run`
  - All existing (FG1 + FG2) + new (FG3) tests pass

---

## Phase 10: Validation Gate

**Dependencies**: All phases complete

### Automated Validation

- **T025** Run full backend test suite: `cd backend && npx vitest run`
  - All FG1 + FG2 + FG3 tests pass
- **T026** Run full frontend test suite: `cd frontend && npx vitest run`
  - All FG1 + FG2 + FG3 tests pass
- **T027** Run TypeScript compilation check:
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`

### Manual Validation

- **T028** Run manual validation scenarios with two browser tabs:

  | # | Scenario | AC |
  |---|----------|----|
  | 1 | Drawer (Tab A) draws on canvas — visible marks appear in real time | AC-001 |
  | 2 | Drawer clicks "Clear Canvas" — all marks removed | AC-002 |
  | 3 | Guesser (Tab B) submits matching secret word — accepted, +100 points, history updated on both tabs within ~3s | AC-003, AC-008, AC-013 |
  | 4 | Guesser submits incorrect word — appears in history as incorrect, score unchanged | AC-003, AC-009 |
  | 5 | Guesser submits empty/whitespace guess — inline error, not recorded | AC-004 |
  | 6 | Drawer attempts to guess — error message, guess not recorded | AC-005 |
  | 7 | Both tabs show identical guess history with correct/incorrect indicators | AC-011, AC-012 |
  | 8 | Two separate rooms: guesses and scores from Room A not visible in Room B | AC-013 (FG1) |

---

## Dependency Graph

```
Phase 1 (T001-T003)
    │
    ├────────────────────────────────────┐
    ▼                                    ▼
Phase 2 (T004-T007)              Phase 5 (T013-T015)
    ▼                                    ▼
Phase 3 (T008)                           │
    ▼                                    ├── Phase 7 (T018-T020)
Phase 4 (T009-T012)                      │
    │                                    │
    │              Phase 6 (T016-T017) ──┤
    │                                    ▼
    │                             Phase 8 (T021)
    │                                    │
    │                                    ▼
    │                             Phase 9 (T022-T024)
    │                                    │
    └────────────────┬───────────────────┘
                     ▼
              Phase 10 (T025-T028)
```

**Total tasks**: 28
**Parallel opportunities**: T001-T002 (both `[P]`); Phase 5 can start after
Phase 1; Phase 6 (canvas) is independent and can start at any time.

---

## Implementation Sequence

1. **Phase 1** (backend model + schema): 3 tasks — Foundation for all type
   changes.
2. **Phase 2** (backend service): 4 tasks — Core logic for guesses, scoring,
   and history storage.
3. **Phase 3** (backend routes): 1 task — Wire guess endpoint.
4. **Phase 4** (backend tests): 4 tasks — Validate all backend behavior.
5. **Phase 5** (frontend API + store): 3 tasks — Update types, add API
   method, add store action. Can start as soon as Phase 1 is done.
6. **Phase 6** (frontend canvas): 2 tasks — Interactive drawing and clear.
   Fully independent; can run in parallel with any other phase.
7. **Phase 7** (frontend components): 3 tasks — GuessForm, Scoreboard,
   ResultPanel rework. Depends on Phase 5.
8. **Phase 8** (frontend GamePage): 1 task — Wire all components together.
9. **Phase 9** (frontend tests): 3 tasks — API + store tests.
10. **Phase 10** (validation gate): 4 tasks — Final verification.
