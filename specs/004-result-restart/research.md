# Research: Result, Restart, and Final Validation

**Feature**: `specs/004-result-restart`
**Date**: 2026-05-31

## Decision 1: Restart Endpoint Shape

**Decision**: `POST /rooms/:code/restart` with body `{ participantId: string (UUID) }`, returning `{ room: RoomSnapshot }`.

**Rationale**: Mirrors the `POST /rooms/:code/start` pattern exactly — same URL convention
(action verb as path segment after code), same body shape (just `participantId`), same
response shape (`{ room: RoomSnapshot }`). Existing `roomCodeParamsSchema` and UUID validation
patterns apply without modification.

**Alternatives considered**:
- `DELETE /rooms/:code` — semantically wrong; restart preserves participants, not a teardown
- `PATCH /rooms/:code` with `{ status: "lobby" }` — exposes internal state mutation interface; not RESTful for an action
- `POST /rooms/:code/reset` — "reset" and "restart" are synonymous here; "restart" matches the spec's UI label

---

## Decision 2: State Reset in `restartRoom()`

**Decision**: `restartRoom()` mutates in place then persists via `rooms.set()`, following the
`startRoom()` and `submitGuess()` patterns. Fields cleared: `status → "lobby"`, `drawerId → ""`,
`secretWord → ""`, `guesses → []`, `scores → {}`. Participants are preserved.

**Rationale**: The same mutable-then-clone approach used throughout `roomStore.ts` keeps the
pattern consistent. The mutation is explicit and follows the spec FR-004 field list exactly.
Clearing `scores` to `{}` (empty object) is correct — there is no cross-round accumulation
(Spec Assumption). Scores will be re-initialized to `0` per participant at the next
`startRoom()` call, consistent with Scenario 2 behavior.

**Alternatives considered**:
- Re-create room from scratch — loses participant list, violates FR-005
- Retain scores across restarts — explicitly forbidden by spec Assumptions; no cross-round leaderboard

---

## Decision 3: Host Guard Order

**Decision**: Guard order in `restartRoom()` is: 404 (room not found) → 409 (not ended) → 403 (not host). This returns an informative error even for non-hosts attempting restart when the room isn't ended.

**Rationale**: 404 is always first (fundamental). Status check before identity check prevents
leaking host identity — a non-host who guesses wrong status gets a 409, not a 403. This is
consistent with the guard order in `submitGuess()`.

---

## Decision 4: Result View — Same Screen, No New Route

**Decision**: When `room.status === "ended"`, the existing `GamePage.tsx` switches from
active-game content to result-view content in the same component. No new route or URL change.

**Rationale**: This was explicitly resolved in the spec Clarifications section (2026-05-31).
The existing `isEnded` flag is already computed and guards the `GuessForm`. Extending this
pattern to render a dedicated result section avoids routing complexity and matches the spec's
stated assumption.

**Alternatives considered**:
- New `/result` route — adds a route, navigation event, and a new page component; spec explicitly rejected this
- Modal overlay — introduces z-index complexity and breaks two-tab visual testing clarity

---

## Decision 5: Lobby Navigation After Restart

**Decision**: `GamePage`'s existing navigation `useEffect` is extended to detect `room.status === "lobby"` and call `navigate("/lobby", { replace: true })`.

**Rationale**: The polling loop already updates `room` in the store every ~2s. The navigation
`useEffect` already reacts to `room` changes (it fires when `room` goes `null`). Adding a
`"lobby"` status check is the minimal, existing-pattern extension. `replace: true` keeps
browser history clean (no back-navigation to an ended game screen).

**Alternatives considered**:
- Separate polling interval for status change — redundant; existing 2s poll already covers it
- `window.location.href` redirect — bypasses React Router, loses store state unexpectedly

---

## Decision 6: Restart Button Gating

**Decision**: The Restart button is rendered only when `isEnded && participantId === room.hostId`. No server-side feature flag or hidden element; the element simply is not rendered for non-hosts.

**Rationale**: This is sufficient because the server also rejects non-host restart requests (FR-008). The two-layer guard (no UI element + server rejection) satisfies both SC-002 (no visible control) and SC-005 (server rejects non-host).

**Alternatives considered**:
- Disabled button for non-hosts — spec FR-003 says "MUST NOT see or have access to a restart control"; disabled still visible; rejected
- RBAC-based visibility from server — over-engineering; `hostId` is already in the snapshot
