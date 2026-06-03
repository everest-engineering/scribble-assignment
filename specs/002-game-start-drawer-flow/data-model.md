# Data Model: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02

## Entity Changes

### Room (backend model — `backend/src/models/game.ts`)

**Added fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `drawerId` | `string \| null` | Yes | participantId of the current drawer; null while in lobby |
| `currentWord` | `string \| null` | Yes | Active secret word; null while in lobby |

**Updated `RoomStatus`**: No change — `"lobby" \| "in-progress"` covers both states.

```typescript
// Existing
export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  // NEW:
  drawerId: string | null;
  currentWord: string | null;
}
```

### RoomSnapshot (shared wire type — `shared/schemas/room.ts` + `backend/src/models/game.ts`)

**Added fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `drawerId` | `string \| null` | Yes | Who is drawing (visible to all players) |
| `currentWord` | `string \| null` | Yes | The secret word — null for non-drawer clients, populated for the drawer |

```typescript
// Existing
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  // NEW:
  drawerId: string | null;
  currentWord: string | null;
}
```

---

## State Transitions

```
createRoom()
  └─► Room { status: "lobby", drawerId: null, currentWord: null, hostId: creatorId }

joinRoom()
  └─► Room (unchanged status/drawerId/currentWord)

startRoom(code, participantId) — participantId must equal hostId
  Validations (in order):
    1. room exists          → not_found (404)
    2. participantId = host → not_host  (403)
    3. status = "lobby"     → already_started (409) [NEW]
    4. participants ≥ 2     → too_few_players (400)
  On success:
  └─► Room {
        status: "in-progress",
        drawerId: hostId,          ← host is always drawer for round 1
        currentWord: STARTER_WORDS[0]  ← "rocket" (position 0)
      }
```

---

## Word Selection Rule

- Source: `STARTER_WORDS` constant in `backend/src/seed/starterData.ts`
- Round 1 always uses `STARTER_WORDS[0]` ("rocket")
- The word is stored on `room.currentWord` at start time
- It does not change for the lifetime of round 1

---

## Snapshot Visibility Rule

`toRoomSnapshot(room, viewerParticipantId?)`:

```
if (room.drawerId && viewerParticipantId === room.drawerId)
  → currentWord = room.currentWord   (drawer sees the word)
else
  → currentWord = null               (all others see null)

drawerId is always included in the snapshot (all players can see who is drawing)
```

---

## Zod Schema Changes (`shared/schemas/room.ts`)

```typescript
export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(participantRoleSchema),
  // NEW:
  drawerId: z.string().nullable(),
  currentWord: z.string().nullable()
});
```

---

## Backend Result Type Change (`roomStore.ts`)

```typescript
type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "already_started" | "too_few_players" };
  //                                                  ^^^^^^^^^^^^^^^^ NEW
```

---

## No Persistence

All fields remain in-memory (`Map<string, Room>`). No storage layer changes. Consistent with Constitution Principle V.
