# Data Model: Host Tracking on Room Creation

**Phase**: 1 | **Date**: 2026-07-05 | **Input**: Research findings + feature spec

## Changes

### Backend: `backend/src/models/game.ts`

```typescript
// Participant — added isHost field
export interface Participant {
  id: string;           // UUID v4
  name: string;         // Display name (defaults to "Player")
  joinedAt: string;     // ISO-8601 timestamp
  isHost: boolean;      // NEW: true only for the room creator
}

// Room — added hostId field
export interface Room {
  code: string;               // 4-char uppercase alphanumeric
  status: RoomStatus;         // Currently only "lobby"
  hostId: string;             // NEW: participant ID of the host
  participants: Participant[];
  createdAt: string;          // ISO-8601
  updatedAt: string;          // ISO-8601
}
```

No changes to `RoomSnapshot`, `RoomStatus`, `ParticipantRole`, or `RoomSessionResponse`.

### Frontend: `frontend/src/services/api.ts`

```typescript
// Participant — added isHost field matching backend
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;      // NEW
}
```

No changes to `RoomSnapshot`, `RoomSessionResponse`, or other types.

## Field Details

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Room | hostId | string | Yes | Participant ID of the host. Set once at creation, never changes. |
| Participant | isHost | boolean | Yes | `true` for the creator, `false` for all joiners. |

## State Transitions

- **Room Created**: `hostId` = creator's participant ID. Creator's `isHost` = `true`.
- **Player Joins**: New participant's `isHost` = `false`. Room's `hostId` unchanged.
- **Room lifetime**: `hostId` and `isHost` are immutable — never transferred or cleared within the scope of this feature.

## Validation Rules

- `hostId` MUST be a valid participant ID (must match exactly one participant in the room).
- `isHost` MUST be `true` for exactly one participant in any room at all times.
