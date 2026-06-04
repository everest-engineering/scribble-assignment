# Data Model: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow` | **Date**: 2026-06-04

---

## Backend Changes (`backend/src/models/game.ts`)

### `Room` interface — extended

```typescript
export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;   // NEW — set to hostId at game start; null in lobby
  currentWord: string | null; // NEW — set at game start; null in lobby
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

### `RoomSnapshot` interface — extended

```typescript
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;   // NEW — always forwarded (not viewer-gated)
  currentWord: string | null; // NEW — viewer-gated: actual word for drawer, null for all others
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

**No other model changes.** `Participant`, `ParticipantRole`, `RoomStatus`, `RoomSessionResponse` are unchanged.

---

## Backend Service Changes (`backend/src/services/roomStore.ts`)

### `createRoom()` — initialise new fields

```typescript
const room: Room = {
  code: generateUniqueCode(),
  hostId: participant.id,
  drawerId: null,       // NEW
  currentWord: null,    // NEW
  status: "lobby",
  participants: [participant],
  createdAt: now(),
  updatedAt: now()
};
```

### `toRoomSnapshot()` — activate `viewerParticipantId` gating

```typescript
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    hostId: room.hostId,
    drawerId: room.drawerId,                           // NEW — always forwarded
    currentWord:                                        // NEW — viewer-gated
      room.drawerId !== null && viewerParticipantId === room.drawerId
        ? room.currentWord
        : null,
    status: room.status,
    participants: room.participants.map((p) => ({ ...p })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
```

### Word selection helper (inline in `POST /:code/start` handler or extracted)

```typescript
function selectWord(code: string): string {
  const index = Array.from(code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}
```

### `POST /:code/start` handler additions (in `backend/src/api/rooms.ts`)

```typescript
room.drawerId = room.hostId;
room.currentWord = selectWord(room.code);
room.status = "playing";
saveRoom(room);
```

---

## Frontend Changes (`frontend/src/services/api.ts`)

### `RoomSnapshot` interface — extended

```typescript
export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;    // NEW
  currentWord: string | null; // NEW
  status: "lobby" | "playing" | "finished";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

No changes to `api.*` methods — `fetchRoom` already passes `participantId` in the query string, which is all that is needed for drawer gating.

---

## State Transitions

```
Room lifecycle:
  createRoom()  → status:"lobby",   drawerId:null, currentWord:null
  POST /start   → status:"playing", drawerId:hostId, currentWord:STARTER_WORDS[idx]
  (Scenario 4)  → status:"finished" / reset to "lobby" — out of scope here
```

---

## Field Invariants

| Field | Lobby | Playing (drawer viewer) | Playing (non-drawer viewer) |
|-------|-------|------------------------|----------------------------|
| `drawerId` | `null` | `hostId` | `hostId` |
| `currentWord` (Room) | `null` | actual word | actual word |
| `currentWord` (Snapshot) | `null` | actual word | `null` |
