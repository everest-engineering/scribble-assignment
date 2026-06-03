# Data Model: Scribble Game Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03

## Entity Changes

### Room (backend/src/models/game.ts)

One new field added; all existing fields unchanged.

```typescript
export interface Room {
  // ... existing fields unchanged ...
  resultExpiresAt: string | null;  // NEW — ISO timestamp 30 s after status becomes "finished"
}
```

**Lifecycle**:
- Set to `null` on `createRoom()` and `startRoom()`.
- Set to `now + 30 s` (ISO) when `room.status` first transitions to `"finished"` — in both `submitGuess()` (all-correct path) and `checkRoundExpiry()` (timer-expiry path).
- Reset to `null` on `restartRoom()`.

**Validation rule**: If `resultExpiresAt` is non-null and `Date.now() >= new Date(resultExpiresAt).getTime()`, `checkResultExpiry()` transitions `room.status` from `"finished"` to `"lobby"` and clears round state.

---

### RoomSnapshot (shared/schemas/room.ts + backend/src/models/game.ts)

One new field added to the wire format delivered to all clients.

```typescript
// shared/schemas/room.ts
export const roomSnapshotSchema = z.object({
  // ... existing fields unchanged ...
  resultExpiresAt: z.string().nullable(),  // NEW
});

// backend/src/models/game.ts
export interface RoomSnapshot {
  // ... existing fields unchanged ...
  resultExpiresAt: string | null;  // NEW
}
```

**Populated by**: `toRoomSnapshot()` — copies `room.resultExpiresAt` directly. Always `null` when `status !== "finished"`.

---

## State Transitions

### Round End → Results Screen

```
"in-progress" ──► "finished"
  Trigger: (a) checkRoundExpiry (timer expired)
           (b) submitGuess → all guessers correct
  Side effects:
    - room.resultExpiresAt = new Date(Date.now() + 30_000).toISOString()
    - room.scores[drawerId] += 50 * correctGuessers.size
```

### Results Screen → Lobby (host restart)

```
"finished" ──► "lobby"
  Trigger: POST /rooms/:code/restart (host only)
  Side effects:
    - room.drawerId = null
    - room.currentWord = null
    - room.canvasDataUrl = null
    - room.guesses = []
    - room.scores = {}
    - room.correctGuessers = new Set()
    - room.roundStartedAt = null
    - room.resultExpiresAt = null
```

### Results Screen → Lobby (auto-advance)

```
"finished" ──► "lobby"
  Trigger: checkResultExpiry() (called lazily at GET /rooms/:code poll time)
           when Date.now() >= new Date(room.resultExpiresAt).getTime()
  Side effects: identical to host restart above
```

---

## New Service Function: restartRoom

```typescript
type RestartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_finished" };

export function restartRoom(code: string, participantId: string): RestartRoomResult
```

**Guards**:
1. Room must exist → `not_found`
2. `participantId` must equal `room.hostId` → `not_host`
3. `room.status` must be `"finished"` → `not_finished`

**Mutations**: transition to `"lobby"`, clear all round fields (see state transition above).

---

## New Service Function: checkResultExpiry

```typescript
export function checkResultExpiry(room: Room): void
```

Called inside `getRoom()` before returning the snapshot (analogous to `checkRoundExpiry`).

**Logic**:
```
if room.status !== "finished" OR room.resultExpiresAt === null → return
if Date.now() >= new Date(room.resultExpiresAt).getTime():
  clear round state (same mutations as restartRoom)
  room.status = "lobby"
```

---

## toRoomSnapshot Changes

```typescript
// Before (currentWord hidden from non-drawers always):
const currentWord = room.drawerId && viewerParticipantId === room.drawerId
  ? room.currentWord
  : null;

// After (reveal to all when finished):
const currentWord =
  room.status === "finished"
    ? room.currentWord
    : room.drawerId && viewerParticipantId === room.drawerId
      ? room.currentWord
      : null;
```

`resultExpiresAt` field added to the return object:
```typescript
resultExpiresAt: room.resultExpiresAt,
```

---

## Drawer Scoring: submitGuess Change

When the all-correct condition fires (or `checkRoundExpiry` fires), add to existing logic:

```typescript
// After setting room.status = "finished":
if (room.drawerId && room.scores[room.drawerId] !== undefined) {
  room.scores[room.drawerId] += 50 * room.correctGuessers.size;
}
room.resultExpiresAt = new Date(Date.now() + 30_000).toISOString();
```

Same block added to `checkRoundExpiry()` when the timer-expiry branch fires.

---

## Key Invariants

| Invariant | Enforcement |
|-----------|-------------|
| `resultExpiresAt` is only non-null when `status === "finished"` | Set only at the point of status transition; cleared on restart/auto-advance |
| Drawer score is included in `scores` map before results screen renders | Set at the moment status becomes `"finished"`, before any client polls |
| `currentWord` is visible to all after round ends | `toRoomSnapshot` checks `status === "finished"` |
| Only the host can manually restart | `restartRoom()` guard: `participantId !== room.hostId → not_host` |
| Participants list is preserved through restart | `restartRoom()` does not touch `room.participants` |
