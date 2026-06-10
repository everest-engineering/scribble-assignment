# Research: Gameplay Interaction - Drawing, Guessing & Scoring

## 1. Canvas Stroke Data Format

**Decision**: Store drawing actions as an ordered array of `CanvasAction` objects with two variants: `stroke` and `clear`. A stroke is an array of 2D points with drawing attributes. The clear action resets the canvas state.

**Stroke format**:
```
{ type: "stroke", points: { x: number, y: number }[], color: string, width: number }
```

**Clear format**:
```
{ type: "clear" }
```

**Rationale**: A point-array representation is compact (JSON-serializable), easy to replay on the client by iterating over points and drawing line segments, and requires no binary encoding or external libraries. The `clear` action is a single command that resets all strokes.

**Alternatives considered**:
- SVG path data: More complex to generate from mouse events and requires SVG parser on replay.
- Base64 image snapshots: Lossy, large payload, and doesn't support incremental updates.
- Fabric.js / Konva.js serialization: Heavy dependency; unnecessary for a simple drawing game.

## 2. Guess Submission Endpoint Design

**Decision**: Use `POST /rooms/:code/guess?playerId=<id>` with a JSON body `{ "text": "string" }`. The response returns the guess result (`correct: boolean`) and the player's updated score.

**Rationale**: Simple REST endpoint. The server handles trimming, empty rejection, case-insensitive comparison, duplicate-guesser rejection, and drawer rejection. The `playerId` query param identifies the submitter (per FR-018).

**Response shape for accepted guess (correct)**:
```json
{ "correct": true, "score": 100, "guessId": "uuid" }
```

**Response shape for accepted guess (incorrect)**:
```json
{ "correct": false, "score": 0, "guessId": "uuid" }
```

**Error responses**:
- `400` — Empty guess, guess too long (>100 chars), or already-scored guesser
- `403` — Drawer cannot guess
- `404` — Room not found

## 3. Canvas Rendering on the Guesser Side

**Decision**: The `GET /rooms/:code` response includes the full `canvasActions` array. Guessers iterate the array and replay strokes on their local HTML Canvas using `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, `ctx.stroke()`. A `clear` action calls `ctx.clearRect()`.

**Rationale**: The full action list is small (typically <100 actions per round). Sending the full list is simpler than a delta-based approach and the polling interval (~2s) means bandwidth is negligible. Replaying on the client ensures deterministic rendering.

**Alternatives considered**:
- Server-side rendered canvas snapshots: Requires canvas on the server (node-canvas dependency), adds complexity.
- Delta-based sync: Only send new actions since last poll. More efficient but adds complexity of tracking what each client has seen. Not justified given small payload size.

## 4. Client-Side Canvas Implementation

**Decision**: Use native HTML5 Canvas API with mouse event handlers (`mousedown`, `mousemove`, `mouseup`) for drawing. No external drawing library.

**Rationale**: The project has no drawing dependencies currently. Native Canvas API is sufficient for a simple freeform drawing game. Avoids adding unnecessary dependencies.

**Implementation approach**:
- Create a `DrawingCanvas` React component wrapping a `<canvas>` element.
- Track `isDrawing` state; on `mousedown` start a new stroke, on `mousemove` push points and draw live, on `mouseup` finalize and send to server.
- The drawer draws on their local canvas immediately (no round-trip per point). Periodically or on stroke-end, send the completed stroke action to `POST /rooms/:code/canvas`.
- Clear button triggers a `clear` action sent to the server and resets the local canvas.
- Guessers receive the full action list on each poll and replay all strokes from scratch.

**Alternatives considered**:
- Pointer Events API: Better for pen/touch but less widely supported; mouse events + touch events polyfill is more robust.

## 5. Score Tracking in the Snapshot

**Decision**: Store scores as `Record<string, number>` (participant ID → score) on the Room object. Include `scores` in `RoomSnapshot` as a flat object. The drawer always shows `0` for all participants (drawer doesn't guess/score).

**Rationale**: A simple map from participant ID to score is the most straightforward structure. Scores are reset to `0` for all non-drawer participants when a round starts (the drawer has no score entry).

**Shape**:
```json
"scores": {
  "participant-uuid-1": 100,
  "participant-uuid-2": 0,
  "participant-uuid-3": 100
}
```

**Alternatives considered**:
- Array of `{ participantId, score }` objects: More verbose, requires array lookups.

## 6. Polling Integration

**Decision**: The existing `GET /rooms/:code` response is extended with three new fields:
- `canvasActions: CanvasAction[]` — full drawing action list
- `guessHistory: GuessEntry[]` — ordered list of all guesses
- `scores: Record<string, number>` — current scores

The existing polling infrastructure (LobbyPage/GamePage interval at ~2s) will automatically pick up these new fields. No new polling mechanism needed.

**Rationale**: Consistent with existing architecture (Constitution II). Minimizes client changes.

## 7. Round-End Detection

**Decision**: After each correct guess, check if all non-drawer participants have a score of 100. If so, the round ends. The room status stays `"playing"` (round rotation is out of scope for this feature). The `roundOver` flag is added to the snapshot.

**Rationale**: The spec (FR-017) says the round ends when all guessers guess correctly. Without round rotation in scope, we just signal round completion in the snapshot. Future features will handle round transitions.

**Shape**:
```json
"roundOver": true
```
