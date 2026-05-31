# Data Model: Result, Restart & Final Validation

**Date**: 2026-05-31 | **Feature**: 004

## Changed Types — `backend/src/models/game.ts`

### `RoomStatus` (modified — additive)

```typescript
// Before
export type RoomStatus = "lobby" | "in-progress";

// After
export type RoomStatus = "lobby" | "in-progress" | "finished";
```

**New value**: `"finished"` — the post-round result state. The room enters this state
when the host ends the round; it exits when the host restarts, returning to `"lobby"`.

---

### `RoundResult` (new type)

```typescript
export interface RoundResult {
  revealedWord: string;
  scores: Record<string, number>;   // participantId → score
  guesses: GuessEntry[];             // full ordered history
}
```

Derived from the existing `currentRound` object when `status === "finished"`. Not persisted
separately — computed in `toRoomSnapshot()`.

---

### `RoomSnapshot` (modified — additive)

```typescript
// New optional field added (all existing fields unchanged):
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;              // now includes "finished"
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  secretWord?: string;             // visible to ALL when "finished"; drawer-only when "in-progress"
  result?: RoundResult;            // NEW — present only when status === "finished"
}
```

**Key change**: `secretWord` is now exposed to all participants (not just the drawer) when
`status === "finished"`. During `"in-progress"`, the existing drawer-only visibility is unchanged.

---

## Unchanged Types

- `Participant` — no changes; preserved across restart as per spec
- `GuessEntry` — no changes; surfaced via `RoundResult.guesses`
- `CurrentRound` — no changes to the stored structure; cleared on restart by setting
  `room.currentRound = undefined`
- `Room` — no new fields; the `status` field already exists and now accepts `"finished"`

---

## State Transitions

```
lobby ──[POST /start]──► in-progress ──[POST /end-round]──► finished
  ▲                                                              │
  └──────────────────[POST /restart]────────────────────────────┘
```

### On `endRound(code, participantId)`:
1. Validate `room.status === "in-progress"` (else 409)
2. Validate `participantId === room.hostId` (else 403)
3. Set `room.status = "finished"`
4. Set `room.updatedAt`
5. Return updated snapshot (exposes `secretWord` + `result` to all)

### On `restartGame(code, participantId)`:
1. Validate `room.status === "finished"` (already lobby → return snapshot, no-op)
2. Validate `participantId === room.hostId` (else 403)
3. Set `room.currentRound = undefined`
4. Set `room.status = "lobby"`
5. Set `room.updatedAt`
6. Return updated snapshot (no `result`, no `secretWord`, participants preserved)

---

## Validation Rules

| Rule | Applies To | Error |
|------|-----------|-------|
| `status` must be `"in-progress"` to end round | `endRound` | HTTP 409 |
| `participantId` must equal `hostId` to end round | `endRound` | HTTP 403 |
| `status` must be `"finished"` to restart (or already lobby → no-op) | `restartGame` | HTTP 403 for non-host |
| `participantId` must equal `hostId` to restart | `restartGame` | HTTP 403 |

---

## Frontend State Impact

The frontend `RoomSnapshot` type in `frontend/src/services/api.ts` (or equivalent type
definition) must mirror the backend changes:
- Add `"finished"` to the `status` union
- Add optional `result?: { revealedWord: string; scores: Record<string, number>; guesses: GuessEntry[] }`
