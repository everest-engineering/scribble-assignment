---

description: "Task list for Drawing Canvas feature"

---

# Tasks: Drawing Canvas

**Input**: Design documents from `specs/003-drawing-canvas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated test tasks — manual validation per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization (SKIP — brownfield project; all infrastructure exists)

No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model and API client additions that ALL user stories depend on.

- [ ] T001 [P] Create Stroke, CanvasState, and DrawingAction types with Zod validation schemas in `backend/src/models/canvas.ts`
- [ ] T002 [P] Add `canvasState: CanvasState | null` field to Room interface in `backend/src/models/game.ts`
- [ ] T003 [P] Add canvas API client methods (`addStroke`, `clearCanvas`, `fetchCanvas`) with response types to `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — types, model, and API client exist; user story implementation can begin.

---

## Phase 3: User Story 1 — Drawer Draws on Canvas (Priority: P1) 🎯 MVP

**Goal**: The assigned drawer can draw on an interactive HTML5 canvas with colour palette (8+ colours) and brush width options (thin=2, medium=4, thick=8). The guesser sees a read-only canvas.

**Independent Test**: Open the game as the drawer — verify freehand strokes appear on the canvas as the mouse drags, in the selected colour and width. Open as guesser — verify the canvas is non-interactive.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Implement `addStroke` method in canvasService at `backend/src/services/canvasService.ts` — validate drawer permission, append stroke to room's canvasState, return updated CanvasState
- [ ] T005 [US1] Implement POST `/api/rooms/:code/canvas/strokes` endpoint in `backend/src/api/canvas.ts` — parse Zod-validated request body, delegate to canvasService, return updated CanvasState; register route in router
- [ ] T006 [P] [US1] Create interactive Canvas React component with HTML5 canvas element, colour palette (8+ colours), and brush width selector (2/4/8 px) in `frontend/src/components/Canvas.tsx` — use `useRef` for canvas access, track drawing state with `useState`; accept `readOnly` prop to disable drawing for guessers
- [ ] T007 [US1] Embed Canvas component in GamePage at `frontend/src/pages/GamePage.tsx` — replace existing canvas placeholder; pass `readOnly={!isDrawer}`; for the drawer, call `api.addStroke` on mouse-up

**Checkpoint**: Drawer-canvas interaction verified — drawing appears locally; guesser sees read-only canvas.

---

## Phase 4: User Story 2 — Drawing Syncs to Guessers (Priority: P1)

**Goal**: Completed strokes appear on all guessers' canvases within 2 seconds via HTTP polling. Mid-round joiners receive the full current drawing.

**Independent Test**: Open game as drawer in one window and as guesser in another — verify strokes drawn in the drawer window appear on the guesser's canvas within 2 seconds.

### Implementation for User Story 2

- [ ] T008 [US2] Implement GET `/api/rooms/:code/canvas` endpoint in `backend/src/api/canvas.ts` — return current CanvasState (or null if no active round); no authentication required beyond room existence check
- [ ] T009 [US2] Add canvas polling and stroke rendering to GamePage at `frontend/src/pages/GamePage.tsx` — add a `useEffect` with 2s `setInterval` that calls `api.fetchCanvas` and renders returned strokes on the Canvas component; display subtle "connection issue" indicator on poll failure that auto-clears on next success

**Checkpoint**: Drawing sync verified — strokes drawn by drawer appear on guesser's canvas within 2 seconds.

---

## Phase 5: User Story 3 — Drawer Clears Canvas (Priority: P2)

**Goal**: The drawer can clear all strokes from the canvas, syncing the cleared state to all guessers.

**Independent Test**: Drawer draws several strokes and clicks "Clear Canvas" — verify canvas is empty for both drawer and all guessers within 2 seconds.

### Implementation for User Story 3

