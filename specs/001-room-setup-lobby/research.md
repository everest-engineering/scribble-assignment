# Research: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-02

## Findings

### Finding 1 — `hostId` is missing from the Room model

**Decision**: Add a `hostId: string` field to the `Room` interface and to
`RoomSnapshot`. Populate it in `createRoom()` with the first participant's `id`.

**Rationale**: The spec requires the creator to be identified as host throughout the
session. Without a persisted `hostId` on the room the frontend cannot reliably
determine host status after a poll cycle refreshes the snapshot.

**Alternatives considered**:
- Derive host from first participant in `participants[0]` — rejected because
  participant order is not contractually guaranteed and is fragile once leave/rejoin
  logic exists.
- Store host in frontend state only — rejected because it breaks the guarantee across
  tabs and poll refreshes.

---

### Finding 2 — `playerName` validation is absent

**Decision**: Tighten `createRoomSchema` and `joinRoomSchema` in
`backend/src/api/schemas.ts` to use `z.string().min(1)` after `.trim()`. Mirror with
client-side guard in `CreateRoomPage` and `JoinRoomPage` before the API call.

**Rationale**: Current schemas mark `playerName` as optional and the `displayName()`
fallback silently substitutes `"Player"`. The spec requires empty/whitespace-only names
to be rejected with a clear message.

**Alternatives considered**:
- Server-side only validation — accepted as the authority; client-side guard is an
  additional UX improvement to avoid a round-trip.

---

### Finding 3 — Lobby uses a manual Refresh button, not polling

**Decision**: Replace the manual `handleRefresh` button in `LobbyPage` with a
`useEffect` that calls `roomStore.fetchRoom()` on a 2000 ms `setInterval`. Clear the
interval on unmount. Keep error state local; do not navigate away on a failed poll
cycle.

**Rationale**: The spec requires automatic refresh at ~2 s. The current `setInterval`
approach is the simplest compliant implementation using only existing browser APIs and
the already-present `fetchRoom` method on the store.

**Alternatives considered**:
- React Query / SWR refetch interval — rejected; adding a new library violates the Hard
  Constraints in the constitution.
- Long-polling — rejected; constitution forbids push/streaming patterns.

---

### Finding 4 — No `POST /rooms/:code/start` endpoint exists

**Decision**: Add a new `POST /rooms/:code/start` route in `rooms.ts`. It accepts
`{ participantId: string }` in the body, verifies the caller is the host, verifies at
least 2 participants are present, and transitions `room.status` from `"lobby"` to
`"active"`. Returns `403` if not host, `409` if fewer than 2 players.

**Rationale**: The spec requires host-only start gating enforced server-side. A
dedicated endpoint keeps the transition atomic and auditable.

**Alternatives considered**:
- PATCH `/rooms/:code` with `{ status: "active" }` — rejected; too broad and harder to
  authorise safely.

---

### Finding 5 — `RoomStatus` type needs extending; `RoomSnapshot` needs `hostId`

**Decision**: Extend `RoomStatus` to `"lobby" | "active"`. Add `hostId: string` to
both `Room` and `RoomSnapshot`. Update `toRoomSnapshot()` to include `hostId`.

**Rationale**: The frontend needs `hostId` in every snapshot to render the host
indicator and conditionally show the Start button.

---

### Finding 6 — `API_BASE_URL` has a bug (`/bug` suffix)

**Decision**: Fix `frontend/src/services/api.ts` line:
`const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";`
→ `"http://localhost:3001"`.

**Rationale**: This is a clear typo in the starter that would break all API calls in
development.

---

### Finding 7 — Frontend `RoomSnapshot` type is missing `hostId` and uses a literal `"lobby"` status

**Decision**: Update `frontend/src/services/api.ts` — add `hostId: string` to
`RoomSnapshot` and widen `status` to `"lobby" | "active"`.

**Rationale**: Keeps the frontend type in sync with the backend contract after the
model changes.
