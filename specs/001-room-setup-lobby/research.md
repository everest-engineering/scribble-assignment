# Phase 0 Research: Room Setup & Lobby

All Technical Context items are known (brownfield starter with a fixed stack and explicit
constraints). No `NEEDS CLARIFICATION` markers remained after `/speckit-clarify`. This document
records the decisions that shape Phase 1.

## Decision 1 — Host identity

- **Decision**: Store `hostId` on the `Room`, set to the creator's participant id at `createRoom`.
  The snapshot exposes `hostId` and a derived per-participant `isHost` so any client can identify the
  host without extra requests.
- **Rationale**: Minimal, deterministic, and matches "creator is host" (FR-002, Assumptions). Uses the
  already-generated participant id; no auth needed.
- **Alternatives considered**: Mark host by participant index 0 (fragile if list ordering ever
  changes); separate host registry (more state than needed).

## Decision 2 — Room status lifecycle

- **Decision**: Extend `RoomStatus` from `"lobby"` to `"lobby" | "started"`. `started` is set only by
  the start endpoint.
- **Rationale**: The clarification scoped start to a status flip + navigation (FR-017, FR-018).
  Two states are the smallest change that supports lobby→game transition and polling-based detection.
- **Alternatives considered**: Richer status enum (e.g., `in_round`, `ended`) — premature; those
  belong to Groups 3–4.

## Decision 3 — Start enforcement location

- **Decision**: Enforce host-only and ≥2-player rules **server-side** in `roomStore.startRoom` /
  the route handler. UI also disables the control, but the server is the source of truth.
- **Rationale**: Constitution Principle IV (validation at the edge) and FR-014 ("not merely hidden in
  the UI"). A non-host direct request must be rejected (403).
- **Alternatives considered**: UI-only gating — rejected; trivially bypassable and violates the spec.

## Decision 4 — Synchronization via polling

- **Decision**: Lobby uses `setInterval(~2000ms)` to `GET /rooms/:code`; interval cleared on unmount.
  Start detection is "next poll sees `status === started` → navigate to `/game`".
- **Rationale**: WebSockets are forbidden (Principle V). Polling already exists conceptually (manual
  refresh) — we automate it. ~2s satisfies SC-003 and FR-009.
- **Alternatives considered**: Long-polling / SSE — out of scope and unnecessary at this scale.

## Decision 5 — Code normalization & display

- **Decision**: Normalize submitted codes at the edge (trim + uppercase) before lookup; always display
  the canonical uppercase code in the lobby.
- **Rationale**: FR-005, FR-005a. The starter already uppercases in route params and the join page;
  we make it explicit and consistent and reject empty/whitespace codes.
- **Alternatives considered**: Preserve user-typed casing — rejected; ambiguous for sharing.

## Decision 6 — Multi-room isolation

- **Decision**: Keep the keyed `Map<code, Room>`; add a test proving an action in room A never mutates
  room B. No structural change needed.
- **Rationale**: The starter already isolates by key; the spec requires it be *verified* (FR-008,
  SC-005), not redesigned.
- **Alternatives considered**: Namespacing/partitioning — unnecessary.

## Decision 7 — startRoom discriminated result + idempotent re-start

- **Decision**: `startRoom` returns `{ ok, reason? }` at the store layer; routes map to 404/403/422.
  If the room is already `started`, return success with the current room (idempotent).
- **Rationale**: Keeps HTTP mapping in one place; avoids race/double-click errors when the host clicks
  Start twice or polls after navigating.
- **Alternatives considered**: Always 409 on re-start — harsher UX with no spec requirement.

## Resolved Unknowns

None outstanding. Ready for Phase 1 design and `/speckit-tasks`.
