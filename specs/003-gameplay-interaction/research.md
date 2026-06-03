# Research: Gameplay Interaction

## Decision: Stroke Representation
- **Decision**: Array of Stroke objects with points array, color, and lineWidth.
- **Rationale**: JSON-serializable, easy to iterate for canvas rendering, extensible for future color/width features.
- **Alternatives considered**: Base64-encoded images (not editable, heavy), Canvas2D path commands (complex to serialize).

## Decision: Canvas Rendering
- **Decision**: HTML5 <canvas> with 2d context, redraw all strokes on each polling update.
- **Rationale**: Native browser API, no dependencies. Simple redraw loop is fine for lab-scale stroke counts.
- **Alternatives considered**: SVG (DOM manipulation heavy for many paths), third-party canvas libraries (unnecessary dependency per constitution).

## Decision: Guess Storage and Scoring
- **Decision**: Flat array of Guess objects on room. Each player has a `hasScored` flag. First correct guess = 100 points.
- **Rationale**: Simple, auditable. History display is just iterating the array.
- **Alternatives considered**: Score as computed property from guesses (requires recounting each time), separate score store (duplicate state).

## Decision: Canvas Sync via Polling
- **Decision**: Strokes included in RoomSnapshot. Frontend redraws canvas when snapshot changes.
- **Rationale**: Reuses existing 2s polling. No new infrastructure needed.
- **Alternatives considered**: Separate /canvas endpoint (extra API surface), WebSocket (forbidden by constitution).
