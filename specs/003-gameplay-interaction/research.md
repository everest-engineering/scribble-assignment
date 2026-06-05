# Research: Gameplay Interaction

**Feature**: 003-gameplay-interaction — Scenario 3
**Date**: 2026-06-05
**Prerequisites**: Scenarios 1 and 2 fully implemented.

---

## Decision 1 — Canvas State Representation

**Decision**: Store canvas state as `canvasStrokes: Stroke[][]` on `Room`, where each
`Stroke` is an array of `{x: number, y: number}` points captured from a single
mouse-down-to-mouse-up drag. Clear canvas sets the array to `[]`.

**Rationale**: Array of polylines is the simplest faithful representation of freehand
drawing. It can be replayed on an HTML5 `<canvas>` element with `moveTo`/`lineTo` calls.
No new library needed; no SVG/path serialisation required.

**Alternatives considered**:
- Base64 PNG snapshot — simpler to render but large payload; loses editability.
- Single flat array of all points with a separator — workable but less readable.
- SVG path string — slightly easier to replay but harder to clear individual strokes.

---

## Decision 2 — Canvas Mutation API

**Decision**: Two new endpoints:
- `POST /rooms/:code/stroke` — body `{ participantId, points: {x,y}[] }` — appends a
  stroke to `room.canvasStrokes`.
- `POST /rooms/:code/clear` — body `{ participantId }` — sets `room.canvasStrokes = []`.

Both validate that `participantId === room.drawerId` (403 otherwise).

**Rationale**: Separate endpoints keep individual operations clear and testable. Using
polling for reads and explicit POST for writes avoids a heavier sync protocol.
Appending (not replacing) individual strokes means the client only sends new strokes,
keeping payloads small.

**Alternatives considered**:
- PUT `/rooms/:code/canvas` with full canvas replacement — simpler but sends full
  payload on every stroke; wasteful.
- WebSocket real-time sync — explicitly out of scope.

---

## Decision 3 — Guess Submission API

**Decision**: New endpoint `POST /rooms/:code/guess` — body
`{ participantId, text: string }`. Server trims, validates non-empty, checks
`participantId !== room.drawerId` (403 for drawers), compares case-insensitively against
`room.currentWord`, stores the `Guess` object with `isCorrect` and current timestamp,
and updates `room.scores[participantId]` if correct.

**Rationale**: A single endpoint encapsulates all guess logic (trim, validate, score).
Results are returned in the same room snapshot via polling — no extra response payload
needed.

**Alternatives considered**:
- Client-side scoring — violates determinism principle (III); server is authoritative.
- Separate score endpoint — unnecessary indirection; score is a side effect of a guess.

---

## Decision 4 — Scores Initialisation

**Decision**: In `startRoom()`, initialise `room.scores` as a `Record<string, number>`
mapping every `participant.id` to `0` at the time of game start.

**Rationale**: Initialising all scores on start ensures the scoreboard is immediately
populated with real players and zeroes. Avoids undefined-access on first render.

**Alternatives considered**:
- Initialise scores lazily on first guess — risk of undefined entries; complicates
  rendering.

---

## Decision 5 — Game Screen Polling

**Decision**: `GamePage` uses a `setInterval` (~2 000 ms) identical in structure to the
lobby polling already in `LobbyPage`. Each tick calls `roomStore.fetchRoom()`. The
existing `GET /rooms/:code` endpoint already includes the full room snapshot; canvas
strokes, guesses, and scores will all be included once added to the model.

**Rationale**: Reuses the exact polling pattern from Scenario 1 (Principle IV —
Simplicity). No new infrastructure.

**Alternatives considered**:
- Separate polling endpoints for canvas and guesses — unnecessary fragmentation.

---

## Decision 6 — Canvas Rendering

**Decision**: Use a plain HTML5 `<canvas>` element. The drawer attaches `mousedown`,
`mousemove`, `mouseup` event listeners for stroke capture; on `mouseup`, sends the
completed stroke to `POST /rooms/:code/stroke`. Guessers re-render the full stroke array
on each poll by clearing the canvas and replaying all strokes with `ctx.lineTo`.

**Rationale**: HTML5 Canvas API requires no new dependency. Full replay on each poll is
simple and correct — no incremental patch logic needed.

**Alternatives considered**:
- Fabric.js or Konva — adds a library dependency (Principle IV violation); overkill.
- SVG overlay — slightly harder to capture mouse events across browsers.
