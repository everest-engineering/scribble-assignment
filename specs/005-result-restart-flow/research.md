# Research: Phase 4 Result State and Restart

## Decision 1: Reveal result data through the existing room snapshot

- Decision: Use the existing `RoomSnapshot` shape and change its `result` semantics
  so every viewer receives `secretWord` and unredacted `guessHistory` when
  `status === "result"`.
- Rationale: the frontend already polls one room snapshot shape and derives result
  UI from it. Reusing that contract keeps the Phase 4 change small and preserves the
  viewer-specific secrecy split only where it still matters: `playing`.
- Alternatives considered:
  - Add a separate result-only endpoint
  - Add a new `revealedWord` field alongside hidden `secretWord`
  - Keep guess-history redaction and reveal only the word header

## Decision 2: Add a dedicated restart endpoint

- Decision: Add `POST /rooms/:code/restart` with `{ participantId }` request body.
- Rationale: restart has distinct authorization and eligibility rules, so a
  dedicated route is clearer than overloading `/start` or inventing a generic room
  mutation endpoint.
- Alternatives considered:
  - Reuse `POST /rooms/:code/start`
  - Add `PATCH /rooms/:code`
  - Handle restart entirely on the client

## Decision 3: Reset the room in place

- Decision: Restart mutates the existing room back to a clean lobby state while
  preserving `code`, `hostId`, and `participants`.
- Rationale: this matches the spec exactly and lets the existing polling/session
  restore logic converge clients back to lobby without creating new identities.
- Alternatives considered:
  - Create a new room with a new code
  - Destroy the old room and recreate it under the same code
  - Track multiple rounds inside the same room state

## Decision 4: Preserve the current result-state canvas lock

- Decision: Keep the current no-drawing behavior in `result` and add local canvas
  cleanup only when the room returns to `lobby`.
- Rationale: Phase 3 already implemented the lock, and Phase 4 only needs to make
  sure stale local marks do not visually survive a restart.
- Alternatives considered:
  - Re-enable drawing in `result`
  - Persist local sketch across restart
  - Move sketch state into backend room storage

## Decision 5: Reuse the existing 2-second polling flow

- Decision: Use the current active-room polling flow for both result reveal and
  restart convergence.
- Rationale: current requirements only need updates within about 2 seconds, and the
  code already pauses polling in background tabs and preserves last good state on
  transient errors.
- Alternatives considered:
  - Manual refresh only
  - WebSockets
  - Separate polling loop for restart only
