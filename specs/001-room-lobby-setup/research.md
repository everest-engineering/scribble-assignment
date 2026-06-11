# Research: Room Setup & Lobby

**Phase**: 0 — Outline & Research
**Date**: 2026-06-11
**Spec**: [spec.md](./spec.md)

## Decisions

### Host Tracking Without Authentication

- **Decision**: Store `hostId` (participantId string) on the Room entity.
- **Rationale**: The constitution forbids authentication. The participantId
  returned from room creation is the only viable identity token. The frontend
  compares the stored participantId against the room's hostId to conditionally
  render host controls.
- **Alternatives considered**: Storing host as a boolean flag on Participant
  (rejected — would need to update when host changes); using a separate host
  code/pin (rejected — too complex for lab scope).

### Room Code Format

- **Decision**: 4-character alphanumeric, excluding ambiguous characters
  (0/O, 1/I). Generated server-side using the existing `generateCode` function.
- **Rationale**: Existing starter convention. Short enough to type manually,
  unambiguous charset reduces input errors.
- **Alternatives considered**: 6-digit numeric (rejected — harder to remember);
  UUID (rejected — not suitable for manual entry).

### Polling Mechanism

- **Decision**: Frontend uses `setInterval` (~2000ms) to call `GET /rooms/:code`.
  Silent retry on failure — no UI disruption, stale state preserved.
- **Rationale**: Clarified during spec review. The constitution mandates HTTP
  polling (no WebSockets). Silent retry provides the best UX for transient
  network issues.
- **Alternatives considered**: `requestAnimationFrame` loop (rejected — overkill
  for 2s interval); WebSocket (forbidden by constitution); showing error banner
  (rejected during clarification — silent retry preferred).

### Start Game Transition

- **Decision**: Dedicated `POST /rooms/:code/start` endpoint. Room status
  transitions from `"lobby"` to `"playing"`. All polling clients detect the
  status change and navigate to the game screen.
- **Rationale**: REST semantics — a POST action represents a state transition.
  Existing GET polling naturally picks up the new status on the next cycle.
- **Alternatives considered**: PATCH on room (rejected — implicit, harder to
  reason about); client-side only navigation (rejected — no backend enforcement
  of host-only or 2-player minimum).

### Duplicate Participant Detection

- **Decision**: No duplicate detection in this iteration. The same browser can
  open multiple tabs and join the same room as distinct participants.
- **Rationale**: The clarification question was not answered before proceeding
  to planning. Defaulting to permissive behavior avoids unnecessary complexity.
  Tabs are distinct browser contexts and will receive different participantIds.
- **Alternatives considered**: Block by display name (deferred); block by
  participantId (pointless — lost on refresh).

## Key Findings

1. All technical context fields are derivable from the existing codebase and
   constitution. No NEEDS CLARIFICATION markers remain.
2. The existing `roomStore.ts` already has `createRoom`, `joinRoom`, `getRoom`,
   and `saveRoom`. Only `saveRoom` is dead code — it should be wired to the
   `startGame` action.
3. The frontend `roomStore.ts` uses `useSyncExternalStore` — polling state needs
   to be added without breaking the reactive subscription pattern.
