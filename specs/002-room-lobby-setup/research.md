# Research: Room Setup & Lobby

## Overview

Feature adds host designation, room joining validation, auto-polling lobby refresh, and host-only game start. All implementation falls within the existing tech stack (Express + React + Vite + Zod + Vitest). No new technologies needed.

## Key Design Decisions

### Host Tracking

- **Decision**: Add `isHost: boolean` to `Participant` model rather than a separate `hostId` on Room.
- **Rationale**: The existing `Participant[]` array is the single source of truth for room membership. Marking the host as a participant property keeps the schema flat and avoids stale-host-pointer bugs if the host changes.
- **Alternatives considered**: 
  - `hostId: string` on Room (rejected: requires cross-referencing with participants array, extra validation on mutation)
  - `hostIndex: number` on Room (rejected: fragile against participant reordering)

### Rate Limiting Strategy

- **Decision**: Per-session counters stored in-memory using a `Map<string, RateLimitEntry>` keyed by participant ID (or anonymous session token for pre-join).
- **Rationale**: No database available (constitutional constraint). In-memory counters are simple and sufficient for this scale (<100 concurrent users). Window-based (sliding 60s) rather than fixed-minute to avoid burst-at-boundary behavior.
- **Alternatives considered**: IP-based tracking (rejected: multiple players behind same NAT would share limits), no rate limiting (rejected per spec FR-016/FR-017).

### Duplicate Name Discrimination

- **Decision**: Append suffix ` (N)` where N is the next available integer starting from 2, computed during `joinRoom` in `roomStore.ts`.
- **Rationale**: Server-side enforcement guarantees consistency across all polling clients. Using `(2)`, `(3)` etc. is the most recognizable disambiguation pattern.
- **Alternatives considered**: Client-side rename prompt (rejected: breaks automated testing, inconsistent across views), UUID suffix (rejected: ugly UX).

### Auto-Polling Mechanism

- **Decision**: `setInterval` in `RoomStore` class, started on `createRoom`/`joinRoom` success, cleared on unmount via `useEffect` cleanup.
- **Rationale**: The existing store already exposes `fetchRoom()`. Adding an interval wrapper keeps the pattern consistent with the existing `withLoading` helper. 2-second interval matches spec.
- **Alternatives considered**: `setTimeout` recursive chain (more complex cleanup), frontend timer in component (mixes concerns).

### Host-Only Game Start Enforcement

- **Decision**: Both client-side (hide/disable button for non-hosts) and server-side (`POST /rooms/:code/start` rejects non-host with 403).
- **Rationale**: The spec requires enforcement "both in the UI and on the server" (SC-006). Client-side prevents accidental clicks; server-side prevents malicious requests.
- **Alternatives considered**: Client-side only (rejected: insecure), server-side only (worse UX).

### Room Cleanup on Host Leave

- **Decision**: When host disconnects, transfer host to the participant who has been in the room longest. If no other participants remain, mark room as available for garbage collection (next poll that finds empty room removes it).
- **Rationale**: Clarification resolved "no expiration" for active rooms. Transferring host keeps the room playable. Empty room cleanup prevents unbounded memory growth.
- **Alternatives considered**: Disband room on host leave (rejected: disruptive to other players who joined).
