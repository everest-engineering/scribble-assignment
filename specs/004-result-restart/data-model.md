# Phase 1 Data Model: Result, Restart & Final Validation

In-memory only. Source of truth is `Map<string, Room>` in `backend/src/services/roomStore.ts`.
**Bold** marks fields/behavior added or changed by this feature.

## Type: RoomStatus

| Value | Meaning |
|-------|---------|
| `"lobby"` | Waiting room (Scenario 1). |
| `"playing"` | Active round (Scenario 2/3). |
| **`"result"`** | **Round ended; shared result shown (word, scores, history) until restart.** |

## Entity: Room (backend internal)

No new fields. Lifecycle of existing fields by action:

| Field | After `endRound` (→ result) | After `restartRound` (→ lobby) |
|-------|-----------------------------|--------------------------------|
| `status` | `"result"` | `"lobby"` |
| `participants` | unchanged | **unchanged (preserved)** |
| `hostId` | unchanged | **unchanged (preserved)** |
| `drawerId` | unchanged (retained for display) | **`null`** |
| `secretWord` | unchanged (now revealed in snapshot) | **`null`** |
| `guesses` | unchanged (full history) | **`[]`** |
| `drawing` | unchanged | **`null`** |
| `scores` | unchanged (final) | **every participant reset to `0`** |

### Invariants

- `endRound` is legal only from `status === "playing"`; `restartRound` only from
  `status === "result"`; both are host-only.
- After `restartRound`, the room is indistinguishable from a fresh lobby except that the same
  participants (and host) remain.
- Participant ids are stable across the whole lifecycle (clients keep holding them).

## Entity: RoomSnapshot (additions & reveal)

| Field | Type | Notes |
|-------|------|-------|
| …Scenario 1–3 fields… | — | `status`, `participants`, `hostId`, `isHost`, `canStart`, `drawerId`, `isDrawer`, `guesses`, `scores`, `drawing`, … |
| `status` | `RoomStatus` | Now includes `"result"`. |
| `secretWord` | `string \| null` | **Now revealed to ALL viewers when `status === "result"`** (previously drawer-only; still drawer-only while `playing`). |
| `guesses[].text` | `string \| null` | **Correct-guess text is shown to ALL when `status === "result"`** (the prior drawer/author-only stripping applies only while `playing`). |
| **`canEndRound`** | **`boolean`** | **NEW. `isHost && status === "playing"`.** |
| **`canRestart`** | **`boolean`** | **NEW. `isHost && status === "result"`.** |

## Derived values

| Value | Formula | Used by |
|-------|---------|---------|
| `canEndRound` | `isHost && room.status === "playing"` | End-Round control |
| `canRestart` | `isHost && room.status === "result"` | Restart control |
| revealed word | `isDrawer || status === "result" ? room.secretWord : null` | result word display |
| visible guess text | `status === "result" || !correct || isDrawer || viewer === author ? text : null` | result/play history |

## State transitions

```text
playing --endRound(host)-->     result      (round data retained; word becomes public)
result  --restartRound(host)--> lobby       (clear drawer/word/guesses/drawing; scores → 0;
                                             participants + host preserved)
lobby   --startRound(host,≥2)-> playing      (Scenario 2; unchanged, reusable after restart)

Rejected (no change) when:
   - endRound:     status != "playing"  OR requester != host
   - restartRound: status != "result"   OR requester != host
```

All result/restart state is in memory only. No persistence; a backend restart still wipes rooms.
