# Phase 1 Data Model: Result, Restart & Final Validation

In-memory only (no persistence). Group 4 changes **behavior**, not type shapes — all entities already
exist from Groups 1–3. Types live in `backend/src/models/game.ts`; the frontend mirrors the snapshot in
`frontend/src/services/api.ts`.

## Entities (no shape changes)

### Room (unchanged shape)

| Field | Type | Group 4 behavior |
|-------|------|------------------|
| `code` | `string` | Unchanged |
| `status` | `"lobby" \| "started"` | Restart sets back to `"lobby"` (no new status) |
| `hostId` | `string` | Preserved across restart |
| `participants` | `Participant[]` | Preserved across restart |
| `round` | `RoundState \| null` | Restart sets to `null` (clears all round state) |

### RoundState (unchanged shape; `ended` from Group 3)

`ended: boolean` drives both the result reveal and restart eligibility. No fields added.

### RoomSnapshot (unchanged shape; reveal rule widened)

| Field | Type | Group 4 behavior |
|-------|------|------------------|
| `secretWord` | `string?` (optional) | Included when viewer is drawer **OR** `round.ended === true`; otherwise absent |
| `roundEnded` | `boolean` | Already present (Group 3); drives result view |
| `strokes` / `guesses` | arrays | Empty after restart (`round` null) |
| `participants[].score` | `number` | Final scores while ended; reset to 0 on next start |

## Validation Rules

| Rule | Where | Requirement |
|------|-------|-------------|
| Reveal `secretWord` to all when ended | `toRoomSnapshot` | FR-049, SC-001 |
| Keep `secretWord` drawer-only while active | `toRoomSnapshot` | FR-049 (preserves Group 2) |
| Restart payload `participantId` non-empty | Edge (`restartRoomSchema`) | FR-052 |
| Restart host-only | `restartRoom` | FR-052, FR-055, SC-002 |
| Restart only when `round.ended` | `restartRoom` | FR-052, FR-056 |
| Restart clears round + keeps participants/host | `restartRoom` | FR-053, FR-054 |
| Restart idempotent when already lobby | `restartRoom` | FR-057 |
| Next start re-initializes fresh round | `startRoom` (existing) | FR-058, SC-004 |
| Play controls locked while ended | `GamePage` (Group 3 lock) | FR-051 |
| Auto-nav to lobby on `status === "lobby"` | `GamePage` | FR-060, SC-003 |

## State Transitions

```text
  started, round.ended = false   (active play — Group 3)
            │  first correct guess (Group 3)
            ▼
  started, round.ended = true     (RESULT: word revealed to all; play locked)
            │  POST /rooms/:code/restart  (host only)
            ▼
  lobby, round = null             (clean lobby; participants + host preserved)
            │  POST /rooms/:code/start    (host + ≥2 players — Groups 1–2)
            ▼
  started, round.ended = false    (fresh round: scores 0, no strokes/guesses)
```

- Restart rejected while `round.ended === false` (`not-ended` → 409).
- Restart idempotent when already `lobby` with `round === null`.
- `Room.status` never takes a value other than `lobby`/`started`.

## Store result shape

```typescript
type RestartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "not-ended" };
```

Route handler maps `reason` → 404 / 403 / 409.

## Isolation Invariant

For any two rooms A and B with distinct codes: a restart on A (status/round reset) leaves B's status,
participants, and round unchanged. Enforced by the keyed `Map`; covered by a unit test (FR-061, SC-005).
