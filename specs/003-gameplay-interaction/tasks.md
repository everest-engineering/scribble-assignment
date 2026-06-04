# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Paths use `backend/src/` and `frontend/src/` conventions

---

## Phase 1: Foundational — Backend Model & Store

**Purpose**: Extend `Participant`, `Room`, and `RoomSnapshot` with `score`, `strokes`, and
`guesses`. All user stories depend on this data being present.

**⚠️ CRITICAL**: All phases depend on this phase being complete first.

- [ ] T001 Add `score: number` field to `Participant` interface in `backend/src/models/game.ts` (initialised to `0`)
- [ ] T002 Add `strokes: Stroke[]` field to `Room` interface in `backend/src/models/game.ts`
- [ ] T003 Add `guesses: GuessRecord[]` field to `Room` interface in `backend/src/models/game.ts`
- [ ] T004 Add `Stroke` discriminated union types (`DrawStroke`, `ClearStroke`) and `GuessRecord` type in `backend/src/models/game.ts`; `GuessRecord` includes internal `participantId` for cap enforcement
- [ ] T005 Add `SnapshotGuessRecord` type (strip `participantId`) in `backend/src/models/game.ts`
- [ ] T006 Extend `RoomSnapshot` with `strokes: Stroke[]` and `guesses: SnapshotGuessRecord[]` in `backend/src/models/game.ts`
- [ ] T007 Add `score: 0` to `createParticipant()` in `backend/src/services/roomStore.ts`; add `strokes: []` and `guesses: []` to `createRoom()`; update `toRoomSnapshot()` to forward `strokes` and `guesses` (strip `participantId` via map)

---

## Phase 2: Backend API — Schemas & Routes

**Purpose**: Add `POST /rooms/:code/strokes` and `POST /rooms/:code/guess` with Zod
validation and all business rule gates.

- [ ] T008 Add `strokeSchema` (z.discriminatedUnion with `"draw"` and `"clear"` variants) and `guessSchema` (participantId + guess string) to `backend/src/api/schemas.ts`
- [ ] T009 Add `POST /rooms/:code/strokes` handler in `backend/src/api/rooms.ts`: Zod parse → check room exists (404) → check `status === "playing"` (400) → check `participantId === drawerId` (403) → append stroke (or clear) → `saveRoom()` → return `toRoomSnapshot()`
- [ ] T010 Add `POST /rooms/:code/guess` handler in `backend/src/api/rooms.ts`: Zod parse → trim guess → check not empty/whitespace (400) → check room exists (404) → check `status === "playing"` and `currentWord !== null` (400) → check `participantId !== drawerId` (403) → find participant (404) → check no existing correct guess by this `participantId` via `room.guesses.some()` (400) → case-insensitive compare → update participant `score` (+100 if correct) → append to `room.guesses` → `saveRoom()` → return `{ correct, score }`

---

## Phase 3: Frontend Types & API Client

**Purpose**: Extend `Participant`, `RoomSnapshot` on the frontend and add `submitStroke` /
`submitGuess` API methods.

- [ ] T011 Add `DrawStroke`, `ClearStroke`, `Stroke`, `SnapshotGuessRecord` types and extend `Participant` with `score: number` in `frontend/src/services/api.ts`
- [ ] T012 Extend `RoomSnapshot` with `strokes: Stroke[]` and `guesses: SnapshotGuessRecord[]` in `frontend/src/services/api.ts`
- [ ] T013 Add `api.submitStroke(code, stroke)` method in `frontend/src/services/api.ts`: `POST /rooms/:code/strokes` with stroke payload
- [ ] T014 Add `api.submitGuess(code, participantId, guess)` method in `frontend/src/services/api.ts`: `POST /rooms/:code/guess`, returns `{ correct: boolean; score: number }`

---

## Phase 4: GuessForm Component Activation

**Story goal**: `GuessForm` accepts an `onSubmit` prop and submits guesses to the backend.

**Independent Test**: Render `GuessForm` with a mock `onSubmit`; type a guess and click
Submit; confirm `onSubmit` is called with the trimmed guess string.