- [ ] T010 [P] [US3] Add `clearCanvas` method to canvasService at `backend/src/services/canvasService.ts` — validate drawer permission, empty the strokes array in room's canvasState, return updated CanvasState
- [ ] T011 [US3] Implement POST `/api/rooms/:code/canvas/clear` endpoint in `backend/src/api/canvas.ts` — parse request body, delegate to canvasService, return updated CanvasState; register route in router
- [ ] T012 [P] [US3] Add "Clear Canvas" button to Canvas component in `frontend/src/components/Canvas.tsx` — visible only when `readOnly` is false; calls `api.clearCanvas` on click; disabled while request is in flight

**Checkpoint**: Canvas clear verified — drawer clears canvas, cleared state syncs to guessers.

---

## Phase 6: Polish & Edge Cases

**Purpose**: Cross-cutting verification and edge case handling.

- [ ] T013 Run build verification — `cd backend && npm run build && cd ../frontend && npm run build`
- [ ] T014 Execute full manual validation per `specs/003-drawing-canvas/quickstart.md` — run all 6 scenarios with two browser windows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Not applicable — skip
- **Foundational (Phase 2)**: T001, T002, T003 are parallel — no dependencies between them
- **US1 (Phase 3)**: Depends on foundational types (T001, T002, T003)
- **US2 (Phase 4)**: Depends on US1 (canvas component exists) + foundational (GET endpoint)
- **US3 (Phase 5)**: Depends on US1 (canvas component + service exist) + foundational
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: Depends on foundational types — no dependency on other stories
- **User Story 2 (P1)**: Depends on US1 (Canvas component, backend canvas endpoints exist)
- **User Story 3 (P2)**: Depends on US1 (Canvas component, canvasService exist); functionally independent from US2

### Within Each Phase

- [P] tasks can run in parallel (different files, no cross-dependencies)
- Non-[P] tasks must run sequentially
- Backend tasks before frontend tasks where the frontend consumes the API

### Parallel Opportunities

- T001, T002, T003 can all run in parallel — three independent files
- T004 (canvasService) and T006 (Canvas component) can run in parallel — backend vs frontend
- T005 follows T004 sequentially (same backend module)
- T007 follows T006 sequentially (same frontend module)
- T010 and T012 can run in parallel — backend service vs frontend component
- T011 follows T010 sequentially (same backend module)

---

## Parallel Example: User Story 1

```bash
# Launch T004 (backend service) and T006 (frontend component) together:
Task: "Implement addStroke in canvasService at backend/src/services/canvasService.ts"
Task: "Create Canvas React component at frontend/src/components/Canvas.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001, T002, T003)
2. Complete Phase 3: User Story 1 (T004, T005, T006, T007)
3. **STOP and VALIDATE**: Open game as drawer — verify canvas drawing works locally
4. Deliver — drawer has functional drawing canvas

### Incremental Delivery

1. Complete Foundational + US1 → Validate independently → Deliver (MVP!)
2. Complete US2 → Validate independently → Deliver
3. Complete US3 → Validate independently → Deliver
4. Complete Polish → Final validation → Deliver

### Notes

- CanvasState lifecycle: created at round start (empty strokes[]), mutated on add/clear, discarded at round transition (set to null)
- Stroke identity uses client-generated UUID v4 for idempotent POST retries
- Stroke coordinates are normalized 0–1 relative to canvas dimensions
- Canvas polling uses a separate 2s interval from room polling — add as a second `useEffect` in GamePage
- The `canvas-placeholder` div in GamePage.tsx (lines 94-100) is replaced by the Canvas component
- The drawer's canvas must call `api.addStroke` on mouse-up only — no partial-stroke streaming
- Clear action empties the strokes array server-side; all clients fetch the updated state on next poll
- No backend changes needed for round-transition canvas clear — it's handled by the existing round management code setting `canvasState = null`
- Build (`npm run build`) must pass on both backend and frontend before phase completion
- Per constitution Principle V: commits must be granular and traceable to the spec
