# Phase 1 — Data Model

**Feature**: Result, Restart & Final Validation (`004-result-restart`)

---

## Room state machine

The only structural change vs. feature 003: the `RoomStatus` union gains `"result"`. The Room entity itself gains no new fields.

```text
                                  ┌──────────────────────────────────────┐
                                  │  startRoom (host, ≥ 2 participants)  │
                                  │  → FR-006 (feature 001)              │
                                  ▼
       ┌────────────────────────────────────────────────────┐
       │  status: "lobby"                                   │
       │    round: null                                     │
       │    participants[].isDrawer = false                 │
       └────────────────────────────────────────────────────┘
                ▲                              │
                │                              │ startRoom
                │                              ▼
       ┌────────┴──────────┐    ┌────────────────────────────────────────────────┐
       │  restartRoom      │    │  status: "round"                                │
       │  (host, status =  │    │    round: { ...secretWord, guesses, scores }   │
       │   "result")       │    │    participants[host].isDrawer = true          │
       │  → FR-005, FR-006 │    │    submitGuess accepted                        │
       └────────────────── ┘    └────────────────────────────────────────────────┘
                ▲                              │
                │                              │ endRound (host, status = "round")
                │                              ▼ → FR-002
       ┌────────┴───────────────────────────────────────────────────────────────┐
       │  status: "result"                                                       │
       │    round: { ...secretWord (now revealed to all), guesses, scores }    │
       │    submitGuess → 409 (no_round)                                        │
       │    isDrawer flags unchanged from "round"                               │
       └────────────────────────────────────────────────────────────────────────┘
```

**Idempotency edges (each is a 200 no-op, not 409):**

- `endRound` while `status === "result"` → returns the unchanged snapshot (D4).
- `restartRoom` while `status === "lobby"` → returns the unchanged snapshot (D4).
- `startRoom` while `status === "round"` → returns the unchanged snapshot *(already implemented by feature 002, unchanged here)*.

**Invalid edges (always 409):**

- `endRound` while `status === "lobby"` → `409 "No active round"`.
- `restartRoom` while `status === "round"` → `409 "Round is still active"`.

---

## Entity diffs vs. feature 003

### `RoomStatus` (TypeScript union)

```ts
// before (feature 003)
type RoomStatus = "lobby" | "round";

// after (this feature)
type RoomStatus = "lobby" | "round" | "result";
```

Mirrored identically in `backend/src/models/game.ts` and `frontend/src/services/api.ts`.

### `Room` *(no change)*

```ts
interface Room {
  code: string;
  status: RoomStatus;        // ← the union widened; the field name/position is unchanged
  participants: Participant[];
  hostParticipantId: string;
  round: Round | null;
  createdAt: string;
  updatedAt: string;
}
```

### `Round` *(no field changes; just a visibility-rule change downstream)*

The `Round` entity is byte-for-byte identical to feature 003. What changes is the **projection rule** in `toRoomSnapshot`:

- **`status === "round"`**: `secretWord` included **only when** `viewerParticipantId === drawerParticipantId` (current behavior, FR-005 of feature 002).
- **`status === "result"`** *(new)*: `secretWord` included for **every** viewer including anonymous (no `participantId`).
- **`status === "lobby"`**: `round` is `null`, so no `secretWord` to project.

### `RoomSnapshot.canStart` *(no rule change, just status-aware)*

The existing rule already evaluates `room.round === null && room.participants.length >= 2`. After Restart, `round === null` again, so `canStart` flips back to `true` for the host — no code change required.

---

## New service functions

### `endRound(code: string, requesterId: string): EndRoundOutcome`

```ts
export type EndRoundOutcome =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_active" };
```

- **`not_found`**: no room with this code → maps to HTTP 404.
- **`not_host`**: `requesterId !== room.hostParticipantId` → maps to HTTP 403.
- **`not_active`**: `room.status === "lobby"` → maps to HTTP 409. (Note: `"result"` is **not** `not_active`; it's the idempotent re-call path that returns `ok: true` with the unchanged room.)

On success when `status === "round"`: sets `room.status = "result"`, leaves `room.round` intact (including `secretWord`, all `guesses`, all `scores`, all `lockedParticipantIds`), bumps `room.updatedAt`.

On idempotent re-call when `status === "result"`: returns `ok: true` with the unchanged room — **no** mutations, **no** `updatedAt` bump.

### `restartRoom(code: string, requesterId: string): RestartRoomOutcome`

```ts
export type RestartRoomOutcome =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_ended" };
```

- **`not_found`**: no room with this code → HTTP 404.
- **`not_host`**: `requesterId !== room.hostParticipantId` → HTTP 403.
- **`not_ended`**: `room.status === "round"` → HTTP 409. *(Idempotent re-call from `"lobby"` returns `ok: true`.)*

On success when `status === "result"`: sets `room.round = null`, `room.status = "lobby"`, bumps `room.updatedAt`. Participants array is **untouched** (same IDs, same `hostParticipantId`).

On idempotent re-call when `status === "lobby"`: returns `ok: true` with the unchanged room — **no** mutations, **no** `updatedAt` bump.

### `submitGuess` *(small extension)*

The existing guard `if (room.round === null) return { ok: false, reason: "no_round" }` becomes:

```ts
if (room.status !== "round") return { ok: false, reason: "no_round" };
```

This single change covers both the `"lobby"` case (already covered) and the new `"result"` case (FR-004). No new reason code; the route's existing `409 "No round in progress"` mapping is reused.

---

## Validation rules (Zod, in `schemas.ts`)

Both new schemas are identical in shape — they're aliased to make intent clear at the route boundary.

```ts
export const endRoundSchema = z.object({
  participantId: z.string().min(1)
});

export const restartRoomSchema = z.object({
  participantId: z.string().min(1)
});
```

A missing or empty `participantId` returns `400` via the existing Zod error middleware — **before** the host check runs. This means a "missing participantId" never leaks the room's existence (it's a `400`, not a `404`), which matches the existing behavior of `startRoom`.

---

## Wire-type mirroring

| Wire shape | Backend file | Frontend file | Notes |
|---|---|---|---|
| `RoomStatus` union widened to include `"result"` | `backend/src/models/game.ts` | `frontend/src/services/api.ts` | Must be edited in the **same commit** to avoid type drift. |
| End-round response: `{ room: RoomSnapshot }` | `backend/src/api/rooms.ts` | `frontend/src/services/api.ts` `api.endRound()` return type | Mirrors `startRoom`'s response shape. |
| Restart response: `{ room: RoomSnapshot }` | `backend/src/api/rooms.ts` | `frontend/src/services/api.ts` `api.restartRoom()` return type | Same. |

No new wire entities are introduced.

---

## Out of scope (explicit, per spec.md *Assumptions* & Constitution §I)

- Multiple rounds, drawer rotation, cumulative scoring across rounds.
- Auto-end on first correct guess; round timers; speed bonuses.
- Persisting result history beyond the room's lifetime.
- Spectator mode in the result state (anyone with the code already sees the result via plain `GET /rooms/:code` polling — no new "spectator" concept needed).
