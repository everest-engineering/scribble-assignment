# Research: Gameplay Interaction

## Canvas Interaction Strategy

**Decision**: Use an HTML5 `<canvas>` element with mouse/pointer event listeners for drawing.
The drawer's canvas state is local (not synced to guessers in this feature). Clearing the canvas
calls `ctx.clearRect(0, 0, canvas.width, canvas.height)`.

**Rationale**: The spec requires the canvas to be visible and interactive for the drawer. An
HTML5 canvas is the standard browser primitive for freehand drawing — no external libraries
needed, keeping the bundle under the 150 KB constitution gate. Canvas sync to guessers is
explicitly out of scope for this feature.

**Alternatives considered**:
- SVG-based drawing: More accessible for static shapes but complex for freehand; heavier DOM.
- Third-party canvas library (e.g., Fabric.js): Adds bundle weight; overkill for a local-only
  canvas.
- WebSocket-based real-time sync: Prohibited by the constitution's "No WebSockets" constraint.

## Guess Submission & Scoring Strategy

**Decision**: Add a `POST /api/rooms/:code/guess` endpoint that accepts `participantId` and
`text`, trims the text, rejects empty strings, compares case-insensitively against `secretWord`,
awards 100 points for a correct guess (0 for incorrect), and appends the guess to a per-room
guess log.

**Rationale**: The guess must be validated server-side (per constitution Principle V). The server
holds `secretWord` and is the authority on correctness. Client-side comparison is prohibited
because the word must never be sent to guessers.

**Alternatives considered**:
- Client-side comparison: Security violation — guessers don't receive `secretWord`, so comparison
  must be server-side.
- Batch endpoint (guess + score in one response vs. separate score endpoint): Single endpoint
  returning the updated guess record and updated room snapshot is simpler.

## Score Storage Strategy

**Decision**: Add a `scores: Record<string, number>` map to the `Room` model (keyed by
`participantId`). Scores start at 0 for all participants when the game starts and increment by
100 on each correct guess.

**Rationale**: Scores live alongside the room in the in-memory store, consistent with the
"no DB, in-memory Map" constraint. All scores are initialized to 0 at `startGame()` time so
the scoreboard can render from the first poll. `RoomSnapshot` already includes `participants`;
a separate `scores` map on the snapshot lets the frontend render the scoreboard without extra
API calls.

**Alternatives considered**:
- Scores on `Participant`: Would require mutating the participants array on every guess — noisier
  diff.
- Separate score endpoint: Extra API call for the same data; no benefit.

## Guess History Storage & Sync Strategy

**Decision**: Add a `guesses: Guess[]` array to the `Room` model. Each `Guess` has
`participantId`, `text` (trimmed), `isCorrect`, and `submittedAt`. The existing
`GET /api/rooms/:code?participantId=<id>` polling endpoint returns `guesses` in the snapshot,
so all players receive the full guess history on every poll (≤ 3-second interval).

**Rationale**: Reusing the existing room-state polling endpoint avoids adding new infrastructure.
The spec requires guess history to be "synced to all players via polling" — appending guesses
to the room and including them in the snapshot satisfies this exactly.

**Alternatives considered**:
- Separate `GET /api/rooms/:code/guesses` endpoint: Extra network round-trip; frontend already
  polls the room snapshot.
- WebSocket push: Prohibited by the constitution.

## Empty/Whitespace Guess Rejection Strategy

**Decision**: Reject the guess at the API layer using a Zod schema:
`z.string().trim().min(1, "Guess cannot be empty.")`. The trimmed value is used for both
validation and comparison.

**Rationale**: Consistent with the existing `playerName` validation pattern (already uses
`.trim().min(1)`). Server-side rejection means the client never has to implement the same logic.
Client-side pre-validation is acceptable as a UX nicety but is not the enforcement point.

**Alternatives considered**:
- Client-only rejection: Bypassable; not safe per Principle V.
- Regex-based whitespace check: Redundant given `.trim().min(1)`.
