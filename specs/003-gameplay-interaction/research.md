# Research: Gameplay Interaction

**Feature**: 003 — Gameplay Interaction
**Date**: 2026-05-31
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## Decision 1: Canvas Implementation Approach

**Decision**: Native HTML5 Canvas API (`<canvas>` + `CanvasRenderingContext2D`)

**Rationale**: The spec explicitly limits this sprint to the drawer seeing their own
drawing (no broadcast to guessers). A third-party canvas library (Fabric.js, Konva,
react-canvas-draw) provides serialization/sync capabilities that are out of scope and
would add an unjustified dependency. The HTML5 Canvas API covers all in-scope
requirements:
- `mousedown` / `mousemove` / `mouseup` events for freehand drawing
- `ctx.clearRect(0, 0, w, h)` for the Clear button
- `ctx.lineTo` / `ctx.stroke` for stroke rendering

**Alternatives considered**:
- **Fabric.js**: Rich object model and serialization — overkill; adds ~150 KB bundle
- **react-canvas-draw**: Simple API but introduces a dependency; native Canvas is
  sufficient for local-only drawing
- **SVG paths**: More accessible but more complex for freehand strokes; Canvas is
  the conventional choice for drawing games

**Implementation pattern** (React functional component):
```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const isDrawing = useRef(false);

function handleMouseDown(e: React.MouseEvent) {
  isDrawing.current = true;
  const ctx = canvasRef.current?.getContext("2d");
  ctx?.beginPath();
  ctx?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
}

function handleMouseMove(e: React.MouseEvent) {
  if (!isDrawing.current) return;
  const ctx = canvasRef.current?.getContext("2d");
  ctx?.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  ctx?.stroke();
}

function handleMouseUp() { isDrawing.current = false; }

function handleClear() {
  const canvas = canvasRef.current;
  canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}
```

No canvas state needs to be persisted — the canvas is a local DOM element.

---

## Decision 2: Guess and Score Storage

**Decision**: Add `guesses: GuessEntry[]` and `scores: Record<string, number>` to
`CurrentRound` in the existing in-memory `Room` model.

**Rationale**:
- Guesses and scores are round-scoped — they reset when a new round starts
- Storing them on `CurrentRound` (rather than on `Room` or `Participant`) makes
  future multi-round support trivial
- Avoids mutating the `Participant` interface (Brownfield Awareness) — participant
  scores are derived state within a round, not identity attributes
- No migration or persistence concern (in-memory only)

**Score initialization**: `startGame()` in `roomStore.ts` already sets up
`currentRound`. It will also initialize `scores` as a zero-valued map over all
participant IDs and `guesses` as an empty array.

**Alternatives considered**:
- **Add `score: number` to `Participant`**: Simpler but pollutes the Participant
  model with round-specific mutable state; also breaks identity/session semantics
- **Separate `guesses` Map at module level**: Unnecessary indirection; co-location
  with the round it belongs to is cleaner

---

## Decision 3: Guess History Polling Endpoint Design

**Decision**: New `GET /rooms/:code/guesses` endpoint that returns both
`guesses` and `scores` in a single response.

**Rationale**:
- The frontend needs both for the ResultPanel (guesses) and Scoreboard (scores)
- A single poll request is more efficient than two
- Keeps guess-related concerns isolated from the existing `GET /rooms/:code`
  endpoint (Brownfield Awareness — avoids expanding `RoomSnapshot`)
- Frontend polls this endpoint on a fixed interval (≤ 3 s)

**Alternatives considered**:
- **Add scores to `RoomSnapshot`**: Would work but expands an already-polled
  endpoint with concerns that belong to gameplay, not room state; risks confusion
  for future features
- **Two separate endpoints** (`GET /guesses` + `GET /scores`): Double the poll
  requests for no benefit

---

## Decision 4: Guess Validation Location

**Decision**: Server-side validation only (after Zod schema confirms non-empty);
client provides optimistic inline error for empty/whitespace before sending.

**Rationale**:
- FR-006 requires rejection with a clear inline message; the client can do this
  cheaply before making a network request (better UX)
- The server MUST also validate (client is not trusted) — trims and rejects empty
  after trim, ensures participant is not the drawer, ensures room is in-progress
- Zod schema: `z.object({ participantId: z.string(), guessText: z.string() })`
  (raw string; trim+validate happens in service layer, not schema, so the server
  can return a specific error code for "empty after trim" vs "missing field")

---

## Decision 5: Drawer Restriction on Canvas & Guess Form

**Decision**: Conditional rendering in `GamePage.tsx` based on `isDrawer` boolean.

**Rationale**:
- Drawer sees `<DrawingCanvas>` component; guessers see a placeholder message
- Guessers see `<GuessForm>`; drawer sees no guess form (FR-004)
- The `isDrawer` flag is already computed in `GamePage.tsx` line 25:
  `const isDrawer = participantId === room.currentDrawerId`
- No backend enforcement needed for canvas (it is client-only); backend DOES
  enforce that the drawer cannot submit guesses (returns 403 error)

---

## Decision 6: Poll Interval

**Decision**: 2 seconds for the guess history poll, matching the existing lobby
poll interval in `LobbyPage.tsx`.

**Rationale**:
- SC-003 requires all players to see new guesses within the polling interval
- 2 s satisfies ≤ 3 s requirement with margin
- Consistent with existing polling patterns in the codebase
- No need for a configurable constant this sprint

**Implementation**: `useEffect` with `setInterval` in `GamePage.tsx`, cleaned up
on component unmount. Pattern mirrors `LobbyPage.tsx` polling.

---

## Resolved Clarifications Summary

| ID | Question | Resolution |
|----|----------|------------|
| C1 | Canvas library or native? | Native HTML5 Canvas API |
| C2 | Where to store guesses/scores? | On `CurrentRound` in existing Room store |
| C3 | One endpoint or two for guess data? | One: `GET /rooms/:code/guesses` returns both |
| C4 | Client or server validates empty guess? | Both: client optimistic, server authoritative |
| C5 | How to restrict drawer from guessing? | Server returns 403; client hides GuessForm |
| C6 | Poll interval for guess history? | 2 seconds (matches lobby polling) |
