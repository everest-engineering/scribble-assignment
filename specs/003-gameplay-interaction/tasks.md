# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. US1 (canvas) can begin immediately; US2–US4 depend on foundational
backend work completing first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

No setup required — this is a brownfield scenario extending an existing working application.
Proceed directly to Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `Guess` type, extend `Room`/`RoomSnapshot` with `guesses`/`scores`,
wire up the backend guess endpoint, and expose `submitGuess` on the frontend API and store.
All user stories depend on this data layer being in place.

**⚠️ CRITICAL**: US2, US3, and US4 cannot be completed until this phase is done.
US1 (canvas drawing) can proceed in parallel with this phase.

- [ ] T001 [P] Add `Guess` interface (`participantId`, `participantName`, `text`, `correct`, `submittedAt`) to `backend/src/models/game.ts`; add `guesses: Guess[]` and `scores: Record<string, number>` to both `Room` and `RoomSnapshot` interfaces
- [ ] T002 [P] Mirror `Guess` interface and add `guesses: Guess[]` and `scores: Record<string, number>` to `RoomSnapshot` in `frontend/src/services/api.ts`
- [ ] T003 [P] Add `export const guessSchema = z.object({ participantId: z.string(), guessText: z.string() })` to `backend/src/api/schemas.ts`; export it alongside existing schemas
- [ ] T004 In `backend/src/services/roomStore.ts` `startRoom`: after setting `status`, add `room.guesses = []` and `room.scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))`; in `toRoomSnapshot`: spread `guesses: room.guesses` and `scores: { ...room.scores }` into the snapshot object (after T001)
- [ ] T005 Add `export function submitGuess(code: string, participantId: string, guessText: string)` to `backend/src/services/roomStore.ts`: get room or throw 404; trim guessText, throw 400 if empty; throw 403 if `participantId === room.drawerId`; find participant by id for `participantName`; compare `trimmed.toLowerCase()` against `room.secretWord!.toLowerCase()`; push `Guess` object to `room.guesses`; if correct add 100 to `room.scores[participantId]`; call `saveRoom(room)`; return `toRoomSnapshot(cloneRoom(room), participantId)` (after T001, T004)
- [ ] T006 Add `router.post("/:code/guess", (request, response, next) => { ... })` to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, body with `guessSchema`; call `submitGuess`; respond `200` with `{ room: snapshot }`; pass errors to `next` (after T003, T005)
- [ ] T007 [P] Add `submitGuess(code: string, participantId: string, guessText: string)` to the `api` object in `frontend/src/services/api.ts`: `POST /rooms/${code}/guess` with `{ participantId, guessText }` body, return type `{ room: RoomSnapshot }` (after T002)
- [ ] T008 Add `async submitGuess(guessText: string)` method to `RoomStore` in `frontend/src/state/roomStore.ts`: guard — return if no `this.state.room` or `this.state.participantId`; call `api.submitGuess(room.code, participantId, guessText)`; on success call `this.setRoomSnapshot(response.room)`; re-throw any error so callers can display it (after T007)

**Checkpoint**: Backend guess endpoint live; frontend store can submit guesses and update state.
US2, US3, US4 implementation can now begin.

---

## Phase 3: User Story 1 — Drawer Draws and Clears the Canvas (Priority: P1) 🎯 MVP

**Goal**: Replace the canvas placeholder with a real `<canvas>` for the drawer (freehand
drawing via mouse events + "Clear Canvas" button) and a styled "Watch the drawer!" div for
guessers.

**Independent Test**: One tab as Alice (drawer). After game start, Alice can click and drag
on the canvas to draw freehand. The drawing appears in real time. Alice clicks "Clear Canvas"
and the canvas is wiped blank. Bob's tab (guesser) shows "Watch the drawer!" — not a canvas.

**Note**: T009–T011 all modify `frontend/src/pages/GamePage.tsx` and must run sequentially.
They can begin in parallel with Phase 2 backend tasks (different files).

