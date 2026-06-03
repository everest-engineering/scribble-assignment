# Research: Gameplay Interaction

**Feature**: `003-gameplay-interaction`
**Status**: Complete — all NEEDS CLARIFICATION markers resolved. No unknowns remain.

---

## Decision Log

### 1. Canvas Representation

**Decision**: Represent canvas state as `Array<Array<{x: number; y: number}>>` — a list of strokes,
where each stroke is an ordered list of `{x, y}` coordinate points sampled from one
mousedown → mousemove → mouseup sequence.

**Rationale**: Minimal, serialisable, and round-trips through JSON without loss. No binary encoding,
no image data, no external library. Fits the existing `structuredClone`-based in-memory storage.

**Alternatives considered**:

- SVG path strings: Rejected — hard to render back onto a `<canvas>` element and bulkier for many points.
- Base-64 PNG snapshot: Rejected — violates Principle II (no file storage), bulky, and lossy on re-render.
- Delta/diff protocol (send only new strokes): Rejected — spec assumption 8 explicitly says canvas state
  is replaced wholesale; server is authoritative.

---

### 2. Canvas Sync Endpoint

**Decision**: `PATCH /rooms/:code/canvas` — body `{ participantId, strokes }`. Called by the
drawer after each completed stroke (on `mouseup`) and immediately after a "Clear" action. Not polled
by guessers; guessers receive `strokes` in the normal `GET /rooms/:code` poll response.

**Rationale**: Decouples drawing activity from the polling cycle. Drawer writes frequently; guessers
read on the 2-second poll. Single-responsibility endpoint.

**Alternatives considered**:

- Embedding canvas in a generic room-update endpoint: Rejected — blurs responsibility and complicates Zod schemas.
- Polling the canvas separately: Rejected — the existing room poll already carries all room state; a separate canvas poll would be redundant.

---

### 3. Guess Submission Endpoint

**Decision**: `POST /rooms/:code/guesses` — body `{ participantId, text }`. Returns `{ guess }` where
`guess` contains the evaluated `correct` flag and updated score for the submitter. Immediate feedback
is delivered via the HTTP response, not deferred to the next poll.

**Rationale**: FR-010 requires the result to be "immediately visible to the guesser who submitted it".
Returning the evaluated guess in the response body satisfies this without a second round-trip.

**Alternatives considered**:

- Returning a "pending" status and waiting for the next poll: Rejected — violates FR-010 and SC-002.
- Combining guess submission with a canvas update: Rejected — unrelated operations, single-responsibility preferred.

---

### 4. "Correct Once Per Guesser" Enforcement

**Decision**: On `submitGuess()`, before awarding points, query `room.guesses` for an existing entry
where `participantId === submitterId && correct === true`. If found, record the new submission with
`correct: false` and award 0 points, regardless of whether the word matched.

**Rationale**: Server-side enforcement of FR-019. Simple linear scan of `guesses` — acceptable for
small local game sessions (Principle V, no speculative optimisation).

**Alternatives considered**:

- Tracking scored participants in a separate `Set<string>`: Slightly more efficient but adds a second field to `Room`. The `guesses` array already has the information; redundancy is unwarranted at this scale.

---

### 5. Score Storage

**Decision**: Add `scores: Record<string, number>` to `Room`, initialized with `{ [participantId]: 0 }`
for every participant when `startRoom()` runs. Updated in place when a correct guess is processed.
Included in `RoomSnapshot` on every response (not gated to drawer/guesser).

**Rationale**: Scores are public information — all players can see the leaderboard. No redaction needed.
`Record<string, number>` maps naturally to participant IDs already used throughout the model.

**Alternatives considered**:

- Storing scores on the `Participant` object: Rejected — `Participant` is a value object shared between
  `Room` and `RoomSnapshot`; mutating it for scoring conflates identity with game state.

---

### 6. Canvas Drawing (Frontend)

**Decision**: Use the browser's built-in `HTMLCanvasElement` and 2D rendering context (`CanvasRenderingContext2D`). No external canvas library. Events: `pointerdown`, `pointermove`, `pointerup` / `pointerleave` (pointer events unify mouse + stylus; touch support is best-effort per spec assumption 6).

**Rationale**: Built-in API, zero bundle cost. Satisfies Principle V (no new runtime dependencies).
`pointer` events are preferred over `mouse` events because they handle stylus and touch with the same code path.

**Alternatives considered**:

- `fabric.js` / `konva.js`: Rejected — external dependency, violates Principle V without explicit justification.
- SVG-based drawing: Rejected — harder to implement freehand smoothly; canvas is the standard approach.

---

### 7. Immediate Guess Feedback (Frontend)

**Decision**: After `api.submitGuess()` resolves, store the returned `Guess` object in local component state
(`useState`) and render it immediately, before the next poll. The next poll will also include it in the
`guesses` array from the server, at which point the local state is superseded by the poll snapshot.

**Rationale**: SC-002 requires the result to be visible "within one screen refresh of submission — not
deferred to the next poll". Local state allows immediate rendering without complicating the `RoomStore`.

**Alternatives considered**:

- Triggering an immediate extra poll after guess submission: Rejected — unnecessary network round-trip; the
  response body already contains the result.
- Updating the RoomStore with the returned guess directly: Possible but complex — the store's `room.guesses`
  would be a partial view. Keeping it as local component state is simpler (Principle V).

---

### 8. No New Runtime Dependencies

**Decision**: No new `npm` packages for this feature.

- Canvas drawing: built-in browser API
- Guess evaluation: string methods (`trim()`, `toLowerCase()`)
- Scoring: integer arithmetic

All dependencies already in use: React, React Router, Vitest, Zod, Express.
