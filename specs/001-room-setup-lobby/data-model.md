# Data Model: Room Setup And Lobby

## Entity: Room

Represents a single game session. Rooms are fully isolated from each other.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `code` | `string` | 4-char alphanumeric unique identifier (A-Z, 2-9) | Auto-generated, checked for uniqueness |
| `hostId` | `string` | UUID of the participant who created the room | Set at creation, immutable |
| `status` | `"lobby" \| "playing"` | Current state of the room | Transitions: `lobby` → `playing` (via start) |
| `participants` | `Participant[]` | Players currently in the room | At least 1 (creator), max ~10 |
| `createdAt` | `string` (ISO 8601) | Timestamp of room creation | Auto-set |
| `updatedAt` | `string` (ISO 8601) | Timestamp of last modification | Updated on each mutation |

### State Transitions

```
lobby ──(host clicks start, ≥2 players)──▶ playing
```

### Validation Rules

- Room code is exactly 4 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Room must have at least 1 participant (the host)
- Host cannot be changed after creation
- Room cannot transition to `playing` unless:
  - The requesting player is the host (`participantId === hostId`)
  - At least 2 participants are in the room

## Entity: Participant

Represents a player connected to a room.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` (UUID) | Unique identifier for this session | Auto-generated |
| `name` | `string` | Display name chosen by the player | Defaults to `"Player"` if empty |
| `joinedAt` | `string` (ISO 8601) | When the player joined | Auto-set |

### Relationships

- A **Room** has many **Participants** (1:N)
- A **Participant** belongs to exactly one **Room**
- The **host** is identified by `room.hostId` matching a participant's `id`

## Changes to Existing Types

### Backend (`backend/src/models/game.ts`)

Update `RoomStatus` to include `"playing"`:
```typescript
export type RoomStatus = "lobby" | "playing";
```

Add `hostId` field to `Room`:
```typescript
export interface Room {
  code: string;
  hostId: string;          // NEW
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

Update `RoomSnapshot` to expose host info (for frontend to determine who can start):
```typescript
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;          // NEW
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### Frontend (`frontend/src/services/api.ts`)

Mirror the updated `RoomSnapshot`:
```typescript
export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;          // NEW
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```
