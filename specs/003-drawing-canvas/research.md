# Research: Drawing Canvas and Guess Scoring

## Decision 1: Store canvas activity as append-only round state
- Decision: Represent drawing as a small append-only event list on the active
  round, plus a clear event that resets the canvas history.
- Rationale: Event-style state is simple to serialize in HTTP snapshots, easy
  to poll, and avoids introducing binary payloads or external storage.
- Alternatives considered: A rasterized image buffer, a persisted canvas file,
  or a push-based drawing stream. Those options were rejected because they add
  complexity, violate the in-memory constraint, or conflict with the HTTP-only
  rule.

## Decision 2: Normalize guesses at the backend boundary
- Decision: Trim submitted guesses before evaluation and compare them
  case-insensitively against the active secret word.
- Rationale: The spec requires blank guess rejection and case-insensitive
  matching, so normalization belongs at the API boundary where all clients pass
  through the same validation rule.
- Alternatives considered: Client-only normalization and exact string matching.
  Those were rejected because they would let different clients behave
  inconsistently.

## Decision 3: Keep guess history and scores in the room round state
- Decision: Store guess history and per-player round scores on the active round
  so each poll returns one consistent snapshot.
- Rationale: The feature requires all players to see the same history and score
  state through polling, and the room snapshot already acts as the source of
  truth.
- Alternatives considered: Maintaining client-side guess history only or a
  separate cache service. Those were rejected because they would drift across
  viewers or add forbidden persistence.

## Decision 4: Preserve HTTP polling for synchronization
- Decision: Reuse the existing polling pattern for lobby and room refreshes so
  canvas updates, guesses, and scores propagate through repeated GET requests.
- Rationale: The constitution forbids WebSockets and the current app already
  uses polling for freshness.
- Alternatives considered: WebSocket or server-sent event updates. Those were
  rejected because they violate the repo rules.

## Decision 5: Hide guess controls for the drawer in the UI
- Decision: Make the guess form conditional on the viewer not being the active
  drawer.
- Rationale: The spec explicitly requires the drawer to have the guess field
  hidden, and the UI already derives role from the room snapshot.
- Alternatives considered: Leaving the form visible but disabled. That was
  rejected because the requirement is to hide the field, not just block input.
