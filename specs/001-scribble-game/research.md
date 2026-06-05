# Phase 0 Research: Scribble Guessing Game

All open questions were resolvable from the README, the constitution, and the existing starter
code. No `NEEDS CLARIFICATION` markers remained from the spec. Decisions below lock in the
approach for Phase 1.

## R1 — Cross-player synchronization mechanism

- **Decision**: Client-side polling of the existing `GET /rooms/:code` endpoint at ~2s intervals,
  driven by a timer in `frontend/src/state/roomStore.ts`. Each poll replaces the local snapshot.
- **Rationale**: The README's out-of-scope list forbids WebSockets/real-time sync and the
  constitution mandates ~2s polling. The starter already has a `fetchRoom` action; polling wraps it.
- **Alternatives considered**: WebSockets/SSE (rejected — out of scope); manual-refresh only
  (rejected — Scenario 1 requires automatic lobby refresh).

## R2 — Deterministic secret-word selection

- **Decision**: Select the word by a deterministic index into `STARTER_WORDS` (e.g., index `0` →
  `rocket` for the first round), not `Math.random()`.
- **Rationale**: Principle III requires deterministic, reproducible selection so acceptance tests
  are repeatable. The seed list in `backend/src/seed/starterData.ts` is the single source.
- **Alternatives considered**: Random selection (rejected — violates determinism); hashing room
  code into an index (acceptable but unnecessary for a single round — keep it simple with index 0).

## R3 — Host designation

- **Decision**: The room creator is the host. Store `hostId` on the `Room` (the creator's
  participant id). Host-only actions (start, restart) verify the caller's `participantId === hostId`.
- **Rationale**: Scenario 1 requires the creator to be host and only the host to start; the snapshot
  already returns `participantId`, so the client can derive `isHost`.
- **Alternatives considered**: First-in-list = host (equivalent here, but an explicit `hostId` is
  clearer and survives roster ordering changes).

## R4 — Drawer assignment & word visibility

- **Decision**: On start, the host (first player) becomes the drawer; store `drawerId` on the round.
  The snapshot includes the secret word **only** when the requesting `participantId === drawerId`.
- **Rationale**: Scenario 2 requires a clearly identified drawer and drawer-only word visibility;
  filtering server-side prevents the word leaking to guessers via the network payload.
- **Alternatives considered**: Sending the word to everyone and hiding in the UI (rejected — word
  would be visible in network traffic, failing the visibility rule).

## R5 — Guess validation, comparison, and scoring

- **Decision**: Trim guesses server-side; reject empty/whitespace-only with a 400 + clear message.
  Compare `guess.trim().toLowerCase() === word.toLowerCase()`. Correct → +100 to that player's
  score (scores start at 0); incorrect → +0. Append every accepted guess to a shared history.
- **Rationale**: Principle III fixes these exact rules; doing it server-side keeps scoring
  authoritative and synchronized.
- **Alternatives considered**: Client-side scoring (rejected — not authoritative, easy to desync).

## R6 — Round lifecycle / state machine

- **Decision**: Extend `RoomStatus` from `"lobby"` to `"lobby" | "active" | "result"`. Transitions:
  `lobby --start(host,≥2)--> active --round ends--> result --restart(host)--> lobby`. Restart clears
  drawer, word, drawing, guesses, and scores while preserving the participant roster.
- **Rationale**: Scenarios 2–4 describe exactly these states and the restart reset semantics.
- **Alternatives considered**: Boolean flags (rejected — a status union is clearer and already
  modeled as a type).

## R7 — Drawing surface

- **Decision**: Use the browser-native `<canvas>` element in the Game page with pointer events for
  strokes and a clear action; drawing is local to the drawer's screen (the README's Scenario 3 only
  requires the drawing visible on the drawer's screen, not synced).
- **Rationale**: Avoids any new drawing dependency (Principle II). Guess history and scores are the
  synchronized data, not pixels.
- **Alternatives considered**: A canvas/drawing library (rejected — unjustified dependency);
  syncing drawing data via polling (rejected — out of scope and not required by the spec).

## R8 — No new dependencies

- **Decision**: Implement entirely with existing packages (Express, Zod, React, react-router-dom).
- **Rationale**: Principle II requires justification for any new top-level dependency; none is
  needed.
