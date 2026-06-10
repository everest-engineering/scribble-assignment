# Data Model: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10

## Changed Types

### Participant (backend: `backend/src/models/game.ts`)

```typescript
// Before
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

// After
export interface Participant {
  id: string;
  name: string;       // always trimmed; never empty
  joinedAt: string;
  isHost: boolean;    // true for room creator; false for all others
}
```

**Validation rules**:
- `name`: trimmed before storage; MUST be non-empty after trim
- `isHost`: set once at participant creation; never mutated

### Participant (frontend: `frontend/src/services/api.ts`)

Mirror the backend change:

```typescript
// Before
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

// After
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}
```

### RoomSnapshot (backend: `backend/src/models/game.ts` & `frontend/src/services/api.ts`)

No structural change to `RoomSnapshot` itself — `participants` already contains
`Participant[]`, so adding `isHost` to `Participant` propagates automatically.

## Unchanged Types

| Type | File | Notes |
|------|------|-------|
| `Room` | `backend/src/models/game.ts` | No change; stores `Participant[]` |
| `RoomStatus` | `backend/src/models/game.ts` | Stays `"lobby"` for Scenario 1 |
| `RoomSessionResponse` | both | Unchanged structure |
| `RoomState` | `frontend/src/state/roomStore.ts` | Unchanged |

## Backend Store Changes (`backend/src/services/roomStore.ts`)

`createParticipant` gains an `isHost` parameter:

```typescript
// Before
function createParticipant(name?: string): Participant

// After
function createParticipant(name: string, isHost: boolean): Participant
```

- `createRoom()` calls `createParticipant(trimmedName, true)`
- `joinRoom()` calls `createParticipant(trimmedName, false)`
- The `displayName()` fallback is removed — name is required and validated by
  Zod before reaching the store

## Schema Changes (`backend/src/api/schemas.ts`)

```typescript
// Before
export const createRoomSchema = z.object({ playerName: z.string().optional() });
export const joinRoomSchema   = z.object({ playerName: z.string().optional() });

// After
export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});
export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});
```

Zod validation errors are caught by the existing `next(error)` error handler in
`rooms.ts` and result in a 422 response with a `message` field the frontend can
display.

## Frontend Store Changes (`frontend/src/state/roomStore.ts`)

New method `pollRoom()` added to `RoomStore`:

```typescript
// Silent poll — does NOT set isLoading
async pollRoom() {
  if (!this.state.room) return null;
  try {
    const response = await api.fetchRoom(
      this.state.room.code,
      this.state.participantId ?? undefined
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    this.setState({ error: message });
    return null;
  }
}
```

Existing `fetchRoom()` (which uses `withLoading`) is retained for the initial
mount load.

## State Flow

```
CreateRoomPage submit
  → frontend validates: trim name, reject empty → inline error if blank
  → POST /rooms { playerName }
  → backend Zod validates: trim, min(1)
  → roomStore.createRoom(name, isHost=true)
  → RoomSessionResponse { participantId, room: { participants: [{ isHost: true, ... }] } }
  → LobbyPage renders: host indicator on creator; Start Game disabled (count=1)

JoinRoomPage submit
  → frontend validates: trim name, trim+uppercase code, reject empty name
  → POST /rooms/:code/join { playerName }
  → backend: 404 if code unknown → frontend inline error "Room not found…"
  → roomStore.joinRoom(name, isHost=false)
  → LobbyPage renders: no Start Game button (not host)

LobbyPage mount (host tab)
  → initial fetchRoom() with withLoading → isLoading shown
  → on response: schedule pollRoom() after 2 000 ms
  → poll response: update participants silently (no isLoading)
  → once participants.length ≥ 2: Start Game enabled
  → unmount: clearTimeout → polling stops
```
