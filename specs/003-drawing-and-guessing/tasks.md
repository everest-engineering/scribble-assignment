# Tasks: Drawing & Guessing

**Input**: Design documents from `/specs/003-drawing-and-guessing/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. The spec does not explicitly request tests, so none are generated. Add test tasks manually if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — project structure is already established from the previous feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add `Stroke`, `Point`, and `Guess` types to `backend/src/models/game.ts`
- [x] T002 [P] Extend `RoundState` with `strokes: Stroke[]` and `guesses: Guess[]` fields in `backend/src/models/game.ts`
- [x] T003 [P] Extend `RoomSnapshot` with `strokes: Stroke[]` and `guesses: Guess[]` fields in `backend/src/models/game.ts`
- [x] T004 Add `strokesSchema` and `guessSchema` Zod schemas to `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Drawer Draws on Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer sees a drawing canvas after selecting a secret word, can draw freehand lines with mouse, and strokes are submitted to the server for storage.

**Independent Test**: Start a game as drawer, select a word, verify a blank white canvas appears. Draw several lines and verify each stroke appears immediately on the drawer's screen. Verify strokes are stored on the server (check via API or poll response).

### Implementation for User Story 1

- [x] T005 [P] [US1] Create `DrawingCanvas` component with pointer event handlers, local stroke rendering, and submit-on-mouse-up in `frontend/src/components/DrawingCanvas.tsx`
- [x] T006 [P] [US1] Add `addStroke()` function to `backend/src/services/roomStore.ts` that appends strokes to `RoundState.strokes` with validation
- [x] T007 [P] [US1] Add `POST /rooms/:code/strokes` route handler in `backend/src/api/rooms.ts` that validates caller is drawer, phase is drawing, and calls `addStroke()`
- [x] T008 [US1] Add `api.addStroke()` method in `frontend/src/services/api.ts` and `store.addStroke()` method in `frontend/src/state/roomStore.ts`
- [x] T009 [US1] Update `GamePage.tsx` to render `DrawingCanvas` for the drawer when phase is "drawing", passing the submit callback

**Checkpoint**: At this point, User Story 1 should be fully functional — drawer can draw on canvas, strokes are stored server-side.

---

## Phase 4: User Story 2 — Guessers See the Drawing via Polling (Priority: P1)

**Goal**: Guessers see the drawer's strokes rendered on their canvas, updated via 500ms HTTP polling.

**Independent Test**: Start a game with 2+ players. Have the drawer draw several strokes. Verify guessers' canvases render the same strokes after at most 2 polling cycles.

### Implementation for User Story 2

- [x] T010 [US2] Modify `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `strokes` and `guesses` in the room polling response
- [x] T011 [US2] Update `GamePage.tsx` render cycle to use 500ms polling interval during "drawing" phase
- [x] T012 [US2] Pass `strokes` from room poll response into `DrawingCanvas` in read-only mode for guessers, clearing and redrawing on each update

**Checkpoint**: At this point, User Story 2 should work — guessers see the drawing updated via polling.

---

## Phase 5: User Story 3 — Guessers Submit Guesses (Priority: P1)

**Goal**: Guessers type and submit guesses. Server validates case-insensitively against secret word. Correct guesses are confirmed. All guesses visible to all players with correctness filtered per viewer role.

**Independent Test**: Start a game with a known secret word. Submit the correct word as a guesser, verify correct response. Submit an incorrect word, verify incorrect response. Verify drawer sees all guesses but NOT correctness. Verify already-correct guesser is rejected from further guesses.

### Implementation for User Story 3

- [x] T013 [P] [US3] Add `submitGuess()` function to `backend/src/services/roomStore.ts` that validates caller is a guesser, hasn't already guessed correctly, compares text case-insensitively against `secretWord`, appends to `RoundState.guesses`, and returns `{ correct: boolean }`
- [x] T014 [P] [US3] Add `POST /rooms/:code/guess` route handler in `backend/src/api/rooms.ts` that calls `submitGuess()` and returns the correctness result
- [x] T015 [US3] Add `api.submitGuess()` method in `frontend/src/services/api.ts` and `store.submitGuess()` method in `frontend/src/state/roomStore.ts`
- [x] T016 [US3] Add guess input (text field + submit button) to `GamePage.tsx`, visible only to guessers when phase is "drawing"
- [x] T017 [US3] Implement guess visibility filtering in `toRoomSnapshot()`: drawer sees `isCorrect = null` for ALL guesses; guessers see their own `isCorrect` as stored, others' as `null`
- [x] T018 [US3] Render guess list in `GamePage.tsx` sidebar for both drawer and guessers, showing guesser name + text

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 Run `npm run build` in backend to verify no type or compilation errors
- [x] T020 Run `npm run build` in frontend to verify no type or compilation errors
- [ ] T021 Run through quickstart.md validation steps manually (pending manual verification)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs strokes stored + DrawingCanvas component)
- **US3 (Phase 5)**: Depends on Foundational + US2 (needs polling infra + game page in drawing phase)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story dependencies
- **User Story 2 (P1)**: After US1 — needs strokes to exist and DrawingCanvas component
- **User Story 3 (P1)**: After US2 — needs game page in drawing phase with polling loop

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- T005, T006, T007 (US1) can run in parallel (different files: component, service, route)
- T013 and T014 (US3) can run in parallel (service + route)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tasks together:
Task: "Create DrawingCanvas component in frontend/src/components/DrawingCanvas.tsx"
Task: "Add addStroke() in backend/src/services/roomStore.ts"
Task: "Add POST /rooms/:code/strokes in backend/src/api/rooms.ts"
```

## Parallel Example: User Story 3

```bash
# Launch both backend tasks together:
Task: "Add submitGuess() in backend/src/services/roomStore.ts"
Task: "Add POST /rooms/:code/guess in backend/src/api/rooms.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types, schemas)
2. Complete Phase 3: User Story 1 (canvas drawing + stroke submission)
3. **STOP and VALIDATE**: Test User Story 1 independently via API or frontend
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Drawer can draw → **MVP!**
3. Add User Story 2 → Guessers see drawing
4. Add User Story 3 → Guessers can guess

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (canvas + stroke endpoint)
   - Developer B: User Story 2 (polling + read-only canvas)
3. After US1 + US2: Developer B continues to US3 (guess endpoint + UI)
