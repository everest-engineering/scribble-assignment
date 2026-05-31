# Data Model: Game Start and Drawer Flow (002)

## Updated Entity: Room

`backend/src/models/game.ts`

```typescript
export interface Room {
  code: string;
  hostId: string;       // unchanged — room creator
  status: RoomStatus;   // unchanged — "lobby" | "active" | "ended"
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  // NEW in Scenario 002:
  drawerId: string;     // participant.id of the drawer; "" until game starts
  secretWord: string;   // selected word; "" until game starts
}
```

**Invariants**:
- `drawerId === hostId` always (in this scenario; rotation is out of scope)
- `secretWord` is non-empty iff `status === "active"`
- `drawerId` is non-empty iff `status === "active"`
- Both fields reset to `""` conceptually on a new room (initialized as `""` at creation)

---

## Updated Entity: RoomSnapshot (viewer-scoped)

`backend/src/models/game.ts`

```typescript
export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  // NEW in Scenario 002:
  drawerId: string;          // always present; "" in lobby
  secretWord?: string;       // defined only in drawer-scoped response
  wordPlaceholder?: string;  // defined only in guesser-scoped response; e.g. "_ _ _ _ _"
}
```

**Viewer-scoping rule** (applied in `toRoomSnapshot`):
- If `status !== "active"`: both fields omitted (both `undefined`)
- If `status === "active"` and `viewerParticipantId === drawerId`: `secretWord` is set, `wordPlaceholder` is `undefined`
- If `status === "active"` and `viewerParticipantId !== drawerId`: `wordPlaceholder` is set, `secretWord` is `undefined`

---

## Frontend Mirror: RoomSnapshot

`frontend/src/services/api.ts`

```typescript
export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: "lobby" | "active" | "ended";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  // NEW in Scenario 002:
  drawerId: string;
  secretWord?: string;
  wordPlaceholder?: string;
}
```

Must stay in sync with backend interface (Constitution P4).

---

## New Pure Function: selectWord

`backend/src/services/roomStore.ts`

```typescript
export function selectWord(code: string, words: readonly string[]): string {


  const index = [...code].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % words.length;
  return words[index];
}
```

**Properties**:
- Pure — no side effects
- Deterministic — same `(code, words)` → same result
- Exported — directly unit-testable
- Depends only on room code (stable for lifetime of room)

---

## State Transition

```
Room.status: "lobby" → "active"
  triggers:
    Room.drawerId = Room.hostId
    Room.secretWord = selectWord(Room.code, STARTER_WORDS)
```

---

## Unchanged Entities

- `Participant` — no changes
- `RoomSessionResponse` — no changes
- `STARTER_WORDS` / `STARTER_ROLES` — no changes