- [ ] T009 [US1] In `frontend/src/pages/GamePage.tsx`: add `const canvasRef = useRef<HTMLCanvasElement>(null)` and `const isDrawingRef = useRef(false)` at the top of the component; replace the existing canvas placeholder `<div>` with a conditional block — when `isDrawer`: render `<canvas ref={canvasRef} width={800} height={500} style={{ display: 'block', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }} />`, when `!isDrawer`: render a styled `<div style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>Watch the drawer!</div>`
- [ ] T010 [US1] In `frontend/src/pages/GamePage.tsx`: add a `useEffect` (runs when `isDrawer` or `canvasRef` changes) that — if `isDrawer` and canvas is available — gets `ctx = canvas.getContext('2d')` and attaches: `mousedown` handler (set `isDrawingRef.current = true`, `ctx.beginPath()`, `ctx.moveTo(offsetX, offsetY)`), `mousemove` handler (if `isDrawingRef.current`: `ctx.lineTo(offsetX, offsetY)`, `ctx.stroke()`), and `mouseup`/`mouseleave` handlers (set `isDrawingRef.current = false`); return cleanup function that removes all four event listeners from the canvas (after T009)
- [ ] T011 [US1] In `frontend/src/pages/GamePage.tsx`: directly below the `<canvas>` element (inside the `isDrawer` branch), add a `<div className="button-row" style={{ marginTop: '8px' }}>` containing a `<button className="button button--secondary">Clear Canvas</button>` whose `onClick` calls `canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)` (after T010)

**Checkpoint**: Alice can draw and clear on the canvas; Bob sees "Watch the drawer!". US1 complete.

---

## Phase 4: User Story 2 — Guesser Submits a Guess (Priority: P1)

**Goal**: Wire up the guess form so guessers can submit guesses that are trimmed, validated,
sent to the backend, and reflected immediately in their own UI; empty guesses are rejected
with an error; the drawer's form stays disabled.

**Independent Test**: Two tabs. Bob types " ROCKET ", submits — trimmed to "ROCKET", matched
case-insensitively to "rocket", Bob's score becomes 100. Bob then submits an empty string —
error message shown, no API call made, input field retains its value.

- [ ] T012 [US2] In `frontend/src/components/GuessForm.tsx`: add `onSubmit?: (guessText: string) => Promise<void>` prop; update `handleSubmit`: trim `guessText`, if empty set `error` state ("Guess cannot be empty") and return without calling `onSubmit` (input value retained); clear `error`; if `onSubmit` defined, `await onSubmit(trimmed)` inside a try/catch that sets `error` on failure; on success clear `guessText` to `""`; render `{error && <p className="form__error" style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '4px' }}>{error}</p>}` below the input field (after T008)
- [ ] T013 [US2] In `frontend/src/pages/GamePage.tsx`: retrieve `store` via `useRoomStore()`; pass `onSubmit={async (text) => { await store.submitGuess(text); }}` to both `<GuessForm>` render sites (the `!isDrawer` branch and the `disabled={true}` branch); the disabled branch already prevents submission, so the prop is harmless there (after T012)

**Checkpoint**: Guessers can submit guesses end-to-end; empty guesses rejected; drawer's form
disabled. US2 complete.

---

## Phase 5: User Story 3 — Guess History Synced to All Players (Priority: P1)

**Goal**: Add 2-second game-screen polling so all players see new guesses within 3 seconds;
replace the `ResultPanel` placeholder with a colour-coded guess history list.

**Independent Test**: Two tabs. Bob submits a guess on Tab 2. Within 3 seconds, without any
interaction on Tab 1, Alice's game screen shows Bob's guess in the history list with green
(correct) or red (incorrect) colouring.

- [ ] T014 [US3] In `frontend/src/pages/GamePage.tsx`: add `const POLL_INTERVAL_MS = 2000` constant at module level; add a `useEffect` (no deps except `store` and `navigate`) that starts `const id = setInterval(async () => { try { await store.fetchRoom(); } catch (error) { const msg = error instanceof Error ? error.message : ""; if (msg.includes("404") || msg.includes("Unable to load room")) { navigate("/", { replace: true }); } else { setPollError(msg); } } }, POLL_INTERVAL_MS)` and returns `() => clearInterval(id)`; add `const [pollError, setPollError] = useState<string | null>(null)`; render `{pollError && <p style={{ color: '#991b1b' }}>{pollError}</p>}` near the bottom of the layout (after T013)
- [ ] T015 [P] [US3] In `frontend/src/components/ResultPanel.tsx`: call `const { room } = useRoomState()` (import `useRoomState` from `../state/roomStore`); replace the placeholder content with: if `!room?.guesses?.length` render `<p style={{ color: '#6b7280' }}>No guesses yet.</p>`; otherwise render a `<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>` where each `<li key={index}` has `style={{ padding: '4px 8px', marginBottom: '4px', borderRadius: '4px', backgroundColor: g.correct ? '#dcfce7' : '#fee2e2', color: g.correct ? '#166534' : '#991b1b' }}>` and renders `{g.participantName}: {g.text}` via JSX text nodes only (not dangerouslySetInnerHTML)

**Checkpoint**: Guess history auto-updates across tabs within 3 s; colour-coded by result.
Polling stops on navigation. US3 complete.

---

## Phase 6: User Story 4 — Scoreboard Reflects Live Scores (Priority: P2)

**Goal**: Replace the `Scoreboard` placeholder with live scores that update on every poll.

