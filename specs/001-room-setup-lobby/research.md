# Research: Room Setup & Lobby

## Overview

All technical decisions are pre-defined by the constitution and existing codebase.
No unresolved NEEDS CLARIFICATION items existed in the spec. This document records
the rationale for each architectural choice.

## Decisions

### Host Tracking Strategy

- **Decision**: Store `hostId` as a participant UUID on the Room model. The
  creator's participant ID is assigned as hostId at room creation.
- **Rationale**: Using UUID-based hostId avoids name collisions and allows host
  reassignment later. Simpler than role-based participant objects.
- **Alternatives considered**: Adding a boolean `isHost` field to each
  participant — rejected because it requires updating all participants on host
  change.

### Room Code Validation

- **Decision**: Validate room codes using Zod with `.length(4)` and
  `.regex(/^[A-Z0-9]+$/)` on the backend. The existing `generateCode` produces
  4-character alphanumeric codes using a safe alphabet (no I/O/0/1).
- **Rationale**: Zod validation on the backend enforces the constitution's
  Strict Input principle. Frontend can provide early feedback but backend is the
  authority.
- **Alternatives considered**: No frontend validation — rejected because it hurts
  UX. Backend-only is the minimum; frontend adds convenience.

### Player Name Validation

- **Decision**: Require non-empty trimmed player names (min 1 character after
  trim, max 50). Existing `z.string().optional()` changed to
  `z.string().min(1).max(50).transform(s => s.trim())`.
- **Rationale**: The spec requires rejection of empty/whitespace names. A max
  length prevents abuse.
- **Alternatives considered**: Unlimited length — rejected as a security concern.

### Polling Mechanism

- **Decision**: Frontend uses `setInterval` at 2000ms calling
  `roomStore.fetchRoom()`. No WebSocket fallback. Polling starts on lobby mount
  and stops on unmount or game start.
- **Rationale**: Constitution Principle III mandates HTTP polling ≤2s.
  `setInterval` is the simplest approach. No exponential backoff needed for a
  lab project.
- **Alternatives considered**: `setTimeout` chaining — functionally equivalent
  but setInterval is simpler for fixed-interval polling.

### Start Game Gate

- **Decision**: Backend endpoint `POST /rooms/:code/start` validates host
  identity (via participantId) and player count (≥2). Frontend disables button
  for non-hosts and shows error.
- **Rationale**: Server-authoritative gate prevents client-side bypass. The
  endpoint checks `participantId` matches `hostId` and participants length ≥ 2.
- **Alternatives considered**: Frontend-only gate — insecure, rejected.

### Room Status Expansion

- **Decision**: Expand `RoomStatus` type from `"lobby"` to
  `"lobby" | "in-progress" | "finished"`. Start-game transitions `lobby →
  in-progress`.
- **Rationale**: The spec mentions game states; start is the first transition.
  Future scenarios will add the remaining transitions.
- **Alternatives considered**: Single `"lobby"` status — insufficient for
  start-game rejection when game is already in progress.

### Join Rejection for Active Games

- **Decision**: `joinRoom` checks `room.status === "lobby"` before allowing
  join. Returns 400 if game is in progress.
- **Rationale**: Spec edge case requires this. Simple status check.
- **Alternatives considered**: Allowing joins during game — spec explicitly
  rejects this.
