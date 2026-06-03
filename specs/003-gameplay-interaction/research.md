# Research: Gameplay Interaction

## Decision 1: Canvas State Representation

**Decision**: Represent the canvas as an ordered list of `Stroke` objects stored in room state. Each `Stroke` holds an array of `{x, y}` points captured from pointer events, plus a `color` string and a `lineWidth` number. The list is stored as `strokes: Stroke[]` on the `Room` model and included in every `RoomSnapshot`.

**Rationale**: A stroke list is the natural unit of drawing input — each pointer-down → pointer-move* → pointer-up gesture produces one stroke. The list is trivially appendable (push a new stroke) and clearable (reset to `[]`). Each poll response carries the full current stroke list, so guessers always get the authoritative state regardless of when they joined or refreshed. A base64 PNG alternative was considered but is heavier to serialize, cannot be diffed, and requires a canvas-to-blob conversion step on the client before upload.

**Alternatives considered**:
- Base64 PNG per stroke: rejected — high payload size, lossy round-trip, harder to clear selectively.
- SVG path strings: rejected — adds string-parsing complexity on the client with no benefit over point arrays.
- Delta-only sync (send only new strokes): rejected — requires client-side sequence tracking; the full list is small enough for this lab scope.

---

## Decision 2: Canvas API — Two New Endpoints

**Decision**: Add two new room-scoped endpoints:
- `POST /rooms/:code/stroke` — appends one stroke submitted by the drawer.
- `POST /rooms/:code/clear` — resets the stroke list to `[]`; only the drawer may call it.

**Rationale**: Separating draw and clear into distinct write endpoints keeps the existing `GET /rooms/:code` polling path read-only and unchanged. The guesser tabs poll `GET /rooms/:code?participantId=...` as they already do for other state; the `strokes` array in the snapshot is simply another field they consume. No new polling endpoint is needed.

**Alternatives considered**:
- PUT /rooms/:code/canvas (replace full canvas): rejected — PUT semantics imply idempotency; concurrent stroke appends would race. Two fine-grained endpoints are clearer.
- Embedding stroke submission inside `POST /rooms/:code/guess`: rejected — conceptually separate actions; merging them creates a payload shape that does not map to user intent.

---

## Decision 3: Guess Submission Endpoint

**Decision**: Add `POST /rooms/:code/guess` with body `{ participantId, text }`. The handler trims `text`, rejects empty strings with a 400, rejects guesses from the drawer with a 403, compares `text.trim().toLowerCase()` to `room.currentWord.toLowerCase()`, creates a `Guess` record, adds 100 to `scores[participantId]` if correct (0 if not), saves the room, and returns the updated snapshot scoped to the submitting participant.

**Rationale**: A dedicated guess endpoint keeps concerns clean — validation, comparison, and scoring all happen atomically in one handler. Returning the full updated snapshot on success means the frontend can immediately update its state without waiting for the next poll cycle, giving instant feedback to the guesser.

**Alternatives considered**:
- Separate `/score` endpoint: rejected — scoring is a side effect of a correct guess; splitting it adds a second round-trip with no user value.
- Client-side scoring: rejected — the constitution requires all game-rule logic (scoring) to be deterministic and server-enforced. Client-side scoring can be spoofed.

---

## Decision 4: Scores Storage on Room

**Decision**: Store scores as `scores: Record<string, number>` on `Room`, keyed by `participantId`. Initialize all participants to `0` when the game starts (in the `startRoom` handler). Include the full `scores` object in `RoomSnapshot`.

**Rationale**: A `Record<string, number>` is the simplest in-memory representation — O(1) lookup by participant ID for scoring, trivial to serialize to JSON for the snapshot. Initializing in `startRoom` ensures every participant has a score entry from the moment the game screen loads, avoiding undefined-key edge cases in the UI.

**Alternatives considered**:
- Score array on each `Participant`: rejected — requires iterating the participants list to update a score; the map is cleaner.
- Deriving scores from the guess history on every read: rejected — O(n guesses) per snapshot; unnecessary for this scale and makes snapshot computation stateful.
