# Research: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-10

## Decision 1: Canvas Drawing & Server Sync Mechanism

**Decision**: Drawer sends each completed stroke (on `mouseup`) to a new `POST /rooms/:code/stroke` endpoint as an array of `{x, y}` points. The server appends the stroke to `room.strokes`. Guessers receive the full stroke list via the existing `GET /rooms/:code` poll every 2 seconds and redraw the canvas from scratch on each update.

**Rationale**: WebSockets are explicitly out of scope (constitution + README). Polling every 2 seconds already exists for room state. Storing completed strokes (not live mousemove streams) keeps the payload size bounded and the server logic simple. A per-stroke POST on `mouseup` is the minimal REST approach — it fires at most once per drawn line, not on every pixel.

**Alternatives considered**:
- Streaming mousemove coordinates: excessive payload, requires WebSockets or SSE for real-time feel — out of scope.
- Embedding stroke data in the guess payload: conflates two separate concerns; drawer may never guess.
- Canvas bitmap snapshot (base64 image): extremely large payload, loses vector fidelity, hard to diff.

## Decision 2: Canvas Clear Sync

**Decision**: "Clear" triggers two actions: (1) call `POST /rooms/:code/clear` to reset `room.strokes` to `[]` on the server; (2) immediately call `ctx.clearRect` on the local canvas. On the next polling cycle guessers receive an empty strokes array and their canvases are cleared.

**Rationale**: One dedicated endpoint keeps the mutation semantic clear. The server is the source of truth; the local clear is purely optimistic for the drawer's immediate feedback.

**Alternatives considered**:
- Sending a special "clear" stroke marker: complicates the stroke list interpretation.
- Sending an empty strokes array via a PUT: fine but POST /clear is more expressive for a named action.

## Decision 3: Stroke Data Format

**Decision**: `Point = { x: number; y: number }`. A stroke is `Point[]`. `room.strokes` is `Point[][]`. Coordinates are raw canvas pixel offsets as recorded from `MouseEvent.offsetX / offsetY`.

**Rationale**: Simplest possible representation. `offsetX/offsetY` are available natively on mouse events without additional calculation. The canvas element has a fixed size so coordinate space is stable.

**Alternatives considered**:
- Normalised (0–1) coordinates: adds calculation complexity with no benefit given fixed canvas size.
- SVG path strings: human-readable but heavier to parse; no benefit over plain arrays.

## Decision 4: Guess Attribution

**Decision**: The guess `POST` body carries `{ playerName: string; guess: string }`. The server uses `playerName` to attribute the guess and update `room.scores[playerName]`.

**Rationale**: Consistent with existing pattern — all prior features use player name for identity (no session tokens). `participantId` is not used for the guess endpoint to stay aligned with the spec assumption.

**Alternatives considered**:
- Using `participantId` in the body: would require a server lookup; adds complexity without gain.
- Using a query param: REST convention favours body fields for POST mutations.

## Decision 5: Scores Storage

**Decision**: `room.scores` is `Record<string, number>` (player name → cumulative points). Initialised to `{}` on `startGame`. Each correct guess adds 100 to `scores[playerName]`; incorrect adds 0 (no change needed, but the key is created at first guess if absent).

**Rationale**: Flat map is the simplest in-memory structure. Summation is trivially derivable from the guesses array, but caching the running total in `scores` avoids repeated iteration on every GET.

**Alternatives considered**:
- Deriving scores from `guesses` on every GET: correct but O(n) per request as guess list grows.
- Storing scores on the `Participant` object: invasive change to an existing entity; name-keyed map is simpler.

## Decision 6: Zod Schemas for New Endpoints

**Decision**: Add `guessSchema` (`{ playerName: z.string().trim().min(1), guess: z.string() }`) and `strokeSchema` (`{ points: z.array(z.object({ x: z.number(), y: z.number() })).min(1) }`) to `backend/src/api/schemas.ts`. Empty-guess rejection (FR-006) is enforced in the service layer after trimming (Zod trims `playerName` but `guess` is validated post-trim in service to return the exact 400 semantics described in the spec).

**Rationale**: Keeps validation co-located with existing patterns. Trimming `guess` in the service rather than the schema means the Zod schema accepts any string (including whitespace-only) and the service performs the business-logic rejection — consistent with how the spec describes the flow.

**Alternatives considered**:
- Rejecting whitespace in Zod `.min(1)` after `.trim()`: would work but Zod validation error vs. explicit HttpError 400 gives a different error message format — explicit service check is clearer.

## Decision 7: Frontend Canvas Component

**Decision**: Extract a `DrawingCanvas` React component in `frontend/src/components/DrawingCanvas.tsx`. It owns the `<canvas>` ref, mouse event handlers, and exposes `onStrokeComplete(points: Point[])` and `onClear()` callbacks. `GamePage` passes these callbacks. For guessers, the same component receives a `strokes` prop and redraws on change (no mouse events attached).

**Rationale**: Keeps `GamePage` clean. A dedicated component makes the canvas concern testable and reusable. The prop-driven redraw pattern means the component is pure w.r.t. external stroke data.

**Alternatives considered**:
- Inline canvas logic in `GamePage`: works but bloats the page component.
- Separate `DrawerCanvas` / `GuesserCanvas` components: unnecessary duplication; the same element handles both roles via props.

## Decision 8: Polling in GamePage

**Decision**: `GamePage` sets up a `setInterval` polling `store.pollRoom()` every 2000 ms via `useEffect`, mirroring the pattern that will exist in `LobbyPage`. The interval is cleared in the cleanup function. After each poll, if `room.strokes` has changed (compared by length as a cheap proxy), the guesser canvas is redrawn.

**Rationale**: Consistent with the existing `pollRoom()` method already on `RoomStore`. Avoids adding another store-level abstraction.

**Alternatives considered**:
- Store-level polling: centralises polling but makes the store responsible for UI timing.
- `usePollRoom` custom hook: reasonable but adds a file for a one-off 3-line interval — inline is simpler here.
