# Research: Gameplay Interaction

**Feature**: 003-gameplay-interaction | **Date**: 2026-05-30

## 1. Canvas stroke representation

**Decision**: Store an ordered `strokes: Stroke[]` array on the internal `Room`. Each `Stroke`
has a stable `id`, `points: { x: number; y: number }[]` in canvas pixel coordinates, and fixed
`color` / `width` defaults for the lab. The drawer appends one stroke per completed pointer
path via `POST /rooms/:code/strokes`; clearing resets the array via
`POST /rooms/:code/canvas/clear`.

**Rationale**: A stroke list is easy to serialize in JSON, replay on an HTML5 canvas, and
include in the existing poll snapshot without new storage. Incremental append matches
draw-on-mouseup UX and keeps payloads small compared to full bitmap sync.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Base64 PNG in snapshot | Large payloads on every poll; harder to clear incrementally |
| Replace full canvas on every poll | Drawer would overwrite local in-progress stroke |
| WebSocket stroke stream | Forbidden by constitution |
| Client-only canvas (no sync) | Guessers cannot watch drawing; violates spec US1 |

## 2. Canvas rendering (frontend)

**Decision**: Implement `DrawingCanvas` with a native HTML5 `<canvas>` element. Drawer captures
pointer events, renders locally for immediate feedback, and POSTs completed strokes. Guessers
and the drawer re-render from `room.strokes` on each poll update. Use a fixed canvas size
(e.g., 800×500) shared between clients so coordinates align.

**Rationale**: Starter has no canvas library; native canvas avoids new dependencies (constitution
out-of-scope rule). Fixed dimensions keep stroke coordinates deterministic across tabs.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| SVG paths | Works but starter uses canvas placeholder; HTML5 canvas is sufficient |
| Fabric.js / Konva | New top-level dependency; unjustified for lab scope |
| CSS-only drawing | Cannot replay server stroke list cleanly |

## 3. Guess submission and validation

**Decision**: Add `POST /rooms/:code/guesses` with `{ participantId, guessText }`. Server trims
text, rejects empty with `400`, rejects drawer role with `403`, appends a `Guess` record to
room history, and evaluates case-insensitive match against `secretWord`. Scoring runs in the
same transaction: +100 only if match and participant not yet in `scoredParticipantIds` set.

**Rationale**: Single POST endpoint mirrors create/join/start patterns. Server-side validation
enforces FR-008–FR-014; client shows errors before fetch for empty guesses (UX parity with
name validation).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| PATCH room with guess array | No clear action semantics; harder to validate role |
| Client-side scoring only | Guessers could manipulate scores; fails determinism |
| Separate score endpoint | Extra surface; scoring is intrinsic to guess acceptance |

## 4. Score and guess exposure in snapshots

**Decision**: Extend internal `Participant` with `score: number` (init `0` in `startRoom`).
Add `guesses: Guess[]` and `strokes: Stroke[]` on `Room`. Include `score` on each
`ParticipantSnapshot`, plus top-level `guesses` and `strokes` on `RoomSnapshot` visible to
all participants when `status === "playing"`.

**Rationale**: One poll response syncs canvas, history, and scoreboard (FR-005, FR-017, FR-018).
Guess text in history is intentionally visible to all (including drawer) — only the secret word
remains viewer-filtered.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Separate GET /guesses | Extra poll surface; violates minimal-diff brownfield approach |
| Hide guess text from drawer | Spec requires shared history for all participants |
| Score only on separate endpoint | Scoreboard would desync from history between polls |

## 5. Drawer-only mutations

**Decision**: `addStroke` and `clearCanvas` service functions verify
`participantId === room.drawerParticipantId` and `status === "playing"`. Guess submission
verifies participant is not the drawer. Return `403` with clear messages on role violations.

**Rationale**: FR-002, FR-003, FR-008 require server enforcement; UI hiding alone is bypassable
via direct API calls.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Frontend-only drawer guard | API would accept guesser strokes |
| Shared secret for drawer actions | Introduces pseudo-auth; out of scope |

## 6. Game-screen polling (unchanged cadence)

**Decision**: Reuse existing `GamePage` 2s `fetchRoomSilent` interval from Scenario 2. Extended
snapshot fields (`strokes`, `guesses`, `participants[].score`) flow through `roomStore` without
new polling infrastructure.

**Rationale**: FR-020 explicitly continues Scenario 2 polling. Adding fields to GET response
is sufficient for canvas and history sync.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Faster poll for canvas only | Inconsistent cadence; unnecessary complexity |
| Optimistic guess history without poll | Other clients would miss guesses until manual refresh |

## 7. First-correct scoring cap

**Decision**: Maintain `scoredParticipantIds: Set<string>` (or equivalent array) on `Room`.
Award +100 only when guess matches and participant id is not yet in the set; then add id to set.

**Rationale**: Spec FR-014 and US4 scenario 4 — repeat correct guesses do not stack.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Cap score at 100 globally | Wrong participant could block others |
| Allow unlimited +100 per correct submission | Violates spec acceptance scenario 4 |
