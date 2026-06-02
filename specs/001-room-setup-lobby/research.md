# Research: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Branch**: `001-room-setup-lobby`  
**Date**: 2026-06-03

## Decision Log

### 1. Host Tracking Strategy

**Decision**: Add a `hostId: string` field directly to the `Room` model (equal to the first participant's `id`).

**Rationale**: The simplest possible approach — no new entity, no role table, no lookup cost. The host never changes within a room's lifetime (per spec clarification Q2), so a single scalar field is sufficient. `hostId` is set once in `createRoom()` and never mutated.

**Alternatives considered**:

- Add a `isHost: boolean` flag on each `Participant` — rejected; requires iterating all participants to find the host and complicates snapshot serialisation.
- Derive host as `participants[0]` at read time — rejected; fragile if the participant array is ever reordered (e.g. sorted for display).

---

### 2. Polling Implementation Pattern

**Decision**: `setInterval` inside a `useEffect` in `LobbyPage`, with `clearInterval` in the cleanup function.

**Rationale**: React's `useEffect` cleanup is the idiomatic, well-tested pattern for interval management. It guarantees the interval is cleared on unmount (satisfying FR-6 and Constitution Principle III). No external library is needed.

**Alternatives considered**:

- Polling in `RoomStore` — rejected; the store has no lifecycle awareness, making cleanup harder to guarantee without a ref.
- Custom `usePolling` hook — rejected; YAGNI; a single `useEffect` in `LobbyPage` is sufficient and adds no abstraction overhead.

---

### 3. `POST /api/rooms/:code/start` — Request Body

**Decision**: Empty request body (no `participantId` required). Backend does not validate caller identity (spec clarification Q2 — frontend-only enforcement).

**Rationale**: Since the backend does not verify the caller is the host, there is no identity claim to send. An empty-body endpoint is simpler and avoids building unused validation infrastructure.

**Alternatives considered**:

- Send `participantId` in body for future-proofing — rejected; YAGNI; would add a Zod schema field and handler logic that serves no purpose in this scenario.

---

### 4. Late-Join Rejection — HTTP Status Code

**Decision**: Return HTTP **409 Conflict** with body `{ "message": "Game already in progress" }`.

**Rationale**: 409 semantically means the request conflicts with the current state of the resource — an in-progress game is exactly that conflict. It is more precise than 400 (which implies malformed input) and more accurate than 403 (which implies permission denial).

**Alternatives considered**:

- 400 Bad Request — rejected; the request is well-formed; the conflict is server state, not client input.
- 403 Forbidden — rejected; there is no access-control concept here; any player would be rejected equally.

---

### 5. Frontend URL Defect Fix

**Decision**: Fix the default fallback in `frontend/src/services/api.ts` from `"http://localhost:3001/bug"` to `"http://localhost:3001/api"` as part of this feature's work.

**Rationale**: No end-to-end flow is testable without this fix. It is a deliberate starter defect documented in `DISCOVERY.md` and the constitution. Fixing it in the first feature branch is the earliest appropriate moment.

**Alternatives considered**:

- Require a `.env` file — acceptable but not fixing the defect; developers without the file would see silent API failures with no hint as to why.

---

## Resolved NEEDS CLARIFICATION Items

All items were resolved directly from the existing codebase and spec clarification answers — no open questions remain.

| Item                     | Resolution                                |
| ------------------------ | ----------------------------------------- |
| Host tracking mechanism  | `hostId` field on `Room`, set at creation |
| Polling location         | `useEffect` in `LobbyPage`                |
| Start game endpoint body | Empty (no auth)                           |
| Late-join status code    | 409 Conflict                              |
| Frontend URL defect      | Fix in this branch                        |
