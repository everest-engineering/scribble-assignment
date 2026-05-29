# Data Model: Room Setup and Lobby

## Entities

### Participant
Updated to reflect existing structure plus any needed frontend flags.

```typescript
export interface Participant {
  id: string;        // UUID generated on join
  name: string;      // Trimmed, non-empty name
  joinedAt: string;  // ISO timestamp
}
```

### Room
Extended to track host and status.

```typescript
export type RoomStatus = "lobby" | "playing" | "results";

export interface Room {
  code: string;               // 4-character unique code
  status: RoomStatus;         // Current lifecycle state
  hostId: string;             // Participant.id of the host
  participants: Participant[]; // List of players
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}
```

### RoomSnapshot (DTO)
Used for synchronization via polling.

```typescript
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;             // Needed for frontend UI logic
  availableWords: string[];   // For next phases
  roles: ParticipantRole[];   // For next phases
}
```

## State Transitions

1. **Create Room**: `undefined` → `lobby` (Status initialized to `lobby`, creator assigned as `hostId`).
2. **Start Game**: `lobby` → `playing` (Triggered by host, requires ≥ 2 participants).
3. **Player Leave**: If `leavingPlayer.id === hostId` and `participants.length > 1`, `hostId` is transferred to the next available participant.
