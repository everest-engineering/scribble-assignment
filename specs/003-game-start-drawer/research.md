# Research: Game Start & Drawer Flow

**Phase 0 output** | **Date**: 2026-05-30

## Overview

All spec ambiguities were resolved during the `/speckit.clarify` session (4 questions answered). No `NEEDS CLARIFICATION` markers remain. This document consolidates the decisions and existing codebase patterns that inform the design.

## Clarification Decisions

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Invalid name remediation | "Awaiting rename" state — inline text input for the invalid player; game proceeds once all names valid without host retry | Avoids disruptive lobby round-trips; keeps the flow smooth |
| Secret word delivery | Server-side filtering — word included only in responses for the drawer's session | Security: prevents word from appearing in network tab or devtools for non-drawers |
| Non-host start attempt | Start button hidden/disabled for non-host players | Preventive UX — no failed request needed |
| Late join after game start | Spectator mode — late joiners see the game but not the current word; no guessing in active round | Fair play guarantee; minimum viable spectator support |

## Existing Patterns & Dependencies

### Backend: roomStore.ts

- Rooms stored in `Map<string, Room>`; snapshots via `structuredClone` via `toRoomSnapshot(room, viewerParticipantId?)`
- `startGame(code, participantId)` validates host status and minimum 2 players, then sets `room.status = "playing"`
- `toRoomSnapshot` already accepts `viewerParticipantId` — can be used for per-viewer word filtering
- Rate limiting per IP (5 create/min, 10 join/min) in `rateLimitMap`

### Backend: models/game.ts

```typescript
type RoomStatus = "lobby" | "playing"
interface Participant { id: string; name: string; joinedAt: string; isHost: boolean }
interface Room { code: string; status: RoomStatus; participants: Participant[]; createdAt: string; updatedAt: string }
interface RoomSnapshot { ...; availableWords: string[]; roles: Record<string, ParticipantRole> }
```

### Backend: seed/starterData.ts

```typescript
export const STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"] as const
// Only 5 words — needs expansion to at least 10 per spec assumption
```

### Frontend: roomStore.ts

- Custom class-based store with `useSyncExternalStore` for reactivity
- Polling at 2s interval in lobby via `startPolling()` / `stopPolling()`
- `startGame()` method already exists; delegates to `api.startGame()`
- State model: `{ room, participantId, error, isLoading, pollError }`

### Frontend: api.ts

- `api.fetchRoom(code, participantId)` → `GET /rooms/:code?participantId=...`
- `api.startGame(code, participantId)` → `POST /rooms/:code/start`
- All domain types re-exported from `api.ts` (`RoomSnapshot`, etc.)

## Technology Patterns

- **Validation**: Zod schemas defined in `schemas.ts`, validated in route handlers before service calls
- **Error handling**: `HttpError` class with `statusCode`; centralized error handler in `router.ts`
- **Frontend state**: Class-based store with `subscribe`/`getSnapshot` pattern
- **API responses**: JSON with `roomCode`, `participantId`, and `RoomSnapshot` structure

## Key Design Decisions

1. **Extend `RoomStatus` with `"awaiting_rename"`** — a new intermediate state between "lobby" and "playing". The room enters this state when the host triggers start but a player has an invalid name. Polling responses during this state include the rename prompt target.
2. **Add `currentRound` to `Room`** — a `Round` object containing `roundNumber`, `drawerId`, and `word`. Only `roundNumber` and `drawerId` are exposed in the shared snapshot; `word` is added server-side only for the drawer's snapshot.
3. **Word selection** — `STARTER_WORDS[0]` for round 1 (deterministic, per spec assumption). Expand starter list to 10+ words.
4. **`toRoomSnapshot` filtering** — extend the existing method to conditionally include `currentWord` when `viewerParticipantId` matches the drawer.
5. **No new dependencies** — all changes use existing Express, Zod, React, and Vite tooling.