**Independent Test**: Two tabs — both initially show all players at 0. Bob submits the
correct word. On Alice's next poll (≤ 3 s), Bob shows 100 and Alice shows 0.

- [ ] T016 [P] [US4] In `frontend/src/components/Scoreboard.tsx`: call `const { room } = useRoomState()` (import `useRoomState` from `../state/roomStore`); if `!room` render a `<p>Waiting...</p>` placeholder; otherwise render a `<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>` with one `<li>` per participant showing `{p.name}` and `<strong>{room.scores?.[p.id] ?? 0}</strong>` side by side; no inline HTML — all plain text nodes

**Checkpoint**: Scoreboard reflects live scores for all players within 3 s of a correct guess.
US4 complete.

---

## Phase 7: Polish & Validation

**Purpose**: Final cross-cutting validation against all acceptance scenarios.

- [ ] T017 Manual two-tab validation per `specs/003-gameplay-interaction/spec.md`: (1) US1 — Alice draws freehand, "Clear Canvas" wipes it, Bob sees "Watch the drawer!"; (2) US2 — Bob submits " ROCKET " → 100 pts, "pizza" → 0 pts, empty → error retained; (3) US3 — Bob's guess appears on Alice's tab within 3 s without page interaction; (4) US4 — Scoreboard shows 100 for Bob and 0 for Alice after correct guess

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1 — Canvas)**: No dependencies on Phase 2 — can run **in parallel** with Phase 2
- **Phase 4 (US2 — Guess Submit)**: Requires Phase 2 complete (T006–T008)
- **Phase 5 (US3 — Guess Sync)**: Requires Phase 2 complete (T006) + Phase 4 complete (T013)
- **Phase 6 (US4 — Scoreboard)**: Requires Phase 2 complete (T001–T004)
- **Phase 7 (Polish)**: Requires all story phases complete

### User Story Dependencies

- **US1 (Canvas)**: Independent — can start immediately alongside Phase 2
- **US2 (Guess Submit)**: Depends on Phase 2 (foundational backend + store)
- **US3 (Guess Sync)**: Depends on Phase 2 (backend) + US2 (GuessForm wiring in GamePage)
- **US4 (Scoreboard)**: Depends on Phase 2 (data model and snapshot changes)

### Within Each Phase

- T001, T002, T003: fully parallel (different files)
- T004: after T001
- T005: after T001, T004
- T006: after T003, T005
- T007: after T002 (parallel with T004–T006)
- T008: after T007
- T009 → T010 → T011: sequential (same file, each builds on previous)
- T012 → T013: sequential (T013 uses T012's new prop)
- T014: after T013 (both in GamePage.tsx)
- T015: parallel with T016 (different files)

---

## Parallel Execution Examples

### Phase 2 — Start these together

```
Task T001: Add Guess type + extend Room/RoomSnapshot   backend/src/models/game.ts
Task T002: Mirror Guess type + extend RoomSnapshot     frontend/src/services/api.ts
Task T003: Add guessSchema                             backend/src/api/schemas.ts
```

### Phase 3 (US1) — Can run alongside Phase 2

```
Task T009: Replace canvas placeholder (drawer + guesser views)  frontend/src/pages/GamePage.tsx
  → T010: Add drawing useEffect (mouse event listeners)
    → T011: Add Clear Canvas button
```

### Phase 5–6 — Run together after Phase 4

```
Task T015: ResultPanel guess history   frontend/src/components/ResultPanel.tsx
Task T016: Scoreboard live scores      frontend/src/components/Scoreboard.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 2 (Foundational) + Phase 3 (US1 canvas) in parallel
2. Complete Phase 4 (US2 guess submission)
3. **STOP and VALIDATE**: Can Alice draw? Can Bob submit guesses end-to-end?
4. Proceed to US3 + US4 once MVP passes

### Incremental Delivery

1. Phase 2 + Phase 3 in parallel → Backend live, canvas works
2. Phase 4 (US2) → End-to-end guess submission
3. Phase 5 (US3) → Guess history visible across tabs
4. Phase 6 (US4) → Live scoreboard
5. Phase 7 → Full two-tab validation

---

## Notes

- `[P]` tasks can be launched simultaneously by separate agents or sequentially — no shared state conflicts
- All guess text renders as JSX text nodes / `textContent` — never `dangerouslySetInnerHTML` (FR-009a)
- `POLL_INTERVAL_MS = 2000` must be a named constant (Principle IV)
- `clearInterval` cleanup in every `setInterval` useEffect (Principle IV)
- No new npm packages (Principle — constitution Out-of-Scope)
- Type `any` is forbidden; use `unknown` and narrow at boundaries (Principle II)
