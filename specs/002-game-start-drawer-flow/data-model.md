# Data Model: Game Start and Drawer Flow

## Overview

Extends the existing Room and Participant entities with game state: drawer assignment, secret word tracking, and role-aware view projections.

## Entities

### Participant (unchanged)

```typescript
interface Participant {
  id: string;          // UUID, assigned on join
  name: string;        // Display name, trimmed, validated, case-sensitive unique
  joinedAt: string;    // ISO timestamp — used for drawer assignment ordering
}
```

### Room (extended)

```typescript
interface Room {
  code: string;              // 4-char alphanumeric code
  status: RoomStatus;        // "lobby" | "playing"
  hostId: string;            // Participant ID of the room creator
  participants: Participant[];
  drawerId: string | null;   // NEW: Participant ID of current drawer
  secretWord: string | null; // NEW: Current secret word (never sent to guessers)
  createdAt: string;
  updatedAt: string;
}

type RoomStatus = "lobby" | "playing";
```

### RoomSnapshot (extended — API response shape)

```typescript
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;           // NEW: drawer's participant ID
  yourRole: "drawer" | "guesser";    // NEW: computed per viewer
  secretWord?: string;                // NEW: only present when yourRole === "drawer"
}
```

### ParticipantRole (unchanged)

```typescript
type ParticipantRole = "drawer" | "guesser";
```

## Validation Rules

| Field | Rule | Location |
|-------|------|----------|
| `Participant.name` | Trimmed, 1-20 chars, no duplicate names (case-sensitive) in same room | Zod schema + service layer |
| `Room.drawerId` | Must match a participant ID in the room | Invariant maintained by service |
| `Room.secretWord` | Must be a word from the word pool | Service selects deterministically |
| `Room.status` | Transitions: `"lobby"` → `"playing"` (start game); stuck at `"playing"` (single round) | Service layer |

## State Transitions

```
Room status flow:
  "lobby" ──[startGame]──→ "playing"
    ↑                          │
    └────[all leave]───────────┘  (room implicitly cleaned up)

Drawer transitions:
  null ──[startGame]──→ first-joined participant
  first-joined ──[drawer leaves]──→ next longest-joined participant
  next ──[drawer leaves]──→ next (repeat)
  last ──[last leaves]──→ null (room ends)

Secret word transitions:
  null ──[game start / drawer reassign]──→ word from pool
```

## Deterministic Functions

### `pickDrawer(participants: Participant[]): string`
Returns the participant ID of the participant with the earliest `joinedAt` timestamp.

### `pickWord(roomCode: string, participantIds: string[], wordPool: string[]): string`
Returns a word from `wordPool` using a deterministic hash: compute `hashCode(roomCode + participantIds.join(","))`, modulo `wordPool.length`.

### `hashCode(str: string): number`
Simple string hash (djb2 or similar) that produces the same output for the same input every time.