- [ ] T015 [US2] Add `onSubmit: (guess: string) => void` prop to `GuessFormProps` interface in `frontend/src/components/GuessForm.tsx`
- [ ] T016 [US2] In `frontend/src/components/GuessForm.tsx`, inside `handleSubmit` call `onSubmit(guessText.trim())` and clear the input (set state to `""`); the parent is responsible for server communication
- [ ] T017 [US2] Render inline feedback in `frontend/src/components/GuessForm.tsx` when `submitError` or `lastResult` state is set by the parent (accept these as optional props: `error?: string`, `lastResult?: "correct" | "incorrect"`) — this is display-only; the parent drives the actual submit logic

---

## Phase 5: US1 — Canvas Stroke Sync on GamePage

**Story goal**: Drawer draws on a native canvas; strokes are submitted on mouse-up; all
players see the canvas state via polling full redraw.

**Independent Test**: Tab A (drawer) draws a line on canvas; Tab B (guesser) polls and the
same line appears within ~2s. Tab A clicks Clear; Tab B canvas goes blank within ~2s.

- [ ] T018 [US1] In `frontend/src/pages/GamePage.tsx`, replace the `<div className="canvas-placeholder">` with `<canvas ref={canvasRef} width={500} height={500}>` inside the existing `<Card title="Canvas">`
- [ ] T019 [US1] Add a `useRef<HTMLCanvasElement>(null)` for the canvas and a `useEffect` keyed on `room.strokes`: if `canvasRef.current` exists, get 2D context, call `clearRect(0, 0, width, height)`, then iterate `room.strokes` and replay each `"draw"` stroke with `beginPath`/`moveTo`/`lineTo`/`stroke`; skip `"clear"` entries since `clearRect` already handled it (FR-004a)
- [ ] T020 [US1] For the drawer (`isDrawer`) only: add mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`) on the `<canvas>` element that track a local `isDrawing` flag and accumulate the current stroke; on `mouseUp` call `api.submitStroke(code, { type:"draw", participantId, x0, y0, x1, y1, color: "#000000", lineWidth: 3 })`, then call `roomStore.fetchRoom()` to refresh local state
- [ ] T021 [US1] Add a "Clear Canvas" button below the canvas, visible only when `isDrawer`; on click call `api.submitStroke(code, { type:"clear", participantId })`, then `roomStore.fetchRoom()` (FR-002)
- [ ] T022 [US1] For non-drawers (`!isDrawer`): set `style={{ pointerEvents: "none" }}` on the `<canvas>` element so the canvas is read-only (FR-003a); they still see strokes replayed from `room.strokes`

---

## Phase 6: US2 — Guess Submission & Validation Integration

**Story goal**: Non-drawer participants submit guesses; drawer sees guess form hidden.

**Independent Test**: Tab B submits correct guess → sees "Correct!" inline and score 100.
Tab B submits whitespace → sees error inline. Tab A (drawer) confirms no guess form visible.

- [ ] T023 [US2] In `frontend/src/pages/GamePage.tsx`, conditionally render `<GuessForm>` only when `!isDrawer` inside the "Your Guess" `<Card>`; when `isDrawer` show a message such as `"You are drawing — guess form is hidden"` (FR-008a)
- [ ] T024 [US2] In `frontend/src/pages/GamePage.tsx`, pass an `onSubmit` handler to `<GuessForm>` that calls `api.submitGuess(room.code, participantId, guess)`, then sets local `guessResult` state with the returned `{ correct, score }` to render inline feedback below the form
- [ ] T025 [US2] In `frontend/src/pages/GamePage.tsx`, catch submit errors from `api.submitGuess` (e.g., 400/403) and pass `error` prop to `<GuessForm>` so the user sees the error message inline without crashing the UI

---

## Phase 7: US3 — Guess History Display

**Story goal**: All players see the full guess history in submission order.

**Independent Test**: Submit correct and incorrect guesses from Tab B. Tab A (drawer) and
Tab B both show identical history in correct order.

- [ ] T026 [US3] In `frontend/src/pages/GamePage.tsx`, add a `<Card title="Guess History">` area that renders `room.guesses.map((g, i) => ...)` showing `participantName`, `text`, and a correct/incorrect indicator (e.g., checkmark or red X) for each entry; render below the Secret Word card or in the left sidebar

---

## Phase 8: US4 — Scoreboard & ResultPanel Wiring

**Story goal**: Scores are live in the scoreboard; ResultPanel may be removed or repurposed.

**Independent Test**: After a correct guess, confirm `Scoreboard` shows the updated score.

- [ ] T027 [US4] Wire `Scoreboard` component in `frontend/src/components/Scoreboard.tsx` to accept `participants` prop: sort by `score` descending and render each participant's name + score; replace placeholder content; `GamePage` already renders `<Scoreboard />` — pass `participants={room.participants}`
- [ ] T028 [US4] Wire `ResultPanel` component in `frontend/src/components/ResultPanel.tsx` to accept `guesses` prop: render the last N recent guesses (e.g., last 5) or leave as-is if the dedicated "Guess History" card in T026 is preferred; if repurposing, show a summary like "X guesses so far, Y correct"

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Type safety verification, build validation, manual acceptance test.

- [ ] T029 [P] Verify no `any` types introduced across all modified files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, `frontend/src/pages/GamePage.tsx`
- [ ] T030 [P] Verify `room.strokes` and `room.guesses` are never mutated outside `POST /:code/strokes` and `POST /:code/guess` handlers — confirm `saveRoom()` and `toRoomSnapshot()` do not overwrite or reorder them
- [ ] T031 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [ ] T032 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [ ] T033 Manual two-tab acceptance test per plan.md Testing Strategy: create room (Tab A), join (Tab B), host clicks Start Game, drawer draws line → Tab B sees it, drawer clears → Tab B canvas blanks, Tab B submits correct guess → score 100 + "Correct!", Tab B submits empty → 400 error shown, Tab B submits again with same word → 400 cap error, verify guess history identical on both tabs, verify scoreboard shows updated scores

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006   (model chain — sequential, same file)
T007 (store) depends on T001–T006
T008 (schemas) parallel with T007 (different file)
T009 depends on T007, T008
T010 depends on T007, T008
T011–T014 (frontend types + API) depend on T004–T006
T015–T017 (GuessForm) depend on T011–T014
T018–T022 (canvas) depend on T015–T017
T023–T025 (guess integration) depend on T018–T022
T026 (guess history) depends on T023–T025
T027–T028 (Scoreboard/ResultPanel) depend on T026
T029–T032 (polish) depend on T027–T028; parallel with each other
T033 (manual test) depends on T032
```

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (Backend API)**: Depends on Phase 1 complete
- **Phase 3 (Frontend types)**: Depends on Phase 1 complete
- **Phase 4 (GuessForm)**: Depends on Phase 3 complete
- **Phase 5 (US1 Canvas)**: Depends on Phase 4 complete
- **Phase 6 (US2 Guess)**: Depends on Phase 5 complete
- **Phase 7 (US3 History)**: Depends on Phase 6 complete
- **Phase 8 (US4 Scoreboard)**: Depends on Phase 7 complete
- **Phase 9 (Polish)**: Depends on Phase 8 complete

