# Data Model: Result, Restart & Final Validation

## RoomStatus (updated)

**File**: `backend/src/models/game.ts`

```typescript
// Before:
export type RoomStatus = "lobby" | "playing";

// After:
export type RoomStatus = "lobby" | "playing" | "result";
```

## RoomSnapshot (updated fields)

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"lobby" \| "playing" \| "result"` | Updated to include `"result"` |
| `scores` | `Record<string, number>` | Unchanged — already computed in `toRoomSnapshot()` |

No new fields required. The existing `correctWord`, `guesses`, `scores` fields in `RoomSnapshot` already contain all data needed for the result view.

## State Transitions

```
lobby ──[host starts]──→ playing ──[all correct OR host reveals]──→ result ──[host restarts]──→ lobby
```

- **playing → result**: Round ends. `room.status = "result"`. No round data is deleted — frontend reads it for display.
- **result → lobby**: Host restarts. `room.status = "lobby"`. `room.rounds = []` (clears all round data). Participants preserved.

## Round-End Detection

- **Automatic**: After each `guess`, check if every non-drawer participant has ≥1 guess with `result === "correct"` in the current round.
- **Manual**: Host can call a reveal endpoint that sets status to `"result"` unconditionally.
