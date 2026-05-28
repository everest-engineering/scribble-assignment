# Data Model: Game Start and Drawer Flow

## Entities

### Participant
Updated to track assigned role.

```typescript
export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: ParticipantRole | null; // null when in lobby
}
```

### Room
Updated to hold the secret word for the round.

```typescript
export interface Room {
  code: string;
  status: "lobby" | "playing" | "results";
  hostId: string;
  participants: Participant[];
  secretWord: string | null; // Set to "rocket" when game starts
  createdAt: string;
  updatedAt: string;
}
```

### RoomSnapshot (DTO)
Updated to conditionally expose the secret word based on the requester's role.

```typescript
export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "results";
  hostId: string;
  participants: Participant[]; // Includes roles so frontend can render correctly
  secretWord: string | null;   // "rocket" if requester is drawer, null if guesser
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## State Transitions

- **Lobby Phase**: `participant.role` is `null`. `room.secretWord` is `null`.
- **Game Start**: 
  - Host participant gets `role = "drawer"`.
  - All other participants get `role = "guesser"`.
  - `room.secretWord` = `"rocket"`.
