# Research: Gameplay Interaction (003)

## Decision 1: Guess Submission Endpoint

**Decision**: `POST /rooms/:code/guess` with body `{ participantId, text }`, returning
`{ room: RoomSnapshot }`.

**Rationale**: Follows the exact pattern of the existing `POST /rooms/:code/start` endpoint —
same route structure, same body shape (uses `participantId` to identify the actor), same
response envelope. No new conventions needed.

**Alternatives considered**: `PATCH /rooms/:code` (rejected — verb semantics wrong, too broad),
`POST /rooms/:code/guesses` (acceptable plural form but adds no clarity over `/guess`).

---

## Decision 2: Guess Validation and Comparison

**Decision**: Use Zod schema `z.object({ participantId: z.string().uuid(), text: z.string() })`
at the route level. Business validation (trim, non-empty, drawer guard, active-status guard)
lives in `submitGuess()` in `roomStore.ts`, throwing `HttpError` with appropriate status codes.

**Rationale**: Zod validates shape/types at the boundary; `HttpError` handles domain rules —
the same split used throughout the codebase. Trimming and lowercasing in pure service logic
keeps routes thin and the business rule testable in isolation.

**Alternatives considered**: Trimming in the Zod schema with `.trim().min(1)` (works but moves
business logic into the schema layer; inconsistent with how `startRoom` guards are structured).

---

## Decision 3: Guess Comparison Algorithm

**Decision**: `trimmedText.toLowerCase() === room.secretWord.toLowerCase()` — pure string
equality after both sides are lowercased. No fuzzy matching, no stemming.

**Rationale**: Spec FR-004 is explicit: trim + case-insensitive equality. Deterministic,
testable with hard-coded assertions. Consistent with Principle VI of the constitution.

**Alternatives considered**: Levenshtein distance / fuzzy matching (rejected — not in spec,
adds non-determinism in edge cases, violates constitution Principle VI).

---

## Decision 4: Score Storage Shape

**Decision**: `scores: Record<string, number>` — a plain object keyed by participant ID,
initialized to `0` for every participant at game start. Stored on `Room`, cloned and exposed
on `RoomSnapshot`.

**Rationale**: Matches the existing pattern of `drawerId: string` and `secretWord: string`
on `Room` — simple scalar/object fields, no sub-classes. `Record<string, number>` mirrors
the TypeScript-idiomatic way the rest of the type model is expressed.

**Alternatives considered**: `Array<{ participantId: string; score: number }>` (more verbose
for lookup; `Record` is O(1) keyed access and simpler to clone).

---

## Decision 5: Guess History Storage Shape

**Decision**: `guesses: Guess[]` — an ordered array of `Guess` objects appended in submission
order. `Guess` interface: `{ participantId: string; participantName: string; text: string;
correct: boolean; index: number }`. `participantName` is denormalized at submission time.

**Rationale**: Denormalizing `participantName` means the history is self-contained — no
secondary lookup needed to render it. `index` is the submission-order position. Consistent
with how `participants` are stored on `Room` (flat array of plain objects, structuredClone-safe).

**Alternatives considered**: Storing only `participantId` and looking up the name from
`participants` array at render time (works but adds join logic in the frontend; denormalization
is simpler for a read-heavy display).

---

## Decision 6: Secret Word Exposure When Game Is Ended

**Decision**: When `room.status === "ended"`, `toRoomSnapshot` includes `secretWord` for
all viewers (drawer and guessers alike). `wordPlaceholder` is omitted. `availableWords` is
empty (`[]`).

**Rationale**: After a correct guess ends the round, there is no reason to hide the word —
every participant can see who guessed correctly. Revealing the word in the "ended" snapshot
makes the "round ended" banner (FR-008) more informative without requiring a separate endpoint.
Spec FR-003 / FR-004 restrict visibility to *active* games; "ended" is silent on visibility,
so this is a natural and safe extension.

**Alternatives considered**: Keep word hidden even when ended, wait for Scenario 4 to reveal
(overly conservative; produces a confusing banner with no word shown).

---

## Decision 7: Canvas Implementation

**Decision**: A new `DrawingCanvas` React component backed by a `<canvas>` element and a
React `useRef`. Handles `pointerdown`/`pointermove`/`pointerup` events for cross-device
freehand drawing. Clear button calls `context.clearRect(0, 0, width, height)`. No state
leaves the component — no server calls, no store writes.

**Rationale**: `PointerEvent` API unifies mouse, touch, and stylus with a single handler set.
`useRef` for the canvas element avoids unnecessary re-renders on every stroke. The component
is a pure UI widget — no business logic, nothing to test beyond visual inspection.

**Alternatives considered**: SVG path drawing (more declarative but heavier for freehand
strokes), third-party canvas library (rejected — constitution prohibits new libraries without
justified spec requirement).

---

## Decision 8: `submitGuess` Room Store Function Signature

**Decision**:
```typescript
export function submitGuess(
  code: string,
  participantId: string,
  text: string
): Room
```
Throws `HttpError` for: 404 (room not found), 403 (drawer submitting), 409 (room not active),
400 (empty guess after trim). Returns cloned room with updated guesses/scores/status.

**Rationale**: Mirrors `startRoom(code, participantId)` exactly — same argument order, same
error taxonomy, same return type. Routes call it, tests call it — no new patterns to learn.

---

## Decision 9: Participant Validation in submitGuess

**Decision**: Verify `room.participants.some(p => p.id === participantId)` before processing.
If the participantId is not in the room, throw `HttpError(403, "Participant not in room")`.

**Rationale**: Prevents a rogue caller from injecting guesses with a valid UUID that doesn't
belong to this room. The drawer guard alone is insufficient — an unknown participant should
not be able to affect room state.

**Alternatives considered**: Skip validation and trust the client (rejected — constitution
Principle V requires validation at system boundaries).
