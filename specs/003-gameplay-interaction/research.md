# Research: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Date**: 2026-05-31

## R1 — Canvas drawing representation

**Decision**: Store an ordered array of **strokes** on the room. Each stroke has a stable `id`, `color`, `width`, and a polyline of `{ x, y }` points in canvas coordinate space (0–800 × 0–500 logical units).

**Rationale**: A stroke list is easy to serialize in JSON, include in `GET /rooms/:code` snapshots, and replay on HTML5 `<canvas>` without new dependencies. Full snapshot sync via polling matches the lab constraint (no WebSockets).

**Alternatives considered**:
- **Raster image (base64 PNG)**: Simple for guessers but heavy payloads on every poll and lossy on re-draw; rejected.
- **Binary stroke compression**: Over-engineered for a single-round lab with few players.
- **Client-only canvas**: Violates FR-002; guessers would not see drawing.

## R2 — Stroke upload strategy

**Decision**: Drawer appends **one completed stroke** per request when pointer/touch is released (`POST /rooms/:code/drawing/strokes`). Clear uses a dedicated endpoint (`POST /rooms/:code/drawing/clear`) that sets `strokes` to `[]`.

**Rationale**: Batching on stroke end limits request volume while keeping implementation straightforward. Clear as a separate action matches user story 2 and avoids ambiguous “delete stroke” logic.

**Alternatives considered**:
- **Replace entire drawing on every mousemove**: Too many requests; poor fit for polling lab.
- **Single PATCH with full stroke array**: Works but pushes merge/conflict logic to client; append is simpler for one drawer.

## R3 — Frontend canvas approach

**Decision**: Use native HTML5 Canvas in a new `DrawingCanvas` component. Drawer: interactive listeners (`pointerdown` / `pointermove` / `pointerup`). Guesser: same component in read-only mode that replays `room.strokes` from poll updates.

**Rationale**: Starter stack is React + Vite with no canvas library; native API is sufficient for freehand lines.

**Alternatives considered**:
- **SVG overlay**: Viable but starter already frames canvas as a card; HTML5 canvas matches placeholder layout.
- **Third-party drawing library**: Out of scope per constitution (no unjustified dependencies).

## R4 — Guess validation and scoring

**Decision**: Server-side function compares `guess.trim().toLowerCase()` to `secretWord.toLowerCase()`. Correct → `scores[participantId] += 100`; incorrect → no score change. Append to `guesses[]` with `participantId`, `participantName`, `text` (trimmed), `correct`, `submittedAt`.

**Rationale**: Matches constitution V and spec FR-004–FR-008. Server is source of truth for scoring (clients cannot cheat via devtools).

**Alternatives considered**:
- **Client-side scoring**: Rejected; not authoritative.
- **End round on first correct guess**: Deferred to Scenario 4 per spec scope boundaries.

## R5 — Role and status guards

**Decision**: All gameplay mutations require `room.status === "playing"`. Drawing/clear require `participantId === room.drawerId`. Guess requires `participantId !== room.drawerId` and participant exists in room.

**Rationale**: Implements FR-001, FR-003, FR-009, FR-012 in one consistent pattern.

## R6 — Game polling

**Decision**: Reuse ~2000 ms interval on `GamePage` (from Scenario 2 plan). Each poll calls `GET /rooms/:code?participantId=…` and updates canvas, guess history, and scoreboard from snapshot.

**Rationale**: Aligns with constitution polling cadence and Scenario 1 lobby pattern.

## R7 — Prerequisite scenarios on this branch

**Decision**: Treat Scenarios 1–2 (`hostId`, `startGame`, `drawerId`, `secretWord`, `scores`, game route guards) as **hard prerequisites**. If not present on the branch, merge or implement 001/002 before Scenario 3 gameplay endpoints.

**Rationale**: Current branch scaffold lacks `playing` status and round fields; Scenario 3 builds on an active round only.

**Alternatives considered**:
- **Bundle 001–003 in one plan**: Rejected; lab requires phased checkpoints and separate spec directories.

## R8 — Guess history UI

**Decision**: Add `GuessHistory` component listing guesses chronologically with guesser name, text, and correct/incorrect indicator. Feed from `room.guesses` in snapshot.

**Rationale**: Satisfies FR-007 and FR-010 without a separate history endpoint.

## R9 — Automated tests (recommended)

**Decision**: Vitest unit tests for `submitGuess()` and drawing authorization helpers in `roomStore` / dedicated `guessService.ts`. Optional stroke append/clear tests.

**Rationale**: Constitution encourages service tests for deterministic game rules; not mandatory but specified in plan for traceability.
