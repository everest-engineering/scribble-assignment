# Data Model: Result, Restart & Final Validation

## Modified Type: `RoomStatus`

```typescript
// Before (feature 003)
export type RoomStatus = "lobby" | "playing";

// After (this feature)
export type RoomStatus = "lobby" | "playing" | "ended";
```

| Value       | Meaning                                                         |
| ----------- | --------------------------------------------------------------- |
| `"lobby"`   | Room created or restarted; waiting for host to start            |
| `"playing"` | Active round; drawer draws, guessers submit guesses             |
| `"ended"`   | Round concluded; result screen active; waiting for host restart |

---

## Modified Interface: `Room` (backend only)

New optional field added:

| Field          | Type     | Present when         | Notes                                                         |
| -------------- | -------- | -------------------- | ------------------------------------------------------------- |
| `revealedWord` | `string` | `status === "ended"` | The word that was drawn; set on round end; cleared on restart |

All existing fields (`strokes`, `guesses`, `scores`, `currentWord`, `currentDrawerId`, `roundNumber`) are unchanged.

```typescript
export interface Room {
  code: string;
  status: RoomStatus; // now includes "ended"
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  currentDrawerId?: string;
  currentWord?: string;
  roundNumber?: number;
  strokes: CanvasState;
  guesses: Guess[];
  scores: Record<string, number>;
  revealedWord?: string; // NEW
}
```

---

## Modified Interface: `RoomSnapshot` (backend + frontend)

New optional field added. Visibility rules extended:

| Field             | Exposed when             | Visibility                               |
| ----------------- | ------------------------ | ---------------------------------------- |
| `currentDrawerId` | `"playing"` or `"ended"` | All participants                         |
| `strokes`         | `"playing"` or `"ended"` | All participants                         |
| `guesses`         | `"playing"` or `"ended"` | All participants                         |
| `scores`          | `"playing"` or `"ended"` | All participants                         |
| `currentWord`     | `"playing"` only         | Drawer only (non-drawers receive `null`) |
| `revealedWord`    | `"ended"` only           | **All participants**                     |

```typescript
export interface RoomSnapshot {
  code: string;
  status: RoomStatus; // now includes "ended"
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  currentWord?: string | null;
  strokes?: CanvasState;
  guesses?: Guess[];
  scores?: Record<string, number>;
  revealedWord?: string; // NEW
}
```

---

## State Transitions

```
  lobby
    │
    │  POST /rooms/:code/start  (host)
    ▼
  playing
    │
    │  POST /rooms/:code/end  (host — manual)
    │  POST /rooms/:code/guesses  (first correct guess — automatic)
    ▼
  ended
    │
    │  POST /rooms/:code/restart  (host)
    ▼
  lobby  (participants preserved; all round state cleared)
```

---

## Service Function Contracts

### `endRound(code: string, participantId: string): RoomSnapshot`

| Step | Validation                      | Error                                   |
| ---- | ------------------------------- | --------------------------------------- |
| 1    | Room exists                     | 404                                     |
| 2    | `room.status === "playing"`     | 409 `"Game is not in progress"`         |
| 3    | `participantId === room.hostId` | 403 `"Only the host can end the round"` |

**Mutations**: `room.status = "ended"`, `room.revealedWord = room.currentWord ?? ""`

**Returns**: `toRoomSnapshot(room)` — no viewer masking needed (all fields visible to all on result screen)

---

### `restartRoom(code: string, participantId: string): RoomSnapshot`

| Step | Validation                      | Error                                      |
| ---- | ------------------------------- | ------------------------------------------ |
| 1    | Room exists                     | 404                                        |
| 2    | `room.status === "ended"`       | 409 `"Game has not ended"`                 |
| 3    | `participantId === room.hostId` | 403 `"Only the host can restart the game"` |

**Mutations**:

- `room.status = "lobby"`
- `room.currentWord = undefined`
- `room.currentDrawerId = undefined`
- `room.roundNumber = undefined`
- `room.strokes = []`
- `room.guesses = []`
- `room.scores = {}`
- `room.revealedWord = undefined`

**Returns**: `toRoomSnapshot(room)` (lobby snapshot — no round fields)

---

### Modified: `submitGuess` — auto-end side-effect

Existing validation is unchanged. After `isCorrect` is determined and the guess is appended:

```
if (isCorrect) {
  room.scores[participantId] += 100
  room.status = "ended"              // NEW
  room.revealedWord = room.currentWord ?? ""  // NEW
}
```

The function return type (`Guess`) is unchanged. Status change propagates to clients via the next poll.

---

### Modified: `toRoomSnapshot` — `"ended"` status case

```typescript
if (room.status === "playing" || room.status === "ended") {
  snapshot.currentDrawerId = room.currentDrawerId;
  snapshot.strokes = ...;
  snapshot.guesses = ...;
  snapshot.scores = ...;
}

if (room.status === "playing") {
  snapshot.currentWord = viewerIsDrawer ? room.currentWord : null;
}

if (room.status === "ended") {
  snapshot.revealedWord = room.revealedWord;
}
```

---

## Validation Rules (Zod Schemas)

### `endRoundSchema`

```typescript
z.object({ participantId: z.string() });
```

### `restartRoomSchema`

```typescript
z.object({ participantId: z.string() });
```
