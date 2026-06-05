# Research: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-04

---

## Decision 1: Host Identity Storage

**Decision**: Add a `hostId: string` field to the `Room` model, set to the creating participant's
ID at room creation, and include it in every `RoomSnapshot` returned to clients.

**Rationale**: The host identifier must be server-authoritative. Storing it on the `Room` struct
(already in the `rooms` Map) requires no new data structure. The frontend derives host status
by comparing `room.hostId === store.participantId`. This is the minimal change that satisfies
FR-001 and FR-002 without adding a separate concept.

**Alternatives considered**:
- Mark the `Participant` record with `isHost: boolean` — rejected because it requires scanning
  the participants array to find the host on every operation; a direct `hostId` field is O(1).
- Store host in a separate Map — rejected as unnecessary indirection when a single field suffices.

---

## Decision 2: Start-Game Endpoint

**Decision**: `POST /rooms/:code/start` with body `{ participantId: string }`. The backend
validates that `participantId === room.hostId` and `room.participants.length >= 2` before
transitioning `room.status` to `"playing"`. Returns the updated `RoomSnapshot`.

**Rationale**: Passing `participantId` in the request body is consistent with the existing
create/join pattern (body-based identity). The backend must validate both host identity
and player count to enforce FR-008 and FR-010 server-side — client-side disabling is
UI-only and not a security gate.

**Alternatives considered**:
- `participantId` as a query param — rejected; body is more conventional for mutating endpoints
  and avoids the value appearing in server logs.
- No backend validation (trust the client) — rejected; constitution principle III requires
  server-side enforcement so that direct API calls cannot bypass the guard (FR-010).

---

## Decision 3: RoomStatus Type Expansion

**Decision**: Expand `RoomStatus` from the literal `"lobby"` to the union
`"lobby" | "playing" | "result"` in `backend/src/models/game.ts`. Synchronise this change
to `frontend/src/services/api.ts` in the same commit.

**Rationale**: Scenario 1 introduces the `"playing"` transition; Scenarios 3–4 will need
`"result"`. Defining the full union now prevents a breaking type change mid-lab. Constitution
Principle II requires both sides to expand in the same commit.

**Alternatives considered**:
- Add only `"playing"` now — rejected; partial expansion causes another breaking sync commit
  later. Adding the full union costs nothing and avoids drift.

---

## Decision 4: Player Name Validation

**Decision**: Validate and trim names **on the backend** inside `createParticipant()`. If the
trimmed name is empty, return a `400` `HttpError("Player name is required")`. Also trim on the
frontend before submitting so the error is caught immediately without a round trip when the
field is obviously blank.

**Rationale**: FR-003 requires server-side rejection so the rule cannot be bypassed. Frontend
trim-and-check is a UX enhancement that catches the obvious empty case early (no spinner needed).
Both sides must agree on the rule; trimming on both is consistent with the Zod pattern already
in use.

**Alternatives considered**:
- Frontend-only validation — rejected; direct API calls would bypass it (FR-010 pattern applies
  equally here).
- Zod `.min(1)` on the schema — valid alternative, but Zod errors return a generic 400 "Invalid
  request payload"; a specific `HttpError` gives the user a clearer message. Custom validation
  inside `createParticipant` is preferred.

---

## Decision 5: Lobby Polling Implementation

**Decision**: Add a `useEffect` hook in `LobbyPage` that calls `setInterval(store.fetchRoom, 2000)`.
The cleanup function calls `clearInterval`. The interval constant `POLL_INTERVAL_MS = 2000` lives
in a shared constants file (or at the top of the component for now). The manual "Refresh Room"
button is removed.

**Rationale**: `useEffect` with `setInterval` is the standard React pattern for interval-based
polling. Cleanup on unmount satisfies FR-007 and Constitution Principle IV. The interval constant
must be named (not a magic number) per the constitution.

**Implementation detail**: The `useEffect` dependency array must be stable. `store.fetchRoom` is
a class method bound to the `RoomStore` instance — it does not change between renders. The
effect depends only on `[store]` which is also stable (created once in `RoomStoreProvider`).

---

## Decision 6: Game Start Navigation for All Players

**Decision**: The lobby poll loop checks `room.status` after every successful fetch. When
`status !== "lobby"` (i.e., `"playing"`), the poll stops and `navigate("/game")` is called.
This handles both the host (who triggered the start) and non-host players (who detect the
change on their next poll).

**Rationale**: The spec assumption already states this pattern. It requires no new endpoint or
push mechanism — polling naturally distributes the state change to all connected lobbies within
the polling interval. The host's own UI can navigate immediately on start-game API success;
other players navigate on the next poll.

**Alternatives considered**:
- Host navigates immediately, others navigate on poll — this is the implementation detail; the
  spec-level decision is that all players end up navigated to `/game` as a result of the
  status change.
