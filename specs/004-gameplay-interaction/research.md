# Research: Phase 3 Gameplay Interaction

## Decisions

### 1. Keep drawing state local to the drawer session

- Decision: Use a browser-local canvas for drawing and clearing.
- Rationale: Phase 3 explicitly excludes live stroke broadcast and persistence, so
  backend-owned drawing state would add complexity without changing shared gameplay.
- Alternatives considered:
  - Persist strokes on `Room`
  - Maintain a separate in-memory drawing store
  - Broadcast strokes through polling

### 2. Add one explicit guess-submission endpoint

- Decision: Introduce `POST /rooms/:code/guesses` as the only Phase 3 gameplay write
  endpoint after room start.
- Rationale: A dedicated endpoint gives one clear place for trimmed validation,
  guesser-only enforcement, correctness checks, and room-status transition logic.
- Alternatives considered:
  - Encode guesses into `GET /rooms/:code`
  - Add a generic mutate-room endpoint
  - Simulate guesses only on the client

### 3. Keep shared round state on the existing `Room`

- Decision: Store `guessHistory`, `scores`, `winnerId`, and `endedAt` directly on
  `Room`.
- Rationale: The current room store is already the authoritative source for round
  lifecycle and viewer-specific snapshots, and Phase 3 still manages only one round.
- Alternatives considered:
  - Separate score map keyed by room code
  - Separate guess-history store
  - Frontend-derived score state

### 4. Reuse the established 2-second polling pattern

- Decision: Extend polling into the game flow instead of introducing push transport.
- Rationale: Phase 1 already proved a simple 2-second polling cadence with hidden-tab
  pause behavior, and Phase 3 only needs shared guesses and final round status to
  appear within about 2 seconds.
- Alternatives considered:
  - WebSockets
  - Server-sent events
  - Manual refresh only

### 5. Use `result` as canonical ended-round status

- Decision: Transition the room from `playing` to `result` on the first correct
  guess.
- Rationale: This status is already clarified in the spec and gives Phase 4 a clean
  state boundary for later rendering.
- Alternatives considered:
  - Keep `playing` and add an ended flag
  - Use `finished`

### 6. Preserve secret-word privacy after round end in Phase 3

- Decision: Continue omitting `secretWord` from guesser-visible snapshots in both
  `playing` and `result`.
- Rationale: Phase 2 established viewer-specific secrecy. Phase 3 does not require
  a reveal, and keeping the same privacy rule avoids leaking new data before Phase 4
  explicitly defines result presentation.
- Alternatives considered:
  - Reveal the word to all viewers immediately on `result`
  - Return a masked word to guessers on `result`
