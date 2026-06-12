# Research: Round Drawing, Guessing, and Scoring

## Canvas Drawing Approach

**Decision**: Use HTML5 `<canvas>` with freehand mouse/touch events. Coordinates are captured in raw pixel space, then normalized to a fixed 0–1000 logical coordinate system before being sent to the server. On render, the receiving client scales the logical coordinates back to their local canvas dimensions.

**Rationale**:
- HTML5 Canvas is the standard, zero-dependency solution for freehand drawing in browsers.
- Normalizing to a fixed logical size ensures strokes look consistent across different screen sizes and viewport dimensions.
- The payload remains small (arrays of `{x, y}` points) and is easy to serialize for HTTP polling.

**Alternatives considered**:
- SVG paths: More verbose serialization, harder to implement freehand drawing ergonomically.
- WebGL/Canvas 2D libraries (Fabric.js, etc.): Would add a dependency; constitution prefers extending the starter without new top-level dependencies.

## Polling Strategy for Canvas + History

**Decision**: Piggyback canvas strokes, scores, and guess history onto the existing `GET /rooms/:code` room snapshot endpoint. The `RoomSnapshot` type is extended with `canvasStrokes`, `scores`, and `guessHistory` fields.

**Rationale**:
- The spec explicitly states (Clarification Q&A #3) to extend the existing room snapshot endpoint.
- This avoids introducing new endpoints that would require additional polling intervals or complexity.
- All players already poll the room snapshot every ~2 seconds; adding these fields is a natural extension.

**Alternatives considered**:
- Separate `/canvas` and `/history` polling endpoints: Would add more HTTP traffic and complicate the frontend polling logic. Rejected per spec clarification.

## Guess Validation & Scoring

**Decision**: Trim whitespace on the backend using `.trim()`, reject empty/whitespace-only guesses with `400`, compare using `.toLowerCase()`, award 100 points for first correct guess per player, 0 for incorrect or duplicate correct guesses.

**Rationale**:
- Backend validation is the source of truth; prevents race conditions and ensures consistency across all clients.
- Case-insensitive comparison is straightforward and matches user expectations.
- Tracking which players have already guessed correctly prevents duplicate scoring.

**Alternatives considered**:
- Client-side-only validation: Unreliable; a malicious or buggy client could bypass it. Rejected.
- Fuzzy matching (Levenshtein distance): Out of scope; spec requires exact word matching.

## Canvas Clear Semantics

**Decision**: A `POST` to `/rooms/:code/canvas/clear` (or `DELETE` to `/rooms/:code/canvas`) removes all strokes by setting `canvasStrokes` to an empty array. The empty array is then returned in the next poll, causing all clients to render a blank canvas.

**Rationale**:
- Simple, deterministic state reset.
- No need for versioning or incremental stroke IDs because the entire stroke array is replaced on each poll.

## Drawer Leaves Mid-Round

**Decision**: When the drawer leaves, `removeParticipant` already resets the room to `lobby` and clears `drawerId` and `currentWord`. We extend this to also clear `scores`, `guessHistory`, and `canvasStrokes`.

**Rationale**:
- Reuses existing reset logic; keeps cleanup centralized.
- Consistent with the spec edge case: "End the round immediately, clear all round state, and return the room to lobby."
