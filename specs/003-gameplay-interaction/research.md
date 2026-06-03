# Phase 0 Research: Gameplay Interaction

**Feature**: 003-gameplay-interaction
**Date**: 2026-06-02

The spec arrived with two clarifications already integrated (capped scoring,
correct-guess text redaction) and a thorough assumptions list. Phase 0 locks
the implementation-pattern decisions the plan needs before contracts.

## Decision: Score placement

**Decision**: Add `score: number` to `Participant`. Initialize to 0 at
`createRoom` / `joinRoom`. Reset to 0 for every participant inside
`startRoom` (FR-010).

**Rationale**:
- This lab is single-round per room; there is no second round to inherit
  scores from. A per-participant field captures the round's score directly.
- The snapshot already serialises `participants` fully, so scores become
  visible to every viewer without any new endpoint.
- Resetting in `startRoom` aligns with the round lifecycle: scores are a
  property of the active round, even though they live on a longer-lived
  entity.

**Alternatives considered**:
- A `Map<participantId, number>` inside `Round` — would correctly scope
  scores to the round, but adds a join step on every snapshot read. The
  spec's "scores start at 0 at round start" rule is more naturally
  satisfied by resetting an existing field than by constructing a new map.
- A `scoreHistory: number[]` per participant — overkill at lab scale.

## Decision: First-correct cap mechanism

**Decision**: At `submitGuess` time, scan `room.guesses[]` for any prior
entry with the same `guesserParticipantId` AND `isCorrect === true`. If
none, and the new guess is correct, bump `Participant.score` by 100. If
any, leave the score alone. Always append the new entry to `room.guesses`
regardless.

**Rationale**:
- O(N) per submission with N ≤ a few dozen for a lab session — negligible.
- The cap rule is computed from the source of truth (`room.guesses`) rather
  than a separate "first-correct" flag, so there is no drift risk.
- Appending the new entry whether or not it bumps the score preserves the
  history's "show the timeline of play" property that the spec values.

**Alternatives considered**:
- Track `firstCorrectAt: string | null` on the `Participant` — adds a
  parallel state to keep in sync; not worth the cognitive cost.
- Reject duplicate correct submissions outright — would hide the timeline
  ("Bob kept playing after getting it right") that the spec explicitly
  retains.

## Decision: Submission order signal

**Decision**: Each `Guess` carries `submittedAt: string` (ISO 8601) AND
`order: number` (zero-based, assigned at append time from
`room.guesses.length` BEFORE the push). The snapshot returns guesses in
ascending `order`. Frontend sorts by `order`, not by timestamp.

**Rationale**:
- Timestamps can collide at millisecond resolution under concurrent
  submissions in Node's single event loop. `order` is monotonic by
  construction.
- Carrying both fields is cheap (one extra integer per entry) and gives the
  frontend the option to render either signal.

**Alternatives considered**:
- `order` only — loses human-readable submission time.
- `submittedAt` only — collisions at millisecond resolution would cause
  unstable ordering.

## Decision: Text redaction filter

**Decision**: Extend `toRoomSnapshot(room, viewerParticipantId)` to map
`room.guesses` → `SnapshotGuess[]`. For each entry:
- If `entry.isCorrect === false` → emit real `text` always.
- If `entry.isCorrect === true` → emit real `text` only when
  `viewerParticipantId === entry.guesserParticipantId` OR
  `viewerParticipantId === room.currentRound?.drawerParticipantId`;
  otherwise emit `text: null`.

The placeholder string the client renders (e.g., `"<correct guess>"`) is
chosen on the frontend; the server never emits a placeholder string, only
`null`. This guarantees the placeholder cannot encode the word's length.

**Rationale**:
- Mirrors the exact filter pattern Scenario 2 established for
  `currentRound.secretWord`. Reusing the same shape (real value vs `null`)
  keeps the contract's mental model uniform across endpoints.
- Centralising the filter in `toRoomSnapshot` means every endpoint that
  returns a snapshot (`POST /rooms`, `POST /:code/join`, `GET /:code`,
  `POST /:code/start`, `POST /:code/guess`) inherits the rule with no
  duplication.
- The drawer privilege is included so the drawer can see which guessers
  got it right and verify the comparison logic is correct from their
  perspective.

