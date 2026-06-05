# Phase 0 Research: Gameplay Interaction

Technical decisions for Group 3. NEEDS CLARIFICATION items were resolved during `/speckit-clarify`
(Session 2026-06-05) and are restated here as decisions.

## Decision 1 — Stroke model & submission

- **Decision**: A `Stroke` is `{ points: Array<{ x: number; y: number }> }`. The drawer submits one
  completed stroke per `POST /rooms/:code/strokes`. The room holds an append-only `round.strokes`, and
  the snapshot returns `strokes` for all viewers; every client redraws the canvas from that list.
- **Rationale**: Simple, deterministic, and polling-friendly — one request per completed stroke avoids
  per-point chatter under ~2s polling. Re-rendering from the authoritative list keeps tabs consistent.
- **Alternatives considered**:
  - *Per-segment events*: far more requests; unnecessary at this scale.
  - *Single image blob (data URL)*: large payloads, lossy merge, harder to test.

## Decision 2 — Round-ended representation

- **Decision**: Add `round.ended: boolean` (default `false`, set `true` on the first correct guess).
  `Room.status` stays `"started"` for the whole game-screen visit; Group 4 handles the lobby return on
  restart.
- **Rationale**: Minimal, additive change; keeps `Room.status` semantics stable for Groups 1–2 and gives
  Group 4 a clean signal for the result/restart UI without widening the status enum yet.
- **Alternatives considered**:
  - *Widen `RoomStatus` with `"ended"`*: ripples into existing status switches and Group 1/2 tests.
  - *Separate `round.phase` enum*: more states than this single-round lab needs.

## Decision 3 — Clear-canvas endpoint

- **Decision**: `POST /rooms/:code/canvas/clear` with `{ participantId }`; drawer-only; sets
  `round.strokes = []` when `round.ended` is false.
- **Rationale**: Consistent with the existing `start`/`guess` POST-with-body pattern; easy to validate and
  test; idempotent on an already-empty canvas.
- **Alternatives considered**:
  - *`DELETE /strokes`*: RESTful but inconsistent with the rest of the room API.
  - *`POST /strokes { clear: true }`*: overloads one schema with two operations.

## Decision 4 — Guess evaluation & scoring (pure functions)

- **Decision**: `normalizeGuess(text) = text.trim().toLowerCase()`; `isCorrectGuess(guess, secret)` compares
  normalized values; scoring is fixed (`CORRECT_SCORE = 100`, `INCORRECT_SCORE = 0`). All in
  `backend/src/services/gameRules.ts`, unit-tested independent of HTTP/React.
- **Rationale**: Constitution III — deterministic, reproducible, testable core rules. Trimming +
  case-insensitive matching mirror the name-validation discipline from Group 2.
- **Alternatives considered**:
  - *Inline comparison in the route handler*: not unit-testable in isolation; violates III.
  - *Fuzzy/partial matching*: out of scope; exact normalized match only.

## Decision 5 — Round end on first correct guess

- **Decision**: The first correct guess sets `round.ended = true`; subsequent guesses and draw/clear
  actions are rejected (409 conflict). One round only.
- **Rationale**: Matches the brief's single-round lab; deterministic and simple to verify.
- **Alternatives considered**:
  - *Keep accepting guesses after first correct*: contradicts "round ends"; no rotation/second word.

## Decision 6 — Canvas technology

- **Decision**: Native HTML `<canvas>` 2D context in a new `DrawingCanvas` component; no drawing library.
- **Rationale**: Constitution I/V — no new dependencies; the canvas only needs freehand strokes and a
  redraw-from-list, which the 2D context handles directly.
- **Alternatives considered**:
  - *A drawing library (e.g., fabric/konva)*: forbidden new dependency, overkill.

## Open items deferred to implementation (low impact)

- Guess payload field name fixed as `guess` (decided here for the contract).
- Exact canvas pixel dimensions and pointer-event handling are implementation details; raw `{x,y}` stored.
- Max stroke point count is a validation guard (e.g., 2000) — tunable without contract change.
