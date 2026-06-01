# Research: Gameplay Interaction

## Canvas Drawing

**Decision**: Native HTML5 Canvas element with mouse/touch event handling

**Rationale**: The existing codebase has no canvas dependency. Using the native `<canvas>` API avoids adding external drawing libraries. Stroke data is serialized as an array of discrete strokes, each being an array of {x, y} points plus color and width metadata. This is transmitted via HTTP POST/Polling.

**Alternatives considered**: SVG (too heavy for real-time), Canvas library like Fabric.js (unjustified dependency), offscreen canvas (overkill for this scope).

## Stroke Serialization Format

**Decision**: JSON array of stroke objects

- `{x: number, y: number}` point arrays, relative to canvas dimensions
- Stroke metadata: `{points: Point[], color: string, width: number}`
- Full canvas state stored as `DrawingStroke[]` on the Room object
- Serialized size capped at ~1MB

**Rationale**: Simple, human-readable, directly usable by `<canvas>` 2D context API. Color stored as hex string, width as integer pixel value.

## Polling Strategy

**Decision**: Extend existing 2-second polling to include canvas state and guess history

**Rationale**: The existing `RoomSnapshot` pattern already handles role-aware filtering. We extend it to include `strokes`, `guesses`, and `scores` fields. No new polling mechanism needed.

## Guess Validation

**Decision**: Server-side case-insensitive comparison with Zod validation

- Trim and normalize whitespace
- Case-insensitive exact match to `secretWord`
- Reject empty/whitespace-only, >200 chars
- Reject guesses from the drawer
- Reject guesses after round ends
- Once a guesser is correct, ignore subsequent guesses from that player

**Rationale**: Deterministic, stateless validation. No fuzzy matching or Levenshtein distance needed — Pictionary rules are exact word match.

## Scoring

**Decision**: 1 point per correct guess, awarded deterministically

- Fixed at exactly 1 point, no variation
- Each correct guesser gets 1 point regardless of order or attempt count
- Scores stored as `Map<string, number>` on the Room (participantId → score)

**Rationale**: Simple, deterministic, matches spec requirement. No bonus system, no speed scoring, no partial credit.

## Round End Detection

**Decision**: Check after each correct guess — if all guessers (all participants except drawer) have a correct guess, transition to "round_ended" status. Also allow drawer to manually end via "reveal" endpoint.

- Room status transitions: `"lobby" → "playing" → "round_ended"`
- On `"round_ended"`, no new guesses or strokes accepted
- The final state (drawing, guesses, scores) is still readable via polling

## Architecture Impact

- All gameplay state (strokes, guesses, scores) lives on the Room object in memory
- Existing `toRoomSnapshot()` role-aware projection must be extended
- Existing polling in `GamePage` leverages new snapshot fields
- No new services or infrastructure needed