**Alternatives considered**:
- Server emits the placeholder string — couples server and client UX
  language; if the client wanted "🤫" instead of "<correct guess>", the
  server would have to change.
- Hide the entire entry from non-privileged viewers — loses the
  "Bob guessed correctly!" affordance that drives social pressure on other
  guessers.

## Decision: `POST /rooms/:code/guess` shape

**Decision**: `POST /rooms/:code/guess` with body
`{ participantId: string, text: string }`. Returns 200 +
`{ room: snapshotFor(participantId) }` on success.

**Rationale**:
- Body params (rather than a query string) match every other write
  endpoint in this codebase.
- Returning the full snapshot lets the submitter's UI reflect their score
  change and the new history entry immediately, without waiting for the
  next poll.

**Error matrix**:

| Condition | Status | `message` |
|---|---|---|
| Code empty / whitespace | 400 | `"Enter a room code"` (existing rule) |
| Code not found | 404 | `"Room not found"` |
| Body fails Zod | 400 | The Zod issue message; falls back to `"Invalid request payload"` |
| Text empty after trim | 400 | `"Enter a guess"` (from Zod refine) |
| Room not `playing` | 409 | `"Round has not started"` |
| Participant is the drawer | 403 | `"Only guessers can submit guesses"` |
| Anything else | 500 | `"Unexpected server error"` |

**Error precedence**:

The server resolves error precedence in this order so the most actionable
error surfaces first:

1. Code params (400 for empty)
2. Body Zod (400 for empty text / missing participantId)
3. Room existence (404)
4. Room status (409 if `lobby`)
5. Drawer rule (403 if participantId is the drawer)
6. Service result (200 success or 500)

**Alternatives considered**:
- 409 for "drawer attempting to guess" — semantically conflates "wrong
  participant" with "wrong room state". 403 is the right HTTP signal for
  "you are authenticated as someone who is not authorised to do this".

## Decision: Drawer-locality of canvas

**Decision**: The canvas is a purely client-side React component
(`CanvasBoard`) rendered only when `isDrawer === true`. No state leaves
the component; no network requests are made.

**Rationale**:
- The spec's FR-013 + SC-007 explicitly forbid synchronisation. Keeping
  the implementation entirely client-local makes that property tautological:
  no synchronisation channel exists.
- The lab's no-WS, no-DB constraint already forbids the obvious sync
  alternatives. Local-only is the only viable shape.

**Alternatives considered**:
- Server stores the drawing as a serialised stroke list, syncs via polling
  — violates SC-007 (other viewers would receive the data even if they
  chose not to render it), and adds large polling payloads at lab scale.
- Cancellation: render the canvas to non-drawers as an empty placeholder
  with no interactivity — what the plan does today via the `isDrawer`
  conditional render.

## Decision: Canvas implementation

**Decision**: `<canvas>` element with a 2D rendering context.
`onMouseDown` begins a new stroke (saves current x/y, calls `beginPath`).
`onMouseMove` while down calls `lineTo` then `stroke`. `onMouseUp` ends the
stroke. Clear calls `ctx.clearRect(0, 0, width, height)` and resets the
internal strokes list.

**Rationale**:
- Native browser API, no library needed (Constitution Principle II).
- Trivial to test: the Vitest+jsdom test asserts the strokes-state data
  structure becomes empty after Clear; it does not need to inspect pixels.

**Alternatives considered**:
- React DOM-element-per-stroke (SVG `<path>`) — slower for many small
  strokes; more rerender pressure on React.
- A drawing library (Fabric, Konva, react-canvas-draw) — would require
  adding a top-level dep; forbidden by Constitution Principle II.

## Decision: Round-end deferral

**Decision**: This scenario does NOT define a round-end trigger. The room
stays in `"playing"` indefinitely. Scenario 4 is expected to own this and
will read `Room.guesses[]` to render the result screen.

**Rationale**:
- Consistent with Constitution Principle II ("Brownfield Discipline") and
  with the README's allocation of "Result, Restart" to Scenario 4.
- The two clarifications (cap + redact) keep gameplay sensible even with
  an open-ended round.

**Alternatives considered**:
- End round on first correct guess (in this scenario) — overlaps with
  Scenario 4's scope and would force Scenario 4 to either repeat the
  trigger logic or remove it.

## Open questions

None. All Phase 0 unknowns are resolved. Ready for Phase 1.
