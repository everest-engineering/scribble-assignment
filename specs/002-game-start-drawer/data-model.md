# Data Model: Game Start & Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-31

## Backend Models (`backend/src/models/game.ts`)

### Room (extended)
```ts
export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;    // ADDED — null in lobby, set to hostId on game start
  secretWord: string | null;  // ADDED — null in lobby, set to STARTER_WORDS[0] on start
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

### RoomSnapshot (extended)
```ts
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;  // ADDED — always present, not secret
  secretWord?: string;      // ADDED — present only when viewer === drawer (omitted otherwise)
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## Backend Service (`backend/src/services/roomStore.ts`)

### startRoom() — extended
```ts
// Before (Scenario 1):
return saveRoom({ ...room, status: "game" });

// After (Scenario 2):
return saveRoom({
  ...room,
  status: "game",
  drawerId: room.hostId,
  secretWord: STARTER_WORDS[0]
});
```

### toRoomSnapshot() — extended
```ts
// viewerParticipantId was accepted but ignored (void viewerParticipantId)
// Now used to conditionally include secretWord:

const isDrawer = viewerParticipantId !== undefined &&
                 viewerParticipantId === room.drawerId;

return {
  code: room.code,
  hostId: room.hostId,
  drawerId: room.drawerId ?? null,
  ...(isDrawer && room.secretWord ? { secretWord: room.secretWord } : {}),
  status: room.status,
  participants: ...,
  availableWords: ...,
  roles: ...
};
```

## Frontend Types (`frontend/src/services/api.ts`)

### RoomSnapshot (extended)
```ts
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;  // ADDED
  secretWord?: string;      // ADDED — optional; present only for the drawer
  status: "lobby" | "game";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## State Transitions (addition to Scenario 1)

```
Game starts (POST /rooms/:code/start):
  room.drawerId  = room.hostId
  room.secretWord = STARTER_WORDS[0]  ("rocket")
  room.status    = "game"

GET /rooms/:code?participantId=<drawerId>:
  → snapshot includes secretWord: "rocket"

GET /rooms/:code?participantId=<other>:
  → snapshot omits secretWord entirely

GET /rooms/:code (no participantId):
  → snapshot omits secretWord entirely
```

## Validation Rules

| Field | Rule | Layer |
|-------|------|-------|
| `drawerId` | Set to `hostId` on start; `null` before start | Backend only |
| `secretWord` | Set to `STARTER_WORDS[0]` on start; only returned to drawer | Backend only |
| `secretWord` in snapshot | Omitted (key absent) for non-drawers | Backend (`toRoomSnapshot`) |
