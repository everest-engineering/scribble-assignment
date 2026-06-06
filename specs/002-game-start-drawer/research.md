# Phase 0 Research: Game Start & Drawer Flow

Technical decisions for Group 2. All NEEDS CLARIFICATION items were resolved during `/speckit-clarify`
(Session 2026-06-05) and are restated here as decisions.

## Decision 1 — Round initialization runs inside the start action

- **Decision**: Assign drawer/guesser roles and select the secret word inside `startRoom` on the first
  transition to `started`, in the same operation that flips the status. `GET /rooms/:code` remains a
  pure read/projection and never mutates state.
- **Rationale**: Single, explicit state-transition point is the most testable and avoids mutation in a
  read path. Matches Group 1's discriminated `startRoom` result and keeps the snapshot a projection.
- **Alternatives considered**:
  - *Lazy-init on first GET*: puts mutation in a read endpoint; harder to reason about and test.
  - *Separate "initialize round" endpoint*: extra round-trip and surface area for no benefit at this scale.

## Decision 2 — Deterministic word selection

- **Decision**: `selectWord(code, words) = words[ sum(code.charCodeAt) % words.length ]`. Pure function
  in `backend/src/services/wordSelection.ts`; no randomness.
- **Rationale**: Uses the full room code, trivially unit-testable, satisfies Constitution III
  (deterministic, reproducible, same room → same word). Better distribution than first-char-only.
- **Alternatives considered**:
  - *First char code % length*: clusters when codes share a first character.
  - *Named hash (DJB2)*: more uniform but more code than needed for a 5-word list.
  - *`Math.random()`*: forbidden by Constitution III (non-deterministic, untestable).

## Decision 3 — Secret word representation for guessers

- **Decision**: Omit the `secretWord` field entirely from non-drawer snapshots; include it only on the
  drawer's snapshot. The field is therefore `secretWord?: string` (absent, never `null`).
- **Rationale**: Smallest exposure surface — the word never appears in guesser JSON, so it cannot leak
  via network inspection. "Absent" is a cleaner contract than "present-and-null" for a secret.
- **Alternatives considered**:
  - *Always present, `null` for guessers*: still ships the key; risk of accidentally populating it.

## Decision 4 — Drawer identity = host

- **Decision**: The drawer is the room host (`round.drawerId = room.hostId`). No rotation.
- **Rationale**: Deterministic and matches the brief ("host (or first player) becomes the drawer") and
  discovery assumption 2. Rotation/multiple rounds are out of scope (Constitution V).

## Decision 5 — Name validation at the edge

- **Decision**: `playerName` becomes required, trimmed, and `min(1)` after trim, in both create and join
  Zod schemas; the `"Player"` default in the store is removed. UI also blocks empty submits.
- **Rationale**: Closes the starter's silent-default hole (Constitution IV — no silent defaults). Edge
  validation is the single source of truth; the client guard is a UX convenience that mirrors it.
- **Alternatives considered**:
  - *Validate only in the store*: bypasses the Zod boundary the constitution mandates.
  - *Client-only validation*: trivially bypassed; not source-of-truth.

## Decision 6 — Round state lives on the Room (in-memory)

- **Decision**: Add `round: RoundState | null` to `Room` (`null` in lobby). Roles stored as
  `Record<participantId, ParticipantRole>`; snapshot exposes per-participant `role` and top-level
  `drawerId`.
- **Rationale**: Keeps authoritative round state in one place, supports idempotent init, and lets the
  projection compute viewer-specific views. In-memory only (Constitution V).
- **Alternatives considered**:
  - *Separate rounds Map keyed by code*: more indirection; room already owns its lifecycle.

## Open items deferred to planning/implementation (low impact)

- Exact game-screen copy/layout for drawer vs guesser (UX detail; covered by FR-031).
- Behavior when `participantId` is missing/unknown on GET: no `secretWord` exposed (safe default);
  follows existing API conventions.
