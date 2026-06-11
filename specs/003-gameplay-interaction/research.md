# Research: Gameplay Interaction

## Decision 1: Canvas Stroke Format

- **Decision**: Strokes are arrays of `{color, points: {x, y}[]}` segments. Each mousedown-to-mouseup sequence produces one stroke segment with a color and an ordered array of coordinate points.
- **Rationale**: Lightweight JSON serialization, efficient to store and transmit via polling. Enables replay on reconnect without image blobs. Consistent with "no new libraries" constraint (no binary/image encoding needed).
- **Alternatives considered**: Base64 image snapshots (bandwidth-heavy, no replay), per-point individual POSTs (chatty, high overhead), SVG paths (complex serialization).

## Decision 2: Canvas Endpoint Design

- **Decision**: Three endpoints:
  - `POST /rooms/:code/draw` — append a stroke segment (drawer only)
  - `DELETE /rooms/:code/draw` — clear all strokes (drawer only)
  - `GET /rooms/:code/canvas` — fetch all strokes (all participants)
- **Rationale**: Separate endpoint per FR-002 (dedicated canvas poll). Read is a simple GET returning full stroke array. Write is POST with stroke body. Clear is DELETE for REST semantics.
- **Alternatives considered**: Bundling with room snapshot (response bloat as strokes accumulate), PATCH for incremental update (over-engineered for polling model), PUT for full replacement (not needed).

## Decision 3: Guess Submission Endpoint

- **Decision**: `POST /rooms/:code/guess` with body `{participantId, text}`. Returns `{correct: boolean, points: number, alreadyGuessed: boolean}`.
- **Rationale**: Simple request-response. Server validates role (guesser only), trims text, compares case-insensitively, awards points, records to guess log.
- **Alternatives considered**: GET-based submission (not REST), bundled multiple guess submission (over-engineered for single round).

## Decision 4: Canvas State Storage

- **Decision**: In-memory `Map<string, CanvasState>` in roomStore, keyed by room code. `CanvasState = { strokes: Stroke[] }`. Cleared on round end.
- **Rationale**: Mirrors existing room storage pattern. In-memory is consistent with constitution (no databases). Room code key enables direct lookup on poll.
- **Alternatives considered**: Embedding strokes in Room object (increases room snapshot size, coupling), separate file storage (violates in-memory constraint).

## Decision 5: Score Storage

- **Decision**: `Map<participantId, number>` stored on the Room model as `scores` field.
- **Rationale**: Scores are inherently per-room. Embedding on Room keeps data colocated with participants. Reset on room creation (no cross-game persistence).
- **Alternatives considered**: Separate scores map (unnecessary indirection), participant-embedded score (mixed concerns).

## Decision 6: Guess Log Storage

- **Decision**: Array of `{participantId, text, correct, timestamp}` stored on the Room model as `guessLog` field.
- **Rationale**: Embedded on Room for simplicity. All participants see full log per FR-006. Sorted by timestamp for ordered display.
- **Alternatives considered**: Separate endpoint for guess log (extra poll, unnecessary), in-memory event log (over-engineering).

## Decision 7: Round End Detection

- **Decision**: After each correct guess, count how many guessers have guessed correctly. If `correctGuessers.length >= guessers.length`, trigger round end. Host can also trigger via `POST /rooms/:code/end-round`.
- **Rationale**: Deterministic condition based on participant roles. Host override for manual control per FR-010.
- **Alternatives considered**: Timer-based (deferred per spec), drawer-initiated end (not supported).

## Decision 8: Canvas Polling Cadence

- **Decision**: ~2 seconds, matching the existing room state polling cadence. Runs as a separate interval in the frontend store.
- **Rationale**: Consistent with existing polling pattern. 2s provides smooth-enough stroke delivery per SC-001 (3s requirement).
- **Alternatives considered**: 1s (too aggressive for mobile/bandwidth), tied to room poll (different update cadence needs).

## Decision 9: Guess Validation Rules

- **Decision**: Trim whitespace, lowercase comparison. Empty/whitespace-only → reject. Already-correct guesser → return `{alreadyGuessed: true}` (no points). Drawer → reject with 403. Non-existent participant → reject with 404.
- **Rationale**: Clear validation chain. Exact match after normalization prevents false positives while being user-friendly.
- **Alternatives considered**: Fuzzy matching (out of scope), substring matching (too permissive, per spec edge case).

## Decision 10: Room "finished" Status Transition

- **Decision**: When round ends (auto or host), `room.status` transitions to `"finished"`. Canvas is cleared. Snapshot includes `secretWord` revealed to all, final scores, and full guess log.
- **Rationale**: Spec states results screen is the terminal state. "finished" status enables frontend to conditionally render results view. Post-round flow deferred to next spec.
- **Alternatives considered**: Separate "results" status (three-state enum unnecessarily complex), keeping "playing" with round-ended flag (ambiguous).
