# Phase 0 Research: Result, Restart & Final Validation

**Feature**: 004-result-restart
**Date**: 2026-06-03

The spec arrived with one clarification already integrated (host-pressed
End Round trigger) and a thorough assumptions list. Phase 0 locks the
implementation-pattern decisions the plan needs before contracts.

## Decision: Result-state name

**Decision**: Extend `RoomStatus` from `"lobby" | "playing"` to
`"lobby" | "playing" | "result"`.

**Rationale**:
- Explicit, short, and visually distinct from the other two states.
- Forward-compatible with any "between rounds" sub-state if a future
  scenario introduces multi-round play; `"result"` would precede a
  hypothetical `"intermission"` or be renamed to `"round-ended"` without
  reshaping clients.
- Mirrors the lab's pattern of a small string union for `RoomStatus`
  (no flag bag, no nested objects).

**Alternatives considered**:
- `"done"` / `"ended"` / `"reveal"` — synonymous; `"result"` reads most
  cleanly when paired with the user-facing "Result" view.
- A boolean `isResult` alongside `status` — denormalised and fragile.

## Decision: End-round endpoint shape

**Decision**: `POST /rooms/:code/end` with JSON body
`{ participantId: string }`. Returns 200 + `{ room: snapshot }` on
success.

**Rationale**:
- Mirrors Scenario 2's `POST /:code/start` exactly. The host's identity
  is carried in the body, the server validates against
  `room.hostParticipantId`, and the response carries the freshly-filtered
  snapshot so the caller's UI can render immediately without waiting on
  the next poll.
- Body params (not query string) match every other write endpoint in
  this codebase.

**Error matrix**:

| Condition | Status | `message` |
|---|---|---|
| Code empty / whitespace | 400 | `"Enter a room code"` (existing rule) |
| Body fails Zod | 400 | `"Invalid request payload"` |
| Code not found | 404 | `"Room not found"` |
| `participantId !== hostParticipantId` | 403 | `"Only the host can end the round"` |
| `status !== "playing"` | 409 | `"Cannot end a round that is not in progress"` |
| Anything else | 500 | `"Unexpected server error"` |

**Error precedence**: code params → body Zod → room lookup → host check
→ state check → service success. The host check runs before the state
check so a non-host attempting to end an already-ended round gets the
auth message rather than the state message — least-confusing UX.

**Alternatives considered**:
- `DELETE /rooms/:code/round` — semantically arguable but unusual for
  a state transition that retains all the round's data.
- 204 No Content on success — forces an extra fetch on the host's tab.

## Decision: Restart endpoint shape

**Decision**: `POST /rooms/:code/restart` with JSON body
`{ participantId: string }`. Returns 200 + `{ room: snapshot }` on
success.

**Rationale**:
- Same shape as `/end` and `/start`. Three host-only state-transition
  endpoints, three identical request bodies. The schemas module exports
  three named exports (`startRoomSchema`, `endRoundSchema`,
  `restartRoomSchema`) that all evaluate to the same Zod object; the
  named exports keep the route handlers self-documenting without
  duplicating validation logic.

**Error matrix**:

| Condition | Status | `message` |
|---|---|---|
| Code empty / whitespace | 400 | `"Enter a room code"` |
| Body fails Zod | 400 | `"Invalid request payload"` |
| Code not found | 404 | `"Room not found"` |
| `participantId !== hostParticipantId` | 403 | `"Only the host can restart"` |
| `status !== "result"` | 409 | `"Cannot restart from this state"` |
| Anything else | 500 | `"Unexpected server error"` |

**Error precedence**: same as `/end`. Host check before state check.

**Alternatives considered**:
- `POST /rooms/:code/start` reused for restart — the existing Start
  rejects unless `status === "lobby"`, so it would only work after
  Restart already transitioned to lobby. Two-step ("restart then start")
  is worse UX than a single Restart action.
- Restart that ALSO transitions straight to playing — out of scope; the
  spec says "everyone returns to the lobby" and Scenario 2's host-only
  Start with the 2-player quorum stays in play.

## Decision: Restart side effects

**Decision**: In this order — for each participant, `score = 0`; then
`room.guesses = []`; then `room.currentRound = null`; then `room.status
= "lobby"`. The order is independent (no field reads another), but
deterministic ordering makes the test assertions predictable.

**Rationale**:
- All four fields are mentioned in FR-011. The order isn't load-bearing
  but it groups "data clears" before "state transition", which reads as
  "wipe round data, then return to lobby".
- The participants list and `room.hostParticipantId` are untouched;
  they belong to the room's identity, not the round's.

**Alternatives considered**:
- Replace the entire `Room` object with a new one (keeping only the
  identity fields) — wasteful and breaks any cached references.
