# Data Model: Round Result, Restart & Final Validation

**Feature**: `004-round-result-restart` | **Date**: 2026-06-04

---

## Backend Changes

### `RoomStatus` — already includes `"finished"`

No change needed. From Scenario 2:
```typescript
export type RoomStatus = "lobby" | "playing" | "finished";
```

### `toRoomSnapshot()` — gating update

```typescript
export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    hostId: room.hostId,
    drawerId: room.drawerId,
    currentWord:
      room.status === "finished" ||
      (viewerParticipantId === room.drawerId && room.drawerId !== null)
        ? room.currentWord
        : null,
    strokes: room.strokes.map((stroke) => ({ ...stroke })),
    guesses: room.guesses.map(({ participantName, text, correct }) => ({
      participantName, text, correct
    })),
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
```

The only material change is the `currentWord` ternary: `"finished"` status lifts
viewer-gating unconditionally.

### Restart logic in `roomStore.ts` (new exported function)

```typescript
export function restartRoom(code: string) {
  const room = rooms.get(code);
  if (!room) return null;
  room.status = "lobby";
  room.drawerId = null;
  room.currentWord = null;
  room.strokes = [];
  room.guesses = [];
  for (const participant of room.participants) {
    participant.score = 0;
  }
  room.updatedAt = now();
  rooms.set(room.code, room);
  return getRoom(room.code);
}
```

This function lives in `backend/src/services/roomStore.ts` and is imported by the
restart handler.

---

## Backend API Changes (`backend/src/api/schemas.ts`)

```typescript
export const endRoundSchema = z.object({
  participantId: z.string().uuid()
});

export const restartSchema = z.object({
  participantId: z.string().uuid()
});
```

---

## New API Routes (`backend/src/api/rooms.ts`)

### `POST /rooms/:code/end`

Host-only. Sets `room.status = "finished"`.

```
POST /rooms/:code/end
Content-Type: application/json

{ "participantId": "<uuid>" }
```

Response: `{ room: RoomSnapshot }` (with `currentWord` visible to all since status is now
`"finished"`).

### `POST /rooms/:code/restart`

Host-only. Clears round state, returns to lobby.

```
POST /rooms/:code/restart
Content-Type: application/json

{ "participantId": "<uuid>" }
```

Response: `{ room: RoomSnapshot }` (status `"lobby"`, all cleared fields).

---

## Frontend Changes

No new types or API interfaces. `RoomSnapshot.status` already includes `"finished"`.

New `api` method:

```typescript
restartGame(code: string, participantId: string) {
  return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  });
},
endRound(code: string, participantId: string) {
  return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end`, {
    method: "POST",
    body: JSON.stringify({ participantId })
  });
}
```

---

## State Transitions

```
Round end (correct guess):
  "playing" ──correct guess──► "finished"
                              currentWord visible to all
                              scores/guesses/strokes preserved

Round end (manual):
  "playing" ──POST /end────► "finished"
                              currentWord visible to all
                              all state preserved

Restart:
  "playing" or "finished" ──POST /restart──► "lobby"
                                              strokes=[]
                                              guesses=[]
                                              drawerId=null
                                              currentWord=null
                                              all scores=0
                                              participants preserved
                                              hostId preserved
```

---

## Field Invariants

| Field | Playing | Finished | Lobby (after restart) |
|-------|---------|----------|-----------------------|
| `status` | `"playing"` | `"finished"` | `"lobby"` |
| `currentWord` | viewer-gated | visible to all | `null` |
| `strokes` | grows | preserved | `[]` |
| `guesses` | grows | preserved | `[]` |
| `drawerId` | host ID | host ID | `null` |
| `score` | accumulates | final | `0` (all) |
