# Research: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`
**Date**: 2026-05-31

All decisions are grounded in inspection of the existing starter codebase.
No external unknowns remain.

---

## Decision 1: Host tracking strategy

**Decision**: Add a `hostId: string` field to the `Room` model in
`backend/src/models/game.ts`. Set it to the first participant's `id` inside
`createRoom()` in `backend/src/services/roomStore.ts`. Expose `hostId` in
`RoomSnapshot` so the frontend can determine which participant is the host
without a separate API call.

**Rationale**: The simplest extension to the existing model. The `participantId`
returned by `POST /rooms` is already held in frontend `RoomStore.state.participantId`,
so comparing it to `room.hostId` is a zero-cost host check on the frontend.
No role enum, no separate `/host` endpoint, no additional state.

**Alternatives considered**:
- Add an `isHost: boolean` to `Participant` — rejected; requires iterating
  participants to find the host and makes host transfer more complex.
- Return a separate `hostParticipantId` query param — rejected; creates a
  second source of truth.

---

## Decision 2: Room status state machine

**Decision**: Extend `RoomStatus` from `"lobby"` to `"lobby" | "in-progress"` in
`backend/src/models/game.ts`. The transition from `"lobby"` to `"in-progress"`
is triggered by the new `POST /rooms/:code/start` endpoint (see Decision 3).
Once `"in-progress"`, join attempts MUST be rejected with HTTP 409.

**Rationale**: The existing `RoomStatus` type is already defined in `game.ts`
as a single-value union. Adding `"in-progress"` is a minimal, additive change
that covers the spec requirement for rejecting late joiners without introducing
a separate state store.

**Alternatives considered**:
- Separate `isStarted: boolean` field — rejected; a string status enum scales
  to future states (e.g., `"finished"`) without model changes.

---

## Decision 3: Start Game API endpoint

**Decision**: Add `POST /rooms/:code/start` to `backend/src/api/rooms.ts`.
Request body: `{ participantId: string }`. Validates that (a) the room exists,
(b) the caller's `participantId` matches `room.hostId`, and (c) the room has
≥ 2 participants. On success, sets `room.status = "in-progress"` and returns
the updated `RoomSnapshot`. On failure: 404 (room not found), 403 (not host),
400 (fewer than 2 players).

**Rationale**: Follows the existing pattern in `rooms.ts` — parse with Zod,
call a `roomStore` function, return snapshot. Keeps all mutation logic in
`roomStore.ts`.

**Alternatives considered**:
- `PATCH /rooms/:code` with a `status` field — rejected; more generic but
  harder to apply per-caller validation (host check, min-players check).

---

## Decision 4: Frontend lobby polling

**Decision**: Replace the manual "Refresh Room" button in `LobbyPage.tsx` with
a `useEffect` that sets up a `setInterval` at 2000 ms, calling
`roomStore.fetchRoom()`. The interval is cleared on component unmount via
the `useEffect` cleanup return. The manual button is removed.

**Rationale**: `fetchRoom()` already exists in `RoomStore` and calls
`GET /rooms/:code`. Adding a `setInterval` wrapping it is the minimal, correct
approach. No new hook or utility needed. The existing `isLoading` state
provides polling feedback in the Status card.

**Alternatives considered**:
- Custom `useInterval` hook — rejected; adds abstraction not justified for a
  single use-site.
- Long-polling — rejected; adds backend complexity prohibited by the
  REST-only constraint.

---

## Decision 5: Input validation

**Decision**: 
- Frontend (`CreateRoomPage.tsx`, `JoinRoomPage.tsx`): check `playerName.trim()` 
  and `roomCode.trim()` non-empty before dispatching to `roomStore`. Show inline
  error if empty; do not call the API.
- Backend (`schemas.ts`): change `playerName` from `z.string().optional()` to
  `z.string().min(1)` in both `createRoomSchema` and `joinRoomSchema`. This
  ensures the server also rejects empty names even if the frontend check is
  bypassed.

**Rationale**: Defense in depth. Frontend validation provides immediate feedback;
backend validation closes the API-level gap. The existing Zod error handler in
`router.ts` already converts `ZodError` to HTTP 400 with `{ message: "Invalid
request payload" }`, so no new error handling is needed.

**Alternatives considered**:
- Frontend-only validation — rejected; violates spec requirement for server-level
  rejection and leaves the API unguarded.

---

## Decision 6: API base URL bug fix

**Decision**: Fix `frontend/src/services/api.ts` line 22:
```
// Before (starter bug):
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

// After:
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
```

**Rationale**: The `/bug` suffix is an intentional starter defect — it causes
all API calls to hit nonexistent routes, returning 404. The backend router
mounts rooms at `/rooms` (no prefix), so the correct base is the bare origin.
This fix is a prerequisite for any end-to-end story verification.

---

## Pre-Phase 1 Constitution Check: PASS

All five constitution principles satisfied. No violations to justify.
No new packages. All changes additive to existing files.