- Use `Object.assign` for the wipe — less explicit; reviewers have to
  diff the assignment to understand what changed.

## Decision: Idempotency interpretation

**Decision**: Both `/end` and `/restart` reject wrong-state calls with
409 + a clear message. Neither endpoint is idempotent in the
return-200-on-no-op sense.

**Rationale**:
- The spec's FR-003 and FR-010 say "MUST be rejected with a user-visible
  message". A 409 with the message satisfies that requirement directly.
- The spec's edge case "twice rapidly → no-op" is satisfied through the
  UI layer: after the first successful end, the host's tab navigates
  away from the game view (to `/result`) so a UI-driven second press is
  not possible. A console-driven second press receives 409 with the
  clear message; that's the correct behaviour.
- This differs from Scenario 2's Start endpoint, which the spec there
  explicitly designated as idempotent. The two specs have different
  language; we honour each one literally.

**Alternatives considered**:
- Idempotent semantics: second `/end` on result returns 200 + same
  snapshot — would violate FR-003 as written.
- 410 Gone or 422 Unprocessable Entity — wrong semantics; 409 Conflict
  is the correct HTTP code for "state forbids this transition".

## Decision: Result-state visibility override

**Decision**: Extend `toRoomSnapshot(room, viewerParticipantId)` with a
single conditional at the top of the function: if `room.status ===
"result"`, treat every viewer as fully privileged for both the
`secretWord` and every entry's `guess.text`. Scenarios 2 + 3 visibility
rules apply only when `status === "playing"`.

**Rationale**:
- Centralises three modes (`lobby`, `playing`, `result`) in one function.
  No new function call sites, no new exports.
- The conditional is at the TOP of the privileged-viewer derivation, so
  the existing `viewerParticipantId === drawerParticipantId` and
  `viewerParticipantId === entry.guesserParticipantId` checks short-
  circuit harmlessly when result-state takes over.
- The data layer enforces the reveal, not the UI — same architecture as
  Scenarios 2 + 3. SC-002 + SC-004 can be verified via Network-tab
  inspection.

**Alternatives considered**:
- Separate snapshot endpoints per state — would duplicate the response
  shape and require client routing.
- UI-only reveal (client uses real data when status is result, ignores
  redaction placeholder) — but the server must NOT deliver `null` in
  the first place; SC-002 requires the literal word to be in the
  response.

## Decision: Frontend transition triggers

**Decision**: Both `GamePage` and `ResultPage` subscribe to `room.status`
via the existing polling-driven snapshot. GamePage's `useEffect`
navigates to `/result` when status flips to `"result"`. ResultPage's
`useEffect` navigates to `/lobby` when status flips back to `"lobby"`.
The host gets immediate transition because the endpoint response
updates the store synchronously; guests catch up on their next poll
within ~2 s.

**Rationale**:
- This is the exact pattern Scenario 2 already established (LobbyPage
  status-watch effect navigates to `/game` on `"playing"`). Replicating
  it on two more pages keeps the transition logic uniform and gives
  reviewers one mental model to apply across all three pages.
- No new polling code, no new event mechanism.

**Alternatives considered**:
- A single shared transition component wrapping every page — premature
  abstraction; three repetitions of a 4-line effect aren't worth a new
  HOC.
- WebSocket push — out of scope.

## Decision: ResultPage layout

**Decision**: `ResultPage` renders, top to bottom:
1. A header card with "Round Over" + the room code.
2. A "The word was…" card containing the literal `currentRound.secretWord`.
3. The same `<Scoreboard>` component from Scenarios 2 + 3, fed with
   `room.participants` and `room.currentRound?.drawerParticipantId`.
4. A "Full guess history" list — the same ordered list pattern from
   Scenario 3's GamePage, but with no placeholder branch (since `text`
   is always non-null in result state).
5. For the host only: a Restart button. For guests: a status line such
   as "Waiting for the host to restart".

**Rationale**:
- Reuses existing components and patterns; no new visual language to
  introduce.
- Layout maps directly to FR-005 (word), FR-006 (final scores), FR-007
  (full history) and SC-002 / SC-003 / SC-004.

**Alternatives considered**:
- Inline the result view INTO GamePage and toggle via `room.status` —
  one file with three sections (drawer area, scoreboard / history,
  conditional "Round Over" banner). Workable, but a separate page +
  route gives reviewers a clearer URL signal and matches Scenario 2's
  `/game` ↔ `/lobby` separation.
- Modal overlay on top of GamePage — overlays make navigation,
  refresh, and back-button behaviour fragile.

## Open questions

None. All Phase 0 unknowns are resolved. Ready for Phase 1.
