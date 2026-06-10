# Research: Room Setup & Lobby

## Overview

All technical context was resolved from the existing codebase. No external research was needed.

## Decisions

### Room Code Generation
- **Decision**: 4-character alphanumeric code using `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes confusable characters: 0/O, 1/I/L)
- **Rationale**: Short codes for easy sharing; collision-resistant via uniqueness loop; existing codebase already uses this pattern
- **Alternatives considered**: UUID (too long for manual entry), 6-char codes (unnecessary with low collision probability)

### Host Tracking
- **Decision**: Add `hostId` to `Room` model; first participant is automatically the host
- **Rationale**: Explicit host tracking vs relying on array position; enables future host reassignment
- **Alternatives considered**: Role field on Participant (adds complexity since role is already used for drawer/guesser)

### Duplicate Name Handling
- **Decision**: Check for unique display names at join time; reject with 409 Conflict if name taken
- **Rationale**: FR-012 requires unique names within a room; existing store returns null for failures, so extend with typed error
- **Alternatives considered**: Auto-suffix (could confuse players), client-side check (race condition)

### Room Cleanup
- **Decision**: Set-based interval running every 60s, checking `updatedAt` against 5-min threshold
- **Rationale**: Simple, bounded memory; aligns with FR-011
- **Alternatives considered**: Per-room TTL (more precise but more complex), LRU eviction (unnecessary)

### Polling Mechanism
- **Decision**: Frontend `useEffect` with `setInterval` calling `fetchRoom` every ~2s; cleanup on unmount
- **Rationale**: Aligns with FR-007 and existing store pattern; no new dependencies
- **Alternatives considered**: `useSyncExternalStore` with external timer (over-engineered for lobby polling)

### Start Game Enforcement
- **Decision**: Backend validates host status and player count; returns 403/400; frontend shows error message
- **Rationale**: Security (backend is source of truth) + UX (immediate feedback)
- **Alternatives considered**: Frontend-only (bypassable), backend-only (slower UX)
