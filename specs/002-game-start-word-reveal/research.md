# Phase 0 Research: Game Start, Drawer Selection & Secret Word Reveal

All decisions below resolve the Technical Context unknowns. No remaining NEEDS CLARIFICATION.

## D1 — Deterministic word selection

- **Decision**: Select the round's word with a pure helper `selectWord(code, roundNumber)` that computes a stable integer hash of the seed string `` `${code}:${roundNumber}` `` and indexes into `STARTER_WORDS` via `hash % STARTER_WORDS.length`. The hash is a simple deterministic accumulation (e.g., `djb2`-style over the seed's char codes) — no randomness, no `Date`, no external input.
- **Rationale**: Clarification chose "seed by room code + round number." A fixed room code at round 1 always yields the same word, so SC-005 is verifiable by starting games in rooms with a fixed code. Pure function = trivially unit-testable. Reuses the existing `STARTER_WORDS` seed (Constitution IV — no custom word packs).
- **Alternatives considered**:
  - *Always first word in list* — every room draws the same word; less interesting, rejected per clarification.
  - *`Math.random()`* — non-deterministic, fails SC-005 and the determinism acceptance test.
  - *Crypto hash (SHA over seed)* — overkill; adds nothing over a small string hash for a 5-word list.

## D2 — Drawer designation for round 1

- **Decision**: `round.drawerId = room.hostId`. Exactly one drawer; everyone else is a guesser for the round.
- **Rationale**: FR-002 and the spec assumption: host = first player = round-1 drawer. `hostId` already exists on `Room` (feature 001). No rotation logic (out of scope — Constitution IV).
- **Alternatives considered**: *Random/first-joined-other-than-host* — contradicts FR-002. *Round-robin* — out of scope (drawer rotation prohibited this increment).

## D3 — Enforcing word secrecy (server-side, viewer-aware snapshot)

- **Decision**: Make `toRoomSnapshot(room, viewerParticipantId)` viewer-aware (the parameter already exists but is currently ignored). The returned `round` block includes `word` **only when** `viewerParticipantId === round.drawerId`; all viewers receive `wordLength` (and a precomputed `maskedWord` of blanks). Also stop sending the full `availableWords` list in the snapshot.
- **Rationale**: Clarification chose "withhold from guesser data entirely." Filtering at the snapshot boundary means a guesser's HTTP response never contains the word — it cannot be recovered by inspecting network traffic (SC-003, FR-007). Every route already passes the viewer's `participantId` into `toRoomSnapshot`, so no transport change is needed.
- **Alternatives considered**: *Send word to all, hide in UI* — recoverable via devtools/network; rejected per clarification. *Separate "drawer word" endpoint* — extra endpoint and round-trip with no benefit; the existing poll already carries per-viewer data.

## D4 — Concealed representation for guessers

- **Decision**: Convey **length only** — server provides `wordLength`; the guesser UI renders one blank per letter (e.g., `_ _ _ _ _`). A `maskedWord` string of underscores may be precomputed server-side for convenience. No letters revealed.
- **Rationale**: Matches the spec assumption and FR-008 (length without disclosing letters). Words in `STARTER_WORDS` are single words with no spaces, so a simple per-character blank is sufficient.
- **Alternatives considered**: *Reveal some letters/hints* — out of scope (no hint mechanic this increment). *Hide length entirely* — loses the standard skribbl affordance and weakens SC-007 (player understands what to do).

## D5 — Name validation (trim + reject empty) — behavior change vs. feature 001

- **Decision**: Trim surrounding whitespace and **reject** empty/whitespace-only names with a clear message, on both client (block submit) and server (`400` with a specific message). Internal spaces are preserved. This **supersedes** feature 001's behavior of silently defaulting an empty name to `"Player"`.
- **Rationale**: FR-009/FR-010/FR-011 and US3 require rejection with a message, not a silent default. Enforcing on the server guarantees FR-011 (every participant has a valid name by round start); the client guard gives immediate feedback. The existing generic ZodError handler returns "Invalid request payload", which is **not** specific enough — so the route validates the trimmed name explicitly and throws `HttpError(400, "Please enter a name to continue.")` to satisfy "clear message."
- **Regression note (Constitution V.3)**: Any feature-001 acceptance step or test that relied on empty name → `"Player"` must be updated. The disambiguation logic (`"Name (2)"`) for non-empty duplicates is unchanged.
- **Alternatives considered**: *Keep silent "Player" default* — violates FR-010 (no rejection, no message). *Server-only validation* — works but worse UX; client guard added for immediacy. *Rely on generic ZodError message* — fails the "clear message" requirement.

## D6 — Round-start propagation (reuse existing poll)

- **Decision**: No new realtime mechanism. `startGame` flips `status` to `playing` and attaches `round`; all clients learn of the round on their next `GET /rooms/:code` poll (~2s), then `GamePage` renders roles/word from the snapshot.
- **Rationale**: Constitution III (polling only). Feature 001 already navigates lobby→game on `status === "playing"`; this feature only enriches what the game screen shows. Meets SC-001 (within ~2s).
- **Alternatives considered**: *WebSocket/SSE push* — permanently prohibited (Constitution III/IV).

## D7 — Drawer (host) leaves after round begins

- **Decision**: Reuse the existing `closeIfEmptyOrHostGone` behavior — if the host (the round-1 drawer) is pruned/departs, the room is deleted and remaining players' next poll returns `404`, ejecting them (the frontend already handles this as "host left, room closed").
- **Rationale**: Clarification chose "close the room," consistent with feature 001's host-departure rule (FR-013). No new code path — the round just rides on the room; deleting the room discards the round. The frontend `closed` handling already exists.
- **Alternatives considered**: *Reassign drawer* — that is drawer rotation, out of scope. *Return to lobby* — not chosen in clarification and would need new lobby re-entry logic.

## Open Questions

None. All Technical Context items resolved.
