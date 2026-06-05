# Research: Room Setup & Lobby

**Feature**: 001-scribble-game — Scenario 1
**Date**: 2026-06-05

---

## Decision 1 — Lobby Polling Strategy

**Decision**: Use `setInterval` inside a `useEffect` in `LobbyPage`, calling the existing `roomStore.fetchRoom()` method. Clean up with `clearInterval` on unmount.

**Rationale**: The `RoomStore.fetchRoom()` method and `GET /rooms/:code` endpoint already exist and work correctly. A plain interval is the simplest mechanism that requires no new dependencies and aligns with Principle IV (Simplicity). React's `useEffect` cleanup handles the teardown case correctly.

**Alternatives considered**:
- `useInterval` custom hook — adds abstraction without benefit at this scale.
- Long-polling (hanging GET) — incompatible with Express's default request handling and adds server complexity.
- WebSockets — explicitly out of scope per README and Principle IV.

---

## Decision 2 — Host Tracking

**Decision**: Add `hostId: string` to the `Room` model (backend) and surface it in `RoomSnapshot`. The frontend compares `participantId` (stored in `RoomStore.state`) against `room.hostId` to determine host-only UI.

**Rationale**: Storing `hostId` on the Room (not as an `isHost` flag on each Participant) keeps the model clean — there is exactly one host per room at any time. The `participantId` is already stored in `RoomStore` and flows through `setRoomSession`. No additional API call or session mechanism is needed.

**Alternatives considered**:
- `isHost: boolean` on Participant — works, but requires iterating participants to find the host; also complicates join logic.
- Relying on participant order (index 0 = host) — brittle; not surfaced in the API response.

---

## Decision 3 — Name Validation

**Decision**: Validate on both the frontend (before submitting) and backend (in Zod schemas). The frontend trims the input and rejects if empty before calling the API. The backend schema uses `.transform(s => s.trim())` and `.min(1)` to enforce the same rule server-side.

**Rationale**: Client-side validation gives instant feedback (Principle V — validate early). Server-side validation ensures the rule is enforced regardless of client behaviour (defence in depth without adding complexity).

**Alternatives considered**:
- Backend-only validation — valid but gives slower feedback; user sees network error instead of inline message.
- Custom error middleware only — Zod already handles this cleanly; no new code needed.

---

## Decision 4 — Start Game Endpoint

**Decision**: Add `POST /rooms/:code/start` on the backend. It validates the caller is the host (by `participantId` in the body), checks participant count ≥ 2, and transitions `room.status` from `"lobby"` to `"active"`. All players navigate to `/game` when their lobby poll returns `status: "active"`.

**Rationale**: The frontend already polls `GET /rooms/:code`. By checking `status` in the poll response, the game transition is handled without a new client-side event mechanism. This reuses the existing polling loop for navigation — no new infrastructure needed.

**Alternatives considered**:
- Frontend-only navigation (current behaviour, `navigate("/game")` without checking status) — unsafe; non-host players could navigate independently.
- Separate SSE or WebSocket event — out of scope.

---

## Decision 5 — RoomStatus Extension

**Decision**: Extend `RoomStatus` type to `"lobby" | "active"` in `backend/src/models/game.ts` and mirror it in `frontend/src/services/api.ts`.

**Rationale**: Scenario 1 needs `"active"` to drive the post-start navigation. Adding it now keeps the model honest without anticipating further statuses (no `"result"` yet).

**No alternatives** — direct extension of the existing union type.
