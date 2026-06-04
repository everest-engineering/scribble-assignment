# Data Model: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Date**: 2026-06-04

---

## Backend Changes (`backend/src/models/game.ts`)

### New types

```typescript
export type StrokeType = "draw" | "clear";

export interface DrawStroke {
  type: "draw";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
}

export interface ClearStroke {
  type: "clear";
}

export type Stroke = DrawStroke | ClearStroke;

export interface GuessRecord {
  participantId: string;   // internal only — used for cap enforcement; NOT in snapshot
  participantName: string;
  text: string;
  correct: boolean;
}
```

### `Participant` interface — extended

```typescript
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;   // NEW — initialised to 0
}
```

### `Room` interface — extended

```typescript
export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];       // NEW — empty array at creation
  guesses: GuessRecord[];  // NEW — empty array at creation
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
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];                        // NEW — always forwarded, no viewer-gating
  guesses: SnapshotGuessRecord[];           // NEW — always forwarded (no participantId)
  status: RoomStatus;
  participants: Participant[];              // score now included on each entry
  availableWords: string[];
  roles: ParticipantRole[];
}

// Snapshot-safe subset — strips participantId before sending to client
export interface SnapshotGuessRecord {
  participantName: string;
  text: string;
  correct: boolean;
}
```

---

## Backend Service Changes (`backend/src/services/roomStore.ts`)

### `createParticipant()` — add `score: 0`

```typescript
function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    score: 0          // NEW
  };
}
```

### `createRoom()` — initialise `strokes` and `guesses`

```typescript
const room: Room = {
  ...
  drawerId: null,
  currentWord: null,
  strokes: [],    // NEW
  guesses: [],    // NEW
  status: "lobby",
  ...
};
```

### `toRoomSnapshot()` — forward strokes and guesses

```typescript
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    ...
    strokes: room.strokes.map((s) => ({ ...s })),
    guesses: room.guesses.map(({ participantName, text, correct }) => ({
      participantName, text, correct        // strip participantId
    })),
    participants: room.participants.map((p) => ({ ...p })), // score included
    ...
  };
}
```

---

## Backend API Changes (`backend/src/api/schemas.ts`)

```typescript
export const strokeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("draw"),
    participantId: z.string().uuid(),
    x0: z.number(),
    y0: z.number(),
    x1: z.number(),
    y1: z.number(),
    color: z.string(),
    lineWidth: z.number().positive()
  }),
  z.object({
    type: z.literal("clear"),
    participantId: z.string().uuid()
  })
]);

export const guessSchema = z.object({
  participantId: z.string().uuid(),
  guess: z.string().min(1, "Guess must not be empty after trimming")
  // Note: trim() is applied in the handler, not here, per FR-005
});
```

---

## New API Routes (`backend/src/api/rooms.ts`)

### `POST /rooms/:code/strokes`

Validates stroke, checks `room.status === "playing"`, checks
`participantId === room.drawerId` (403 otherwise), appends or clears `room.strokes`,
calls `saveRoom`.

### `POST /rooms/:code/guess`

Validates guess, trims, checks `room.status === "playing"` and `room.currentWord !== null`,
checks `participantId !== room.drawerId` (403), checks participant exists (404), checks
not already-guessed-correctly (400), compares case-insensitively, awards score, appends
to `room.guesses`, calls `saveRoom`. Returns `{ correct: boolean, score: number }`.

---

## Frontend Changes (`frontend/src/services/api.ts`)

```typescript
export interface DrawStroke {
  type: "draw";
  x0: number; y0: number; x1: number; y1: number;
  color: string; lineWidth: number;
}
export interface ClearStroke { type: "clear"; }
export type Stroke = DrawStroke | ClearStroke;

export interface SnapshotGuessRecord {
  participantName: string;
  text: string;
  correct: boolean;
}

// RoomSnapshot extended:
export interface RoomSnapshot {
  ...
  strokes: Stroke[];
  guesses: SnapshotGuessRecord[];
  // participants already includes score via Participant.score
}

// Participant extended:
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}
```

New `api` methods:

```typescript
submitStroke(code: string, stroke: Stroke & { participantId: string }) → Promise<{ room: RoomSnapshot }>
submitGuess(code: string, participantId: string, guess: string) → Promise<{ correct: boolean; score: number }>
```

---

## State Transitions

```
Room.strokes lifecycle:
  createRoom()         → strokes: []
  POST /strokes (draw) → strokes: [...prev, newStroke]
  POST /strokes (clear)→ strokes: []

Room.guesses lifecycle:
  createRoom()         → guesses: []
  POST /guess (any)    → guesses: [...prev, { participantId, participantName, text, correct }]

Participant.score lifecycle:
  createParticipant()  → score: 0
  correct guess        → score += 100
  incorrect guess      → score unchanged
```

---

## Field Invariants

| Field | Lobby | Playing | Notes |
|-------|-------|---------|-------|
| `strokes` | `[]` | grows per draw, resets on clear | no viewer-gating |
| `guesses` | `[]` | grows per accepted guess | no viewer-gating; `participantId` stripped in snapshot |
| `score` | `0` | accumulates on correct guess | always present from join |
