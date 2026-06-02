# Research: Room Setup & Lobby

**Feature**: Room Setup & Lobby
**Date**: 2026-06-02

---

## Decision 1: Host Identity Storage

**Decision**: Add a `hostId` field (participant UUID) to the backend `Room` model and include it in `RoomSnapshot` so the frontend can determine whether the current user is the host.

**Rationale**: The starter `Room` model has no concept of a host. The simplest approach is a single string field set at room creation time and never changed. The frontend already receives and stores the participant's own `participantId` from the create/join response — comparing it to `hostId` from the snapshot is sufficient to gate the Start Game button without any additional auth mechanism.

**Alternatives considered**:
- Boolean `isHost` per participant — rejected; requires iterating participants and is harder to query.
- Session/token-based host assertion — rejected; out of scope per constitution (no auth).

---

## Decision 2: Lobby Polling Strategy

**Decision**: Use a `setInterval` inside a `useEffect` in `LobbyPage.tsx`, calling `api.fetchRoom()` every 2000ms. The interval is cleared when the component unmounts.

**Rationale**: The starter's `GET /rooms/:code` endpoint already returns a full room snapshot. Polling it at ~2s delivers the required participant-list freshness. WebSockets are explicitly out of scope per the constitution. No new library is needed — this is idiomatic React with the existing `fetch`-based API client.

**Alternatives considered**:
- React Query / SWR polling — rejected; introducing a new state-management library is out of scope per constitution (Principle IV).
- Long polling — rejected; adds backend complexity for marginal gain at this scale.

---

## Decision 3: Start Game Endpoint

**Decision**: Add `POST /rooms/:code/start` to the backend. The handler reads `participantId` from the request body, looks up the room, and rejects (403) if the caller is not the `hostId`. On success it transitions the room `status` from `"lobby"` to `"active"` and returns the updated snapshot.

**Rationale**: The frontend gate (disabled button) is a UX convenience only per the spec (FR-010). Backend enforcement is mandatory. A new endpoint is the cleanest addition without touching existing handlers.

**Alternatives considered**:
- Repurposing `PUT /rooms/:code` — rejected; no such endpoint exists and adding a general update endpoint is broader than needed.
- Passing `participantId` as a query parameter — rejected; sensitive identity data belongs in the request body, not the URL.

---

## Decision 4: Input Validation Location

**Decision**: Trim and validate player name and room code on the frontend before submission (immediate feedback) and on the backend via Zod schemas (authoritative gate).

**Rationale**: Frontend validation (FR-003, FR-004) gives instant feedback; backend validation ensures the API cannot be called with invalid data directly. Zod is already used for all existing request schemas.

**Alternatives considered**:
- Frontend only — rejected; API can be called directly, bypassing checks.
- Backend only — rejected; degrades UX with a round-trip for an obviously empty field.

---

## Decision 5: Room Code Case Handling

**Decision**: Normalise room codes to uppercase in the backend `joinRoom` handler before lookup. Frontend inputs are also uppercased on change for clarity.

**Rationale**: The starter generates codes from an uppercase alphabet. Case-insensitive matching per the spec edge cases is cleanest achieved by normalisation at the point of entry rather than a case-insensitive Map lookup.

**Alternatives considered**:
- Lowercase normalisation — rejected; generated codes are uppercase, uppercase is more readable for short codes.
- Case-sensitive match — rejected; violates spec edge-case requirement.
