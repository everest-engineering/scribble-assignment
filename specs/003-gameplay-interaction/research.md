# Research: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Date**: 2026-06-04

---

## Decision 1 — Where to add `POST /rooms/:code/strokes` and `POST /rooms/:code/guess`

**Decision**: Add both routes to the existing `createRoomsRouter()` in
`backend/src/api/rooms.ts`. No new router file is needed.

**Rationale**: All room-scoped endpoints already live in this file. Adding two more routes
here keeps the surface minimal and consistent with the brownfield approach. Both routes
share the same `roomCodeParamsSchema` param validation already imported there.

**Alternatives considered**:
- Separate `gameRouter` in a new file — rejected: over-engineering for two endpoints;
  no evidence the router needs splitting yet.

---

## Decision 2 — Stroke discriminated union type

**Decision**: `Stroke` is a TypeScript discriminated union on `type`:
- `{ type: "draw"; x0: number; y0: number; x1: number; y1: number; color: string; lineWidth: number }`
- `{ type: "clear" }`

Zod schema mirrors this with `z.discriminatedUnion("type", [...])`.

**Rationale**: Discriminated unions are the idiomatic TypeScript pattern for heterogeneous
tagged data. `z.discriminatedUnion` gives precise validation and exhaustive type checking
at no extra cost. The two variants are well-defined in the spec assumptions.

**Alternatives considered**:
- Single flat schema with optional coordinate fields — rejected: allows invalid shapes
  (e.g., `"draw"` without coordinates) to pass validation silently.

---

## Decision 3 — Participant `score` field placement

**Decision**: Add `score: number` to the `Participant` interface in
`backend/src/models/game.ts`, initialised to `0` in both `createParticipant()` helper
(used by `createRoom`) and `joinRoom()`.

**Rationale**: Score is a per-participant property that must persist across polls; it
belongs directly on `Participant` rather than a separate map. `createParticipant` is
the single place where participants are created — adding `score: 0` there covers both
`createRoom` and `joinRoom` paths with a single change.

**Alternatives considered**:
- Separate `scores: Map<string, number>` on `Room` — rejected: adds indirection; breaks
  the existing pattern of all participant data living on the `Participant` object.

---

## Decision 4 — `GuessRecord` storage and correct-guess cap enforcement

**Decision**: `Room` gains `guesses: GuessRecord[]`. The cap (one correct guess per player)
is enforced in the `POST /rooms/:code/guess` handler by checking whether
`room.guesses.some(g => g.participantId === participantId && g.correct)` before accepting
a guess. `GuessRecord` stores `participantId` internally for this lookup but the snapshot
exposes only `participantName`, `text`, `correct` (no id leakage).

**Rationale**: Reuses the `guesses` array (already required for FR-010/011) as the
source of truth for the cap check — no extra field needed on `Room`.

**Alternatives considered**:
- Separate `correctGuessers: Set<string>` on `Room` — rejected: redundant state that
  must be kept in sync with `guesses`; violates single source of truth.

---

## Decision 5 — Frontend canvas implementation

**Decision**: Use the native `HTMLCanvasElement` API via `useRef<HTMLCanvasElement>`.
On mount and on every `room.strokes` change (via `useEffect` keyed on `room.strokes`),
clear the canvas with `ctx.clearRect` and replay all strokes. Mouse events (`mousedown`,
`mousemove`, `mouseup`) are wired for the drawer only; non-drawers get
`style={{ pointerEvents: "none" }}` on the canvas element.

**Rationale**: No canvas library is introduced (no new dependencies). `useRef` +
`useEffect` is the standard React pattern for imperative canvas operations. `pointerEvents: none`
is the simplest CSS read-only guard for non-drawers (FR-003a).

**Alternatives considered**:
- `fabric.js` or `konva` — rejected: new npm dependency, violates constitution.
- `onMouseMove` streaming — rejected: spec requires mouse-up submission (Q3 clarification).

---

## Decision 6 — `GuessForm` component activation

**Decision**: `GuessForm` is already a placeholder component rendered in `GamePage`.
This scenario wires it up: add `onSubmit` prop accepting `(guess: string) => void`,
implement the controlled input + submit inside `GuessForm`, and render it conditionally
in `GamePage` only when `!isDrawer`.

**Rationale**: The component already exists; extending its props is a minimal brownfield
change. The `isDrawer` flag computed in Scenario 2 is already available in `GamePage`.

**Alternatives considered**:
- Inline guess form directly in `GamePage` — rejected: the `GuessForm` placeholder
  exists for exactly this purpose; using it is consistent with the starter's intent.
