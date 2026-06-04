# Research

## 1. Room snapshot as the single sync source

- Decision: Keep one authoritative room snapshot per room and extend it with drawing state, guess history, and participant scores.
- Rationale: The repo already uses polling to read room snapshots. One expanded snapshot keeps the client simple and avoids endpoint fan-out.
- Alternatives considered: Separate endpoints for drawing, guesses, and scores. Rejected because it adds client coordination work without improving correctness.

## 2. Stroke-based drawing persistence

- Decision: Store drawing as an ordered list of strokes, where each stroke is a list of `{x, y}` points plus optional style metadata.
- Rationale: This matches the current spec, is easy to serialize in memory, and is stable under polling. Clearing the canvas becomes a simple reset to an empty array.
- Alternatives considered: Image snapshots or a hybrid stroke-image model. Rejected because it would complicate syncing and make incremental drawing harder to reason about.

## 3. Guess history semantics

- Decision: Record only server-accepted guesses in the shared guess history feed. Rejected, duplicate, drawer, and empty submissions are not appended.
- Rationale: The spec defines the feed as a shared log of valid attempts. This keeps the history aligned with actual game state and avoids noisy rejected-input entries.
- Alternatives considered: Logging every submitted attempt, including invalid ones. Rejected because it blurs the game feed and makes acceptance behavior harder to test.

## 4. Score and duplicate-guess tracking

- Decision: Keep participant score on the participant record and mark whether a participant has already guessed correctly in room state.
- Rationale: This makes scoring and duplicate-guess rejection deterministic and cheap to check during request handling.
- Alternatives considered: Separate score tables or a dedicated guess-tracking collection. Rejected because the game is in-memory and room-local, so extra indirection is unnecessary.

## 5. Frontend polling behavior

- Decision: Reuse the existing room store polling loop as the main refresh mechanism for both lobby and active game views.
- Rationale: The project already standardizes on HTTP polling. Extending the same flow to include the new game state avoids new transport or shared-state machinery.
- Alternatives considered: Push updates or a separate game polling channel. Rejected by constitution and by the current architecture.
