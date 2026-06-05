# Phase 0 Research: Result, Restart & Final Validation

Technical decisions for Group 4. The two clarified items (restart API, word reveal) are restated here as
decisions, alongside the supporting design choices.

## Decision 1 — Restart API shape

- **Decision**: `POST /rooms/:code/restart` with `{ participantId }`; host-only; returns the updated room
  snapshot. Mirrors `POST /rooms/:code/start`.
- **Rationale**: Consistency with the existing host action (`start`) — same body shape, same discriminated
  result → HTTP status mapping, same client wiring. Easy to validate and test.
- **Alternatives considered**:
  - `POST /rooms/:code/reset`: same behavior, less aligned with the "restart the game" wording.
  - Reuse `start` with a flag: overloads one endpoint with two opposite transitions; muddier tests.

## Decision 2 — Post-round word reveal via snapshot projection

- **Decision**: Extend `toRoomSnapshot` so `secretWord` is included when the viewer is the drawer **or**
  `round.ended === true`. During active play it stays drawer-only (Group 2 behavior preserved).
- **Rationale**: Constitution IV — viewer-specific data is enforced server-side, not by UI tricks. Reuses
  the existing `secretWord?` field (no new field), so the frontend already understands it.
- **Alternatives considered**:
  - Separate `revealedWord` field: redundant with `secretWord`; two fields meaning "the word".
  - Client-only reveal: violates the server-side projection principle; risks leaking via dev tools.

## Decision 3 — No new room status; reset via `status = lobby` + `round = null`

- **Decision**: Keep `RoomStatus` as `"lobby" | "started"`. End-of-round is represented by `round.ended`
  (Group 3). Restart sets `status = "lobby"` and `round = null`.
- **Rationale**: Minimal, additive; avoids rippling a new `"ended"` status through Group 1–3 switches and
  tests. `round.ended` already carries the "show result" signal; `status === "lobby"` already drives
  navigation.
- **Alternatives considered**:
  - Add `"ended"` status: more states than a single-round lab needs; touches existing status logic.

## Decision 4 — Restart gating & idempotency

- **Decision**: `restartRoom` returns a discriminated result: `not-found` (404), `forbidden` (non-host,
  403), `not-ended` (active round, 409), else `ok`. Idempotent when already `lobby` with `round === null`.
- **Rationale**: Matches the `startRoom` pattern and the constitution's edge-discipline. Idempotency
  handles double-clicks and concurrent polls cleanly.
- **Alternatives considered**:
  - Allow restart any time: would discard an in-progress round; contradicts FR-056.
  - Throw on repeat restart: poor UX for double-clicks; idempotent is safer.

## Decision 5 — Game→lobby auto-navigation via existing polling

- **Decision**: Reuse the Group 3 game-screen poll; when a tab observes `status === "lobby"`, it
  navigates to `/lobby`. This mirrors Group 1's lobby tab navigating to `/game` on `status === "started"`.
- **Rationale**: No new sync mechanism; symmetric with the established pattern; participants preserved.
- **Alternatives considered**:
  - Push/WebSocket notification: forbidden by scope.
  - Manual "Back to lobby" only: leaves non-host tabs stranded; fails FR-060/SC-003.

## Decision 6 — Reuse existing result components

- **Decision**: Reuse `Scoreboard` (final scores) and `ResultPanel` (guess history) from Group 3 for the
  result view; render the revealed word in `GamePage`. Host restart is a button in `GamePage`.
- **Rationale**: Constitution I/V — extend, don't replace. These components already read from the snapshot.
- **Alternatives considered**:
  - A dedicated `ResultView` component/route: more surface area than needed for one round.

## Open items deferred to implementation (low impact)

- Result view layout/styling is a presentation detail (no contract impact).
- Restart button placement/label in `GamePage` is cosmetic.
