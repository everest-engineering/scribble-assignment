# Data Model: Room Setup & Lobby

## Overview

This document defines the data entities and state shapes for Scenario 1.

---

## Backend Entities

### Room

```typescript
interface Room {
  code: string;              // 4-6 alphanumeric, lowercase, unique
  hostId: string;            // player ID of the room creator
  participants: Player[];    // ordered list of players currently in the room
  gameState: GameState;      // lifecycle state of the room
  createdAt: number;         // ISO timestamp when room was created
}

type GameState = "lobby" | "inProgress" | "finished";
```

**Lifecycle**:
- Created with `gameState: "lobby"`
- Transitions to `"inProgress"` when host clicks Start (Scenario 2)
- Transitions to `"finished"` at end of round (Scenario 4)
- Returns to `"lobby"` on restart (Scenario 4)

### Player

```typescript
interface Player {
  id: string;      // unique within the room, generated server-side
  name: string;    // trimmed, non-empty (1-100 chars, reasonable limit)
  isHost: boolean; // true if this player created the room
}
```

**Constraints**:
- `name` must not be empty or whitespace-only
- `name` is trimmed before storage (no leading/trailing spaces)
- `name` can contain any UTF-8 character (no artificial restrictions)
- `isHost` is set to `true` for the creator, `false` for joiners

---

## RoomStore (Backend Service)

The in-memory store maintains all active rooms and provides query/mutation operations.

```typescript
class RoomStore {
  private rooms: Map<string, Room> = new Map();
  
  // Queries
  getRoom(code: string): Room | undefined
  roomExists(code: string): boolean
  
  // Mutations (return updated room or throw error)
  createRoom(playerName: string): { code: string; room: Room; playerId: string }
  joinRoom(code: string, playerName: string): { room: Room; playerId: string }
  
  // Helpers
  private generateCode(): string // 4-6 alphanumeric, unique
  private generatePlayerId(): string // UUID v4 or similar
}
```

**Invariants**:
- All rooms are keyed by lowercase code
- Every room has exactly one host (`isHost: true`)
- No two participants in a room have the same `id`
- Participant list order is preserved (insertion order)
- Room codes are unique across all rooms

---

## Frontend State (Zustand roomStore)

The frontend store manages the current user's room context and polling state.

```typescript
interface RoomState {
  // Current Room Context
  currentCode: string | null;      // room code of the player's current room
  currentPlayerId: string | null;   // the player's own ID in the current room
  isHost: boolean;                  // whether current player is the host
  participants: Player[];           // list of all players in the current room
  
  // Polling State
  isPolling: boolean;               // whether polling is active
  lastPollTime: number | null;      // timestamp of last successful poll
  pollError: string | null;         // error message if last poll failed
  
  // Actions
  createRoom: (playerName: string) => Promise<void>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startPolling: (code: string, playerId: string) => void;
  stopPolling: () => void;
  _setParticipants: (participants: Player[]) => void;  // internal, called by polling
  _setPollingError: (error: string | null) => void;    // internal
}
```

**Flow**:
1. User creates or joins a room → `createRoom()` or `joinRoom()` sets `currentCode`, `currentPlayerId`, `isHost`
2. Component mounts Lobby → calls `startPolling(code, playerId)`
3. Polling runs in background, every ~2s fetches room state and calls `_setParticipants()`
4. User leaves room or game starts → `stopPolling()` clears polling state
5. User navigates away → component unmounts, polling stopped via cleanup

---

## API Response Shapes

### POST /rooms (Create Room)

**Request**:
```typescript
{ playerName: string }
```

**Response (200)**:
```typescript
{
  code: string;
  hostId: string;
  participants: Player[];
  playerId: string;  // the creator's ID in this room
}
```

**Error (400)**:
```typescript
{ error: "Player name is required" }
```

---

### POST /rooms/:code/join (Join Room)

**Request**:
```typescript
{ playerName: string }
```

**Response (200)**:
```typescript
{
  code: string;
  participants: Player[];
  playerId: string;    // the joiner's ID in this room
  isHost: boolean;     // false (always false for joiners)
}
```

**Error (404)**:
```typescript
{ error: "Room not found" }
```

**Error (400)**:
```typescript
{ error: "Player name is required" }
```

---

### GET /rooms/:code (Get Room State)

**Response (200)**:
```typescript
{
  code: string;
  hostId: string;
  participants: Player[];
  gameState: GameState;
}
```

**Error (404)**:
```typescript
{ error: "Room not found" }
```

---

## State Transitions

### Room Lifecycle (Per Scenario)

```
┌─────────────────────────────────────────────────────────────┐
│ Scenario 1: Room Setup & Lobby (this feature)               │
│                                                              │
│  createRoom()           joinRoom()                           │
│       │                     │                                │
│       └──────────┬──────────┘                                │
│                  ▼                                           │
│           [LOBBY STATE]  ← polling updates participants     │
│                  │                                           │
│                  │ host clicks Start (iff ≥2 players)       │
│                  ▼                                           │
│          [OUT OF SCOPE FOR SCENARIO 1]                     │
└─────────────────────────────────────────────────────────────┘
```

### Player Lifecycle

```
┌────────────────────────────────────────────────┐
│ Player State in Room                           │
│                                                │
│ Created via createRoom() or joinRoom()         │
│    ▼                                           │
│ Active in participants[]                       │
│    │                                           │
│    ├─── (polling updates isHost, etc.)         │
│    │                                           │
│    └─► leaveRoom() (not yet implemented)      │
└────────────────────────────────────────────────┘
```

---

## Constraints & Assumptions

1. **Unique Codes**: Room codes are 4-6 alphanumeric characters, globally unique, case-insensitive.
2. **No Duplicate Participants**: If a player attempts to join a room they are already in, their entry is updated (not duplicated).
3. **Synchronous Operations**: All room mutations are synchronous; no race conditions in in-memory store.
4. **Name Constraints**: Player names are 1-100 characters, trimmed, non-empty.
5. **Player Persistence**: Players persist in room state until the room is destroyed (backend restart).
6. **No User Identification**: Players are anonymous; only names and IDs within the room context.

