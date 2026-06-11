# Research: Gameplay Interaction

## Decision Log

### 1. Canvas Data Sharing Mechanism

**Decision**: Include stroke data in the existing room snapshot response (`GET /rooms/:code`). The drawer submits strokes via a dedicated `POST /rooms/:code/stroke` endpoint. The backend appends strokes to the round's `strokes` array. All participants receive the full stroke array via the existing polling loop.

**Rationale**: Reuses the existing polling mechanism (no new polling setup). Stroke data is compact (arrays of coordinate points). Full state transfer (all strokes every poll) is simple and reliable for lab-scale use — no risk of missed strokes from incremental sync.

**Alternatives considered**:
- Dedicated polling endpoint for canvas data — unnecessary complexity, same data flowing through existing snapshot
- WebSocket for real-time drawing — forbidden by constitution
- Image snapshots — larger payload, requires image encoding/decoding on both ends

### 2. Stroke Submission Strategy

**Decision**: Strokes are accumulated client-side during drawing and submitted to the backend on `mouseup` (end of a stroke). The `POST /rooms/:code/stroke` endpoint accepts a single stroke (array of points). A `POST /rooms/:code/clear` endpoint empties the stroke array.

**Rationale**: Submitting per-stroke (not per-point) reduces HTTP requests. Mouseup is a natural stroke boundary. Clearing is a separate action that resets all strokes.

**Alternatives considered**:
- Submit points continuously during drawing — too many HTTP requests for polling
- Submit full canvas state periodically — wasteful, large payload
- Submit strokes on a timer (every N ms) — acceptable but mouseup is more natural

### 3. Guess Submission and Validation

**Decision**: Guess submission via `POST /rooms/:code/guess`. Backend trims whitespace, compares case-insensitively against the round's secret word, and returns the result. The guess (with result) is appended to the round's `guesses` array and synced to all participants via the snapshot.

**Rationale**: Single endpoint handles submission and validation. The round's guesses array serves as the canonical guess history. The frontend reads it from the snapshot for display.

**Alternatives considered**:
- Client-side validation — insecure, guesser could bypass comparison
- Separate validation endpoint — unnecessary round trip

### 4. Score Computation

**Decision**: Scores are computed on-the-fly by counting correct guesses per participant (each correct = 100 points). The `RoomSnapshot` response includes a `scores` map (`Record<string, number>`) keyed by participant ID.

**Rationale**: No separate score storage needed — scores are derived from guesses. Computing on each snapshot ensures consistency. The scores map is cached on the snapshot to avoid repeated computation.

**Alternatives considered**:
- Store scores as a separate Round field — would need to keep in sync with guesses
- Client-side score computation — not all participants have all data immediately

### 5. Canvas Rendering Approach

**Decision**: Use the HTML Canvas API (`<canvas>` element) for both drawing and display. The `DrawingCanvas` component handles mouse events and produces strokes. The `GuessingCanvas` component replays strokes from the snapshot data. Both render the same stroke data identically.

**Rationale**: HTML Canvas API is built into all modern browsers, no external dependencies. Drawing and replay use the same path-drawing operations (`beginPath`, `lineTo`, `stroke`). GuessingCanvas can be read-only by not attaching mouse event handlers.

**Alternatives considered**:
- SVG — declarative but slower for frequent updates
- Framework-specific canvas wrappers (react-konva, Fabric.js) — unnecessary dependency for simple line drawing
- OffscreenCanvas for rendering — premature optimization at lab scale