### Parallel Opportunities

- T007 and T008: parallel (different files — store vs schemas)
- T009 and T010: sequential within same file, but both depend on T007+T008
- T011–T014: sequential within same file
- T015 and T018: technically different files, but T018 depends on GuessForm interface (T015); not parallel
- T027 and T028: parallel (different components — `Scoreboard.tsx` vs `ResultPanel.tsx`)
- T029, T030, T031, T032: all parallel (read-only verification + separate build commands)

---

## Implementation Strategy

### MVP (US1 only — Phases 1–5, T001–T022)

1. Complete Phase 1 (T001–T007) — backend model + store
2. Complete Phase 2 (T008–T010) — backend API routes
3. Complete Phase 3 (T011–T014) — frontend types + API client
4. Complete Phase 4 (T015–T017) — GuessForm activation
5. Complete Phase 5 (T018–T022) — canvas draw/clear/replay with polling
6. **Validate**: drawer draws, all tabs see it; clear works; non-drawers cannot draw

### Full delivery (all phases)

7. Complete Phase 6 (T023–T025) — guess submission, validation, inline feedback
8. Complete Phase 7 (T026) — guess history display
9. Complete Phase 8 (T027–T028) — scoreboard + result panel wired
10. Complete Phase 9 (T029–T033) — polish + builds + manual acceptance test
