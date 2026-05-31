# Research: Result, Restart & Final Validation

**Date**: 2026-05-31 | **Feature**: 004

## Decision 1 — How to surface result data from the existing room model

**Decision**: Extend `RoomSnapshot` with an optional `result` field (type `RoundResult`)
populated only when `status === "finished"`. The `RoundResult` derives from the existing
`currentRound` object; it is not a new persistent entity.

**Rationale**: The `GET /rooms/:code` polling endpoint is already used by every client to
detect state transitions (lobby → in-progress in spec 003). Embedding result data in
the same snapshot means clients need no new polling endpoint for the result screen — one
poll surfaces both the state transition and the data to display. The alternative (a
dedicated `GET /rooms/:code/result` endpoint) would require an extra HTTP call after the
transition is detected, adding latency and complexity with no benefit.

**Alternatives considered**:
- Dedicated result endpoint: rejected — adds a round-trip; result data is small and fits
  comfortably in the existing snapshot payload.
- Embed guesses/scores as top-level snapshot fields: rejected — clutters the type for all
  states; `result` as a nested optional is self-documenting about when the data is present.

---

## Decision 2 — How to reveal `secretWord` to all players on finish

**Decision**: In `toRoomSnapshot()`, when `room.status === "finished"`, set `secretWord`
for all viewers (not just the drawer) by skipping the `viewerParticipantId` check.
The word is already stored as `STARTER_WORDS[currentRound.wordIndex]`; no new field is needed.

**Rationale**: The existing `toRoomSnapshot` function already computes `secretWord`
conditionally. Extending the condition to include the finished state is a one-line change
that preserves the existing pattern without introducing a parallel data path.

**Alternatives considered**:
- Store `revealedWord` as a separate field in `currentRound`: rejected — redundant;
  the word is already derivable from `wordIndex`.
- Return `secretWord` in the nested `result` object only: considered, but keeping it on
  the top-level snapshot field is consistent with how the drawer already sees it during play.

---

## Decision 3 — Authorization pattern for end-round and restart

**Decision**: Both `POST /rooms/:code/end-round` and `POST /rooms/:code/restart` accept
`{ participantId }` in the request body and reject with HTTP 403 if
`participantId !== room.hostId`. This matches the existing host-authorization pattern
used by `POST /rooms/:code/start`.

**Rationale**: The codebase already uses `participantId` in the request body to identify
the caller (see `startGame` in `roomStore.ts`). Reusing this pattern avoids introducing
any new authentication mechanism.

**Alternatives considered**:
- Session cookie or header-based auth: rejected — no session management exists; the
  spec explicitly scopes auth to `hostId` matching.

---

## Decision 4 — Frontend navigation to the result screen

**Decision**: `GamePage.tsx` adds a second polling interval that calls
`roomStore.fetchRoom()` every 2 seconds (matching the existing lobby poll cadence).
When the polled room status becomes `"finished"`, it navigates to `/result`. The result
page polls the same endpoint and navigates to `/lobby` when status becomes `"lobby"`.

**Rationale**: `LobbyPage.tsx` already uses this exact pattern — poll `fetchRoom()`,
watch `room.status`, `navigate()` on transition. Reusing the identical approach keeps
navigation logic consistent across the game flow.

**Alternatives considered**:
- Poll `GET /rooms/:code/guesses` in `GamePage` for the finish signal: rejected —
  that endpoint does not expose room status; a separate room poll is required.
- Single combined poll replacing the existing guesses poll: rejected — the guesses poll
  supports real-time activity feed during play; removing it would regress spec 003 behavior.

---

## Decision 5 — Restart idempotency (double-click defence)

**Decision**: `restartGame()` in `roomStore.ts` checks `room.status === "finished"` before
applying the transition. If the room is already `"lobby"`, it returns the current snapshot
without error (no-op). This mirrors the existing guard in `startGame()` which checks
`status === "lobby"` before proceeding.

**Rationale**: The spec edge case explicitly requires the second restart call to be a no-op.
A silent guard (return current state without throwing) is the simplest implementation and
avoids client-side error handling for a race condition that is extremely unlikely in practice.

**Alternatives considered**:
- Return HTTP 409 on duplicate restart: rejected — the spec says "should not cause errors";
  a 409 would require the client to handle an error for an already-resolved state.

---

## All NEEDS CLARIFICATION items resolved

No unknowns remain. All decisions are grounded in the existing codebase patterns.
