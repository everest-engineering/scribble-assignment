# Research: Room Setup & Lobby Navigation

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02

## Summary

All clarification questions resolved through codebase inspection. No external research required — the starter provides a near-complete scaffold; this feature completes gaps between the scaffold and the spec.

---

## R-001: Host Concept — How is "host" tracked?

**Decision**: Add a `hostId` field to the `Room` model (the `id` of the first participant / creator). The `RoomSnapshot` exposed to the frontend will include `hostId` so the lobby can conditionally render the Start Game button.

**Rationale**: The model currently has no host tracking. First participant in `participants[]` is always the creator (participants are pushed in join order), but relying on index-0 is fragile. An explicit `hostId` field is safer and self-documenting.

**Alternatives considered**:
- Flag on `Participant` (`isHost: boolean`) — rejected; requires scanning the array on every check, and the snapshot would expose an irrelevant field to non-host clients.
- Index-0 convention — rejected; fragile if future features allow participant list reordering.

---

## R-002: Max-Players Enforcement (FR-013)

**Decision**: Enforce max 4 participants in `joinRoom()` in `roomStore.ts`. Return `null` with a distinguishable reason (or throw an `HttpError(409)` from the route handler) so the frontend can display "Room is full".

**Rationale**: The spec requires a clear error for full rooms. The backend is the authoritative enforcer. The frontend form validation alone is insufficient.

**Alternatives considered**:
- Return a 400 Bad Request — rejected; 409 Conflict is semantically correct for "resource at capacity".
- Enforce on frontend only — rejected; violates server-as-authority principle.

---

## R-003: Start Game Endpoint

**Decision**: Add `POST /rooms/:code/start` endpoint. The route validates that the requesting participant is the host (via `participantId` in the request body) and that there are ≥ 2 participants. On success it transitions `room.status` from `"lobby"` to `"in-progress"`.

**Rationale**: `RoomStatus` in `game.ts` currently only has `"lobby"`. Adding `"in-progress"` enables non-host polling clients to detect the transition and auto-navigate to the game screen.

**Alternatives considered**:
- WebSockets for real-time push — rejected; polling at ~2s is spec-mandated and sufficient; WebSockets add complexity outside the spec scope.
- Status transition via PATCH — rejected; a dedicated `start` sub-resource is explicit about the single allowed transition.

---

## R-004: Polling Pattern (FR-008)

**Decision**: Implement polling in `LobbyPage` using `useEffect` + `setInterval` at 2000ms, calling `roomStore.fetchRoom()`. Clear the interval on unmount. Polling errors are non-blocking: retain the existing participant list and show a transient inline error that clears on the next successful poll.

**Rationale**: `setInterval` inside `useEffect` with a cleanup return is the established React pattern for polling. The `RoomStore.fetchRoom()` method already exists and handles loading state.

**Alternatives considered**:
- `setTimeout` loop — equivalent, slightly more complex with cancel logic.
- React Query / SWR refetchInterval — rejected; constitution forbids new dependencies without justification; polling is simple enough to implement without a library.

---

## R-005: Form Validation — Empty/Whitespace Name & Code (FR-003, FR-004)

**Decision**: Validate on the frontend (trim + non-empty check before submit, show inline `<p className="form__error">`) **and** on the backend (tighten Zod schemas with `.min(1)` after trim). The backend is the authoritative enforcer; the frontend provides fast feedback.

**Rationale**: Existing `createRoomSchema` and `joinRoomSchema` use `z.string().optional()` — they accept empty strings. These must be tightened to `z.string().trim().min(1)` to comply with FR-003/FR-004.

**Alternatives considered**:
- Frontend-only — rejected; backend must be authoritative (Principle VI).
- Backend-only — rejected; degrades UX (network round-trip for a local validation).

---

## R-006: Zod Schemas Location (Principle VI — Contract First)

**Decision**: Shared Zod schemas and derived TypeScript types live in `shared/schemas/`. Both `backend/` and `frontend/` import from `shared/schemas/`. The `RoomSnapshot` Zod schema defines the wire format; the TS type is derived with `z.infer<>`.

**Rationale**: Constitution Principle VI mandates shared schemas in a location accessible to both frontend and backend. Currently types are duplicated (`api.ts` in frontend, `game.ts` in backend). A `shared/` package eliminates this drift.

**Alternatives considered**:
- Keep types duplicated — rejected; violates Principle VI, which forbids raw response casts without Zod parse.
- Put schemas only in backend and copy to frontend at build time — rejected; error-prone and not "single source of truth".

---

## R-007: `RoomStatus` Extension

**Decision**: Extend `RoomStatus` in the shared schema to `"lobby" | "in-progress"`. The frontend uses this to detect when to auto-navigate to the game screen.

**Rationale**: The spec (FR-011) requires non-host clients to detect `status === "in-progress"` from polling and navigate automatically.

**Alternatives considered**:
- Separate `gameStarted: boolean` flag — rejected; status is already the right discriminant and adding a redundant flag creates two sources of truth.

---

## R-008: Loading/Spinner State on Submit (FR-014)

**Decision**: Use existing `isLoading` from `useRoomState()`. Disable submit button and render an inline spinner element (e.g., `<span className="spinner" aria-label="Loading" />`) while `isLoading` is `true`. No new dependency required.

**Rationale**: `RoomStore.withLoading()` already gates `isLoading`. `CreateRoomPage` and `JoinRoomPage` do not yet read `isLoading` — adding it is a one-line change per page.

---

## R-009: Error Boundary Coverage (Principle VII)

**Decision**: Wrap `CreateRoomPage`, `JoinRoomPage`, and `LobbyPage` in a reusable `PageErrorBoundary` React class component. The boundary renders a human-readable fallback message.

**Rationale**: Constitution Principle VII requires each route/page to be wrapped in a React error boundary. No error boundary exists in the codebase today.

---

## R-010: `api.ts` — Base URL Bug

**Decision**: The current `API_BASE_URL` default is `http://localhost:3001/bug` (note `/bug`). This must be corrected to `http://localhost:3001` (no trailing path segment).

**Rationale**: Existing stub code contains a deliberate bug; fixing it is required for any HTTP call to succeed.

---

## Resolved Unknowns Summary

| ID | Unknown | Resolution |
|----|---------|-----------|
| R-001 | Host tracking | Add `hostId: string` to `Room` and `RoomSnapshot` |
| R-002 | Max player enforcement | `joinRoom()` returns null + 409 from route |
| R-003 | Start game endpoint | `POST /rooms/:code/start` |
| R-004 | Polling pattern | `setInterval` in `useEffect`, 2000ms |
| R-005 | Form validation | Frontend trim+min(1) + backend Zod tightened |
| R-006 | Shared schemas | New `shared/schemas/` package |
| R-007 | RoomStatus extension | Add `"in-progress"` value |
| R-008 | Loading state | Use existing `isLoading` from `RoomStore` |
| R-009 | Error boundaries | `PageErrorBoundary` wrapping each route/page |
| R-010 | API base URL bug | Remove `/bug` from default URL |
