# Research: Room Setup & Lobby

## Decision 1 — Host identity storage

**Decision**: Store `hostId` as a `string` field on the `Room` model, set to `participants[0].id`
at `createRoom` time. Expose `hostId` in `RoomSnapshot` so the frontend can compare against
`participantId` without a separate API call.

**Rationale**: No extra endpoint, no client-side guessing, O(1) lookup. The host is immutable
for the room lifetime (no reassignment per FR-015), so a single field suffices.

**Alternatives considered**: Deriving host from `participants[0]` on every read — rejected because
it couples host identity to array order and breaks if the array is ever sorted.

---

## Decision 2 — Name validation location

**Decision**: Validate and trim `playerName` in the Zod schemas on the backend
(`createRoomSchema`, `joinRoomSchema`). Also validate client-side in the form before any fetch
to give instant feedback (FR-002).

**Rationale**: Backend validation is the authoritative gate (constitution Principle V — Zod on all
payloads). Client-side pre-check is a UX improvement only; it duplicates the rule deliberately.

**Alternatives considered**: Backend-only validation — produces a round-trip for an easily
detectable error. Client-only — insufficient; backend must not accept bad data.

---

## Decision 3 — Polling implementation

**Decision**: Add a `startPolling(intervalMs: number)` / `stopPolling()` method pair to
`RoomStore`. `LobbyPage` calls `startPolling(2000)` in a `useEffect` on mount and calls the
cleanup to `stopPolling()` on unmount. Uses `setInterval` / `clearInterval` internally.
Poll errors set an inline `pollError` string on `RoomState` without stopping the interval
(FR-014).

**Rationale**: The existing `fetchRoom()` method on `RoomStore` already handles the API call and
state update. Polling is purely a scheduling wrapper around it. Keeping it in the store avoids
duplicating logic if the game screen also needs polling.

**Alternatives considered**: `setInterval` directly in `LobbyPage` — works but couples polling
lifetime to one component; centralising in the store allows reuse in `GamePage` (Scenario 3).

---

## Decision 4 — Start Game endpoint

**Decision**: Add `POST /rooms/:code/start` route. Validates that the requesting participant is
the host and that `participants.length >= 2`. On success sets `room.status = "playing"` via
`saveRoom`. Returns the updated `RoomSnapshot`.

**Rationale**: A dedicated endpoint keeps the action explicit and validates server-side (host
check cannot be trusted client-side). Returns the snapshot so the host's frontend can update
state before navigating (FR-011).

**Alternatives considered**: Patching via `PUT /rooms/:code` — more general but requires
defining a full update shape; a dedicated action endpoint is simpler and auditable.

---

## Decision 5 — `RoomStatus` extension

**Decision**: Expand `RoomStatus` in `backend/src/models/game.ts` from `"lobby"` to
`"lobby" | "playing" | "finished"`. Mirror the same union in `frontend/src/services/api.ts`.

**Rationale**: Required for lobby polling to detect game start (FR-012) and for result state
(Scenario 4). A discriminated string union is the most idiomatic TypeScript pattern and costs
nothing at runtime.

**Alternatives considered**: A boolean `started` flag — does not scale to `"finished"` state
needed in Scenario 4.

---

## Decision 6 — Non-host Start Game button

**Decision**: Render the Start Game button for all players. Compute `isHost` as
`room.hostId === participantId` and `canStart` as `isHost && room.participants.length >= 2`.
Button is `disabled` when `!canStart`; label changes to "Only the host can start" when
`!isHost` (FR-013).

**Rationale**: Single button element, two disabled states, no conditional render. Easier to test
(element always in DOM) and more informative UX.
