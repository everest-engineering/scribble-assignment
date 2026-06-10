# Research: Room Setup & Lobby

## Polling Strategy

**Decision**: `setInterval` in a React `useEffect` with cleanup on unmount, polling every 2000 ms.

**Rationale**: No WebSockets are allowed (constitution + AGENTS.md). `setInterval` is the simplest
HTTP-polling primitive; wrapping it in `useEffect` with a cleanup return ensures the interval is
cleared when the component unmounts, preventing memory leaks and stale updates.

**Alternatives considered**:
- Long-polling: more complex server implementation, no meaningful benefit over short-interval
  polling for this scale.
- Recursive `setTimeout`: functionally equivalent, marginally more control over drift; overkill
  here.

## Host Identity

**Decision**: Add a `hostId` field (participant UUID) to the `Room` model. Populated at room
creation time with the creator's participant id.

**Rationale**: The host must be identifiable on the backend so the `GET /rooms/:code` snapshot can
include it, allowing the frontend to show/hide the Start button based on whether
`participantId === room.hostId`.

**Alternatives considered**:
- Always treat `participants[0]` as host: fragile if the array order changes; not explicit.
- Store a boolean `isHost` on Participant: requires updating all participants on every state
  change; more complex.

## Name Validation

**Decision**: Validate on both client (immediate feedback) and server (authoritative rejection).
Trim whitespace before the empty check. Return HTTP 422 with `{ message: "Name cannot be empty." }`
on server rejection.

**Rationale**: Client validation gives instant UX feedback; server validation is the constitution-
required boundary check. Zod `.trim().min(1)` covers both in a composable way on the backend.

## Room Code Case-Insensitivity

**Decision**: Uppercase the incoming code in the join handler before the map lookup.

**Rationale**: The code generator produces uppercase-only codes; uppercasing on lookup is a
one-liner that covers mobile keyboards that auto-lowercase input.

## API Base URL Bug

**Decision**: Fix `VITE_API_URL ?? "http://localhost:3001/bug"` → `"http://localhost:3001/api"`.

**Rationale**: The `/bug` suffix is a known defect discovered during discovery (see
`DISCOVERY_NOTES.md`). All API calls currently fail because of this typo.
